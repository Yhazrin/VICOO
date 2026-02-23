/**
 * LangChain 模型工厂
 * 统一模型入口，支持 MiniMax、OpenAI、Anthropic
 * MiniMax 使用官方 Anthropic 兼容接口（baseUrl + tools 原生支持）
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getMiniMaxProvider, type MiniMaxProvider } from '../minimax.js';

/**
 * 模型类型
 */
export type ModelProvider = 'openai' | 'minimax' | 'anthropic';

/**
 * 模型配置
 */
export interface ModelConfig {
  provider: ModelProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 创建 OpenAI Chat Model
 */
export function createOpenAIModel(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): ChatOpenAI {
  return new ChatOpenAI({
    model: config?.model || 'gpt-4o-mini',
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 4096,
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * 创建 Anthropic Chat Model
 */
export function createAnthropicModel(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): ChatAnthropic {
  return new ChatAnthropic({
    model: config?.model || 'claude-3-5-sonnet-20241022',
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 4096,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * 统一模型工厂函数
 */
export function createChatModel(config: ModelConfig): BaseChatModel<any> {
  switch (config.provider) {
    case 'openai':
      return createOpenAIModel({
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    case 'anthropic':
      return createAnthropicModel({
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    case 'minimax':
    default:
      return createMiniMaxModel({
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
  }
}

/**
 * 获取默认的嵌入模型（OpenAI）
 */
export function getEmbeddingModel(): ChatOpenAI {
  return new ChatOpenAI({
    model: 'text-embedding-3-small',
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// ==================== MiniMax LLM Wrapper ====================

/**
 * MiniMax 模型配置
 */
export interface MiniMaxConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * MiniMax LLM - 简化的 LangChain 包装器
 * 用于文本对话
 */
class MiniMaxLLM {
  model: string;
  temperature: number;
  maxTokens: number;
  private miniMax: MiniMaxProvider;

  constructor(config: MiniMaxConfig = {}) {
    this.model = config.model || 'MiniMax-M2.5';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 4096;
    // 使用 getMiniMaxProvider 从数据库/环境变量读取配置
    const providerConfig: { apiKey?: string; baseUrl?: string; model?: string } = {
      model: this.model,
    };
    if (config.apiKey) providerConfig.apiKey = config.apiKey;
    if (config.baseUrl) providerConfig.baseUrl = config.baseUrl;
    this.miniMax = getMiniMaxProvider(providerConfig as any);
  }

  /**
   * 调用模型生成回复
   */
  async invoke(messages: any[]): Promise<any> {
    // 检查 API Key 是否配置
    if (!this.miniMax.isConfigured()) {
      console.log('[MiniMax] API Key not configured, using mock response');
      // 返回模拟响应用于测试
      const lastMessage = messages[messages.length - 1]?.content || '';
      const mockResponse = this.generateMockResponse(lastMessage);
      return {
        content: mockResponse,
        text: mockResponse,
      };
    }

    // 转换消息格式：优先使用显式的 role，其次兼容 LangChain Message 的 kwargs.type
    const minimaxMessages: any[] = messages.map((msg: any) => ({
      role: msg.role
        ?? (msg?.kwargs?.type === 'system'
          ? 'system'
          : msg?.kwargs?.type === 'ai'
            ? 'assistant'
            : 'user'),
      content: msg?.kwargs?.content || msg?.content || msg?.text || '',
    }));

    const result = await this.miniMax.chat({
      messages: minimaxMessages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });

    if (!result.success) {
      throw new Error(result.error || 'MiniMax API error');
    }

    const content = result.data?.content || [];
    const textBlock = content.find((c: any) => c.type === 'text');
    const text = textBlock?.text || '';

    return {
      content: text,
      text,
    };
  }

  /**
   * 生成模拟响应（用于测试）
   */
  private generateMockResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('搜索') || lowerMessage.includes('search')) {
      return '【搜索结果】\n\n找到以下相关笔记：\n1. React Best Practices - 包含 React 开发最佳实践\n2. Design System Ideas - 设计系统相关笔记\n3. Project Planning Meeting - 项目规划会议记录';
    }

    if (lowerMessage.includes('创建') || lowerMessage.includes('create')) {
      return '【创建成功】\n\n已为您创建新笔记！';
    }

    if (lowerMessage.includes('任务') || lowerMessage.includes('task')) {
      return '【任务列表】\n\n当前有 2 个待办任务：\n1. 完成 API 文档\n2. 测试新功能';
    }

    if (lowerMessage.includes('改进') || lowerMessage.includes('improve')) {
      return '【改进后的内容】\n\n这是一段经过改进的创意风格文本，包含了更丰富的表达和更好的语言组织。';
    }

    return '【Vicoo 助手】\n\n您好！我是 Vicoo 助手。由于 MiniMax API 未配置，当前使用的是模拟响应。请配置 MiniMax API Key 以获得真实的 AI 回复。\n\n您可以：\n- 搜索笔记\n- 创建新笔记\n- 查看任务列表\n- 使用写作改进功能';
  }
}

/**
 * 创建 MiniMax 模型（旧版，无工具调用）
 */
export function createMiniMaxModel(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): any {
  return new MiniMaxLLM({
    model: config?.model || 'MiniMax-M2.5',
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 4096,
  });
}

/**
 * 创建 MiniMax ChatOpenAI 模型
 * 对话使用 M2-her，LangChain 工具调用使用 MiniMax-M2.5
 */
export function createMiniMaxChatOpenAI(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** 是否需要工具调用 */
  withTools?: boolean;
}): ChatOpenAI {
  const provider = getMiniMaxProvider();
  const { apiKey, baseUrl, model } = provider.getConfig();

  if (!apiKey) {
    throw new Error('MiniMax API Key 未配置，请在设置中配置');
  }

  // 对话使用 M2-her，工具调用使用 MiniMax-M2.5
  const useTools = config?.withTools ?? false;
  const effectiveModel = useTools ? 'MiniMax-M2.5' : (config?.model || model || 'M2-her');
  const maxTokens = useTools ? 4096 : 2048;

  // 统一使用 /v1/text/chatcompletion_v2 端点（M2-her 和 MiniMax-M2.5 都支持）
  // 工具调用需要 extra_body.reasoning_split
  // baseURL 只设置到 /v1，LangChain 会自动添加 /chat/completions
  const normalizedBaseUrl = baseUrl?.replace(/\/+$/, '') || 'https://api.minimaxi.com';
  const fullEndpoint = normalizedBaseUrl + '/v1';

  console.log('[MiniMax] Creating ChatOpenAI with model:', effectiveModel, 'baseURL:', fullEndpoint, 'withTools:', useTools);

  // 设置环境变量
  process.env.OPENAI_API_KEY = apiKey;
  process.env.OPENAI_BASE_URL = fullEndpoint;

  // 工具调用时设置 reasoning_split: false，让思考内容在 content 中
  const modelParams: Record<string, any> = {
    model: effectiveModel,
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? maxTokens,
    apiKey: apiKey,
    baseURL: fullEndpoint,
  };

  // MiniMax 工具调用需要设置 reasoning_split: false
  if (useTools) {
    modelParams.extraBody = {
      reasoning_split: false
    };
  }

  console.log('[MiniMax] modelParams:', JSON.stringify(modelParams, (key, value) => {
    if (key === 'apiKey') return '***';
    return value;
  }));

  const chatModel = new ChatOpenAI(modelParams);
  console.log('[MiniMax] ChatOpenAI model:', (chatModel as any).modelName);

  return chatModel;
}

/**
 * 获取默认的思考模型（MiniMax）
 */
export function getThinkingModel(): any {
  return createMiniMaxModel();
}

// 为了兼容性，也导出 ChatOpenAI 类型的 MiniMax
export type MiniMaxChatModel = ReturnType<typeof createMiniMaxModel>;

// 保持向后兼容性，createMiniMaxChatAnthropic 现在指向 ChatOpenAI 版本
export { createMiniMaxChatOpenAI as createMiniMaxChatAnthropic };

export default {
  createChatModel,
  createOpenAIModel,
  createAnthropicModel,
  createMiniMaxModel,
  createMiniMaxChatOpenAI,
  getThinkingModel,
  getEmbeddingModel,
};
