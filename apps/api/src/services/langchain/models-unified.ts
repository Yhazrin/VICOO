/**
 * LangChain 增强模型工厂
 * 支持多 Provider：OpenAI, Anthropic, MiniMax, Google, Cohere, Mistral
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatCohere } from '@langchain/cohere';
import { ChatMistralAI } from '@langchain/mistralai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getMiniMaxProvider, type MiniMaxProvider } from '../minimax.js';

// ==================== 类型定义 ====================

/**
 * 支持的模型 Provider
 */
export type ModelProvider = 'openai' | 'anthropic' | 'minimax' | 'google' | 'cohere' | 'mistral';

/**
 * 统一模型配置
 */
export interface UnifiedModelConfig {
  provider: ModelProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * 模型用途分类
 */
export type ModelPurpose = 'thinking' | 'embedding' | 'fast' | 'cheap';

/**
 * 任务到模型的映射策略
 */
export interface ModelStrategy {
  purpose: ModelPurpose;
  provider: ModelProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// ==================== Provider 工厂 ====================

/**
 * 创建 OpenAI 模型
 */
export function createOpenAIChat(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}): ChatOpenAI {
  return new ChatOpenAI({
    model: config?.model || 'gpt-4o-mini',
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 4096,
    apiKey: config?.apiKey || process.env.OPENAI_API_KEY,
  });
}

/**
 * 创建 Anthropic 模型
 */
export function createAnthropicChat(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}): ChatAnthropic {
  return new ChatAnthropic({
    model: config?.model || 'claude-3-5-sonnet-20241022',
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 4096,
    anthropicApiKey: config?.apiKey || process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * 创建 Google Gemini 模型
 */
export function createGoogleChat(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({
    model: config?.model || 'gemini-1.5-flash',
    temperature: config?.temperature ?? 0.7,
    maxOutputTokens: config?.maxTokens ?? 4096,
    apiKey: config?.apiKey || process.env.GOOGLE_API_KEY,
  });
}

/**
 * 创建 Cohere 模型
 */
export function createCohereChat(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}): ChatCohere {
  return new ChatCohere({
    model: config?.model || 'command-r-plus',
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 4096,
    apiKey: config?.apiKey || process.env.COHERE_API_KEY,
  });
}

/**
 * 创建 Mistral 模型
 */
export function createMistralChat(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}): ChatMistralAI {
  return new ChatMistralAI({
    model: config?.model || 'mistral-large-latest',
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 4096,
    apiKey: config?.apiKey || process.env.MISTRAL_API_KEY,
  });
}

/**
 * 统一工厂函数
 */
export function createChatModel(config: UnifiedModelConfig): BaseChatModel<any> {
  const { provider, model, temperature, maxTokens, apiKey, baseUrl } = config;

  switch (provider) {
    case 'openai':
      return createOpenAIChat({ model, temperature, maxTokens, apiKey });

    case 'anthropic':
      return createAnthropicChat({ model, temperature, maxTokens, apiKey });

    case 'google':
      return createGoogleChat({ model, temperature, maxTokens, apiKey });

    case 'cohere':
      return createCohereChat({ model, temperature, maxTokens, apiKey });

    case 'mistral':
      return createMistralChat({ model, temperature, maxTokens, apiKey });

    case 'minimax':
    default:
      return createMiniMaxChat({ model, temperature, maxTokens });
  }
}

// ==================== MiniMax 增强版 ====================

/**
 * 创建 MiniMax Chat 模型（带工具调用支持）
 * 对话使用 M2-her，工具调用使用 MiniMax-M2.5
 */
export function createMiniMaxChat(config?: {
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

  // 工具调用固定使用 MiniMax-M2.5
  const useTools = config?.withTools ?? false;
  const effectiveModel = useTools ? 'MiniMax-M2.5' : (config?.model || model || 'M2-her');
  const maxTokens = useTools ? 4096 : 2048;

  // baseURL 只设置到 /v1，LangChain 会自动添加 /chat/completions
  const normalizedBaseUrl = baseUrl?.replace(/\/+$/, '') || 'https://api.minimaxi.com';
  const fullEndpoint = normalizedBaseUrl + '/v1';

  console.log('[MiniMax Unified] Creating ChatOpenAI with model:', effectiveModel, 'baseURL:', fullEndpoint);

  // 设置环境变量
  process.env.OPENAI_API_KEY = apiKey;
  process.env.OPENAI_BASE_URL = fullEndpoint;

  // MiniMax 工具调用需要设置 reasoning_split: false
  const modelParams: Record<string, any> = {
    model: effectiveModel,
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? maxTokens,
    apiKey: apiKey,
    baseURL: fullEndpoint,
  };

  if (useTools) {
    modelParams.extraBody = {
      reasoning_split: false
    };
  }

  return new ChatOpenAI(modelParams);
}

// ==================== 模型策略 ====================

/**
 * 默认模型策略配置
 */
export const defaultModelStrategies: Record<ModelPurpose, ModelStrategy> = {
  // 思考/推理模型 - 使用最强模型
  thinking: {
    purpose: 'thinking',
    provider: 'minimax',
    model: 'MiniMax-M2.5',
    temperature: 0.7,
    maxTokens: 4096,
  },

  // 嵌入模型 - 使用专门的嵌入服务
  embedding: {
    purpose: 'embedding',
    provider: 'openai',
    model: 'text-embedding-3-small',
    temperature: 0,
    maxTokens: 8191,
  },

  // 快速响应 - 使用小模型
  fast: {
    purpose: 'fast',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.5,
    maxTokens: 2048,
  },

  // 低成本 - 使用最便宜的模型
  cheap: {
    purpose: 'cheap',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 1024,
  },
};

/**
 * 根据用途获取模型
 */
export function getModelByPurpose(purpose: ModelPurpose): BaseChatModel<any> {
  const strategy = defaultModelStrategies[purpose];
  return createChatModel({
    provider: strategy.provider,
    model: strategy.model,
    temperature: strategy.temperature,
    maxTokens: strategy.maxTokens,
  });
}

/**
 * 获取思考模型（默认）
 */
export function getThinkingModel(): BaseChatModel<any> {
  return getModelByPurpose('thinking');
}

/**
 * 获取嵌入模型
 */
export function getEmbeddingModel(): ChatOpenAI {
  return createOpenAIChat({
    model: 'text-embedding-3-small',
    temperature: 0,
  });
}

/**
 * 获取快速响应模型
 */
export function getFastModel(): BaseChatModel<any> {
  return getModelByPurpose('fast');
}

/**
 * 获取低成本模型
 */
export function getCheapModel(): BaseChatModel<any> {
  return getModelByPurpose('cheap');
}

/**
 * 自定义模型策略
 */
export function setModelStrategy(purpose: ModelPurpose, strategy: Partial<ModelStrategy>): void {
  defaultModelStrategies[purpose] = {
    ...defaultModelStrategies[purpose],
    ...strategy,
  };
}

// ==================== 兼容导出 ====================

// 保留原有的导出名称以保持兼容性
export type ModelConfig = UnifiedModelConfig;
export type MiniMaxConfig = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
};

export {
  createChatModel as createOpenAIModel,
  createChatModel as createAnthropicModel,
  createMiniMaxModel,
  createMiniMaxChatAnthropic,
} from './models.js';

export default {
  createChatModel,
  createOpenAIChat,
  createAnthropicChat,
  createGoogleChat,
  createCohereChat,
  createMistralChat,
  createMiniMaxChat,
  getModelByPurpose,
  getThinkingModel,
  getEmbeddingModel,
  getFastModel,
  getCheapModel,
  setModelStrategy,
  defaultModelStrategies,
};
