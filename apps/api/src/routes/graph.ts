import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAll, getOne, runQuery, saveDatabase } from '../db/index.js';
import { generateGraphWithMiniMax, generateKnowledgeGraphPrompt } from '../services/claude-code.js';

const router = Router();

/**
 * Simple force-directed layout: related nodes cluster together.
 * Runs a few iterations of spring-electric simulation.
 */
function computeForceLayout(
  nodes: Array<{ label: string }>,
  links: Array<{ source: string; target: string; strength?: number }>
): Array<{ x: number; y: number }> {
  const n = nodes.length;
  if (n === 0) return [];

  const labelIdx = new Map(nodes.map((nd, i) => [nd.label, i]));

  // Initial positions: circle layout
  const pos = nodes.map((_, i) => ({
    x: Math.cos((2 * Math.PI * i) / n) * 200,
    y: Math.sin((2 * Math.PI * i) / n) * 150,
  }));

  const REPULSION = 8000;
  const SPRING_K = 0.04;
  const DAMPING = 0.85;
  const ITERATIONS = 80;

  const vx = new Float64Array(n);
  const vy = new Float64Array(n);

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x;
        let dy = pos[i].y - pos[j].y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let force = REPULSION / (dist * dist);
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        vx[i] += fx; vy[i] += fy;
        vx[j] -= fx; vy[j] -= fy;
      }
    }

    // Attraction along edges
    for (const link of links) {
      const si = labelIdx.get(link.source);
      const ti = labelIdx.get(link.target);
      if (si === undefined || ti === undefined) continue;
      let dx = pos[ti].x - pos[si].x;
      let dy = pos[ti].y - pos[si].y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      let strength = (link.strength ?? 0.5) * SPRING_K;
      let fx = dx * strength;
      let fy = dy * strength;
      vx[si] += fx; vy[si] += fy;
      vx[ti] -= fx; vy[ti] -= fy;
    }

    // Apply velocity with damping
    for (let i = 0; i < n; i++) {
      vx[i] *= DAMPING;
      vy[i] *= DAMPING;
      pos[i].x += vx[i];
      pos[i].y += vy[i];
    }
  }

  // Center the layout
  let cx = 0, cy = 0;
  for (const p of pos) { cx += p.x; cy += p.y; }
  cx /= n; cy /= n;
  for (const p of pos) { p.x -= cx; p.y -= cy; }

  return pos.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
}

// ==================== NODES ====================

// GET /api/nodes - Get all nodes
router.get('/', (req, res) => {
  try {
    const nodes = getAll<any>('SELECT * FROM nodes ORDER BY label');

    res.json({
      data: nodes.map(n => ({
        id: n.id,
        x: n.x,
        y: n.y,
        label: n.label,
        type: n.type,
        color: n.color,
        icon: n.icon,
        description: n.description,
        linkedNoteId: n.linked_note_id,
        tags: n.tags ? JSON.parse(n.tags) : []
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch nodes' }
    });
  }
});

// POST /api/nodes - Create a new node
router.post('/', (req, res) => {
  try {
    const { x = 0, y = 0, label, type = 'planet', color = '#FFD166', icon = 'circle', description, linkedNoteId, tags = [] } = req.body;

    if (!label) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Node label is required' }
      });
    }

    const id = uuidv4();
    const tagsJson = JSON.stringify(tags);

    runQuery(
      `INSERT INTO nodes (id, x, y, label, type, color, icon, description, linked_note_id, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, x, y, label, type, color, icon, description || null, linkedNoteId || null, tagsJson]
    );
    saveDatabase();

    res.status(201).json({
      data: {
        id, x, y, label, type, color, icon, description, linkedNoteId, tags
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create node' }
    });
  }
});

// GET /api/nodes/orphans - Get orphan nodes (not connected to any note)
router.get('/orphans', (req, res) => {
  try {
    const nodes = getAll<any>(
      "SELECT * FROM nodes WHERE linked_note_id IS NULL OR linked_note_id = '' ORDER BY label"
    );

    res.json({
      data: nodes.map(n => ({
        id: n.id,
        x: n.x,
        y: n.y,
        label: n.label,
        type: n.type,
        color: n.color,
        icon: n.icon,
        description: n.description,
        linkedNoteId: n.linked_note_id,
        tags: n.tags ? JSON.parse(n.tags) : []
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orphan nodes' }
    });
  }
});

// GET /api/graph/status — must be before /:id
router.get('/status', async (req, res) => {
  const available = !!process.env.MINIMAX_API_KEY;
  res.json({
    data: {
      available,
      provider: 'minimax/m2.5',
      message: available ? 'MiniMax AI 可用' : 'MiniMax API Key 未配置'
    }
  });
});

// GET /api/nodes/:id - Get a specific node
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const node = getOne<any>('SELECT * FROM nodes WHERE id = ?', [id]);

    if (!node) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Node not found' }
      });
    }

    res.json({
      data: {
        id: node.id,
        x: node.x,
        y: node.y,
        label: node.label,
        type: node.type,
        color: node.color,
        icon: node.icon,
        description: node.description,
        linkedNoteId: node.linked_note_id,
        tags: node.tags ? JSON.parse(node.tags) : []
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch node' }
    });
  }
});

// PATCH /api/nodes/:id - Update a node
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { x, y, label, type, color, icon, description, linkedNoteId, tags } = req.body;

    const existing = getOne<any>('SELECT id FROM nodes WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Node not found' }
      });
    }

    if (x !== undefined) runQuery('UPDATE nodes SET x = ?, updated_at = datetime("now") WHERE id = ?', [x, id]);
    if (y !== undefined) runQuery('UPDATE nodes SET y = ?, updated_at = datetime("now") WHERE id = ?', [y, id]);
    if (label) runQuery('UPDATE nodes SET label = ?, updated_at = datetime("now") WHERE id = ?', [label, id]);
    if (type) runQuery('UPDATE nodes SET type = ?, updated_at = datetime("now") WHERE id = ?', [type, id]);
    if (color) runQuery('UPDATE nodes SET color = ?, updated_at = datetime("now") WHERE id = ?', [color, id]);
    if (icon) runQuery('UPDATE nodes SET icon = ?, updated_at = datetime("now") WHERE id = ?', [icon, id]);
    if (description !== undefined) runQuery('UPDATE nodes SET description = ?, updated_at = datetime("now") WHERE id = ?', [description, id]);
    if (linkedNoteId !== undefined) runQuery('UPDATE nodes SET linked_note_id = ?, updated_at = datetime("now") WHERE id = ?', [linkedNoteId, id]);
    if (tags) runQuery('UPDATE nodes SET tags = ?, updated_at = datetime("now") WHERE id = ?', [JSON.stringify(tags), id]);

    saveDatabase();

    const updated = getOne<any>('SELECT * FROM nodes WHERE id = ?', [id]);

    res.json({
      data: {
        id: updated.id,
        x: updated.x,
        y: updated.y,
        label: updated.label,
        type: updated.type,
        color: updated.color,
        icon: updated.icon,
        description: updated.description,
        linkedNoteId: updated.linked_note_id,
        tags: updated.tags ? JSON.parse(updated.tags) : []
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update node' }
    });
  }
});

// DELETE /api/nodes/:id - Delete a node
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = getOne<any>('SELECT id FROM nodes WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Node not found' }
      });
    }

    // Delete associated links first
    runQuery('DELETE FROM links WHERE source = ? OR target = ?', [id, id]);
    runQuery('DELETE FROM nodes WHERE id = ?', [id]);
    saveDatabase();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete node' }
    });
  }
});

// POST /api/nodes/:id/connect - Connect node to a note
router.post('/:id/connect', (req, res) => {
  try {
    const { id } = req.params;
    const { noteId } = req.body;

    const node = getOne<any>('SELECT id FROM nodes WHERE id = ?', [id]);
    if (!node) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Node not found' }
      });
    }

    runQuery('UPDATE nodes SET linked_note_id = ?, updated_at = datetime("now") WHERE id = ?', [noteId, id]);
    saveDatabase();

    res.json({ data: { success: true, nodeId: id, linkedNoteId: noteId } });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to connect node' }
    });
  }
});

// ==================== LINKS ====================

// GET /api/links - Get all links
router.get('/../links', (req, res) => {
  try {
    const links = getAll<any>('SELECT * FROM links');

    res.json({
      data: links.map(l => ({
        id: l.id,
        source: l.source,
        target: l.target,
        type: l.type,
        relation: l.relation || 'relates',
        label: l.label || '',
        strength: l.strength ?? 0.5
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch links' }
    });
  }
});

// POST /api/links - Create a new link
router.post('/../links', (req, res) => {
  try {
    const { source, target, type = 'solid' } = req.body;

    if (!source || !target) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Source and target are required' }
      });
    }

    // Check if nodes exist
    const sourceNode = getOne<any>('SELECT id FROM nodes WHERE id = ?', [source]);
    const targetNode = getOne<any>('SELECT id FROM nodes WHERE id = ?', [target]);

    if (!sourceNode || !targetNode) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Source or target node not found' }
      });
    }

    // Check for duplicate
    const existing = getOne<any>(
      'SELECT id FROM links WHERE (source = ? AND target = ?) OR (source = ? AND target = ?)',
      [source, target, target, source]
    );

    if (existing) {
      return res.status(409).json({
        error: { code: 'DUPLICATE_LINK', message: 'Link already exists' }
      });
    }

    const id = uuidv4();
    runQuery(
      'INSERT INTO links (id, source, target, type) VALUES (?, ?, ?, ?)',
      [id, source, target, type]
    );
    saveDatabase();

    res.status(201).json({
      data: { id, source, target, type }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create link' }
    });
  }
});

// DELETE /api/links/:id - Delete a link
router.delete('/../links/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = getOne<any>('SELECT id FROM links WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Link not found' }
      });
    }

    runQuery('DELETE FROM links WHERE id = ?', [id]);
    saveDatabase();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete link' }
    });
  }
});

// ==================== 从笔记生成知识图谱 ====================

// GET /api/graph/generate-from-notes - 从笔记生成知识图谱
router.post('/generate-from-notes', async (req, res) => {
  try {
    const userId = (req as any).userId || 'dev_user_1';
    const { clearExisting = true } = req.body;

    console.log('[Graph Generate] Starting knowledge graph generation from notes...');

    // 1. 获取所有笔记
    const notes = getAll<any>(
      'SELECT id, title, content FROM notes WHERE user_id = ? ORDER BY timestamp DESC',
      [userId]
    );

    if (notes.length === 0) {
      return res.status(400).json({
        error: { code: 'NO_NOTES', message: '没有找到笔记，请先创建一些笔记' }
      });
    }

    console.log(`[Graph Generate] Found ${notes.length} notes`);

    // 2. 获取笔记的标签
    const notesWithTags = notes.map((note: any) => {
      const tags = getAll<{ name: string }>(
        `SELECT t.name FROM tags t
         JOIN note_tags nt ON t.id = nt.tag_id
         WHERE nt.note_id = ?`,
        [note.id]
      ).map((t: any) => t.name);
      return { ...note, tags };
    });

    // 3. 生成提示词
    const prompt = generateKnowledgeGraphPrompt(notesWithTags);

    // 4. 调用 MiniMax-M2.5 分析
    console.log('[Graph Generate] Calling MiniMax-M2.5...');
    const result = await generateGraphWithMiniMax(prompt);

    console.log(`[Graph Generate] MiniMax returned ${result.nodes.length} nodes and ${result.links.length} links`);

    // 5. 清除现有节点和边（如果用户要求）
    if (clearExisting) {
      runQuery('DELETE FROM links');
      runQuery('DELETE FROM nodes');
      console.log('[Graph Generate] Cleared existing nodes and links');
    }

    // 6. Force-directed layout: compute positions based on relationships
    const nodePositions = computeForceLayout(result.nodes, result.links);

    const nodeIdMap = new Map<string, string>();
    const createdNodes: any[] = [];

    for (let i = 0; i < result.nodes.length; i++) {
      const node = result.nodes[i];
      const id = uuidv4();
      const pos = nodePositions[i] || { x: Math.random() * 600 - 300, y: Math.random() * 400 - 200 };
      const x = pos.x;
      const y = pos.y;

      runQuery(
        `INSERT INTO nodes (id, x, y, label, type, color, icon, description, created_at)
         VALUES (?, ?, ?, ?, 'planet', ?, 'circle', ?, datetime('now'))`,
        [id, x, y, node.label, node.color, node.description]
      );

      nodeIdMap.set(node.label, id);
      createdNodes.push({
        id,
        x,
        y,
        label: node.label,
        type: 'planet',
        color: node.color,
        icon: 'circle',
        description: node.description
      });
    }

    // 7. 存储边（关联节点和笔记）
    const createdLinks: any[] = [];

    for (const link of result.links) {
      const sourceId = nodeIdMap.get(link.source);
      const targetId = nodeIdMap.get(link.target);

      if (sourceId && targetId) {
        const id = uuidv4();
        const relation = link.relation || 'relates';
        const label = link.label || '';
        const strength = typeof link.strength === 'number' ? link.strength : 0.5;
        runQuery(
          'INSERT INTO links (id, source, target, type, relation, label, strength) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, sourceId, targetId, 'solid', relation, label, strength]
        );
        createdLinks.push({
          id,
          source: sourceId,
          target: targetId,
          type: 'solid',
          relation,
          label,
          strength
        });
      } else {
        console.warn(`[Graph Generate] Skipping link: source="${link.source}", target="${link.target}" - node not found`);
      }
    }

    // 8. 关联节点与笔记
    for (const note of notesWithTags) {
      // 查找与笔记标题最匹配的节点
      const matchedNode = createdNodes.find((node: any) =>
        node.label.toLowerCase().includes(note.title.toLowerCase().substring(0, 5)) ||
        note.title.toLowerCase().includes(node.label.toLowerCase().substring(0, 5))
      );

      if (matchedNode) {
        runQuery(
          'UPDATE nodes SET linked_note_id = ? WHERE id = ?',
          [note.id, matchedNode.id]
        );
      }
    }

    saveDatabase();

    console.log(`[Graph Generate] Successfully created ${createdNodes.length} nodes and ${createdLinks.length} links`);

    res.json({
      data: {
        nodes: createdNodes,
        links: createdLinks,
        summary: {
          notesProcessed: notes.length,
          nodesCreated: createdNodes.length,
          linksCreated: createdLinks.length
        }
      }
    });
  } catch (error: any) {
    console.error('[Graph Generate] Error:', error);
    res.status(500).json({
      error: { code: 'GENERATION_ERROR', message: error.message || '生成知识图谱失败' }
    });
  }
});

export default router;
