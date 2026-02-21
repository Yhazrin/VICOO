import { Router } from 'express';
import { getAll, getOne, runQuery, saveDatabase } from '../db/index.js';

const router = Router();

// GET /api/notes/published - Get published notes
router.get('/', (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const notes = getAll<any>(
      'SELECT * FROM notes WHERE published = 1 ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [Number(limit), Number(offset)]
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
        coverImage: n.cover_image
      })),
      meta: {
        total: total?.count || 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch published notes' }
    });
  }
});

// GET /api/notes/published/:id - Get a specific published note
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const note = getOne<any>('SELECT * FROM notes WHERE id = ? AND published = 1', [id]);

    if (!note) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Published note not found' }
      });
    }

    res.json({
      data: {
        id: note.id,
        title: note.title,
        category: note.category,
        snippet: note.snippet,
        content: note.content,
        summary: note.summary,
        timestamp: note.timestamp,
        color: note.color,
        coverImage: note.cover_image
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch published note' }
    });
  }
});

export default router;
