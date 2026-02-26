/**
 * AI Writing Agent API Routes
 *
 * POST /api/writer/rewrite - Rewrite content
 * POST /api/writer/outline - Generate outline
 * POST /api/writer/expand - Expand content
 * POST /api/writer/translate - Translate content
 * POST /api/writer/improve - Improve content (LangChain)
 */

import { Router, Request, Response } from 'express';
import { runWritingAgent, WritingAction } from '../services/ai-writer.js';
import { createWritingChain, writingActions, writingStyles } from '../services/langchain/index.js';

const router = Router();

// POST /api/writer/rewrite - Rewrite in different styles
router.post('/rewrite', async (req: Request, res: Response) => {
  const { content, style = 'improve', tone } = req.body;

  if (!content) {
    return res.json({
      success: false,
      error: 'Content is required'
    });
  }

  try {
    const actionMap: Record<string, WritingAction> = {
      'improve': 'improve',
      'simplify': 'simplify',
      'formal': 'formal',
      'casual': 'casual',
      'rewrite': 'rewrite'
    };

    const action = actionMap[style] || 'improve';
    const result = await runWritingAgent({ content, action, tone });

    res.json(result);
  } catch (error: any) {
    console.error('[Writer Rewrite] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/writer/outline - Generate outline
router.post('/outline', async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content) {
    return res.json({
      success: false,
      error: 'Content is required'
    });
  }

  try {
    const result = await runWritingAgent({ content, action: 'outline' });
    res.json(result);
  } catch (error: any) {
    console.error('[Writer Outline] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/writer/expand - Expand content
router.post('/expand', async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content) {
    return res.json({
      success: false,
      error: 'Content is required'
    });
  }

  try {
    const result = await runWritingAgent({ content, action: 'expand' });
    res.json(result);
  } catch (error: any) {
    console.error('[Writer Expand] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/writer/translate - Translate content
router.post('/translate', async (req: Request, res: Response) => {
  const { content, language = 'English' } = req.body;

  if (!content) {
    return res.json({
      success: false,
      error: 'Content is required'
    });
  }

  try {
    const result = await runWritingAgent({ content, action: 'translate', language });
    res.json(result);
  } catch (error: any) {
    console.error('[Writer Translate] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/writer/summarize - Summarize content
router.post('/summarize', async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content) {
    return res.json({
      success: false,
      error: 'Content is required'
    });
  }

  try {
    const result = await runWritingAgent({ content, action: 'summarize' });
    res.json(result);
  } catch (error: any) {
    console.error('[Writer Summarize] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/writer/improve - 使用 MiniMax M2.5 改进内容
router.post('/improve', async (req: Request, res: Response) => {
  const { content, action = 'improve' } = req.body;

  if (!content) {
    return res.json({ success: false, error: 'Content is required' });
  }

  try {
    const result = await runWritingAgent({ content, action: action as any });
    res.json(result);
  } catch (error: any) {
    console.error('[Writer Improve] Error:', error);
    res.json({ success: false, error: error.message });
  }
});

export default router;
