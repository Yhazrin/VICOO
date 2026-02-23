/**
 * 智能体 API 路由
 *
 * POST /api/agent/chat - 智能体对话（传统模式）
 * POST /api/agent/chat/lc - 智能体对话（LangChain 模式）
 * GET /api/agent/config - 获取智能体配置
 * PUT /api/agent/config - 更新智能体配置
 * GET /api/agent/skills - 获取可用技能
 * POST /api/agent/config/minimax - 配置 MiniMax
 */

import { Router, Request, Response } from 'express';
import { runAgent, getAgentSkills, getDefaultAgentConfig, loadAgentConfig, saveAgentConfig } from '../services/agent.js';
import { saveMiniMaxConfig, getMiniMaxProvider } from '../services/minimax.js';
import { chatWithAgent, chatWithAgentStream, simpleChat } from '../services/langchain/index.js';

const router = Router();

// ==================== 对话接口 ====================

// POST /api/agent/chat - 智能体对话（LangChain + 官方 Anthropic 格式）
router.post('/chat', async (req: Request, res: Response) => {
  const { message, agentId, sessionId } = req.body;

  if (!message) {
    return res.json({
      success: false,
      error: '请提供消息内容'
    });
  }

  try {
    console.log(`[Agent] Received: ${message.substring(0, 50)}...`);

    const result = await chatWithAgent(message, { sessionId: sessionId || 'default' });

    res.json({
      success: result.success,
      response: result.content || '',
      error: result.error
    });
  } catch (error: any) {
    console.error('[Agent] Error:', error);
    res.json({
      success: false,
      response: '抱歉，处理您的请求时出现错误。',
      error: error.message
    });
  }
});

// POST /api/agent/chat/stream - 智能体对话（流式输出）
router.post('/chat/stream', async (req: Request, res: Response) => {
  const { message, sessionId } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: '请提供消息内容'
    });
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 刷新 headers 以开始流式响应
  res.flushHeaders();

  try {
    console.log(`[Agent Stream] Received: ${message.substring(0, 50)}...`);

    await chatWithAgentStream(message, {
      sessionId: sessionId || 'default',
      onStream: (data) => {
        const eventData = JSON.stringify(data);
        res.write(`data: ${eventData}\n\n`);
      }
    });
  } catch (error: any) {
    console.error('[Agent Stream] Error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
  }

  res.end();
});

// POST /api/agent/chat/lc - LangChain 模式智能体对话
router.post('/chat/lc', async (req: Request, res: Response) => {
  const { message, sessionId, useLangChain = true } = req.body;

  if (!message) {
    return res.json({
      success: false,
      error: '请提供消息内容'
    });
  }

  try {
    console.log(`[Agent-LC] Received: ${message.substring(0, 50)}...`);

    if (!useLangChain) {
      // Fallback to traditional agent
      const result = await runAgent({ message, sessionId });
      return res.json(result);
    }

    // Use LangChain agent
    const result = await chatWithAgent(message, { sessionId });

    res.json({
      success: result.success,
      response: result.content || '',
      error: result.error
    });
  } catch (error: any) {
    console.error('[Agent-LC] Error:', error);
    res.json({
      success: false,
      response: '抱歉，处理您的请求时出现错误。',
      error: error.message
    });
  }
});

// ==================== 配置接口 ====================

// GET /api/agent/config - 获取智能体配置
router.get('/config', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query;
    const config = await loadAgentConfig(agentId as string);

    res.json({
      success: true,
      config
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/agent/config - 更新智能体配置
router.put('/config', async (req: Request, res: Response) => {
  try {
    const { agentId, config } = req.body;

    if (!config) {
      return res.json({
        success: false,
        error: '请提供配置内容'
      });
    }

    // 合并现有配置
    const existingConfig = await loadAgentConfig(agentId);
    const mergedConfig = {
      ...existingConfig,
      ...config,
      id: agentId || existingConfig.id
    };

    const saved = await saveAgentConfig(mergedConfig);

    res.json({
      success: saved,
      message: saved ? '配置保存成功' : '配置保存失败'
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/agent/skills - 获取可用技能列表
router.get('/skills', async (req: Request, res: Response) => {
  try {
    const skills = getAgentSkills();

    res.json({
      success: true,
      skills: skills.map((skill, index) => ({
        id: `skill_${index}`,
        ...skill
      }))
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// ==================== MiniMax 配置 ====================

// POST /api/agent/config/minimax - 配置 MiniMax
router.post('/config/minimax', async (req: Request, res: Response) => {
  const { apiKey, baseUrl, model } = req.body;

  if (!apiKey) {
    return res.json({
      success: false,
      error: '请提供 MiniMax API Key'
    });
  }

  try {
    const saved = await saveMiniMaxConfig({
      apiKey,
      baseUrl,
      model
    });

    res.json({
      success: saved,
      message: saved ? 'MiniMax 配置保存成功' : '配置保存失败'
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/agent/test-minimax - 测试 MiniMax 对话（不使用 LangChain）
router.post('/test-minimax', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ success: false, error: '请提供消息内容' });
  }

  try {
    const miniMax = getMiniMaxProvider();
    const result = await miniMax.simpleChat([
      { role: 'user', content: message }
    ]);

    res.json({
      success: result.success,
      content: result.content,
      error: result.error
    });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

// GET /api/agent/status - 检查智能体状态
router.get('/status', async (req: Request, res: Response) => {
  try {
    const miniMax = getMiniMaxProvider();
    const config = await loadAgentConfig();

    res.json({
      success: true,
      data: {
        minimax: {
          configured: miniMax.isConfigured(),
          model: miniMax.model
        },
        agent: {
          name: config.name,
          persona: config.persona.name,
          skillsEnabled: config.skills.filter(s => s.enabled).length,
          memory: config.memory.type,
          reasoning: config.reasoning.enabled
        }
      }
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 预设智能体 ====================

// GET /api/agent/presets - 获取预设智能体列表
router.get('/presets', async (req: Request, res: Response) => {
  const presets = [
    {
      id: 'default',
      name: 'Vicoo 助手',
      description: '默认智能体，适合日常问答和知识管理',
      persona: {
        traits: ['友好', '专业', '主动']
      }
    },
    {
      id: 'writer',
      name: '写作助手',
      description: '专注于内容创作和写作建议',
      persona: {
        traits: ['创意', '文采', '逻辑']
      }
    },
    {
      id: 'researcher',
      name: '研究助手',
      description: '适合深度研究和分析任务',
      persona: {
        traits: ['严谨', '全面', '分析']
      }
    }
  ];

  res.json({
    success: true,
    presets
  });
});

export default router;
