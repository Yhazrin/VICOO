/**
 * AI 助手服务
 * 统一的 AI 入口，所有 AI 操作统一由 MiniMax（通过 LangChain）处理
 * - 知识库问答
 * - 全网搜索
 * - 执行操作（创建笔记等）
 */

import { v4 as uuidv4 } from 'uuid';
import { getAll, runQuery, saveDatabase } from '../db/index.js';
import { semanticAISearch } from './ai.js';
import { getMiniMaxProvider } from './minimax.js';

export interface AIAssistantMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIAssistantRequest {
  message: string;
  mode?: 'auto' | 'knowledge' | 'search' | 'action';
  provider?: 'auto' | 'minimax';
  context?: {
    noteId?: string;
    nodeId?: string;
  };
}

export interface AIAssistantResponse {
  success: boolean;
  response: string;
  sources?: Array<{
    type: 'note' | 'web' | 'action';
    title: string;
    content?: string;
    url?: string;
    id?: string;
  }>;
  actions?: Array<{
    type: 'create_note' | 'search_web' | 'generate_graph';
    status: 'success' | 'pending' | 'failed';
    result?: any;
  }>;
  error?: string;
}

/**
 * 搜索知识库
 */
async function searchKnowledgeBase(query: string, limit: number = 10) {
  const notes = getAll<any>(
    `SELECT id, title, content, snippet, category, timestamp FROM notes 
     WHERE title LIKE ? OR content LIKE ? OR snippet LIKE ?
     ORDER BY timestamp DESC LIMIT ?`,
    [`%${query}%`, `%${query}%`, `%${query}%`, limit]
  );

  return notes.map((note: any) => ({
    type: 'note',
    title: note.title,
    content: note.content?.substring(0, 500) || note.snippet,
    id: note.id,
    category: note.category,
    timestamp: note.timestamp
  }));
}

/**
 * 调用 MiniMax 进行简单对话（不带工具，直接文本生成）
 */
async function callMiniMax(prompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
  const provider = getMiniMaxProvider();
  if (!provider.isConfigured()) {
    return { success: false, error: 'MiniMax API Key 未配置' };
  }

  const result = await provider.simpleChat([
    { role: 'user', content: prompt }
  ]);

  return result;
}

/**
 * 从 MiniMax 响应中去除 <think>...</think> 推理块
 */
function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
}

/**
 * 根据用户意图决定使用哪个模式
 */
function determineMode(message: string): 'knowledge' | 'search' | 'action' {
  const lowerMessage = message.toLowerCase();

  // 搜索关键词
  const searchKeywords = ['搜索', '查找', '找', 'search', 'find', 'look up', 'how to', 'what is', '什么是', '怎么', '如何'];
  const isSearch = searchKeywords.some(kw => lowerMessage.includes(kw));

  // 操作关键词
  const actionKeywords = ['创建', '生成', '写', '保存', 'create', 'make', 'save', 'write', 'generate'];
  const isAction = actionKeywords.some(kw => lowerMessage.includes(kw));

  // 全网搜索特定词
  const webKeywords = ['最新', 'news', 'recent', '教程', 'tutorial', '怎么实现', '如何实现'];
  const isWebSearch = webKeywords.some(kw => lowerMessage.includes(kw));

  if (isWebSearch || (isSearch && !isAction)) {
    return 'search';
  }

  if (isAction) {
    return 'action';
  }

  // 默认先搜知识库
  return 'knowledge';
}

/**
 * 执行 AI 助手请求（统一使用 MiniMax via LangChain）
 */
export async function runAIAssistant(request: AIAssistantRequest): Promise<AIAssistantResponse> {
  const { message, mode: requestedMode } = request;

  const mode = requestedMode || determineMode(message);

  console.log(`[AI Assistant] Processing: "${message.substring(0, 50)}..." (mode: ${mode}, provider: minimax/langchain)`);

  try {
    // 1. 搜索知识库获取上下文
    const knowledgeSources = await searchKnowledgeBase(message);

    // 2. 构建带知识库上下文的 prompt
    let prompt = message;

    if (knowledgeSources.length > 0) {
      const knowledgeText = knowledgeSources
        .map((s: any, i: number) => `${i + 1}. [${s.category || '笔记'}] ${s.title}\n   ${s.content?.substring(0, 200)}`)
        .join('\n\n');

      prompt = `用户问题：${message}

以下是知识库中的相关内容：
${knowledgeText}

请根据以上信息回答用户问题。如果知识库有相关内容，优先使用知识库内容。请用中文回答，简洁明了。`;
    }

    // 3. 调用 MiniMax 直接生成回答（不带工具，更快更稳定）
    const result = await callMiniMax(prompt);

    if (result.success && result.content) {
      const cleaned = stripThinking(result.content);
      return {
        success: true,
        response: cleaned,
        sources: knowledgeSources.map((s: any) => ({
          type: s.type || 'note',
          title: s.title,
          content: s.content,
          id: s.id
        }))
      };
    }

    return {
      success: false,
      response: result.error || 'AI 助手调用失败',
      error: result.error
    };
  } catch (error: any) {
    console.error('[AI Assistant] Error:', error);
    return {
      success: false,
      response: '抱歉，处理您的请求时出现错误。请稍后重试。',
      error: error.message
    };
  }
}

/**
 * 流式响应版本（简化版，返回完整响应）
 */
export async function runAIAssistantStream(
  request: AIAssistantRequest,
  onChunk: (chunk: string) => void
): Promise<AIAssistantResponse> {
  const result = await runAIAssistant(request);
  onChunk(result.response);
  return result;
}

export default {
  runAIAssistant,
  runAIAssistantStream
};
