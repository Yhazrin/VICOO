/**
 * RAG (Retrieval-Augmented Generation) API Routes
 *
 * POST /api/rag/search - Semantic search
 * POST /api/rag/hybrid-search - Hybrid search (semantic + keyword)
 * POST /api/rag/ask - Question answering
 * POST /api/rag/ask-domain - Domain-specific question answering
 * POST /api/rag/index - Index a note
 * POST /api/rag/index-all - Re-index all notes
 */

import { Router, Request, Response } from 'express';
import {
  semanticSearch,
  hybridSearch,
  askQuestion,
  askWithDomain,
  indexNote,
  indexAllNotes
} from '../services/rag-enhanced.js';
import { getAll } from '../db/index.js';

const router = Router();

// POST /api/rag/search - Semantic search
router.post('/search', async (req: Request, res: Response) => {
  const { query, limit = 5, userId } = req.body;

  if (!query) {
    return res.json({
      success: false,
      error: 'Query is required'
    });
  }

  try {
    const results = await semanticSearch(query, limit, userId);

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

// POST /api/rag/hybrid-search - Hybrid search (semantic + keyword)
router.post('/hybrid-search', async (req: Request, res: Response) => {
  const { query, limit = 5, userId } = req.body;

  if (!query) {
    return res.json({
      success: false,
      error: 'Query is required'
    });
  }

  try {
    const results = await hybridSearch(query, limit, userId);

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('[RAG Hybrid Search] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/rag/ask - Question answering with RAG
router.post('/ask', async (req: Request, res: Response) => {
  const { question, topK = 3, temperature = 0.7, maxTokens = 2048, userId } = req.body;

  if (!question) {
    return res.json({
      success: false,
      error: 'Question is required'
    });
  }

  try {
    const result = await askQuestion(question, {
      topK,
      temperature,
      maxTokens,
      userId
    });

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

// POST /api/rag/ask-domain - Domain-specific question answering
router.post('/ask-domain', async (req: Request, res: Response) => {
  const { question, domain = 'notes', topK = 3 } = req.body;

  if (!question) {
    return res.json({
      success: false,
      error: 'Question is required'
    });
  }

  if (!['notes', 'tasks', 'timeline'].includes(domain)) {
    return res.json({
      success: false,
      error: 'Invalid domain. Must be one of: notes, tasks, timeline'
    });
  }

  try {
    const result = await askWithDomain(question, domain, { topK });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[RAG Ask Domain] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/rag/index - Index a single note
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
  const userId = (req as any).userId;

  try {
    const count = await indexAllNotes(userId);

    res.json({
      success: true,
      message: `Indexed ${count} notes`
    });
  } catch (error: any) {
    console.error('[RAG Index All] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/rag/stats - Get RAG statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const embeddingsCount = getAll<any>('SELECT COUNT(*) as count FROM note_embeddings');
    const notesWithEmbeddings = getAll<any>(`
      SELECT COUNT(DISTINCT note_id) as count FROM note_embeddings
    `);

    res.json({
      success: true,
      data: {
        totalEmbeddings: embeddingsCount[0]?.count || 0,
        indexedNotes: notesWithEmbeddings[0]?.count || 0
      }
    });
  } catch (error: any) {
    console.error('[RAG Stats] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

export default router;
