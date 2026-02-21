import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, getOne, getAll, getChanges, saveDatabase } from '../db/index.js';

const router = Router();

// GET /api/notes/published - Get published notes (must be before /:id)
router.get('/published', (req, res) => {
  const { limit = '20', offset = '0' } = req.query;

  const notes = getAll<any>(
    'SELECT * FROM notes WHERE published = 1 ORDER BY timestamp DESC LIMIT ? OFFSET ?',
    [parseInt(limit as string, 10), parseInt(offset as string, 10)]
  );

  const total = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes WHERE published = 1');

  res.json({
    data: notes.map(n => ({
      id: n.id,
      title: n.title,
      category: n.category,
      snippet: n.snippet,
      content: n.content,
      summary: n.summary,
      timestamp: n.timestamp,
      color: n.color,
      coverImage: n.cover_image,
      published: true
    })),
    meta: {
      total: total?.count || 0,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    }
  });
});

// GET /api/notes - List all notes
router.get('/', (req, res) => {
  const { limit = '20', offset = '0', category, tag, published } = req.query;
  const userId = (req as any).userId || 'dev_user_1';

  let query = 'SELECT * FROM notes WHERE user_id = ?';
  const params: any[] = [userId];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (published !== undefined) {
    query += ' AND published = ?';
    params.push(published === 'true' ? 1 : 0);
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const totalResult = getOne<{ total: number }>(countQuery, params);
  const total = totalResult?.total || 0;

  // Add pagination
  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

  const notes = getAll<any>(query, params);

  // Get tags for each note
  const notesWithTags = notes.map((note: any) => {
    const tags = getAll<{ name: string }>(
      `SELECT t.name FROM tags t
       JOIN note_tags nt ON t.id = nt.tag_id
       WHERE nt.note_id = ?`,
      [note.id]
    ).map(t => t.name);

    return {
      ...note,
      published: Boolean(note.published),
      tags
    };
  });

  // Handle tag filter (post-filter)
  let filtered = notesWithTags;
  if (tag) {
    filtered = notesWithTags.filter((n: any) => n.tags.includes(tag));
  }

  res.json({
    data: filtered,
    meta: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    }
  });
});

// GET /api/notes/:id - Get single note
router.get('/:id', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';

  const note = getOne<any>('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, userId]);

  if (!note) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Note not found'
      }
    });
  }

  // Get tags
  const tags = getAll<{ name: string }>(
    `SELECT t.name FROM tags t
     JOIN note_tags nt ON t.id = nt.tag_id
     WHERE nt.note_id = ?`,
    [note.id]
  ).map(t => t.name);

  res.json({
    data: {
      ...note,
      published: Boolean(note.published),
      tags
    }
  });
});

// POST /api/notes - Create note
router.post('/', (req, res) => {
  try {
    const { title, category = 'idea', tags = [], content = '', snippet, published = false, color = null, icon = null } = req.body || {};
    const userId = (req as any).userId || 'dev_user_1';

    if (!title) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required'
        }
      });
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const safeContent = content || '';
    const safeSnippet = snippet || safeContent.slice(0, 100);

    // Insert note
    runQuery(
      `INSERT INTO notes (id, user_id, title, category, snippet, content, published, color, icon, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, title, category, safeSnippet, safeContent, published ? 1 : 0, color, icon, timestamp]
    );

    // Insert tags
    for (const tagName of tags) {
      const tagId = uuidv4();
      runQuery('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
      const tag = getOne<{ id: string }>('SELECT id FROM tags WHERE name = ?', [tagName]);
      if (tag) {
        runQuery('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)', [id, tag.id]);
      }
    }

    const newNote = getOne<any>('SELECT * FROM notes WHERE id = ?', [id]);

    // Get tags
    const noteTags = getAll<{ name: string }>(
      `SELECT t.name FROM tags t
       JOIN note_tags nt ON t.id = nt.tag_id
       WHERE nt.note_id = ?`,
      [id]
    ).map(t => t.name);

    saveDatabase();

    res.status(201).json({
      data: {
        ...newNote,
        published: Boolean(newNote?.published),
        tags: noteTags
      }
    });
  } catch (error: any) {
    console.error('Error creating note:', error);
    res.status(500).json({
      error: {
        code: 'CREATE_ERROR',
        message: error.message || 'Failed to create note'
      }
    });
  }
});

// PATCH /api/notes/:id - Update note
router.patch('/:id', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';

  const existing = getOne<any>('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, userId]);

  if (!existing) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Note not found'
      }
    });
  }

  const { title, category, tags, content, snippet, published, coverImage, color, icon } = req.body;

  // Build update query dynamically
  const updates: string[] = [];
  const params: any[] = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (content !== undefined) { updates.push('content = ?'); params.push(content); }
  if (snippet !== undefined) { updates.push('snippet = ?'); params.push(snippet); }
  if (published !== undefined) { updates.push('published = ?'); params.push(published ? 1 : 0); }
  if (coverImage !== undefined) { updates.push('cover_image = ?'); params.push(coverImage); }
  if (color !== undefined) { updates.push('color = ?'); params.push(color); }
  if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }

  updates.push("updated_at = datetime('now')");

  if (updates.length > 0) {
    params.push(req.params.id, userId);
    runQuery(`UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
  }

  // Update tags if provided
  if (tags !== undefined) {
    // Remove existing tags
    runQuery('DELETE FROM note_tags WHERE note_id = ?', [req.params.id]);

    // Add new tags
    for (const tagName of tags) {
      const tagId = uuidv4();
      runQuery('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
      const tag = getOne<{ id: string }>('SELECT id FROM tags WHERE name = ?', [tagName]);
      if (tag) {
        runQuery('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)', [req.params.id, tag.id]);
      }
    }
  }

  const updated = getOne<any>('SELECT * FROM notes WHERE id = ?', [req.params.id]);

  // Get tags
  const noteTags = getAll<{ name: string }>(
    `SELECT t.name FROM tags t
     JOIN note_tags nt ON t.id = nt.tag_id
     WHERE nt.note_id = ?`,
    [req.params.id]
  ).map(t => t.name);

  saveDatabase();

  res.json({
    data: {
      ...updated,
      published: Boolean(updated?.published),
      tags: noteTags
    }
  });
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';

  // Delete note tags first
  runQuery('DELETE FROM note_tags WHERE note_id = ?', [req.params.id]);

  const result = runQuery('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, userId]);

  if (getChanges() === 0) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Note not found'
      }
    });
  }

  saveDatabase();

  res.status(204).send();
});

// POST /api/notes/bulk - Bulk operations
router.post('/bulk', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';
  const { operations } = req.body;

  if (!operations || !Array.isArray(operations)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'operations array is required'
      }
    });
  }

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const op of operations) {
    try {
      if (op.type === 'create') {
        const id = uuidv4();
        const timestamp = new Date().toISOString();
        const { title, category = 'idea', tags = [], content = '', snippet, published = false, color = null, icon = null } = op.data;

        runQuery(
          `INSERT INTO notes (id, user_id, title, category, snippet, content, published, color, icon, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, userId, title, category, snippet || content.slice(0, 100), content, published ? 1 : 0, color, icon, timestamp]
        );

        results.push({ id, success: true });
      } else if (op.type === 'update') {
        const { id, ...data } = op.data;
        const updates: string[] = [];
        const params: any[] = [];

        if (data.title !== undefined) { updates.push('title = ?'); params.push(data.title); }
        if (data.category !== undefined) { updates.push('category = ?'); params.push(data.category); }
        if (data.content !== undefined) { updates.push('content = ?'); params.push(data.content); }
        if (data.published !== undefined) { updates.push('published = ?'); params.push(data.published ? 1 : 0); }
        if (data.color !== undefined) { updates.push('color = ?'); params.push(data.color); }

        updates.push("updated_at = datetime('now')");
        params.push(id, userId);

        runQuery(`UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
        results.push({ id, success: true });
      } else if (op.type === 'delete') {
        const { id } = op.data;
        runQuery('DELETE FROM note_tags WHERE note_id = ?', [id]);
        runQuery('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
        results.push({ id, success: true });
      } else if (op.type === 'archive') {
        const { id } = op.data;
        runQuery(`UPDATE notes SET archived = 1, updated_at = datetime('now') WHERE id = ? AND user_id = ?`, [id, userId]);
        results.push({ id, success: true });
      }
    } catch (error) {
      results.push({ id: op.data?.id || 'unknown', success: false, error: String(error) });
    }
  }

  saveDatabase();

  res.json({
    data: results,
    summary: {
      total: operations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  });
});

// GET /api/notes/export - Export notes
router.get('/export', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';
  const { format = 'json', includeTags = 'true', includeMetadata = 'true' } = req.query;

  // Get all notes for user
  const notes = getAll<any>('SELECT * FROM notes WHERE user_id = ? ORDER BY timestamp DESC', [userId]);

  // Get all tags
  const tags = getAll<any>('SELECT * FROM tags', []);

  // Get note-tag relationships
  const noteTags = getAll<any>('SELECT * FROM note_tags', []);

  // Build response based on format
  if (format === 'json') {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes: notes.map((note: any) => {
        const noteTagNames = includeTags === 'true'
          ? noteTags
              .filter((nt: any) => nt.note_id === note.id)
              .map((nt: any) => tags.find((t: any) => t.id === nt.tag_id)?.name)
              .filter(Boolean)
          : [];

        const exported: any = {
          id: note.id,
          title: note.title,
          content: note.content,
          category: note.category,
          snippet: note.snippet,
          published: Boolean(note.published),
          color: note.color,
          icon: note.icon,
          timestamp: note.timestamp,
        };

        if (includeTags === 'true') {
          exported.tags = noteTagNames;
        }

        if (includeMetadata === 'true') {
          exported.updatedAt = note.updated_at;
        }

        return exported;
      })
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="vicoo-export-${Date.now()}.json"`);
    res.json(exportData);
  } else if (format === 'markdown') {
    const mdContent = notes
      .map((note: any) => {
        let md = `# ${note.title}\n\n`;
        if (note.category) md += `**Category:** ${note.category}\n\n`;
        md += `${note.content}\n`;
        return md;
      })
      .join('\n---\n\n');

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="vicoo-export-${Date.now()}.md"`);
    res.send(mdContent);
  } else {
    res.status(400).json({
      error: { code: 'INVALID_FORMAT', message: 'Supported formats: json, markdown' }
    });
  }
});

// POST /api/notes/import - Import notes
router.post('/import', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';
  const { notes: importNotes, mergeStrategy = 'skip' } = req.body;

  if (!importNotes || !Array.isArray(importNotes)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'notes array is required'
      }
    });
  }

  const results: { id: string; action: string; success: boolean }[] = [];
  let imported = 0;
  let skipped = 0;

  for (const note of importNotes) {
    try {
      // Check for existing note with same title
      const existing = getOne<any>('SELECT id FROM notes WHERE user_id = ? AND title = ?', [userId, note.title]);

      if (existing) {
        if (mergeStrategy === 'skip') {
          skipped++;
          results.push({ id: note.id || note.title, action: 'skipped', success: true });
          continue;
        } else if (mergeStrategy === 'update') {
          // Update existing note
          runQuery(
            `UPDATE notes SET content = ?, category = ?, updated_at = datetime('now') WHERE id = ?`,
            [note.content, note.category || 'idea', existing.id]
          );
          results.push({ id: existing.id, action: 'updated', success: true });
          imported++;
        }
      } else {
        // Create new note
        const id = uuidv4();
        const timestamp = new Date().toISOString();

        runQuery(
          `INSERT INTO notes (id, user_id, title, category, snippet, content, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, userId, note.title, note.category || 'idea', note.snippet || (note.content?.slice(0, 100) || ''), note.content || '', timestamp]
        );

        // Handle tags
        if (note.tags && Array.isArray(note.tags)) {
          for (const tagName of note.tags) {
            const tagId = uuidv4();
            runQuery('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
            const tag = getOne<{ id: string }>('SELECT id FROM tags WHERE name = ?', [tagName]);
            if (tag) {
              runQuery('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)', [id, tag.id]);
            }
          }
        }

        results.push({ id, action: 'created', success: true });
        imported++;
      }
    } catch (error) {
      results.push({ id: note.id || note.title, action: 'failed', success: false });
    }
  }

  saveDatabase();

  res.json({
    data: results,
    summary: {
      total: importNotes.length,
      imported,
      skipped,
      failed: results.filter(r => !r.success).length
    }
  });
});

export default router;
