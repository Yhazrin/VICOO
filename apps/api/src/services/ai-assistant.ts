/**
 * AI 助手服务
 * 统一的 AI 入口，支持：
 * - 知识库问答
 * - 全网搜索
 * - 执行操作（创建笔记等）
 * - Coze 智能体
 */

import { v4 as uuidv4 } from 'uuid';
import { getAll, runQuery, saveDatabase } from '../db/index.js';
import { semanticAISearch } from './ai.js';
import { callClaudeCode } from './claude-code.js';
import { callCozeChat } from './coze.js';
import { isCozeConfigured, getCozeConfig } from './coze-config.js';

export interface AIAssistantMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIAssistantRequest {
  message: string;
  mode?: 'auto' | 'knowledge' | 'search' | 'action';
  provider?: 'auto' | 'claude' | 'coze';
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
 * 全网搜索（使用 Claude Code）
 */
async function searchWeb(query: string): Promise<AIAssistantResponse['sources']> {
  try {
    const prompt = `请搜索并总结关于 "${query}" 的最新信息。

要求：
1. 搜索最新的相关信息
2. 总结关键要点（3-5条）
3. 每条要点用一句话描述

请直接返回 JSON 格式：
{
  "results": [
    {"title": "标题", "summary": "总结内容", "url": "来源链接（如果有）"}
  ]
}`;

    const result = await callClaudeCode(prompt, { timeout: 3 * 60 * 1000 });

    // 尝试解析 Claude 返回的结果
    if (result.nodes && result.nodes.length > 0) {
      // Claude 返回的是知识图谱格式，转换一下
      return result.nodes.map((node: any) => ({
        type: 'web' as const,
        title: node.label,
        content: node.description
      }));
    }

    return [];
  } catch (error: any) {
    console.error('[AI Assistant] Web search error:', error);
    return [];
  }
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
 * 执行 AI 助手请求
 */
export async function runAIAssistant(request: AIAssistantRequest): Promise<AIAssistantResponse> {
  const { message, mode: requestedMode, provider: requestedProvider } = request;

  // 自动判断模式
  const mode = requestedMode || determineMode(message);

  // 确定 AI 提供者
  let provider = requestedProvider || 'auto';
  if (provider === 'auto') {
    // 如果配置了 Coze，优先使用 Coze
    provider = isCozeConfigured() ? 'coze' : 'claude';
  }

  console.log(`[AI Assistant] Processing: "${message.substring(0, 50)}..." (mode: ${mode}, provider: ${provider})`);

  // 如果使用 Coze
  if (provider === 'coze' && isCozeConfigured()) {
    try {
      const cozeConfig = getCozeConfig();
      
      // 构建包含上下文的提示词
      const knowledgeSources = await searchKnowledgeBase(message);
      const webSources = mode === 'search' ? await searchWeb(message) : [];
      const sources = [...knowledgeSources, ...webSources];

      let prompt = message;
      if (sources.length > 0) {
        const knowledgeText = knowledgeSources
          .map((s: any, i: number) => `${i + 1}. ${s.title}: ${s.content?.substring(0, 200)}`)
          .join('\n');
        
        prompt = `用户问题：${message}

知识库相关内容：
${knowledgeText}

${webSources.length > 0 ? `网络搜索结果：\n${webSources.map((s: any) => `- ${s.title}: ${s.content}`).join('\n')}` : ''}

请根据以上信息回答用户问题。请用中文回答。`;
      }

      const cozeResult = await callCozeChat([
        { role: 'user', content: prompt }
      ]);

      if (cozeResult.success && cozeResult.data) {
        return {
          success: true,
          response: cozeResult.data.messages?.[0]?.content || '处理完成',
          sources: sources.map((s: any) => ({
            type: s.type || 'note',
            title: s.title,
            content: s.content,
            id: s.id
          }))
        };
      } else {
        console.error('[AI Assistant] Coze call failed:', cozeResult.error);
        // Coze 失败时回退到 Claude
      }
    } catch (error: any) {
      console.error('[AI Assistant] Coze error:', error);
      // Coze 错误时回退到 Claude
    }
  }

  // 使用 Claude Code（默认或回退）
  try {
    // 1. 搜索知识库
    const knowledgeSources = await searchKnowledgeBase(message);

    // 2. 如果需要全网搜索
    let webSources: AIAssistantResponse['sources'] = [];
    if (mode === 'search') {
      webSources = await searchWeb(message);
    }

    // 3. 构建提示词
    const sources = [...knowledgeSources, ...webSources];

    if (sources.length === 0 && mode !== 'search') {
      // 知识库没有结果，尝试全网搜索
      webSources = await searchWeb(message);
      sources.push(...webSources);
    }

    // 4. 生成回答
    let prompt = '';

    if (sources.length > 0) {
      const knowledgeText = knowledgeSources
        .map((s: any, i: number) => `${i + 1}. [${s.category || '笔记'}] ${s.title}\n   ${s.content?.substring(0, 200)}`)
        .join('\n\n');

      const webText = webSources
        .map((s: any, i: number) => `${knowledgeSources.length + i + 1}. [网页] ${s.title}\n   ${s.content}`)
        .join('\n\n');

      prompt = `用户问题：${message}

以下是搜索到的相关信息：

知识库内容：
${knowledgeText}

${webSources.length > 0 ? `网络搜索结果：\n${webText}` : ''}

请根据以上信息回答用户问题。如果知识库有相关内容，优先使用知识库内容。请用中文回答，简洁明了。`;
    } else {
      prompt = `用户问题：${message}

没有找到相关信息。请尝试：
1. 如果是技术问题，请详细描述你遇到的具体问题
2. 可以尝试创建新笔记来记录这个问题

请用中文回答。`;
    }

    // 5. 调用 Claude Code 生成回答
    const claudeResult = await callClaudeCode(prompt, { timeout: 3 * 60 * 1000 });

    // 从 Claude 结果中提取回答
    let responseText = '';
    if (claudeResult.nodes && claudeResult.nodes.length > 0) {
      // 从知识图谱节点提取描述作为回答
      responseText = claudeResult.nodes
        .map((n: any) => `- ${n.label}: ${n.description}`)
        .join('\n');
    }

    if (!responseText) {
      responseText = '我已经分析了你的问题。';
      if (knowledgeSources.length > 0) {
        responseText += ` 在你的知识库中找到了 ${knowledgeSources.length} 条相关笔记。`;
      }
      if (webSources.length > 0) {
        responseText += ` 还搜索到了 ${webSources.length} 条网络资源。`;
      }
    }

    return {
      success: true,
      response: responseText,
      sources: sources.map((s: any) => ({
        type: s.type || 'note',
        title: s.title,
        content: s.content,
        id: s.id
      }))
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
