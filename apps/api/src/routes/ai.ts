/**
 * AI 助手 API 路由
 * 
 * POST /api/ai/chat - 发送消息给 AI 助手
 * GET /api/ai/status - 检查 AI 服务状态
 */

import { Router, Request, Response } from 'express';
import { runAIAssistant } from '../services/ai-assistant.js';
import { isCozeConfigured } from '../services/coze-config.js';

const router = Router();

// POST /api/ai/chat - AI 聊天接口
router.post('/chat', async (req: Request, res: Response) => {
  const { message, mode } = req.body;

  if (!message) {
    return res.json({
      success: false,
      error: '请提供消息内容'
    });
  }

  try {
    console.log(`[AI Chat] Received: ${message.substring(0, 50)}...`);

    const result = await runAIAssistant({
      message,
      mode
    });

    res.json(result);
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
    // 检查 Claude Code
    const { execSync } = await import('child_process');
    let claudeStatus = 'unavailable';

    try {
      const version = execSync('claude --version', {
        encoding: 'utf-8',
        timeout: 5000,
        windowsHide: true
      });
      claudeStatus = version.trim();
    } catch {
      claudeStatus = 'not installed';
    }

    // 检查 Coze
    const cozeConfigured = isCozeConfigured();

    res.json({
      success: true,
      data: {
        claudeCode: claudeStatus !== 'not installed',
        claudeVersion: claudeStatus,
        coze: cozeConfigured,
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

export default router;
