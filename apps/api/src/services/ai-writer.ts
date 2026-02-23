/**
 * AI Writing Agent Service
 *
 * Provides AI-powered writing assistance including:
 * - Rewrite (improve, simplify, formal, casual)
 * - Outline generation
 * - Content expansion
 * - Translation
 */

import { runAIAssistant } from './ai-assistant.js';

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

export interface WritingRequest {
  content: string;
  action: WritingAction;
  language?: string; // For translation
  tone?: string; // For rewrite
}

export interface WritingResponse {
  success: boolean;
  result?: string;
  error?: string;
}

// Writing prompts
const WRITING_PROMPTS: Record<WritingAction, string> = {
  rewrite: `请重写以下文本，使其更加清晰、流畅、专业。保持原意但改善表达方式：\n\n`,

  improve: `请改进以下文本，提升其质量。纠正语法错误，优化句子结构，增强说服力：\n\n`,

  simplify: `请简化以下文本，使其更容易理解。使用更简单的词汇和更短的句子：\n\n`,

  formal: `请将以下文本改写为正式的风格，适用于商务或学术场景：\n\n`,

  casual: `请将以下文本改写为轻松、口语化的风格：\n\n`,

  outline: `请为以下内容生成一个清晰的结构化大纲。使用 Markdown 格式，包含主要标题和子标题：\n\n`,

  expand: `请扩展以下内容，添加更多细节、例子和分析，使文章更加丰富完整：\n\n`,

  summarize: `请简洁地总结以下内容的要点：\n\n`,

  translate: `请翻译以下内容`
};

export async function runWritingAgent(request: WritingRequest): Promise<WritingResponse> {
  const { content, action, language, tone } = request;

  if (!content || content.trim().length < 10) {
    return {
      success: false,
      error: 'Content must be at least 10 characters'
    };
  }

  try {
    let prompt = WRITING_PROMPTS[action];

    // Add language for translation
    if (action === 'translate' && language) {
      prompt = `请将以下内容翻译成${language}：\n\n`;
    }

    // Add tone for rewrite
    if (action === 'rewrite' && tone) {
      prompt = `请以${tone}的语气重写以下文本：\n\n`;
    }

    // Add content
    prompt += content;

    // Limit content length for API
    const truncatedContent = content.length > 3000 ? content.slice(0, 3000) + '...' : content;
    if (content.length > 3000) {
      prompt = prompt.slice(0, -content.length) + truncatedContent;
    }

    const result = await runAIAssistant({
      message: prompt,
      mode: 'auto'
    });

    if (result.success) {
      return {
        success: true,
        result: result.response
      };
    } else {
      return {
        success: false,
        error: result.error || 'AI generation failed'
      };
    }
  } catch (error: any) {
    console.error('[Writing Agent] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  runWritingAgent
};
