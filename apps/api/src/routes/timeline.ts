import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAll, getOne, runQuery, saveDatabase } from '../db/index.js';

const router = Router();

// GET /api/timeline - Get all timeline events
router.get('/', (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const events = getAll<any>(
      'SELECT * FROM timeline_events ORDER BY date DESC LIMIT ? OFFSET ?',
      [Number(limit), Number(offset)]
    );

    const total = getOne<{ count: number }>('SELECT COUNT(*) as count FROM timeline_events');

    res.json({
      data: events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.date,
        type: e.type,
        relatedNoteId: e.related_note_id,
        color: e.color
      })),
      meta: {
        total: total?.count || 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch timeline' }
    });
  }
});

// POST /api/timeline - Create a new timeline event
router.post('/', (req, res) => {
  try {
    const { title, description, date, type = 'note', relatedNoteId, color = '#FFD166' } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Title and date are required' }
      });
    }

    const id = uuidv4();

    runQuery(
      'INSERT INTO timeline_events (id, title, description, date, type, related_note_id, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, description || null, date, type, relatedNoteId || null, color]
    );
    saveDatabase();

    res.status(201).json({
      data: { id, title, description, date, type, relatedNoteId, color }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create timeline event' }
    });
  }
});

// GET /api/timeline/:id - Get a specific timeline event
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const event = getOne<any>('SELECT * FROM timeline_events WHERE id = ?', [id]);

    if (!event) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Timeline event not found' }
      });
    }

    res.json({
      data: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        type: event.type,
        relatedNoteId: event.related_note_id,
        color: event.color
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch timeline event' }
    });
  }
});

// PATCH /api/timeline/:id - Update a timeline event
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, type, relatedNoteId, color } = req.body;

    const existing = getOne<any>('SELECT id FROM timeline_events WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Timeline event not found' }
      });
    }

    if (title) runQuery('UPDATE timeline_events SET title = ? WHERE id = ?', [title, id]);
    if (description !== undefined) runQuery('UPDATE timeline_events SET description = ? WHERE id = ?', [description, id]);
    if (date) runQuery('UPDATE timeline_events SET date = ? WHERE id = ?', [date, id]);
    if (type) runQuery('UPDATE timeline_events SET type = ? WHERE id = ?', [type, id]);
    if (relatedNoteId !== undefined) runQuery('UPDATE timeline_events SET related_note_id = ? WHERE id = ?', [relatedNoteId, id]);
    if (color) runQuery('UPDATE timeline_events SET color = ? WHERE id = ?', [color, id]);

    saveDatabase();

    const updated = getOne<any>('SELECT * FROM timeline_events WHERE id = ?', [id]);

    res.json({
      data: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        date: updated.date,
        type: updated.type,
        relatedNoteId: updated.related_note_id,
        color: updated.color
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update timeline event' }
    });
  }
});

// DELETE /api/timeline/:id - Delete a timeline event
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = getOne<any>('SELECT id FROM timeline_events WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Timeline event not found' }
      });
    }

    runQuery('DELETE FROM timeline_events WHERE id = ?', [id]);
    saveDatabase();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete timeline event' }
    });
  }
});

export default router;
