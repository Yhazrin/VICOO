/**
 * MiniMax AI Provider
 * 支持：文本对话、函数调用、嵌入向量
 */

import { getOne } from '../db/index.js';

// ==================== 类型定义 ====================

export interface MiniMaxConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface MiniMaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface MiniMaxFunction {
  name: string;
  description: string;
  // 支持两种格式
  input_schema?: {  // Anthropic 兼容格式
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  parameters?: {  // 旧版 API 格式
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MiniMaxChatRequest {
  model?: string; // 可选，实际请求会使用 this.model
  messages: MiniMaxMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: Array<{
    type: 'function';
    function: MiniMaxFunction;
  }>;
  tool_choice?: string | { type: 'function'; function: { name: string } };
  stream?: boolean;
}

export interface MiniMaxChatResponse {
  id: string;
  model: string;
  // OpenAI 兼容模式响应格式
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
      reasoning_details?: Array<{
        type: string;
        text: string;
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  // 兼容 Anthropic 格式
  content?: Array<{
    type: 'text' | 'tool_use' | 'thinking';
    text?: string;
    id?: string;
    name?: string;
    input?: any;
    thinking?: string;
  }>;
  stop_reason?: string;
}

export interface MiniMaxEmbeddingRequest {
  model: string;
  input: string | string[];
}

export interface MiniMaxEmbeddingResponse {
  id: string;
  model: string;
  embeddings: Array<{
    embedding: number[];
    text: string;
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// ==================== MiniMax Provider 类 ====================

export class MiniMaxProvider {
  name = 'MiniMax';
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private legacyBaseUrl: string;
  private legacyModel: string;

  constructor(config?: MiniMaxConfig) {
    // 优先使用传入的 config，然后检查环境变量
    this.apiKey = config?.apiKey || process.env.MINIMAX_API_KEY || '';
    // OpenAI 兼容接口：https://api.minimaxi.com/v1（支持工具调用和思考过程）
    const rawBaseUrl = config?.baseUrl || process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1';
    this.baseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/v1$/, '') || 'https://api.minimaxi.com/v1';
    this.model = config?.model || process.env.MINIMAX_MODEL || 'M2-her';
    // 旧版 API 用于兼容（工具调用用 MiniMax-M2.5）
    this.legacyBaseUrl = 'https://api.minimaxi.com';
    this.legacyModel = 'MiniMax-M2.5';
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /** 获取配置（供 LangChain ChatAnthropic 等使用） */
  getConfig(): { apiKey: string; baseUrl: string; model: string } {
    return {
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      model: this.model,
    };
  }

  /**
   * 调用 Chat API
   */
  async chat(request: MiniMaxChatRequest): Promise<{
    success: boolean;
    data?: MiniMaxChatResponse;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, error: 'MiniMax API Key 未配置' };
    }

    try {
      // OpenAI 兼容模式端点：https://api.minimaxi.com/v1/text/chatcompletion_v2
      const normalizedBaseUrl = this.baseUrl.replace(/\/+$/, '');
      const url = `${normalizedBaseUrl}/v1/text/chatcompletion_v2`;

      console.log('[MiniMax] POST', url);
      console.log('[MiniMax] model:', this.model);
      console.log('[MiniMax] messages count:', request.messages?.length);

      // 添加超时控制
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.error('[MiniMax] Request timeout!');
        controller.abort();
      }, (request.max_tokens && request.max_tokens > 2048) ? 90000 : 60000); // M2.5: 90s, M2-her: 60s

      let response: Response;
      try {
        console.log('[MiniMax] Original messages:', JSON.stringify(request.messages).slice(0, 500));

        // 分离 system 消息和普通消息
        const systemMsg = request.messages.find((m: MiniMaxMessage) => m.role === 'system');
        const nonSystemMsgs = request.messages
          .filter((m: MiniMaxMessage) => m.role !== 'system')
          .map((m: MiniMaxMessage) => ({
            role: m.role,
            content: m.content
          }));

        console.log('[MiniMax] Non-system messages:', JSON.stringify(nonSystemMsgs).slice(0, 500));

        // OpenAI 兼容接口：工具格式为 name/description/parameters
        // 工具调用使用 abab6.5s-chat（Anthropic 兼容格式），对话使用配置的模型（M2-her 或 MiniMax-M2.5）
        // abab6.5s-chat 是 /v1/chat/completions 端点支持的模型
        const effectiveModel = request.tools?.length ? 'abab6.5s-chat' : this.model;
        const toolsPayload = request.tools?.length
          ? request.tools.map((t) => ({
              type: 'function' as const,
              function: {
                name: t.function.name,
                description: t.function.description,
                parameters: t.function.parameters || t.function.input_schema,
              },
            }))
          : undefined;

        // M2-her 最大支持 2048 tokens，MiniMax-M2.5 支持 4096
        const maxTokensForModel = effectiveModel.toLowerCase().includes('m2-her') ? 2048 : 4096;

        const requestBody: Record<string, unknown> = {
          model: effectiveModel,
          messages: nonSystemMsgs,
          temperature: request.temperature ?? 1.0,
          max_tokens: request.max_tokens ?? maxTokensForModel,
          stream: request.stream ?? false,
          system: systemMsg?.content ?? undefined,
        };
        if (toolsPayload?.length) {
          requestBody.tools = toolsPayload;
          requestBody.tool_choice = request.tool_choice ?? 'auto';
        }

        console.log('[MiniMax] Request body:', JSON.stringify(requestBody).slice(0, 1000));

        response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });
      } finally {
        clearTimeout(timeout);
      }

      const contentType = response.headers.get('content-type') || '';
      console.log('[MiniMax] Response status:', response.status, 'Content-Type:', contentType);

      // 先获取原始文本
      const rawText = await response.text();
      console.log('[MiniMax] Raw response:', rawText.slice(0, 500));

      // 若返回 HTML（常见于鉴权失败、错误页、错误域名）
      if (contentType.includes('text/html') || rawText.trimStart().startsWith('<!')) {
        const msg = response.status === 401 || response.status === 403
          ? `MiniMax 鉴权失败 (${response.status})，请检查 API Key 是否正确、是否已开通对应接口。`
          : `MiniMax 返回了 HTML 而非 JSON (状态码 ${response.status})，请检查 API Key、接口地址与网络。`;
        console.error('[MiniMax]', msg, 'Body preview:', rawText.slice(0, 150));
        return { success: false, error: msg };
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error('[MiniMax] Failed to parse JSON, response is not JSON:', rawText.slice(0, 200));
        return { success: false, error: `API 返回非 JSON (状态码 ${response.status}): ${rawText.slice(0, 80)}...` };
      }

      console.log('[MiniMax] API response data:', JSON.stringify(data).slice(0, 500));

      // Anthropic 兼容模式错误格式
      if (data?.type === 'error') {
        const msg = data.error?.message || `API Error: ${data.error?.type}`;
        console.error('[MiniMax] API Error:', msg);
        return { success: false, error: msg };
      }

      // MiniMax 原有格式错误（兼容）
      const baseResp = data?.base_resp;
      if (baseResp && baseResp.status_code !== 0 && baseResp.status_code !== undefined) {
        const msg = baseResp.status_msg || `API 错误: ${baseResp.status_code}`;
        console.error('[MiniMax] API Error (base_resp):', msg);
        return { success: false, error: msg };
      }

      if (!response.ok) {
        console.error('[MiniMax] API Error:', data);
        return {
          success: false,
          error: data?.error?.message || data?.base_resp?.status_msg || `API Error: ${response.status}`
        };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('[MiniMax] Fetch error:', error.message);
      if (error.name === 'AbortError') {
        return { success: false, error: '请求超时 (30秒)' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * 简单对话（不带工具）
   */
  async simpleChat(messages: MiniMaxMessage[]): Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }> {
    const result = await this.chat({ messages });

    if (result.success && result.data) {
      // OpenAI 兼容模式响应格式：data.choices[0].message.content
      const choices = result.data.choices || [];
      const message = choices[0]?.message;
      const content = message?.content || '';
      
      // 解析思考过程（如果有）
      const thinking = message?.reasoning_details?.[0]?.text;
      if (thinking) {
        console.log('[MiniMax] Thinking:', thinking.slice(0, 200) + '...');
      }
      
      return {
        success: true,
        content: content
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * 使用旧版 API 调用工具
   */
  async callToolsWithLegacyApi(
    messages: MiniMaxMessage[],
    tools: MiniMaxFunction[]
  ): Promise<{
    success: boolean;
    content?: string;
    toolCalls?: Array<{ name: string; arguments: any }>;
    error?: string;
  }> {
    console.log('[MiniMax] Using legacy API for tools...');
    const url = `${this.legacyBaseUrl}/v1/text/chatcompletion_v2`;

    // 转换工具格式为旧版 API 格式
    const toolsPayload = tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema || t.parameters  // 兼容两种格式
      }
    }));

    // 分离 system 消息
    const systemMsg = messages.find(m => m.role === 'system');
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.legacyModel,
          messages: nonSystemMsgs,
          temperature: 0.7,
          max_tokens: 4096,
          tools: toolsPayload,
          tool_choice: 'auto'
        }),
      });

      const data = await response.json();
      console.log('[MiniMax] Legacy API response:', JSON.stringify(data).slice(0, 500));

      if (!response.ok || data?.base_resp?.status_code !== 0) {
        return { success: false, error: data?.base_resp?.status_msg || 'Legacy API error' };
      }

      const choice = data.choices?.[0];
      const message = choice?.message;

      if (message?.tool_calls && message.tool_calls.length > 0) {
        return {
          success: true,
          toolCalls: message.tool_calls.map(tc => ({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments)
          }))
        };
      }

      return {
        success: true,
        content: message?.content || ''
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 带工具调用的对话 - 双模型协作
   * 1. 用 MiniMax-M2.5 分析意图
   * 2. 用旧版 API 执行工具
   * 3. 将结果返回给 MiniMax-M2.5 生成最终回复
   */
  async chatWithTools(
    messages: MiniMaxMessage[],
    tools: MiniMaxFunction[]
  ): Promise<{
    success: boolean;
    content?: string;
    toolCalls?: Array<{ name: string; arguments: any }>;
    error?: string;
  }> {
    console.log('[MiniMax] chatWithTools called with', messages.length, 'messages,', tools.length, 'tools');

    // 第一步：用 MiniMax-M2.5 分析是否需要工具调用
    // 将工具描述告诉模型，让模型决定是否调用
    const toolsDescription = tools.map(t =>
      `- ${t.name}: ${t.description}`
    ).join('\n');

    const systemWithTools = `你是一个智能助手。当用户需要时，你可以调用以下工具：
${toolsDescription}

当需要调用工具时，回复格式为：<tool_call>工具名:参数JSON</tool_call>
不需要工具时，直接回复用户。`;

    // 构建只带 system 和最新用户消息的请求（不传 tools 给 M2.5）
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const analysisMessages = [
      { role: 'system', content: systemWithTools },
      lastUserMsg
    ].filter(Boolean) as MiniMaxMessage[];

    console.log('[MiniMax] Step 1: Analyzing with MiniMax-M2.5...');
    const analysisResult = await this.chat({ messages: analysisMessages });

    if (!analysisResult.success) {
      return { success: false, error: analysisResult.error };
    }

    // M2.5 返回 content 数组，第一个是 thinking，第二个是 text
    const content = analysisResult.data?.content || [];
    const textBlock = content.find((c: any) => c.type === 'text');
    const responseText = textBlock?.text || '';

    // 检查是否需要工具调用
    const toolCallMatch = responseText.match(/<tool_call>([\s\S]*?)<\/tool_call>/);

    if (toolCallMatch) {
      console.log('[MiniMax] Tool call detected, using legacy API...');

      // 第二步：用旧版 API 执行工具
      const toolCallStr = toolCallMatch[1].trim();
      const colonIndex = toolCallStr.indexOf(':');
      if (colonIndex === -1) {
        return { success: true, content: responseText };
      }

      const toolName = toolCallStr.substring(0, colonIndex).trim();
      const toolArgs = toolCallStr.substring(colonIndex + 1).trim();

      let toolArguments: any = {};
      try {
        toolArguments = JSON.parse(toolArgs);
      } catch {
        toolArguments = { query: toolArgs };
      }

      // 找到对应的工具定义
      const toolDef = tools.find(t => t.name === toolName);
      if (!toolDef) {
        return { success: true, content: `未找到工具: ${toolName}` };
      }

      // 用旧版 API 调用工具
      const toolResult = await this.callToolsWithLegacyApi(
        [{ role: 'user', content: `使用工具 ${toolName}，参数: ${JSON.stringify(toolArguments)}` }],
        [toolDef]
      );

      if (toolResult.success && toolResult.toolCalls) {
        // 返回工具调用结果，让上层处理
        return {
          success: true,
          content: responseText.replace(/<tool_call>[\s\S]*?<\/tool_call>/, '').trim(),
          toolCalls: toolResult.toolCalls
        };
      }

      // 如果工具执行失败，返回分析结果
      return {
        success: true,
        content: responseText.replace(/<tool_call>[\s\S]*?<\/tool_call>/, '').trim() +
          `\n\n(工具执行: ${toolResult.error || '完成'})`
      };
    }

    // 不需要工具，直接返回 M2.5 的回复
    return { success: true, content: responseText };
  }

  /**
   * 生成嵌入向量
   */
  async generateEmbedding(text: string): Promise<{
    success: boolean;
    embedding?: number[];
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, error: 'MiniMax API Key 未配置' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/text/embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'embo-01',
          input: text
        })
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        return {
          success: false,
          error: data.base_resp?.status_msg || `API Error: ${response.status}`
        };
      }

      return {
        success: true,
        embedding: data.embeddings?.[0]?.embedding || []
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// ==================== 工具函数 ====================

let miniMaxProvider: MiniMaxProvider | null = null;

/**
 * 获取 MiniMax Provider 实例
 * 优先使用环境变量，其次数据库配置，最后使用默认配置
 */
export function getMiniMaxProvider(config?: MiniMaxConfig): MiniMaxProvider {
  if (config?.apiKey) {
    miniMaxProvider = new MiniMaxProvider(config);
    return miniMaxProvider;
  }

  // 优先使用环境变量
  if (process.env.MINIMAX_API_KEY) {
    if (!miniMaxProvider) {
      miniMaxProvider = new MiniMaxProvider({
        apiKey: process.env.MINIMAX_API_KEY,
        baseUrl: process.env.MINIMAX_BASE_URL,
        model: process.env.MINIMAX_MODEL
      });
      console.log('[MiniMax] Using environment variable configuration');
    }
    return miniMaxProvider;
  }

  // 其次从数据库读取
  try {
    const row = getOne<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'minimax_config'"
    );
    if (row?.value) {
      const parsed = JSON.parse(row.value) as MiniMaxConfig;
      if (parsed.apiKey) {
        miniMaxProvider = new MiniMaxProvider(parsed);
        return miniMaxProvider;
      }
    }
  } catch (_) {
    // 忽略解析错误，使用默认配置
  }

  // 使用默认配置
  if (!miniMaxProvider) {
    miniMaxProvider = new MiniMaxProvider();
  }
  return miniMaxProvider;
}

/**
 * 初始化 MiniMax（从数据库读取配置）
 */
export async function initializeMiniMax(): Promise<MiniMaxProvider | null> {
  try {
    // 从数据库读取 MiniMax 配置
    const config = getOne<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'minimax_config'"
    );

    if (config?.value) {
      const parsed = JSON.parse(config.value);
      miniMaxProvider = new MiniMaxProvider({
        apiKey: parsed.apiKey,
        baseUrl: parsed.baseUrl,
        model: parsed.model
      });
      console.log('[MiniMax] 已从数据库加载配置');
      return miniMaxProvider;
    }

    // 检查环境变量
    if (process.env.MINIMAX_API_KEY) {
      miniMaxProvider = new MiniMaxProvider();
      console.log('[MiniMax] 已从环境变量加载配置');
      return miniMaxProvider;
    }

    return null;
  } catch (error) {
    console.error('[MiniMax] 初始化失败:', error);
    return null;
  }
}

/**
 * 保存 MiniMax 配置到数据库
 */
export async function saveMiniMaxConfig(config: MiniMaxConfig): Promise<boolean> {
  try {
    const { runQuery, saveDatabase, getOne } = await import('../db/index.js');

    runQuery(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('minimax_config', ?)",
      [JSON.stringify(config)]
    );
    saveDatabase();

    // 重新初始化
    miniMaxProvider = new MiniMaxProvider(config);
    console.log('[MiniMax] 配置已保存并更新，API Key:', config.apiKey ? config.apiKey.slice(0, 10) + '...' : 'none');

    // 验证保存的配置
    const saved = getOne<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'minimax_config'"
    );
    console.log('[MiniMax] 验证保存的配置:', saved?.value ? 'OK' : 'FAILED');

    return true;
  } catch (error) {
    console.error('[MiniMax] 保存配置失败:', error);
    return false;
  }
}

export default {
  MiniMaxProvider,
  getMiniMaxProvider,
  initializeMiniMax,
  saveMiniMaxConfig
};
