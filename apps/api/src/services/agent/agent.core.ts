/**
 * 智能体核心对话逻辑
 */

import { getMiniMaxProvider } from '../minimax.js';
import { loadAgentConfig } from './agent.config.js';
import { buildSystemPrompt } from './agent.prompt.js';
import { getSessionHistory, addToHistory, clearHistory } from './agent.history.js';
import { executeSkill } from './agent.skill-executor.js';
import { getAll } from '../../db/index.js';
import { AgentSkillFunction } from './agent.types.js';

export interface RunAgentOptions {
  message: string;
  sessionId?: string;
  agentId?: string;
  clearHistory?: boolean;
}

export interface RunAgentResult {
  success: boolean;
  response: string;
  toolCalls?: string[];
  error?: string;
}

/**
 * 运行智能体对话（支持工具调用）
 */
export async function runAgent(options: RunAgentOptions): Promise<RunAgentResult> {
  // 1. 加载配置
  const config = await loadAgentConfig(options?.agentId);

  // 2. 获取 MiniMax Provider（使用初始化时加载的配置）
  const miniMax = getMiniMaxProvider();

  console.log('[Agent] MiniMax configured:', miniMax.isConfigured());
  console.log('[Agent] MiniMax model:', miniMax.model);

  if (!miniMax.isConfigured()) {
    return { success: false, response: '', error: 'MiniMax API 未配置，请在设置中配置 MiniMax API Key' };
  }

  // 3. 获取会话历史
  const sessionId = options?.sessionId || 'default';
  if (options?.clearHistory) {
    clearHistory(sessionId);
  }
  const history = getSessionHistory(sessionId);

  // 4. 获取上下文（笔记、任务）
  const recentNotes = getAll<any>(
    'SELECT id, title, category FROM notes WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5',
    ['dev_user_1']
  );
  const tasks = getAll<any>(
    'SELECT id, title, priority FROM tasks WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 3',
    ['dev_user_1', 'pending']
  );

  // 5. 获取可用工具定义
  const skills = config.skills
    .filter(s => s.enabled)
    .map(s => s.function as AgentSkillFunction);

  // 6. 构建消息列表（包含历史）
  const messages: any[] = [
    {
      role: 'system',
      content: buildSystemPrompt(config, { recentNotes, tasks })
    }
  ];

  // 添加历史对话
  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // 添加当前消息
  console.log('[Agent] User message:', options.message);
  messages.push({ role: 'user', content: options.message });

  console.log('[Agent] Full messages before API call:', JSON.stringify(messages).slice(0, 500));

  // 7. 调用 MiniMax（支持工具调用）
  console.log('[Agent] Calling MiniMax with tools:', skills.map(t => t.name).join(', '));
  let result = await miniMax.chatWithTools(messages, skills);

  if (!result.success) {
    return { success: false, response: '', error: result.error };
  }

  // 8. 处理工具调用
  let finalResponse = result.content || '';
  let toolCallCount = 0;

  if (result.toolCalls && result.toolCalls.length > 0) {
    console.log('[Agent] Detected tool calls:', result.toolCalls.length);
    
    // 添加助手消息（Anthropic 兼容格式：content 数组包含文本块和工具调用块）
    const assistantContent: any[] = [];
    if (result.content) {
      assistantContent.push({ type: 'text', text: result.content });
    }
    for (const tc of result.toolCalls) {
      assistantContent.push({
        type: 'tool_use',
        id: `call_${toolCallCount++}`,
        name: tc.name,
        input: tc.arguments
      });
    }
    
    messages.push({
      role: 'assistant',
      content: assistantContent
    });

    // 执行工具调用
    for (const toolCall of result.toolCalls) {
      console.log('[Agent] Executing tool:', toolCall.name, toolCall.arguments);
      
      const skillResult = await executeSkill(toolCall.name, toolCall.arguments);
      console.log('[Agent] Tool result:', JSON.stringify(skillResult).slice(0, 200));
      
      // 添加工具结果（Anthropic 兼容格式：content 数组包含 tool_result 块）
      messages.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: `call_${--toolCallCount}`,
          content: typeof skillResult === 'string' ? skillResult : JSON.stringify(skillResult)
        }]
      });
    }

    // 再次调用 MiniMax 获取最终响应
    console.log('[Agent] Calling MiniMax again with tool results...');
    const finalResult = await miniMax.chatWithTools(messages, skills);
    
    if (finalResult.success) {
      finalResponse = finalResult.content || '';
      result = finalResult;
    }
  }

  // 9. 保存到历史
  addToHistory(sessionId, 'user', options.message);
  addToHistory(sessionId, 'assistant', finalResponse);

  return {
    success: true,
    response: finalResponse,
    toolCalls: result.toolCalls?.map(tc => tc.name)
  };
}
