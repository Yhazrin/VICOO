/**
 * LangChain Memory 模块
 * 长期记忆（通过 RAG）和短期会话记忆管理
 */

import { getAll, runQuery, saveDatabase } from '../../../db/index.js';

// ==================== 类型定义 ====================

export interface MemoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ConversationSession {
  id: string;
  userId: string;
  title?: string;
  messages: MemoryMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryConfig {
  maxMessages?: number;      // 会话中保留的最大消息数
  maxTokens?: number;        // 最大 token 数（用于摘要）
  persistHistory?: boolean;  // 是否持久化到数据库
}

// ==================== 内存会话存储 ====================

// 内存中的会话缓存
const sessionCache = new Map<string, ConversationSession>();

/**
 * 获取或创建会话
 */
export function getOrCreateConversation(
  sessionId: string,
  userId: string = 'dev_user_1'
): ConversationSession {
  // 先从缓存获取
  if (sessionCache.has(sessionId)) {
    return sessionCache.get(sessionId)!;
  }

  // 从数据库加载
  const dbSessions = getAll<any>(
    `SELECT * FROM conversation_sessions WHERE id = ? AND user_id = ?`,
    [sessionId, userId]
  );

  let session: ConversationSession;

  if (dbSessions.length > 0) {
    const dbSession = dbSessions[0];

    // 加载历史消息
    const messages = getAll<MemoryMessage>(
      `SELECT role, content, timestamp FROM conversation_messages
       WHERE session_id = ? ORDER BY created_at ASC`,
      [sessionId]
    );

    session = {
      id: dbSession.id,
      userId: dbSession.user_id,
      title: dbSession.title,
      messages,
      createdAt: dbSession.created_at,
      updatedAt: dbSession.updated_at,
    };
  } else {
    // 创建新会话
    session = {
      id: sessionId,
      userId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 持久化到数据库
    persistSession(session);
  }

  sessionCache.set(sessionId, session);
  return session;
}

/**
 * 持久化会话到数据库
 */
function persistSession(session: ConversationSession): void {
  runQuery(
    `INSERT OR REPLACE INTO conversation_sessions (id, user_id, title, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [session.id, session.userId, session.title || null, session.createdAt, session.updatedAt]
  );
  saveDatabase();
}

/**
 * 保存消息到会话
 */
export function addMessage(
  sessionId: string,
  message: Omit<MemoryMessage, 'timestamp'>
): void {
  const session = sessionCache.get(sessionId);
  if (!session) return;

  const newMessage: MemoryMessage = {
    ...message,
    timestamp: new Date().toISOString(),
  };

  session.messages.push(newMessage);
  session.updatedAt = newMessage.timestamp;

  // 持久化消息
  runQuery(
    `INSERT INTO conversation_messages (id, session_id, role, content, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [require('uuid').v4(), sessionId, message.role, message.content, newMessage.timestamp]
  );
  saveDatabase();

  // 触发自动摘要（如果消息过多）
  if (session.messages.length > 20) {
    summarizeSession(sessionId).catch(console.error);
  }
}

/**
 * 获取会话历史消息
 */
export function getConversationHistory(
  sessionId: string,
  limit: number = 10
): MemoryMessage[] {
  const session = sessionCache.get(sessionId);
  if (!session) return [];

  return session.messages.slice(-limit);
}

/**
 * 清空会话
 */
export function clearConversation(sessionId: string): void {
  sessionCache.delete(sessionId);

  // 从数据库删除
  runQuery('DELETE FROM conversation_messages WHERE session_id = ?', [sessionId]);
  runQuery('DELETE FROM conversation_sessions WHERE id = ?', [sessionId]);
  saveDatabase();
}

/**
 * 汇总旧会话（用于长期记忆）
 */
async function summarizeSession(sessionId: string): Promise<string> {
  const session = sessionCache.get(sessionId);
  if (!session || session.messages.length < 10) return '';

  // 保留最近的消息
  const recentMessages = session.messages.slice(-10);
  const oldMessages = session.messages.slice(0, -10);

  // 简单摘要：提取关键信息
  const summary = `会话共 ${oldMessages.length} 条消息。用户主要讨论了：${
    oldMessages.filter(m => m.role === 'user').slice(0, 3).map(m => m.content.slice(0, 50)).join('; ')
  }...`;

  // 保存摘要到数据库
  runQuery(
    `INSERT INTO conversation_summaries (id, session_id, user_id, summary, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [require('uuid').v4(), sessionId, session.userId, summary, new Date().toISOString()]
  );
  saveDatabase();

  // 更新内存中的消息
  session.messages = recentMessages;
  session.title = summary.slice(0, 50);

  return summary;
}

/**
 * 获取用户的所有会话摘要（长期记忆）
 */
export function getUserMemorySummary(userId: string = 'dev_user_1'): string[] {
  const summaries = getAll<any>(
    `SELECT summary FROM conversation_summaries
     WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
    [userId]
  );

  return summaries.map(s => s.summary);
}

// ==================== LangChain Memory 接口 ====================

import { BaseMemory } from '@langchain/core/memory';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Vicoo 对话记忆（实现 LangChain BaseMemory 接口）
 */
export class VicooMemory extends BaseMemory {
  sessionId: string;
  maxMessages: number;

  constructor(sessionId: string, config: MemoryConfig = {}) {
    super();
    this.sessionId = sessionId;
    this.maxMessages = config.maxMessages ?? 20;
  }

  get memoryKeys(): string[] {
    return ['history'];
  }

  async loadMemoryVariables(values: Record<string, any>): Promise<Record<string, any>> {
    const history = getConversationHistory(this.sessionId, this.maxMessages);

    const messages = history.map(m => {
      if (m.role === 'user') return new HumanMessage(m.content);
      if (m.role === 'assistant') return new AIMessage(m.content);
      return new SystemMessage(m.content);
    });

    return { history: messages };
  }

  async saveContext(inputValues: Record<string, any>, outputValues: Record<string, any>): Promise<void> {
    const input = inputValues.input ?? inputValues.text ?? '';
    const output = outputValues.output ?? outputValues.text ?? '';

    if (input) {
      addMessage(this.sessionId, { role: 'user', content: input });
    }
    if (output) {
      addMessage(this.sessionId, { role: 'assistant', content: output });
    }
  }

  async clear(): Promise<void> {
    clearConversation(this.sessionId);
  }
}

/**
 * 创建会话记忆
 */
export function createConversationMemory(
  sessionId: string,
  config?: MemoryConfig
): VicooMemory {
  return new VicooMemory(sessionId, config);
}

// ==================== 初始化数据库表 ====================

export function initializeMemoryTables(): void {
  try {
    // 会话表
    runQuery(`
      CREATE TABLE IF NOT EXISTS conversation_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // 消息表
    runQuery(`
      CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // 摘要表（长期记忆）
    runQuery(`
      CREATE TABLE IF NOT EXISTS conversation_summaries (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // 索引
    runQuery('CREATE INDEX IF NOT EXISTS idx_messages_session ON conversation_messages(session_id)');
    runQuery('CREATE INDEX IF NOT EXISTS idx_summaries_user ON conversation_summaries(user_id)');

    console.log('[Memory] Tables initialized');
  } catch (e) {
    console.error('[Memory] Failed to initialize tables:', e);
  }
}

export default {
  getOrCreateConversation,
  addMessage,
  getConversationHistory,
  clearConversation,
  getUserMemorySummary,
  VicooMemory,
  createConversationMemory,
  initializeMemoryTables,
};
