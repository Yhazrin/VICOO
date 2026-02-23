import { Router } from 'express';
import { runQuery, getOne, getAll, saveDatabase } from '../db/index.js';

const router = Router();

// GET /api/note-links - Get all note links
router.get('/', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';

  const links = getAll<any>(
    `SELECT nl.* FROM note_links nl
     JOIN notes n ON nl.source_note_id = n.id
     WHERE n.user_id = ?`,
    [userId]
  );

  res.json({
    data: links.map(l => ({
      id: l.id,
      sourceNoteId: l.source_note_id,
      targetNoteId: l.target_note_id,
      createdAt: l.created_at
    }))
  });
});

// POST /api/note-links - Create a note link
router.post('/', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';
  const { sourceNoteId, targetNoteId } = req.body;

  if (!sourceNoteId || !targetNoteId) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'sourceNoteId and targetNoteId are required' }
    });
  }

  // Verify both notes belong to user
  const sourceNote = getOne<any>('SELECT id FROM notes WHERE id = ? AND user_id = ?', [sourceNoteId, userId]);
  const targetNote = getOne<any>('SELECT id FROM notes WHERE id = ? AND user_id = ?', [targetNoteId, userId]);

  if (!sourceNote || !targetNote) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'One or both notes not found' }
    });
  }

  const id = require('uuid').v4();
  runQuery(
    'INSERT OR IGNORE INTO note_links (id, source_note_id, target_note_id) VALUES (?, ?, ?)',
    [id, sourceNoteId, targetNoteId]
  );

  saveDatabase();

  res.status(201).json({
    data: { id, sourceNoteId, targetNoteId }
  });
});

// DELETE /api/note-links/:id - Delete a note link
router.delete('/:id', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';

  // Verify the link belongs to user's notes
  const link = getOne<any>(
    `SELECT nl.* FROM note_links nl
     JOIN notes n ON nl.source_note_id = n.id
     WHERE nl.id = ? AND n.user_id = ?`,
    [req.params.id, userId]
  );

  if (!link) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Link not found' }
    });
  }

  runQuery('DELETE FROM note_links WHERE id = ?', [req.params.id]);
  saveDatabase();

  res.status(204).send();
});

export default router;
