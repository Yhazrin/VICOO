/**
 * LangChain Retriever 模块
 * 为不同领域（笔记、任务、时间线）提供专门的 Retriever
 */

import { Document } from '@langchain/core/documents';
import { getAll, getOne } from '../../../db/index.js';

// ==================== 类型定义 ====================

export interface RetrieverConfig {
  topK?: number;
  userId?: string;
  category?: string;
  tags?: string[];
}

/**
 * 笔记 Retriever
 * 从用户的笔记库中检索相关内容
 */
export class NotesRetriever {
  private topK: number;
  private userId: string;

  constructor(config: RetrieverConfig = {}) {
    this.topK = config.topK ?? 5;
    this.userId = config.userId ?? 'dev_user_1';
  }

  /**
   * 根据查询检索相关笔记
   */
  async getRelevantDocuments(query: string): Promise<Document[]> {
    // 1. 关键词搜索
    const notes = getAll<any>(
      `SELECT id, title, content, category, snippet, timestamp
       FROM notes
       WHERE user_id = ? AND (title LIKE ? OR content LIKE ? OR snippet LIKE ?)
       ORDER BY timestamp DESC
       LIMIT ?`,
      [this.userId, `%${query}%`, `%${query}%`, `%${query}%`, this.topK * 2]
    );

    // 2. 转换为 LangChain Document
    return notes.map((note: any) => new Document({
      pageContent: note.content || note.snippet || '',
      metadata: {
        id: note.id,
        title: note.title,
        category: note.category,
        timestamp: note.timestamp,
        type: 'note',
      },
    }));
  }

  /**
   * 获取最近的笔记
   */
  async getRecentDocuments(days: number = 7): Promise<Document[]> {
    const notes = getAll<any>(
      `SELECT id, title, content, category, timestamp
       FROM notes
       WHERE user_id = ? AND timestamp >= datetime('now', '-${days} days')
       ORDER BY timestamp DESC
       LIMIT ?`,
      [this.userId, this.topK]
    );

    return notes.map((note: any) => new Document({
      pageContent: note.content || '',
      metadata: {
        id: note.id,
        title: note.title,
        category: note.category,
        timestamp: note.timestamp,
        type: 'note',
      },
    }));
  }
}

/**
 * 任务 Retriever
 * 从任务库中检索相关内容
 */
export class TasksRetriever {
  private topK: number;
  private userId: string;

  constructor(config: RetrieverConfig = {}) {
    this.topK = config.topK ?? 5;
    this.userId = config.userId ?? 'dev_user_1';
  }

  /**
   * 根据查询检索相关任务
   */
  async getRelevantDocuments(query: string): Promise<Document[]> {
    const tasks = getAll<any>(
      `SELECT id, title, description, priority, status, due_date, created_at
       FROM tasks
       WHERE user_id = ? AND (title LIKE ? OR description LIKE ?)
       ORDER BY
         CASE status WHEN 'pending' THEN 0 ELSE 1 END,
         CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
         created_at DESC
       LIMIT ?`,
      [this.userId, `%${query}%`, `%${query}%`, this.topK]
    );

    return tasks.map((task: any) => new Document({
      pageContent: `任务：${task.title}\n描述：${task.description || '无'}\n优先级：${task.priority}\n状态：${task.status}${task.due_date ? '\n截止日期：' + task.due_date : ''}`,
      metadata: {
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        dueDate: task.due_date,
        type: 'task',
      },
    }));
  }

  /**
   * 获取待办任务
   */
  async getPendingDocuments(): Promise<Document[]> {
    const tasks = getAll<any>(
      `SELECT id, title, description, priority, due_date
       FROM tasks
       WHERE user_id = ? AND status = 'pending'
       ORDER BY
         CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
         due_date ASC
       LIMIT ?`,
      [this.userId, this.topK]
    );

    return tasks.map((task: any) => new Document({
      pageContent: `任务：${task.title}\n描述：${task.description || '无'}\n优先级：${task.priority}${task.due_date ? '\n截止日期：' + task.due_date : ''}`,
      metadata: {
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: 'pending',
        dueDate: task.due_date,
        type: 'task',
      },
    }));
  }
}

/**
 * 时间线 Retriever
 * 从时间线中检索相关事件
 */
export class TimelineRetriever {
  private topK: number;
  private userId: string;

  constructor(config: RetrieverConfig = {}) {
    this.topK = config.topK ?? 10;
    this.userId = config.userId ?? 'dev_user_1';
  }

  /**
   * 获取指定时间范围内的笔记
   */
  async getRelevantDocuments(query: string): Promise<Document[]> {
    // 按关键词 + 时间范围搜索
    const notes = getAll<any>(
      `SELECT id, title, content, category, timestamp
       FROM notes
       WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
       ORDER BY timestamp DESC
       LIMIT ?`,
      [this.userId, `%${query}%`, `%${query}%`, this.topK]
    );

    return notes.map((note: any) => new Document({
      pageContent: `[${note.timestamp?.split(' ')[0]}] ${note.title}\n${note.content || ''}`,
      metadata: {
        id: note.id,
        title: note.title,
        category: note.category,
        timestamp: note.timestamp,
        type: 'timeline',
      },
    }));
  }

  /**
   * 获取最近的时间线
   */
  async getRecentDocuments(days: number = 30): Promise<Document[]> {
    const notes = getAll<any>(
      `SELECT id, title, content, category, timestamp
       FROM notes
       WHERE user_id = ? AND timestamp >= datetime('now', '-${days} days')
       ORDER BY timestamp DESC
       LIMIT ?`,
      [this.userId, this.topK]
    );

    return notes.map((note: any) => new Document({
      pageContent: `[${note.timestamp?.split(' ')[0]}] ${note.title}\n${note.content || ''}`,
      metadata: {
        id: note.id,
        title: note.title,
        category: note.category,
        timestamp: note.timestamp,
        type: 'timeline',
      },
    }));
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建笔记 Retriever
 */
export function createNotesRetriever(config?: RetrieverConfig): NotesRetriever {
  return new NotesRetriever(config);
}

/**
 * 创建任务 Retriever
 */
export function createTasksRetriever(config?: RetrieverConfig): TasksRetriever {
  return new TasksRetriever(config);
}

/**
 * 创建时间线 Retriever
 */
export function createTimelineRetriever(config?: RetrieverConfig): TimelineRetriever {
  return new TimelineRetriever(config);
}

/**
 * 创建组合 Retriever（同时检索多个领域）
 */
export function createMultiRetriever(config: RetrieverConfig = {}) {
  const notesRetriever = new NotesRetriever(config);
  const tasksRetriever = new TasksRetriever(config);
  const timelineRetriever = new TimelineRetriever(config);

  return {
    notes: notesRetriever,
    tasks: tasksRetriever,
    timeline: timelineRetriever,

    /**
     * 检索所有领域的相关内容
     */
    async searchAll(query: string): Promise<{
      notes: Document[];
      tasks: Document[];
      timeline: Document[];
    }> {
      const [notes, tasks, timeline] = await Promise.all([
        notesRetriever.getRelevantDocuments(query),
        tasksRetriever.getRelevantDocuments(query),
        timelineRetriever.getRelevantDocuments(query),
      ]);

      return { notes, tasks, timeline };
    },
  };
}

export default {
  NotesRetriever,
  TasksRetriever,
  TimelineRetriever,
  createNotesRetriever,
  createTasksRetriever,
  createTimelineRetriever,
  createMultiRetriever,
};
