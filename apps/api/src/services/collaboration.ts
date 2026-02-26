/**
 * Real-time collaboration service using Yjs + WebSocket.
 * Each note gets its own Yjs document for CRDT-based editing.
 */

import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import * as Y from 'yjs';

const docs = new Map<string, Y.Doc>();
const connections = new Map<string, Set<WebSocket>>();

function getDoc(docName: string): Y.Doc {
  if (!docs.has(docName)) {
    docs.set(docName, new Y.Doc());
  }
  return docs.get(docName)!;
}

export function setupCollaborationServer(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws/collab' });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const docName = url.searchParams.get('doc') || 'default';
    const userName = url.searchParams.get('user') || 'Anonymous';

    const doc = getDoc(docName);

    if (!connections.has(docName)) connections.set(docName, new Set());
    connections.get(docName)!.add(ws);

    console.log(`[Collab] ${userName} joined doc:${docName} (${connections.get(docName)!.size} users)`);

    // Send initial state
    const state = Y.encodeStateAsUpdate(doc);
    ws.send(JSON.stringify({ type: 'sync', data: Array.from(state) }));

    // Send awareness (who's connected)
    const peers = connections.get(docName)!.size;
    broadcastToDoc(docName, { type: 'awareness', peers, user: userName, action: 'joined' });

    ws.on('message', (message: Buffer) => {
      try {
        const msg = JSON.parse(message.toString());

        if (msg.type === 'update') {
          const update = new Uint8Array(msg.data);
          Y.applyUpdate(doc, update);
          // Broadcast to other clients
          for (const client of connections.get(docName) || []) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'update', data: msg.data }));
            }
          }
        }

        if (msg.type === 'cursor') {
          for (const client of connections.get(docName) || []) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'cursor', user: userName, ...msg }));
            }
          }
        }
      } catch (e) {
        console.error('[Collab] Message error:', e);
      }
    });

    ws.on('close', () => {
      connections.get(docName)?.delete(ws);
      const remaining = connections.get(docName)?.size || 0;
      console.log(`[Collab] ${userName} left doc:${docName} (${remaining} users)`);
      broadcastToDoc(docName, { type: 'awareness', peers: remaining, user: userName, action: 'left' });

      if (remaining === 0) {
        // Keep doc in memory for a while before cleanup
        setTimeout(() => {
          if ((connections.get(docName)?.size || 0) === 0) {
            docs.delete(docName);
            connections.delete(docName);
          }
        }, 60000);
      }
    });
  });

  console.log('[Collab] WebSocket collaboration server ready at /ws/collab');
}

function broadcastToDoc(docName: string, message: any) {
  const payload = JSON.stringify(message);
  for (const client of connections.get(docName) || []) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
