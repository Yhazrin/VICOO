/**
 * AI 助手 API 路由
 *
 * POST /api/ai/chat - 发送消息给 AI 助手
 * GET /api/ai/status - 检查 AI 服务状态
 * POST /api/ai/summary - 生成摘要
 * POST /api/ai/suggest-tags - 建议标签
 */

import { Router, Request, Response } from 'express';
import { runAIAssistant } from '../services/ai-assistant.js';
import { getOne, runQuery, saveDatabase } from '../db/index.js';
import { chatWithAgent } from '../services/langchain/index.js';

const router = Router();

/**
 * 去除 MiniMax M2-her 模型返回的 <think>...</think> 推理块，只保留实际回答
 */
function stripThinkingBlock(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
}

// POST /api/ai/chat - AI 聊天接口（使用 LangChain + MiniMax 智能体）
router.post('/chat', async (req: Request, res: Response) => {
  const { message, mode, useAgent } = req.body;

  if (!message) {
    return res.json({
      success: false,
      error: '请提供消息内容'
    });
  }

  try {
    console.log(`[AI Chat] Received: ${message.substring(0, 50)}...`);

    // 使用 LangChain Agent（基于 MiniMax-M2.5 + LangChain 工具）
    const sessionId = (req.body && req.body.sessionId) || 'default';
    const result = await chatWithAgent(message, {
      sessionId,
      // 预留参数：后续可从前端传温度/模式等
    });

    if (!result.success) {
      return res.json({
        success: false,
        response: '',
        error: result.error || 'AI 助手调用失败',
      });
    }

    res.json({
      success: true,
      response: result.content || '',
    });
  } catch (error: any) {
    console.error('[AI Chat] Error:', error);
    res.json({
      success: false,
      response: '抱歉，处理您的请求时出现错误。',
      error: error.message
    });
  }
});

// GET /api/ai/status - AI 服务状态
router.get('/status', async (req: Request, res: Response) => {
  try {
    const minimaxConfigured = !!process.env.MINIMAX_API_KEY;

    res.json({
      success: true,
      data: {
        minimax: minimaxConfigured,
        provider: 'minimax/langchain',
        modes: ['auto', 'knowledge', 'search', 'action']
      }
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/ai/summary - 生成笔记摘要
router.post('/summary', async (req: Request, res: Response) => {
  const { noteId, text } = req.body;

  if (!noteId && !text) {
    return res.json({
      success: false,
      error: '请提供 noteId 或 text'
    });
  }

  try {
    let contentToSummarize = text;

    // If noteId provided, get note content
    if (noteId) {
      const note = getOne<any>('SELECT * FROM notes WHERE id = ?', [noteId]);
      if (!note) {
        return res.json({ success: false, error: '笔记不存在' });
      }
      contentToSummarize = note.content || note.snippet || '';
    }

    if (!contentToSummarize || contentToSummarize.length < 50) {
      return res.json({
        success: true,
        summary: contentToSummarize,
        keywords: []
      });
    }

    // Use AI to generate summary
    const result = await runAIAssistant({
      message: `请为以下内容生成一个简洁的摘要（50字以内）和关键词列表。格式：\n摘要：...\n关键词：...\n\n内容：${contentToSummarize.slice(0, 2000)}`,
      mode: 'auto'
    });

    let summary = '';
    let keywords: string[] = [];

    if (result.success && result.response) {
      const cleaned = stripThinkingBlock(result.response);

      const summaryMatch = cleaned.match(/摘要[：:]\s*([\s\S]*?)(?=关键词[：:]|$)/);
      if (summaryMatch) {
        summary = summaryMatch[1].trim();
      }

      const keywordsMatch = cleaned.match(/关键词[：:]\s*([\s\S]*)/);
      if (keywordsMatch) {
        keywords = keywordsMatch[1].split(/[,，、\n]/).map(k => k.trim()).filter(Boolean);
      }

      if (!summary && !keywordsMatch) {
        summary = cleaned;
      }
    }

    // Update note with summary if noteId provided
    if (noteId && summary) {
      runQuery(
        "UPDATE notes SET summary = ?, updated_at = datetime('now') WHERE id = ?",
        [summary, noteId]
      );
      saveDatabase();
    }

    res.json({
      success: true,
      summary,
      keywords
    });
  } catch (error: any) {
    console.error('[AI Summary] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/ai/suggest-tags - 智能标签建议
router.post('/suggest-tags', async (req: Request, res: Response) => {
  const { noteId, text } = req.body;

  if (!noteId && !text) {
    return res.json({
      success: false,
      error: '请提供 noteId 或 text'
    });
  }

  try {
    let contentToAnalyze = text;

    // If noteId provided, get note content and existing tags
    let existingTags: string[] = [];
    if (noteId) {
      const note = getOne<any>('SELECT * FROM notes WHERE id = ?', [noteId]);
      if (!note) {
        return res.json({ success: false, error: '笔记不存在' });
      }
      contentToAnalyze = note.content || note.snippet || '';

      // Get existing tags
      const noteTags = getOne<any>(
        `SELECT t.name FROM tags t
         JOIN note_tags nt ON t.id = nt.tag_id
         WHERE nt.note_id = ?`,
        [noteId]
      );
      if (noteTags) {
        existingTags = Object.values(noteTags).filter(Boolean) as string[];
      }
    }

    if (!contentToAnalyze || contentToAnalyze.length < 30) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    // Use AI to suggest tags
    const result = await runAIAssistant({
      message: `请为以下内容建议3-5个标签。只返回标签列表，用逗号分隔。\n\n内容：${contentToAnalyze.slice(0, 1500)}`,
      mode: 'auto'
    });

    const suggestions: Array<{ tag: string; confidence: number; isExisting: boolean }> = [];

    if (result.success && result.response) {
      const cleaned = stripThinkingBlock(result.response);
      const tags = cleaned.split(/[,，、\n]/).map(t => t.trim()).filter(Boolean).slice(0, 5);

      for (const tag of tags) {
        const isExisting = existingTags.includes(tag);
        suggestions.push({
          tag,
          confidence: isExisting ? 0.9 : 0.7,
          isExisting
        });
      }
    }

    res.json({
      success: true,
      suggestions
    });
  } catch (error: any) {
    console.error('[AI Suggest Tags] Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

export default router;
