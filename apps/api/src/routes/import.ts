/**
 * Import API — Notion export (JSON/CSV) and Markdown files
 *
 * POST /api/import/markdown — upload .md files
 * POST /api/import/notion   — upload Notion export (JSON)
 * POST /api/import/json     — upload Vicoo JSON export
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, getOne, saveDatabase } from '../db/index.js';
import path from 'path';
import fs from 'fs';

const router = Router();
const TEMP_DIR = path.join(process.cwd(), 'data', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const upload = multer({ dest: TEMP_DIR, limits: { fileSize: 20 * 1024 * 1024 } });

// POST /api/import/markdown — import .md file(s)
router.post('/markdown', upload.array('files', 50), (req: Request, res: Response) => {
  const userId = (req as any).userId || 'dev_user_1';
  const files = req.files as Express.Multer.File[];

  if (!files?.length) {
    return res.status(400).json({ error: { code: 'NO_FILES', message: '请上传 Markdown 文件' } });
  }

  const results: { title: string; id: string; success: boolean }[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const title = path.basename(file.originalname, path.extname(file.originalname));
      const id = uuidv4();

      // Extract first heading as title if available
      const headingMatch = content.match(/^#\s+(.+)$/m);
      const noteTitle = headingMatch ? headingMatch[1].trim() : title;

      runQuery(
        `INSERT INTO notes (id, user_id, title, content, snippet, category, status, timestamp)
         VALUES (?, ?, ?, ?, ?, 'idea', 'inbox', datetime('now'))`,
        [id, userId, noteTitle, content, content.slice(0, 120)]
      );

      results.push({ title: noteTitle, id, success: true });
    } catch (err: any) {
      results.push({ title: file.originalname, id: '', success: false });
    } finally {
      try { fs.unlinkSync(file.path); } catch (_) {}
    }
  }

  saveDatabase();

  res.json({
    data: {
      imported: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    }
  });
});

// POST /api/import/notion — import Notion export (JSON format)
router.post('/notion', upload.single('file'), (req: Request, res: Response) => {
  const userId = (req as any).userId || 'dev_user_1';
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: { code: 'NO_FILE', message: '请上传 Notion 导出文件 (JSON)' } });
  }

  try {
    const raw = fs.readFileSync(file.path, 'utf-8');
    let data: any;
    try { data = JSON.parse(raw); } catch { return res.status(400).json({ error: { code: 'INVALID_JSON', message: '无效的 JSON 格式' } }); }

    const pages = Array.isArray(data) ? data : data.results || data.pages || [data];
    let imported = 0;

    for (const page of pages) {
      const id = uuidv4();
      const title = page.properties?.Name?.title?.[0]?.plain_text
        || page.properties?.title?.title?.[0]?.plain_text
        || page.title || page.name || 'Untitled';

      // Extract content from Notion blocks
      let content = '';
      if (page.children || page.blocks) {
        const blocks = page.children || page.blocks || [];
        content = blocks.map((b: any) => {
          if (b.type === 'paragraph') return b.paragraph?.rich_text?.map((t: any) => t.plain_text).join('') || '';
          if (b.type === 'heading_1') return `# ${b.heading_1?.rich_text?.map((t: any) => t.plain_text).join('') || ''}`;
          if (b.type === 'heading_2') return `## ${b.heading_2?.rich_text?.map((t: any) => t.plain_text).join('') || ''}`;
          if (b.type === 'heading_3') return `### ${b.heading_3?.rich_text?.map((t: any) => t.plain_text).join('') || ''}`;
          if (b.type === 'bulleted_list_item') return `- ${b.bulleted_list_item?.rich_text?.map((t: any) => t.plain_text).join('') || ''}`;
          if (b.type === 'numbered_list_item') return `1. ${b.numbered_list_item?.rich_text?.map((t: any) => t.plain_text).join('') || ''}`;
          if (b.type === 'code') return `\`\`\`\n${b.code?.rich_text?.map((t: any) => t.plain_text).join('') || ''}\n\`\`\``;
          if (b.type === 'quote') return `> ${b.quote?.rich_text?.map((t: any) => t.plain_text).join('') || ''}`;
          return '';
        }).filter(Boolean).join('\n\n');
      }

      if (!content && page.content) content = page.content;
      if (!content && page.body) content = page.body;

      // Extract tags from Notion properties
      const tags: string[] = [];
      if (page.properties?.Tags?.multi_select) {
        for (const t of page.properties.Tags.multi_select) {
          tags.push(t.name);
          const tagId = uuidv4();
          runQuery('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [tagId, t.name]);
          const tag = getOne<any>('SELECT id FROM tags WHERE name = ?', [t.name]);
          if (tag) runQuery('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)', [id, tag.id]);
        }
      }

      runQuery(
        `INSERT INTO notes (id, user_id, title, content, snippet, category, status, timestamp)
         VALUES (?, ?, ?, ?, ?, 'idea', 'inbox', datetime('now'))`,
        [id, userId, title, content, content.slice(0, 120)]
      );

      imported++;
    }

    saveDatabase();
    fs.unlinkSync(file.path);

    res.json({ data: { imported, total: pages.length } });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'IMPORT_ERROR', message: err.message } });
  }
});

// POST /api/import/json — import Vicoo JSON export
router.post('/json', upload.single('file'), (req: Request, res: Response) => {
  const userId = (req as any).userId || 'dev_user_1';
  const file = req.file;

  if (!file) return res.status(400).json({ error: { code: 'NO_FILE', message: '请上传 Vicoo 导出文件' } });

  try {
    const raw = fs.readFileSync(file.path, 'utf-8');
    const data = JSON.parse(raw);
    const notes = data.notes || [];
    let imported = 0;

    for (const note of notes) {
      const id = uuidv4();
      runQuery(
        `INSERT INTO notes (id, user_id, title, content, snippet, category, status, published, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, note.title, note.content || '', note.snippet || '', note.category || 'idea', note.status || 'inbox', note.published ? 1 : 0, note.timestamp || new Date().toISOString()]
      );

      // Import tags
      for (const tagName of (note.tags || [])) {
        const tagId = uuidv4();
        runQuery('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
        const tag = getOne<any>('SELECT id FROM tags WHERE name = ?', [tagName]);
        if (tag) runQuery('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)', [id, tag.id]);
      }

      imported++;
    }

    saveDatabase();
    fs.unlinkSync(file.path);

    res.json({ data: { imported, total: notes.length } });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'IMPORT_ERROR', message: err.message } });
  }
});

export default router;
