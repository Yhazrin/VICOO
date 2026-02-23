/**
 * RAG (Retrieval-Augmented Generation) API Routes
 *
 * POST /api/rag/search - Semantic search
 * POST /api/rag/ask - Question answering
 * POST /api/rag/index - Index a note
 */

import { Router, Request, Response } from 'express';
import { semanticSearch, askQuestion, indexNote, initializeEmbeddingsTable } from '../services/rag.js';
import { getOne, getAll } from '../db/index.js';

const router = Router();

// Initialize on load
initializeEmbeddingsTable();

// POST /api/rag/search - Semantic search
router.post('/search', async (req: Request, res: Response) => {
  const { query, limit = 5 } = req.body;

  if (!query) {
    return res.json({
      success: false,
      error: 'Query is required'
    });
  }

  try {
    const results = await semanticSearch(query, limit);

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('[RAG Search] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/rag/ask - Question answering
router.post('/ask', async (req: Request, res: Response) => {
  const { question } = req.body;

  if (!question) {
    return res.json({
      success: false,
      error: 'Question is required'
    });
  }

  try {
    const result = await askQuestion(question);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[RAG Ask] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/rag/index - Index a note for search
router.post('/index', async (req: Request, res: Response) => {
  const { noteId } = req.body;

  if (!noteId) {
    return res.json({
      success: false,
      error: 'noteId is required'
    });
  }

  try {
    await indexNote(noteId);

    res.json({
      success: true,
      message: 'Note indexed successfully'
    });
  } catch (error: any) {
    console.error('[RAG Index] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/rag/index-all - Re-index all notes
router.post('/index-all', async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'dev_user_1';

  try {
    const notes = getAll<any>('SELECT id FROM notes WHERE user_id = ?', [userId]);

    for (const note of notes) {
      await indexNote(note.id);
    }

    res.json({
      success: true,
      message: `Indexed ${notes.length} notes`
    });
  } catch (error: any) {
    console.error('[RAG Index All] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

export default router;
