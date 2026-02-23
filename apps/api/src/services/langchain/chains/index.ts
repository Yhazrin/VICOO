/**
 * LangChain Chains (简化版)
 * 意图分析链、路由链、工具执行链、写作链、搜索链
 */

import { createMiniMaxModel } from '../models';
import { NoteTools, TaskTools, KnowledgeGraphTools, InfoTools, AllTools } from '../tools';

/**
 * 意图分析 Chain
 * 分析用户输入，确定用户意图
 */
const intentPromptTemplate = `你是一个意图分析助手。根据用户的输入，判断用户的意图。

可选意图：
- search_note: 搜索笔记
- create_note: 创建笔记
- get_task: 获取任务
- search_web: 搜索网页
- general_chat: 一般对话
- analyze_content: 分析内容

用户输入：{query}

请直接输出意图类型，不需要解释。`;

/**
 * 路由 Chain
 * 根据意图选择合适的处理方式
 */
const routingPromptTemplate = `你是一个路由器。根据用户的意图，选择合适的处理方式。

用户输入：{query}
意图：{intent}

如果意图是 search_note、create_note、get_task，选择 "agent"。
如果意图是 search_web，选择 "search"。
如果意图是 general_chat，选择 "chat"。
如果意图是 analyze_content，选择 "analyze"。

直接输出处理方式：agent / search / chat / analyze`;

/**
 * 写作 Chain
 */
const writingPromptTemplate = `你是一个专业的写作助手。根据用户的请求改进内容。

用户请求：{action}
内容：{content}

风格偏好：{style}

请直接输出改进后的内容，不需要解释。`;

/**
 * 搜索 Chain
 */
const searchPromptTemplate = `你是一个搜索助手。根据用户的查询，生成合适的搜索关键词。

用户查询：{query}

请生成 2-3 个搜索关键词，用逗号分隔。`;

/**
 * RAG Chain
 */
const ragPromptTemplate = `你是一个知识库问答助手。根据提供的上下文回答用户的问题。

上下文：
{context}

用户问题：{question}

请根据上下文回答问题。如果上下文中没有相关信息，请如实说明。`;

/**
 * 创建意图分析 Chain
 */
export function createIntentChain() {
  return {
    invoke: async (input: { query: string }) => {
      const llm = createMiniMaxModel();
      const result: any = await llm.invoke([
        { role: 'system', content: intentPromptTemplate.replace('{query}', input.query) }
      ]);
      return { text: result.content || result.text || '' };
    }
  };
}

/**
 * 创建路由 Chain
 */
export function createRoutingChain() {
  return {
    invoke: async (input: { query: string; intent: string }) => {
      const llm = createMiniMaxModel();
      const result: any = await llm.invoke([
        { role: 'system', content: routingPromptTemplate.replace('{query}', input.query).replace('{intent}', input.intent) }
      ]);
      return { text: result.content || result.text || '' };
    }
  };
}

/**
 * 创建写作 Chain
 */
export function createWritingChain() {
  return {
    invoke: async (input: { action: string; content: string; style: string }) => {
      const llm = createMiniMaxModel({ temperature: 0.8 });
      const prompt = writingPromptTemplate
        .replace('{action}', input.action)
        .replace('{content}', input.content)
        .replace('{style}', input.style);
      const result: any = await llm.invoke([
        { role: 'system', content: prompt }
      ]);
      return { text: result.content || result.text || '' };
    }
  };
}

/**
 * 创建搜索 Chain
 */
export function createSearchChain() {
  return {
    invoke: async (input: { query: string }) => {
      const llm = createMiniMaxModel();
      const result: any = await llm.invoke([
        { role: 'system', content: searchPromptTemplate.replace('{query}', input.query) }
      ]);
      return { text: result.content || result.text || '' };
    }
  };
}

/**
 * 创建 RAG Chain
 */
export function createRAGChain() {
  return {
    invoke: async (input: { context: string; question: string }) => {
      const llm = createMiniMaxModel();
      const prompt = ragPromptTemplate
        .replace('{context}', input.context)
        .replace('{question}', input.question);
      const result: any = await llm.invoke([
        { role: 'system', content: prompt }
      ]);
      return { text: result.content || result.text || '' };
    }
  };
}

/**
 * 工具执行 Chain
 */
export function createToolExecutionChain() {
  return {
    invoke: async (input: { tool_result: string }) => {
      const llm = createMiniMaxModel();
      const result: any = await llm.invoke([
        { role: 'system', content: `你是一个工具执行结果处理器。\n\n工具执行结果：${input.tool_result}\n\n请用友好的方式总结这个结果。` }
      ]);
      return { text: result.content || result.text || '' };
    }
  };
}

/**
 * 写作动作
 */
export type WritingAction =
  | 'rewrite'
  | 'improve'
  | 'simplify'
  | 'formal'
  | 'casual'
  | 'outline'
  | 'expand'
  | 'summarize'
  | 'translate';

export const writingActions: Record<WritingAction, string> = {
  rewrite: '重写这段内容，使其更清晰、更专业',
  improve: '改进这段内容，提升质量和表达',
  simplify: '简化这段内容，使其更容易理解',
  formal: '将内容改写为正式商务风格',
  casual: '将内容改写为轻松随意风格',
  outline: '为这段内容生成结构化大纲',
  expand: '扩展这段内容，添加更多细节和例子',
  summarize: '总结这段内容的要点',
  translate: '翻译这段内容到指定语言',
};

export const writingStyles: Record<string, string> = {
  formal: '正式商务风格',
  casual: '轻松随意风格',
  creative: '创意风格',
  academic: '学术风格',
  simple: '简单直白风格',
};

/**
 * 系统提示词
 */
export const VICO_SYSTEM_PROMPT = `你是一个友好的 AI 助手，名字叫 Vicoo。

你可以帮助用户：
- 管理笔记（搜索、创建、编辑、删除）
- 管理任务（查看、创建、完成、删除）
- 回答问题
- 搜索网页内容
- 分析和整理信息

请用中文回复，保持友好和简洁。`;

/**
 * 创建完整的 Agent Chain
 */
export function createAgentChain() {
  const llm = createMiniMaxModel({
    temperature: 0.7,
    maxTokens: 4096,
  });

  return {
    llm,
    tools: AllTools,
    systemPrompt: VICO_SYSTEM_PROMPT,
  };
}

export default {
  createIntentChain,
  createRoutingChain,
  createToolExecutionChain,
  createWritingChain,
  createSearchChain,
  createRAGChain,
  createAgentChain,
  VICO_SYSTEM_PROMPT,
  writingActions,
  writingStyles,
};
