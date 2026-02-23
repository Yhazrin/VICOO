/**
 * LangChain Agent
 * 使用官方 Anthropic 格式 + LangChain bindTools 实现工具调用
 */

import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { createMiniMaxChatAnthropic } from '../models.js';
import { AllTools } from '../tools/index.js';
import { VICO_SYSTEM_PROMPT } from '../chains/index.js';

/**
 * Agent 配置
 */
export interface AgentConfig {
  sessionId?: string;
  userId?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Agent 消息
 */
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
  }>;
}

/**
 * Agent 会话
 */
export interface AgentSession {
  messages: AgentMessage[];
  createdAt: Date;
}

const sessions = new Map<string, AgentSession>();

export function getOrCreateSession(sessionId: string): AgentSession {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      messages: [],
      createdAt: new Date(),
    });
  }
  return sessions.get(sessionId)!;
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * 从 AIMessage 中提取可读文本（兼容 Anthropic content 块格式）
 */
function extractTextFromAIMessage(aiMsg: AIMessage): string {
  const content: any = (aiMsg as any).content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    // Anthropic / MiniMax 兼容格式：[{ type: 'thinking' | 'text' | 'tool_use', ... }, ...]
    const texts: string[] = [];
    for (const block of content) {
      if (block?.type === 'text' && typeof block.text === 'string') {
        texts.push(block.text);
      }
    }
    if (texts.length > 0) {
      return texts.join('\n');
    }
  }

  // 回退：避免出现 [object Object]
  return String(content ?? '');
}

/**
 * 从 AIMessage 中提取 thinking 块
 */
function extractThinkingFromAIMessage(aiMsg: AIMessage): string | null {
  const content: any = (aiMsg as any).content;

  if (!Array.isArray(content)) {
    return null;
  }

  for (const block of content) {
    if (block?.type === 'thinking' && typeof block.thinking === 'string') {
      return block.thinking;
    }
  }

  return null;
}

function toLangChainMessages(sessionMessages: AgentMessage[], userMessage: string): BaseMessage[] {
  const msgs: BaseMessage[] = [
    new SystemMessage(VICO_SYSTEM_PROMPT),
    ...sessionMessages.map((m) => {
      if (m.role === 'user') return new HumanMessage(m.content);
      if (m.role === 'assistant') return new AIMessage(m.content);
      return new SystemMessage(m.content);
    }),
    new HumanMessage(userMessage),
  ];
  return msgs;
}

/**
 * 执行工具调用
 */
async function executeTools(
  toolCalls: Array<{ name: string; args: Record<string, unknown>; id: string }>
): Promise<ToolMessage[]> {
  const toolMap = new Map(AllTools.map((t) => [t.name as string, t]));
  const results: ToolMessage[] = [];

  for (const tc of toolCalls) {
    const tool = toolMap.get(tc.name);
    let content: string;
    try {
      if (tool) {
        const result = await (tool as any).invoke(tc.args);
        content = typeof result === 'string' ? result : JSON.stringify(result);
      } else {
        content = JSON.stringify({ error: `未知工具: ${tc.name}` });
      }
    } catch (e: any) {
      content = JSON.stringify({ error: e.message || String(e) });
    }
    results.push(
      new ToolMessage({
        content,
        tool_call_id: tc.id,
      })
    );
  }
  return results;
}

/**
 * 使用 LangChain + ChatAnthropic（MiniMax 官方 Anthropic 格式）进行对话
 */
export async function chatWithAgent(
  message: string,
  config?: AgentConfig
): Promise<{ success: boolean; content?: string; error?: string }> {
  const sessionId = config?.sessionId || 'default';
  const session = getOrCreateSession(sessionId);

  try {
    // 工具调用使用 MiniMax-M2.5（支持 tools 参数）
    const llm = createMiniMaxChatAnthropic({
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 4096,
      withTools: true,  // 使用 MiniMax-M2.5 进行工具调用
    });

    const modelWithTools = llm.bindTools(AllTools);
    let messages: BaseMessage[] = toLangChainMessages(session.messages, message);
    const maxIterations = 10;
    let iterations = 0;
    let finalContent = '';

    while (iterations < maxIterations) {
      iterations++;
      const response = await modelWithTools.invoke(messages);

      if (!(response instanceof AIMessage)) {
        // 非 AIMessage（极少出现），做一个兜底转换
        const anyResp: any = response;
        finalContent =
          typeof anyResp?.content === 'string'
            ? anyResp.content
            : String(anyResp?.content ?? anyResp ?? '');
        break;
      }

      const aiMsg = response as AIMessage;
      const toolCalls = aiMsg.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        finalContent = extractTextFromAIMessage(aiMsg);
        break;
      }

      messages.push(aiMsg);

      const toolResults = await executeTools(
        toolCalls.map((tc) => ({
          name: tc.name,
          args: (tc.args as Record<string, unknown>) || {},
          id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        }))
      );
      messages.push(...toolResults);
    }

    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'assistant', content: finalContent });

    return { success: true, content: finalContent };
  } catch (error: any) {
    console.error('[LangChain Agent] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 流式输出回调类型
 */
export type StreamCallback = (data: {
  type: 'thinking' | 'text' | 'tool_call' | 'tool_result' | 'final' | 'done' | 'error';
  content?: string;
  text?: string;
  calls?: any[];
  results?: any[];
  error?: string;
}) => void;

/**
 * 使用 LangChain + ChatAnthropic 进行流式对话
 * 使用 stream 方法实现真正的流式输出
 */
export async function chatWithAgentStream(
  message: string,
  config: AgentConfig & { onStream?: StreamCallback }
): Promise<{ success: boolean; content?: string; error?: string }> {
  const sessionId = config?.sessionId || 'default';
  const session = getOrCreateSession(sessionId);
  const onStream = config?.onStream;

  try {
    const llm = createMiniMaxChatAnthropic({
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 4096,
    });

    const modelWithTools = llm.bindTools(AllTools);
    let messages: BaseMessage[] = toLangChainMessages(session.messages, message);
    const maxIterations = 10;
    let iterations = 0;
    let finalContent = '';

    while (iterations < maxIterations) {
      iterations++;

      // 1. 先用 stream 获取流式内容（thinking + text）
      const stream = await modelWithTools.stream(messages);

      let accumulatedText = '';
      let thinkingContent = '';

      for await (const chunk of stream) {
        const aiMsg = chunk as AIMessage;
        const content: any = (aiMsg as any).content;

        // 处理 content 块
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block?.type === 'thinking' && typeof block.thinking === 'string') {
              thinkingContent = block.thinking;
              onStream?.({ type: 'thinking', content: block.thinking });
            }
            if (block?.type === 'text' && typeof block.text === 'string') {
              accumulatedText += block.text;
              onStream?.({ type: 'text', text: block.text });
            }
          }
        } else if (typeof content === 'string') {
          accumulatedText += content;
          onStream?.({ type: 'text', text: content });
        }
      }

      // 2. 再用 invoke 获取完整响应（包含 tool_calls）
      const fullResponse = await modelWithTools.invoke(messages);
      const aiMsg = fullResponse as AIMessage;
      const toolCalls = aiMsg.tool_calls;

      // 如果没有工具调用，输出最终结果
      if (!toolCalls || toolCalls.length === 0) {
        finalContent = extractTextFromAIMessage(aiMsg) || accumulatedText;
        onStream?.({ type: 'final', text: finalContent });
        break;
      }

      // 有工具调用，推送 tool_call 事件
      onStream?.({ type: 'tool_call', calls: toolCalls });

      // 将 AI 消息加入历史
      messages.push(aiMsg);

      // 执行工具
      const toolResults = await executeTools(
        toolCalls.map((tc) => ({
          name: tc.name,
          args: (tc.args as Record<string, unknown>) || {},
          id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        }))
      );

      onStream?.({ type: 'tool_result', results: toolResults.map(t => t.content) });
      messages.push(...toolResults);
    }

    // 更新会话历史
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'assistant', content: finalContent });

    onStream?.({ type: 'done' });
    return { success: true, content: finalContent };
  } catch (error: any) {
    console.error('[LangChain Agent Stream] Error:', error);
    onStream?.({ type: 'error', error: error.message });
    return { success: false, error: error.message };
  }
}

export async function simpleChat(
  message: string,
  config?: AgentConfig
): Promise<{ success: boolean; content?: string; error?: string }> {
  return chatWithAgent(message, {
    ...config,
    sessionId: 'simple_' + Date.now(),
  });
}

export function createMiniMaxAgent(config?: AgentConfig) {
  return {
    llm: createMiniMaxChatAnthropic({
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 4096,
    }),
    tools: AllTools,
    systemPrompt: VICO_SYSTEM_PROMPT,
  };
}

export default {
  createMiniMaxAgent,
  chatWithAgent,
  chatWithAgentStream,
  simpleChat,
  getOrCreateSession,
  clearSession,
};
