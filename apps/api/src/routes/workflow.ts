/**
 * 工作流 API 路由
 * 
 * 提供智能搜索工作流接口
 * 
 * 工作流程：
 * 1. POST /api/workflow/search - 执行智能搜索
 * 2. GET /api/workflow/status - 获取工作流状态
 * 3. POST /api/workflow/config - 配置 Coze
 * 4. GET /api/workflow/intent - 意图分析（仅分析，不搜索）
 */

import { Router, Request, Response } from 'express';
import { executeSearchWorkflow, simpleSearch, getWorkflowStatus } from '../services/workflow.js';
import { runCozeWorkflow, checkCozeStatus } from '../services/coze.js';
import { getCozeConfig, setCozeConfig, isCozeConfigured } from '../services/coze-config.js';
import { parseUrl } from '../services/downloader.js';

const router = Router();

// ==================== 配置接口 ====================

// GET /api/workflow/config - 获取当前 Coze 配置
router.get('/config', (req: Request, res: Response) => {
  const config = getCozeConfig();
  res.json({
    success: true,
    data: {
      configured: isCozeConfigured(),
      apiToken: config.apiToken ? '***' + config.apiToken.slice(-4) : '',
      workflowId: config.workflowId || '',
      baseUrl: config.baseUrl
    }
  });
});

// POST /api/workflow/config - 设置 Coze 配置
router.post('/config', (req: Request, res: Response) => {
  const { apiToken, workflowId, baseUrl } = req.body;

  if (!apiToken || !workflowId) {
    return res.json({
      success: false,
      error: '请提供 apiToken 和 workflowId'
    });
  }

  setCozeConfig({
    apiToken,
    workflowId,
    baseUrl
  });

  res.json({
    success: true,
    message: 'Coze 配置已更新'
  });
});

// GET /api/workflow/status - 获取工作流状态
router.get('/status', async (req: Request, res: Response) => {
  const status = await getWorkflowStatus();
  res.json(status);
});

// ==================== 意图分析接口 ====================

// POST /api/workflow/intent - 仅进行意图分析，不执行搜索
router.post('/intent', async (req: Request, res: Response) => {
  const { query, platform, contentType } = req.body;

  if (!query) {
    return res.json({
      success: false,
      error: '请提供查询内容'
    });
  }

  if (!isCozeConfigured()) {
    return res.json({
      success: false,
      error: 'Coze 未配置，请先设置 API Token 和 Workflow ID'
    });
  }

  try {
    const result = await runCozeWorkflow({
      user_input: query,
      platform,
      content_type: contentType
    });

    res.json(result);
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 搜索接口 ====================

// POST /api/workflow/search - 执行智能搜索
router.post('/search', async (req: Request, res: Response) => {
  const { 
    query,           // 用户查询 (必填)
    platform,        // 指定平台 (可选)
    contentType,     // 内容类型 (可选)
    useIntentAnalysis = true  // 是否使用意图分析
  } = req.body;

  if (!query) {
    return res.json({
      success: false,
      error: '请提供查询内容'
    });
  }

  try {
    const result = await executeSearchWorkflow({
      query,
      platform,
      contentType,
      useIntentAnalysis
    });

    res.json(result);
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message || '搜索失败'
    });
  }
});

// GET /api/workflow/search - 简单搜索 (GET 版本)
router.get('/search', async (req: Request, res: Response) => {
  const { q, platform } = req.query;

  if (!q || typeof q !== 'string') {
    return res.json({
      success: false,
      error: '请提供查询参数 q'
    });
  }

  try {
    const result = await simpleSearch(q, platform as string);
    res.json(result);
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 直接解析接口 ====================

// POST /api/workflow/parse - 直接解析 URL
router.post('/parse', async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.json({
      success: false,
      error: '请提供 URL'
    });
  }

  try {
    const result = await parseUrl(url);
    res.json(result);
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/workflow/parse - 直接解析 URL (GET 版本)
router.get('/parse', async (req: Request, res: Response) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.json({
      success: false,
      error: '请提供 URL 参数'
    });
  }

  try {
    const result = await parseUrl(url);
    res.json(result);
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// ==================== Coze Bot 对话接口 ====================

// POST /api/workflow/coze/chat - Coze Bot 对话
router.post('/coze/chat', async (req: Request, res: Response) => {
  const { query, conversation_id, user_id } = req.body;
  const config = getCozeConfig();

  if (!config.apiToken || !config.workflowId) {
    return res.json({
      success: false,
      error: 'Coze 未配置，请先设置 API Token 和 Bot ID'
    });
  }

  if (!query) {
    return res.json({
      success: false,
      error: '请提供查询内容'
    });
  }

  try {
    const response = await fetch(`${config.baseUrl}/v3/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiToken}`
      },
      body: JSON.stringify({
        bot_id: config.workflowId,
        user_id: user_id || 'web_user',
        query: query,
        conversation_id: conversation_id || `conv_${Date.now()}`,
        stream: false
      })
    });

    const data = await response.json();

    if (response.ok && data.code === 0) {
      return res.json({
        success: true,
        data: {
          conversation_id: data.data?.conversation_id,
          message: data.data?.messages?.[0]?.content || '',
          messages: data.data?.messages || []
        }
      });
    }

    return res.json({
      success: false,
      error: data.msg || data.message || '调用失败'
    });
  } catch (error: any) {
    return res.json({
      success: false,
      error: error.message || '网络错误'
    });
  }
});

// POST /api/workflow/coze/config - 配置 Coze Bot
router.post('/coze/config', (req: Request, res: Response) => {
  const { apiToken, botId, baseUrl } = req.body;

  if (!apiToken || !botId) {
    return res.json({
      success: false,
      error: '请提供 apiToken 和 botId'
    });
  }

  setCozeConfig({
    apiToken,
    workflowId: botId,
    baseUrl
  });

  res.json({
    success: true,
    message: 'Coze Bot 配置已更新'
  });
});

// GET /api/workflow/coze/config - 获取 Coze Bot 配置
router.get('/coze/config', (req: Request, res: Response) => {
  const config = getCozeConfig();
  res.json({
    success: true,
    data: {
      configured: isCozeConfigured(),
      botId: config.workflowId || '',
      baseUrl: config.baseUrl
    }
  });
});

export default router;
