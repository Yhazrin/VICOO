/**
 * Agent System Prompt Builder
 * 
 * 构建智能体的系统提示词
 */

import { getAgentSkills } from './agent.skills.js';

export interface BuildPromptOptions {
  mode?: 'auto' | 'knowledge' | 'search' | 'action';
  context?: {
    recentNotes?: any[];
    currentNote?: string;
  };
}

/**
 * 构建系统提示词
 */
export function buildSystemPrompt(options: BuildPromptOptions = {}): string {
  const { mode = 'auto', context } = options;
  
  const skills = getAgentSkills();
  
  let prompt = `# Vicoo AI Assistant

你是 Vicoo 的 AI 助手，一个强大的个人知识管理助手。

## 你的能力

1. **笔记管理** - 创建、编辑、整理笔记
2. **知识问答** - 回答关于用户笔记的问题
3. **创意生成** - 帮助用户 brainstorming
4. **写作辅助** - 改进和优化用户写作

## 可用技能

`;
  
  // 添加技能列表
  for (const skill of skills) {
    prompt += `\n### ${skill.name}\n${skill.description}\n`;
  }
  
  // 根据模式添加额外指令
  if (mode === 'knowledge') {
    prompt += `\n\n## 当前模式：知识模式\n优先使用用户的笔记知识来回答问题。\n`;
  } else if (mode === 'search') {
    prompt += `\n\n## 当前模式：搜索模式\n需要搜索互联网获取最新信息。\n`;
  } else if (mode === 'action') {
    prompt += `\n\n## 当前模式：行动模式\n执行用户请求的具体操作。\n`;
  }
  
  prompt += `\n\n## 回复要求

- 使用中文回复（除非用户用英文）
- 保持简洁、有帮助
- 如果不确定某事，请诚实说明
- 可以使用 Markdown 格式化回复

好的，让我们开始吧！`;
  
  return prompt;
}

export default buildSystemPrompt;
