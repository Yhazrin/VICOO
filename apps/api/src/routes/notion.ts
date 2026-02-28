/**
 * Notion Integration API Routes
 *
 * GET  /api/notion/status       — connection status
 * GET  /api/notion/auth         — start OAuth flow
 * GET  /api/notion/callback     — OAuth callback
 * POST /api/notion/disconnect   — disconnect Notion
 * GET  /api/notion/pages        — list Notion pages
 * GET  /api/notion/pages/:id    — get page content
 * POST /api/notion/pages        — create page in Notion
 * PUT  /api/notion/pages/:id    — update page content
 * GET  /api/notion/search       — search Notion
 * POST /api/notion/sync/to      — sync Vicoo note TO Notion
 * POST /api/notion/sync/from    — sync Notion page TO Vicoo
 */

import { Router, Request, Response } from 'express';
import {
  getNotionToken, saveNotionToken, clearNotionToken,
  searchNotion, getNotionPage, listNotionPages,
  createNotionPage, updateNotionPage,
  syncToNotion, syncFromNotion,
} from '../services/notion.js';

const router = Router();

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID || '';
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET || '';
const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI || 'http://localhost:8000/api/notion/callback';

// GET /api/notion/status
router.get('/status', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const token = getNotionToken(userId);
  res.json({
    data: {
      connected: !!token,
      configured: !!(NOTION_CLIENT_ID && NOTION_CLIENT_SECRET),
    }
  });
});

// GET /api/notion/auth — start OAuth
router.get('/auth', (req: Request, res: Response) => {
  if (!NOTION_CLIENT_ID) {
    return res.status(501).json({ error: { code: 'NOT_CONFIGURED', message: 'Notion OAuth 未配置。请设置 NOTION_CLIENT_ID 和 NOTION_CLIENT_SECRET。' } });
  }

  const userId = (req as any).userId;
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

  const url = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(NOTION_REDIRECT_URI)}&state=${state}`;
  res.redirect(url);
});

// GET /api/notion/callback — OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !NOTION_CLIENT_ID || !NOTION_CLIENT_SECRET) {
    return res.redirect('http://localhost:3001/?notion=error');
  }

  try {
    let userId = 'dev_user_1';
    try {
      const decoded = JSON.parse(Buffer.from(state as string, 'base64').toString());
      userId = decoded.userId;
    } catch (_) {}

    // Exchange code for token
    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: NOTION_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json() as any;

    if (tokenData.access_token) {
      saveNotionToken(userId, tokenData.access_token, tokenData.workspace_name);
      res.redirect('http://localhost:3001/?notion=connected');
    } else {
      console.error('[Notion OAuth] Token error:', tokenData);
      res.redirect('http://localhost:3001/?notion=error');
    }
  } catch (err: any) {
    console.error('[Notion OAuth] Error:', err);
    res.redirect('http://localhost:3001/?notion=error');
  }
});

// POST /api/notion/connect — manual token (for internal integrations)
router.post('/connect', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Token 必填' } });
  }

  saveNotionToken(userId, token);
  res.json({ data: { connected: true } });
});

// POST /api/notion/disconnect
router.post('/disconnect', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  clearNotionToken(userId);
  res.json({ data: { connected: false } });
});

// GET /api/notion/pages — list pages
router.get('/pages', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = Number(req.query.limit) || 20;
    const pages = await listNotionPages(userId, limit);
    res.json({ data: pages });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'NOTION_ERROR', message: err.message } });
  }
});

// GET /api/notion/pages/:id — get page content
router.get('/pages/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = await getNotionPage(userId, req.params.id);
    res.json({ data: page });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'NOTION_ERROR', message: err.message } });
  }
});

// POST /api/notion/pages — create page
router.post('/pages', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, content, parentPageId } = req.body;
    if (!title) return res.status(400).json({ error: { code: 'VALIDATION', message: 'title 必填' } });
    const page = await createNotionPage(userId, title, content || '', parentPageId);
    res.json({ data: page });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'NOTION_ERROR', message: err.message } });
  }
});

// PUT /api/notion/pages/:id — update page content
router.put('/pages/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { content } = req.body;
    await updateNotionPage(userId, req.params.id, content || '');
    res.json({ data: { success: true } });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'NOTION_ERROR', message: err.message } });
  }
});

// GET /api/notion/search — search Notion
router.get('/search', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const query = String(req.query.q || '');
    const limit = Number(req.query.limit) || 10;
    const results = await searchNotion(userId, query, limit);
    res.json({ data: results });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'NOTION_ERROR', message: err.message } });
  }
});

// POST /api/notion/sync/to — sync Vicoo note to Notion
router.post('/sync/to', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { noteId } = req.body;
    if (!noteId) return res.status(400).json({ error: { code: 'VALIDATION', message: 'noteId 必填' } });
    const result = await syncToNotion(userId, noteId);
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SYNC_ERROR', message: err.message } });
  }
});

// POST /api/notion/sync/from — sync Notion page to Vicoo
router.post('/sync/from', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { notionPageId } = req.body;
    if (!notionPageId) return res.status(400).json({ error: { code: 'VALIDATION', message: 'notionPageId 必填' } });
    const result = await syncFromNotion(userId, notionPageId);
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SYNC_ERROR', message: err.message } });
  }
});

export default router;
