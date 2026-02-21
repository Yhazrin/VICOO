import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAll, getOne, runQuery, saveDatabase } from '../db/index.js';

const router = Router();

// GET /api/tags - Get all tags with note counts
router.get('/', (req, res) => {
  try {
    const tags = getAll<{ id: string; name: string; color: string; created_at: string }>(
      'SELECT id, name, color, created_at FROM tags ORDER BY name'
    );

    // Get note counts for each tag
    const tagsWithCounts = tags.map(tag => {
      const count = getOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM note_tags WHERE tag_id = ?',
        [tag.id]
      );
      return {
        id: tag.id,
        name: tag.name,
        color: tag.color || '#6B7280',
        count: count?.count || 0
      };
    });

    res.json({ data: tagsWithCounts });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tags' }
    });
  }
});

// POST /api/tags - Create a new tag
router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Tag name is required' }
      });
    }

    const id = uuidv4();
    const tagColor = color || '#6B7280';

    runQuery(
      'INSERT INTO tags (id, name, color) VALUES (?, ?, ?)',
      [id, name, tagColor]
    );
    saveDatabase();

    res.status(201).json({
      data: { id, name, color: tagColor, count: 0 }
    });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: { code: 'DUPLICATE_TAG', message: 'Tag already exists' }
      });
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create tag' }
    });
  }
});

// GET /api/tags/:id - Get a specific tag
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tag = getOne<{ id: string; name: string; color: string; created_at: string }>(
      'SELECT id, name, color, created_at FROM tags WHERE id = ?',
      [id]
    );

    if (!tag) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Tag not found' }
      });
    }

    const count = getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM note_tags WHERE tag_id = ?',
      [id]
    );

    res.json({
      data: { ...tag, count: count?.count || 0 }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tag' }
    });
  }
});

// PATCH /api/tags/:id - Update a tag
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const existing = getOne<{ id: string }>('SELECT id FROM tags WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Tag not found' }
      });
    }

    if (name) {
      runQuery('UPDATE tags SET name = ? WHERE id = ?', [name, id]);
    }
    if (color) {
      runQuery('UPDATE tags SET color = ? WHERE id = ?', [color, id]);
    }
    saveDatabase();

    const updated = getOne<{ id: string; name: string; color: string }>(
      'SELECT id, name, color FROM tags WHERE id = ?',
      [id]
    );

    res.json({ data: updated });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: { code: 'DUPLICATE_TAG', message: 'Tag name already exists' }
      });
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update tag' }
    });
  }
});

// DELETE /api/tags/:id - Delete a tag
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = getOne<{ id: string }>('SELECT id FROM tags WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Tag not found' }
      });
    }

    runQuery('DELETE FROM note_tags WHERE tag_id = ?', [id]);
    runQuery('DELETE FROM tags WHERE id = ?', [id]);
    saveDatabase();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete tag' }
    });
  }
});

// GET /api/tags/:id/notes - Get notes with a specific tag
router.get('/:id/notes', (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const tag = getOne<{ id: string }>('SELECT id FROM tags WHERE id = ?', [id]);
    if (!tag) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Tag not found' }
      });
    }

    const notes = getAll<any>(
      `SELECT n.* FROM notes n
       INNER JOIN note_tags nt ON n.id = nt.note_id
       WHERE nt.tag_id = ?
       ORDER BY n.timestamp DESC
       LIMIT ? OFFSET ?`,
      [id, Number(limit), Number(offset)]
    );

    const total = getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM note_tags WHERE tag_id = ?',
      [id]
    );

    res.json({
      data: notes.map(n => ({
        id: n.id,
        title: n.title,
        category: n.category,
        snippet: n.snippet,
        tags: [],
        timestamp: n.timestamp,
        content: n.content,
        summary: n.summary,
        published: !!n.published,
        coverImage: n.cover_image,
        color: n.color,
        icon: n.icon
      })),
      meta: {
        total: total?.count || 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tag notes' }
    });
  }
});

export default router;
