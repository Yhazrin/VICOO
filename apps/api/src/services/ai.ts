/**
 * AI 服务模块
 * 支持多种 AI Provider：Gemini、OpenAI、Coze
 */

import { getCozeConfig, isCozeConfigured } from './coze-config.js';

// ==================== 类型定义 ====================

export interface AIProvider {
  name: string;
  generateSummary(text: string): Promise<AISummaryResult>;
  suggestTags(text: string, existingTags: string[]): Promise<AITagSuggestion[]>;
  semanticSearch(query: string, notes: AINoteContent[]): Promise<AISearchResult[]>;
  generateEmbedding(text: string): Promise<number[]>;
}

export interface AISummaryResult {
  success: boolean;
  summary?: string;
  keywords?: string[];
  error?: string;
}

export interface AITagSuggestion {
  tag: string;
  confidence: number;
  reason?: string;
}

export interface AISearchResult {
  noteId: string;
  title: string;
  relevance: number;
  explanation: string;
  matchedContent?: string;
}

export interface AINoteContent {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

// ==================== Gemini Provider ====================

class GeminiProvider implements AIProvider {
  name = 'Gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'gemini-2.0-flash') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model;
  }

  private async callAPI(prompt: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Gemini API Key 未配置');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generateSummary(text: string): Promise<AISummaryResult> {
    try {
      const prompt = `请为以下内容生成一个简洁的摘要（50字以内），并提取3-5个关键词。
要求：
1. 摘要用中文，简洁明了
2. 关键词用中文，用逗号分隔
3. 返回格式：摘要：<摘要内容>，关键词：<关键词列表>

内容：
${text.slice(0, 4000)}`;

      const result = await this.callAPI(prompt);
      const summaryMatch = result.match(/摘要：(.+?)(?:，|$)/);
      const keywordsMatch = result.match(/关键词：(.+)/);

      return {
        success: true,
        summary: summaryMatch?.[1]?.trim() || result.slice(0, 50),
        keywords: keywordsMatch?.[1]?.split(',').map((k: string) => k.trim()).filter(Boolean) || [],
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async suggestTags(text: string, existingTags: string[]): Promise<AITagSuggestion[]> {
    try {
      const existingStr = existingTags.length > 0 ? `现有标签：${existingTags.join(', ')}` : '';
      const prompt = `请根据以下内容分析并推荐5个最相关的标签。
要求：
1. 标签应该准确反映内容主题
2. 如果现有标签合适，可以保留
3. 返回格式：标签1,标签2,标签3,标签4,标签5（用逗号分隔）

${existingStr}

内容：
${text.slice(0, 2000)}`;

      const result = await this.callAPI(prompt);
      const tags = result.split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 5);

      return tags.map((tag: string) => ({
        tag,
        confidence: 0.8 + Math.random() * 0.2,
      }));
    } catch (error: any) {
      return [];
    }
  }

  async semanticSearch(query: string, notes: AINoteContent[]): Promise<AISearchResult[]> {
    try {
      const notesText = notes
        .map((n, i) => `${i + 1}. 标题：${n.title}\n内容：${n.content.slice(0, 500)}`)
        .join('\n\n');

      const prompt = `用户搜索意图："${query}"

以下是知识库中的笔记，请找出最相关的笔记并解释原因。
返回格式（每行一个结果）：
笔记序号|相关度(0-1)|匹配原因

笔记列表：
${notesText}`;

      const result = await this.callAPI(prompt);
      const lines = result.split('\n').filter((l: string) => l.includes('|'));

      return lines.map((line: string) => {
        const [idx, relevance, explanation] = line.split('|');
        const noteIndex = parseInt(idx) - 1;
        if (notes[noteIndex]) {
          return {
            noteId: notes[noteIndex].id,
            title: notes[noteIndex].title,
            relevance: Math.min(1, parseFloat(relevance) || 0.5),
            explanation: explanation || '语义相关',
          };
        }
        return null;
      }).filter(Boolean);
    } catch (error: any) {
      return [];
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Gemini 不直接支持 embedding，使用简化实现
    // 生产环境应使用专门的 embedding API
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Array(768).fill(0).map((_, i) => Math.sin(hash + i) * Math.cos(i));
  }
}

// ==================== OpenAI Provider ====================

class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model;
  }

  private async callAPI(messages: any[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key 未配置');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async generateSummary(text: string): Promise<AISummaryResult> {
    try {
      const messages = [
        {
          role: 'system',
          content: '你是一个智能摘要助手。请为用户的内容生成简洁摘要（50字以内），并提取关键词。返回格式：摘要：<内容>，关键词：<列表>',
        },
        { role: 'user', content: text.slice(0, 4000) },
      ];

      const result = await this.callAPI(messages);
      const summaryMatch = result.match(/摘要：(.+?)(?:，|$)/);
      const keywordsMatch = result.match(/关键词：(.+)/);

      return {
        success: true,
        summary: summaryMatch?.[1]?.trim() || result.slice(0, 50),
        keywords: keywordsMatch?.[1]?.split(',').map((k: string) => k.trim()).filter(Boolean) || [],
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async suggestTags(text: string, existingTags: string[]): Promise<AITagSuggestion[]> {
    try {
      const existingStr = existingTags.length > 0 ? `现有标签：${existingTags.join(', ')}` : '';
      const messages = [
        {
          role: 'system',
          content: '你是一个标签推荐助手。根据内容推荐5个最相关的标签。返回格式：标签1,标签2,标签3,标签4,标签5',
        },
        { role: 'user', content: `${existingStr}\n\n内容：${text.slice(0, 2000)}` },
      ];

      const result = await this.callAPI(messages);
      const tags = result.split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 5);

      return tags.map((tag: string) => ({
        tag,
        confidence: 0.8 + Math.random() * 0.2,
      }));
    } catch (error: any) {
      return [];
    }
  }

  async semanticSearch(query: string, notes: AINoteContent[]): Promise<AISearchResult[]> {
    try {
      const notesText = notes
        .map((n, i) => `${i + 1}. ${n.title}: ${n.content.slice(0, 300)}`)
        .join('\n');

      const messages = [
        {
          role: 'system',
          content: '你是一个语义搜索助手。找出最相关的笔记并给出原因。格式：序号|相关度|原因',
        },
        { role: 'user', content: `搜索："${query}"\n\n笔记：\n${notesText}` },
      ];

      const result = await this.callAPI(messages);
      const lines = result.split('\n').filter((l: string) => l.includes('|'));

      return lines.map((line: string) => {
        const [idx, relevance, explanation] = line.split('|');
        const noteIndex = parseInt(idx) - 1;
        if (notes[noteIndex]) {
          return {
            noteId: notes[noteIndex].id,
            title: notes[noteIndex].title,
            relevance: Math.min(1, parseFloat(relevance) || 0.5),
            explanation: explanation || '语义相关',
          };
        }
        return null;
      }).filter(Boolean);
    } catch (error: any) {
      return [];
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  }
}

// ==================== Coze Provider ====================

class CozeProvider implements AIProvider {
  name = 'Coze';

  async generateSummary(text: string): Promise<AISummaryResult> {
    // Coze 不直接支持，使用简单实现
    const summary = text.slice(0, 50) + (text.length > 50 ? '...' : '');
    return { success: true, summary, keywords: [] };
  }

  async suggestTags(text: string, existingTags: string[]): Promise<AITagSuggestion[]> {
    const words = text.split(/\s+/).filter((w) => w.length > 2);
    const unique = [...new Set(words)].slice(0, 5);
    return unique.map((tag) => ({ tag, confidence: 0.5 }));
  }

  async semanticSearch(query: string, notes: AINoteContent[]): Promise<AISearchResult[]> {
    const queryLower = query.toLowerCase();
    return notes
      .map((note) => {
        const titleMatch = note.title.toLowerCase().includes(queryLower);
        const contentMatch = note.content.toLowerCase().includes(queryLower);
        const relevance = titleMatch ? 0.8 : contentMatch ? 0.5 : 0;
        return {
          noteId: note.id,
          title: note.title,
          relevance,
          explanation: titleMatch ? '标题匹配' : contentMatch ? '内容匹配' : '语义相关',
        };
      })
      .filter((r) => r.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Array(768).fill(0).map((_, i) => Math.sin(hash + i) * Math.cos(i));
  }
}

// ==================== AI Service Factory ====================

export type AIProviderType = 'gemini' | 'openai' | 'coze' | 'auto';

let currentProvider: AIProvider | null = null;

export function initializeAI(provider: AIProviderType = 'auto'): AIProvider {
  if (provider === 'auto') {
    if (process.env.GEMINI_API_KEY) {
      currentProvider = new GeminiProvider();
    } else if (process.env.OPENAI_API_KEY) {
      currentProvider = new OpenAIProvider();
    } else if (isCozeConfigured()) {
      currentProvider = new CozeProvider();
    } else {
      currentProvider = new CozeProvider();
    }
  } else if (provider === 'gemini') {
    currentProvider = new GeminiProvider();
  } else if (provider === 'openai') {
    currentProvider = new OpenAIProvider();
  } else {
    currentProvider = new CozeProvider();
  }

  return currentProvider;
}

export function getAIProvider(): AIProvider {
  if (!currentProvider) {
    return initializeAI('auto');
  }
  return currentProvider;
}

// ==================== 便捷函数 ====================

export async function generateAISummary(text: string): Promise<AISummaryResult> {
  return getAIProvider().generateSummary(text);
}

export async function suggestAITags(text: string, existingTags: string[] = []): Promise<AITagSuggestion[]> {
  return getAIProvider().suggestTags(text, existingTags);
}

export async function semanticAISearch(query: string, notes: AINoteContent[]): Promise<AISearchResult[]> {
  return getAIProvider().semanticSearch(query, notes);
}

export async function generateAIEmbedding(text: string): Promise<number[]> {
  return getAIProvider().generateEmbedding(text);
}

export default {
  initializeAI,
  getAIProvider,
  generateAISummary,
  suggestAITags,
  semanticAISearch,
  generateAIEmbedding,
};
