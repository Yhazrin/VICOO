/**
 * LangSmith 观测性集成
 * 链路追踪、性能监控、调试
 */

import { getRuntimeEnvironment } from '../../env.js';

// LangChain 观测性相关导入
let langchain: typeof import('@langchain/core') | null = null;
let langsmith: typeof import('langsmith') | null = null;

let isInitialized = false;

/**
 * 初始化 LangSmith
 * 在应用启动时调用
 */
export async function initializeLangSmith(): Promise<void> {
  if (isInitialized) return;

  const apiKey = process.env.LANGSMITH_API_KEY;

  if (!apiKey) {
    console.log('[LangSmith] API Key not configured, tracing disabled');
    return;
  }

  try {
    // 动态导入 langchain-core 以获取 tracing
    langchain = await import('@langchain/core');

    // 设置环境变量
    process.env.LANGCHAIN_TRACING_V2 = 'true';
    process.env.LANGCHAIN_API_KEY = apiKey;

    // 可选：设置项目名
    process.env.LANGCHAIN_PROJECT = process.env.LANGSMITH_PROJECT || 'vicoo';

    isInitialized = true;
    console.log('[LangSmith] Initialized successfully');
  } catch (e) {
    console.warn('[LangSmith] Failed to initialize:', e);
  }
}

/**
 * 创建带追踪的回调
 * 用于手动追踪特定操作
 */
export function createTracingCallback(config: {
  name: string;
  metadata?: Record<string, any>;
}) {
  const { name, metadata } = config;

  // 如果没有 langchain，直接返回空操作
  if (!langchain) {
    return {
      start: () => {},
      end: () => {},
      error: () => {},
    };
  }

  // 使用 langchain 的 tracing
  return {
    start: () => {
      console.log(`[LangSmith] Tracing start: ${name}`);
    },
    end: (result: any) => {
      console.log(`[LangSmith] Tracing end: ${name}`, result ? 'completed' : '');
    },
    error: (error: any) => {
      console.error(`[LangSmith] Tracing error: ${name}`, error);
    },
  };
}

/**
 * 追踪 Agent 执行
 */
export async function traceAgentExecution<T>(
  agentName: string,
  input: any,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    console.log(`[LangSmith] Agent "${agentName}" completed in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[LangSmith] Agent "${agentName}" failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * 追踪 RAG 流程
 */
export async function traceRAGPipeline(
  query: string,
  fn: () => Promise<{ answer: string; sources: any[] }>
): Promise<{ answer: string; sources: any[]; trace: any }> {
  const startTime = Date.now();
  const trace: any = {
    query,
    startTime: new Date().toISOString(),
    steps: [],
  };

  try {
    const result = await fn();

    trace.duration = Date.now() - startTime;
    trace.success = true;
    trace.sources = result.sources.length;

    console.log(`[LangSmith] RAG completed in ${trace.duration}ms, sources: ${result.sources.length}`);

    return { ...result, trace };
  } catch (error) {
    trace.duration = Date.now() - startTime;
    trace.success = false;
    trace.error = String(error);

    throw error;
  }
}

/**
 * 追踪工具调用
 */
export async function traceToolExecution(
  toolName: string,
  args: any,
  fn: () => Promise<any>
): Promise<any> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    console.log(`[LangSmith] Tool "${toolName}" executed in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[LangSmith] Tool "${toolName}" failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * 创建自定义追踪事件
 */
export function createTraceEvent(eventName: string, metadata?: Record<string, any>) {
  return {
    name: eventName,
    timestamp: new Date().toISOString(),
    metadata,
    log: (data?: any) => {
      console.log(`[LangSmith] Event: ${eventName}`, { ...metadata, ...data });
    },
  };
}

/**
 * 获取追踪配置状态
 */
export function getTracingStatus(): {
  enabled: boolean;
  project?: string;
  endpoint?: string;
} {
  return {
    enabled: isInitialized,
    project: process.env.LANGSMITH_PROJECT,
    endpoint: process.env.LANGCHAIN_ENDPOINT,
  };
}

export default {
  initializeLangSmith,
  createTracingCallback,
  traceAgentExecution,
  traceRAGPipeline,
  traceToolExecution,
  createTraceEvent,
  getTracingStatus,
};
