import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, getOne, getAll, saveDatabase } from '../db/index.js';

const router = Router();

// Type definitions
interface NoteLink {
  id: string;
  source_note_id: string;
  target_note_id: string;
  created_at: string;
}

interface Note {
  id: string;
  user_id: string;
}

// GET /api/note-links - Get all note links
router.get('/', (req, res) => {
  try {
    const userId = (req as any).userId || 'dev_user_1';

    const links = getAll<NoteLink>(
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
  } catch (error) {
    console.error('[NoteLinks] Failed to fetch links:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch note links' }
    });
  }
});

// POST /api/note-links - Create a note link
router.post('/', (req, res) => {
  try {
    const userId = (req as any).userId || 'dev_user_1';
    const { sourceNoteId, targetNoteId } = req.body;

    if (!sourceNoteId || !targetNoteId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'sourceNoteId and targetNoteId are required' }
      });
    }

    // Verify both notes belong to user
    const sourceNote = getOne<Note>('SELECT id FROM notes WHERE id = ? AND user_id = ?', [sourceNoteId, userId]);
    const targetNote = getOne<Note>('SELECT id FROM notes WHERE id = ? AND user_id = ?', [targetNoteId, userId]);

    if (!sourceNote || !targetNote) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'One or both notes not found' }
      });
    }

    const id = uuidv4();
    runQuery(
      'INSERT OR IGNORE INTO note_links (id, source_note_id, target_note_id) VALUES (?, ?, ?)',
      [id, sourceNoteId, targetNoteId]
    );

    saveDatabase();

    res.status(201).json({
      data: { id, sourceNoteId, targetNoteId }
    });
  } catch (error) {
    console.error('[NoteLinks] Failed to create link:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create note link' }
    });
  }
});

// DELETE /api/note-links/:id - Delete a note link
router.delete('/:id', (req, res) => {
  try {
    const userId = (req as any).userId || 'dev_user_1';

    // Verify the link belongs to user's notes
    const link = getOne<NoteLink>(
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
  } catch (error) {
    console.error('[NoteLinks] Failed to delete link:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete note link' }
    });
  }
});

export default router;
