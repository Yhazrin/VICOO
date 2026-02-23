/**
 * 增强版 RAG (Retrieval-Augmented Generation) Service
 *
 * 结合 Loaders + Retrievers + Embeddings 实现完整的 RAG 流程
 */

import { getOne, getAll, runQuery, saveDatabase } from '../db/index.js';
import { createNotesLoader, createTasksLoader, createTimelineLoader } from './langchain/loaders/index.js';
import { createNotesRetriever, createTasksRetriever, createTimelineRetriever } from './langchain/retrievers/index.js';
import { getEmbeddingModel } from './langchain/models.js';
import { traceRAGPipeline } from './langchain/observability/index.js';
import { v4 as uuidv4 } from 'uuid';

// ==================== 类型定义 ====================

export interface SearchResult {
  noteId: string;
  title: string;
  content: string;
  relevance: number;
  matchedChunk?: string;
  category?: string;
  timestamp?: string;
}

export interface RAGAnswer {
  answer: string;
  sources: Array<{
    title: string;
    id: string;
    matchedContent: string;
    category?: string;
  }>;
  query: string;
  processingTime: number;
}

export interface RAGConfig {
  maxTokens?: number;
  temperature?: number;
  topK?: number;
}

// ==================== Embedding 生成 ====================

let embeddingModel: any = null;

/**
 * 获取 Embedding 模型（带缓存）
 */
function getEmbedding(): any {
  if (!embeddingModel) {
    try {
      embeddingModel = getEmbeddingModel();
    } catch (e) {
      console.warn('[RAG] Failed to load embedding model, using fallback');
      return null;
    }
  }
  return embeddingModel;
}

/**
 * 生成文本 Embedding
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  const model = getEmbedding();
  if (!model) {
    // 回退到模拟 Embedding
    return generateMockEmbedding(text);
  }

  try {
    const result = await model.embedQuery(text);
    return result;
  } catch (e) {
    console.error('[RAG] Error generating embedding:', e);
    return generateMockEmbedding(text);
  }
}

/**
 * 生成模拟 Embedding（用于测试或无 API Key 时）
 */
function generateMockEmbedding(text: string): number[] {
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  const embedding: number[] = [];
  let seed = Math.abs(hash);
  for (let i = 0; i < 384; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    embedding.push((seed / 0x7fffffff) * 2 - 1);
  }

  return embedding;
}

/**
 * 计算余弦相似度
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 0.0001);
}

// ==================== 文本分块 ====================

/**
 * 将文本分块
 */
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);

  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    currentLength += word.length + 1;
    currentChunk.push(word);

    if (currentLength >= chunkSize) {
      chunks.push(currentChunk.join(' '));
      currentChunk = currentChunk.slice(-Math.floor(overlap / 5));
      currentLength = 0;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// ==================== 索引功能 ====================

/**
 * 为单个笔记创建向量索引
 */
export async function indexNote(noteId: string): Promise<void> {
  const note = getOne<any>('SELECT * FROM notes WHERE id = ?', [noteId]);
  if (!note || !note.content) return;

  // 删除旧的 Embedding
  runQuery('DELETE FROM note_embeddings WHERE note_id = ?', [noteId]);

  // 分块
  const chunks = chunkText(note.content);

  // 为每个块生成 Embedding
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk);
    if (!embedding) continue;

    runQuery(
      `INSERT INTO note_embeddings (id, note_id, chunk, embedding, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [uuidv4(), noteId, chunk, JSON.stringify(embedding)]
    );
  }

  saveDatabase();
  console.log(`[RAG] Indexed note ${noteId} with ${chunks.length} chunks`);
}

/**
 * 为所有笔记创建向量索引
 */
export async function indexAllNotes(userId?: string): Promise<number> {
  const userFilter = userId ? `WHERE user_id = '${userId}'` : '';
  const notes = getAll<any>(`SELECT id FROM notes ${userFilter}`);

  let indexed = 0;
  for (const note of notes) {
    await indexNote(note.id);
    indexed++;
  }

  return indexed;
}

// ==================== 检索功能 ====================

/**
 * 语义搜索笔记
 */
export async function semanticSearch(
  query: string,
  limit: number = 5,
  userId?: string
): Promise<SearchResult[]> {
  const startTime = Date.now();

  // 生成查询的 Embedding
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) {
    console.warn('[RAG] Failed to generate query embedding');
    return [];
  }

  // 从数据库获取所有 Embedding
  const userFilter = userId ? `AND n.user_id = '${userId}'` : '';
  const embeddings = getAll<any>(`
    SELECT e.*, n.title, n.content, n.category, n.timestamp
    FROM note_embeddings e
    JOIN notes n ON e.note_id = n.id
    WHERE 1=1 ${userFilter}
  `);

  // 计算相似度分数
  const scores: Map<string, {
    noteId: string;
    title: string;
    content: string;
    score: number;
    chunk: string;
    category?: string;
    timestamp?: string;
  }> = new Map();

  for (const emb of embeddings) {
    try {
      const embedding = JSON.parse(emb.embedding);
      const similarity = cosineSimilarity(queryEmbedding, embedding);

      const existing = scores.get(emb.note_id);
      if (!existing || similarity > existing.score) {
        scores.set(emb.note_id, {
          noteId: emb.note_id,
          title: emb.title,
          content: emb.content || '',
          score: similarity,
          chunk: emb.chunk,
          category: emb.category,
          timestamp: emb.timestamp
        });
      }
    } catch (e) {
      console.error('[RAG] Error parsing embedding:', e);
    }
  }

  // 排序并返回结果
  const results = Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => ({
      noteId: r.noteId,
      title: r.title,
      content: r.content,
      relevance: r.score,
      matchedChunk: r.chunk,
      category: r.category,
      timestamp: r.timestamp
    }));

  const processingTime = Date.now() - startTime;
  console.log(`[RAG] Semantic search completed in ${processingTime}ms, found ${results.length} results`);

  return results;
}

/**
 * 混合搜索（语义 + 关键词）
 */
export async function hybridSearch(
  query: string,
  limit: number = 5,
  userId?: string
): Promise<SearchResult[]> {
  // 1. 语义搜索
  const semanticResults = await semanticSearch(query, limit * 2, userId);

  // 2. 关键词搜索
  const keywordResults = getAll<any>(
    `SELECT id, title, content, category, timestamp,
            CASE
              WHEN title LIKE ? THEN 1
              WHEN content LIKE ? THEN 0.5
              ELSE 0
            END as keyword_score
     FROM notes
     WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
     ORDER BY keyword_score DESC
     LIMIT ?`,
    [`%${query}%`, `%${query}%`, userId || 'dev_user_1', `%${query}%`, `%${query}%`, limit * 2]
  );

  // 3. 合并结果
  const mergedMap = new Map<string, SearchResult>();

  // 添加语义搜索结果
  for (const r of semanticResults) {
    mergedMap.set(r.noteId, r);
  }

  // 添加关键词搜索结果（如果不存在）或更新分数
  for (const r of keywordResults) {
    const existing = mergedMap.get(r.id);
    if (!existing) {
      mergedMap.set(r.id, {
        noteId: r.id,
        title: r.title,
        content: r.content,
        relevance: r.keyword_score,
        category: r.category,
        timestamp: r.timestamp
      });
    } else {
      // 组合分数
      existing.relevance = (existing.relevance + r.keyword_score) / 2;
    }
  }

  // 返回合并后的结果
  return Array.from(mergedMap.values())
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

// ==================== 问答功能 ====================

/**
 * RAG 问答
 */
export async function askQuestion(
  question: string,
  config?: RAGConfig
): Promise<RAGAnswer> {
  const startTime = Date.now();

  return await traceRAGPipeline(question, async () => {
    // 1. 检索相关上下文
    const searchResults = await semanticSearch(
      question,
      config?.topK || 3,
      config?.userId
    );

    if (searchResults.length === 0) {
      return {
        answer: 'I couldn\'t find any relevant information in your knowledge base to answer this question.',
        sources: [],
        query: question,
        processingTime: Date.now() - startTime
      };
    }

    // 2. 构建上下文
    const context = searchResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.matchedChunk || r.content.slice(0, 500)}`)
      .join('\n\n');

    // 3. 生成答案（使用 MiniMax）
    const { createMiniMaxModel } = await import('./langchain/models.js');
    const llm = createMiniMaxModel({
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 2048
    });

    const prompt = `你是一个知识库问答助手。根据以下上下文回答用户的问题。

上下文：
${context}

问题：${question}

请根据上下文准确回答问题。如果上下文中没有足够信息，请如实说明。`;

    const result: any = await llm.invoke([
      { role: 'system', content: prompt }
    ]);

    const answer = result.content || result.text || '抱歉，我无法生成答案。';

    return {
      answer,
      sources: searchResults.map(r => ({
        title: r.title,
        id: r.noteId,
        matchedContent: r.matchedChunk || '',
        category: r.category
      })),
      query: question,
      processingTime: Date.now() - startTime
    };
  });
}

/**
 * 使用特定领域 Retriever 问答
 */
export async function askWithDomain(
  question: string,
  domain: 'notes' | 'tasks' | 'timeline',
  config?: RAGConfig
): Promise<RAGAnswer> {
  const startTime = Date.now();

  let documents: any[] = [];
  let loader: any;

  switch (domain) {
    case 'notes':
      loader = createNotesLoader();
      documents = loader.loadAll();
      break;
    case 'tasks':
      loader = createTasksLoader();
      documents = loader.loadPending();
      break;
    case 'timeline':
      loader = createTimelineLoader({ days: 30 });
      documents = loader.load();
      break;
  }

  // 简单关键词匹配（可以替换为向量检索）
  const relevantDocs = documents.filter(doc =>
    doc.pageContent.toLowerCase().includes(question.toLowerCase()) ||
    doc.metadata.title?.toLowerCase().includes(question.toLowerCase())
  ).slice(0, config?.topK || 3);

  if (relevantDocs.length === 0) {
    return {
      answer: `在${domain}中没有找到相关信息。`,
      sources: [],
      query: question,
      processingTime: Date.now() - startTime
    };
  }

  const context = relevantDocs
    .map((d, i) => `[${i + 1}] ${d.metadata.title || '未知'}\n${d.pageContent.slice(0, 300)}`)
    .join('\n\n');

  const { createMiniMaxModel } = await import('./langchain/models.js');
  const llm = createMiniMaxModel();

  const prompt = `你是一个${domain}问答助手。根据以下上下文回答用户的问题。

上下文：
${context}

问题：${question}

请根据上下文准确回答。`;

  const result: any = await llm.invoke([
    { role: 'system', content: prompt }
  ]);

  return {
    answer: result.content || result.text || '抱歉，我无法生成答案。',
    sources: relevantDocs.map(d => ({
      title: d.metadata.title || '未知',
      id: d.metadata.id || '',
      matchedContent: d.pageContent.slice(0, 200),
      category: d.metadata.category
    })),
    query: question,
    processingTime: Date.now() - startTime
  };
}

// ==================== 初始化 ====================

/**
 * 初始化 RAG 相关表
 */
export function initializeRAGTables(): void {
  try {
    runQuery(`
      CREATE TABLE IF NOT EXISTS note_embeddings (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL,
        chunk TEXT NOT NULL,
        embedding TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    runQuery('CREATE INDEX IF NOT EXISTS idx_embeddings_note_id ON note_embeddings(note_id)');

    console.log('[RAG] Tables initialized');
  } catch (e) {
    console.error('[RAG] Failed to initialize tables:', e);
  }
}

export default {
  indexNote,
  indexAllNotes,
  semanticSearch,
  hybridSearch,
  askQuestion,
  askWithDomain,
  initializeRAGTables
};
