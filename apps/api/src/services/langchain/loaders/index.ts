/**
 * LangChain Document Loaders
 * 将数据库中的笔记、任务等转换为 LangChain Document
 */

import { Document } from '@langchain/core/documents';
import { getAll, getOne } from '../../../db/index.js';

// ==================== 类型定义 ====================

export interface LoaderConfig {
  userId?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

// ==================== 笔记文档加载器 ====================

/**
 * 笔记文档加载器
 * 将用户的笔记转换为 LangChain Document
 */
export class NotesLoader {
  private userId: string;
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(config: LoaderConfig = {}) {
    this.userId = config.userId ?? 'dev_user_1';
    this.chunkSize = config.chunkSize ?? 500;
    this.chunkOverlap = config.chunkOverlap ?? 50;
  }

  /**
   * 加载单个笔记
   */
  loadNote(noteId: string): Document | null {
    const note = getOne<any>('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (!note) return null;

    return new Document({
      pageContent: note.content || note.snippet || '',
      metadata: {
        id: note.id,
        title: note.title,
        category: note.category,
        tags: note.tags,
        timestamp: note.timestamp,
        type: 'note',
      },
    });
  }

  /**
   * 加载用户所有笔记
   */
  loadAll(): Document[] {
    const notes = getAll<any>(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY timestamp DESC',
      [this.userId]
    );

    return notes.map((note: any) => new Document({
      pageContent: note.content || note.snippet || '',
      metadata: {
        id: note.id,
        title: note.title,
        category: note.category,
        tags: note.tags,
        timestamp: note.timestamp,
        type: 'note',
      },
    }));
  }

  /**
   * 按分类加载笔记
   */
  loadByCategory(category: string): Document[] {
    const notes = getAll<any>(
      'SELECT * FROM notes WHERE user_id = ? AND category = ? ORDER BY timestamp DESC',
      [this.userId, category]
    );

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
   * 按标签加载笔记
   */
  loadByTag(tag: string): Document[] {
    const notes = getAll<any>(
      `SELECT n.* FROM notes n
       JOIN note_tags nt ON n.id = nt.note_id
       JOIN tags t ON nt.tag_id = t.id
       WHERE n.user_id = ? AND t.name = ?
       ORDER BY n.timestamp DESC`,
      [this.userId, tag]
    );

    return notes.map((note: any) => new Document({
      pageContent: note.content || note.snippet || '',
      metadata: {
        id: note.id,
        title: note.title,
        category: note.category,
        timestamp: note.timestamp,
        type: 'note',
        tag,
      },
    }));
  }

  /**
   * 按关键词加载笔记
   */
  loadByKeyword(keyword: string, limit: number = 20): Document[] {
    const notes = getAll<any>(
      `SELECT * FROM notes
       WHERE user_id = ? AND (title LIKE ? OR content LIKE ? OR snippet LIKE ?)
       ORDER BY timestamp DESC
       LIMIT ?`,
      [this.userId, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, limit]
    );

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
   * 按日期范围加载笔记
   */
  loadByDateRange(startDate: string, endDate: string): Document[] {
    const notes = getAll<any>(
      `SELECT * FROM notes
       WHERE user_id = ? AND timestamp BETWEEN ? AND ?
       ORDER BY timestamp DESC`,
      [this.userId, startDate, endDate]
    );

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
}

// ==================== 任务文档加载器 ====================

/**
 * 任务文档加载器
 */
export class TasksLoader {
  private userId: string;

  constructor(config: LoaderConfig = {}) {
    this.userId = config.userId ?? 'dev_user_1';
  }

  /**
   * 加载所有任务
   */
  loadAll(): Document[] {
    const tasks = getAll<any>(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [this.userId]
    );

    return tasks.map((task: any) => new Document({
      pageContent: `标题：${task.title}\n描述：${task.description || '无'}\n优先级：${task.priority}\n状态：${task.status}\n截止日期：${task.due_date || '无'}`,
      metadata: {
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        dueDate: task.due_date,
        createdAt: task.created_at,
        type: 'task',
      },
    }));
  }

  /**
   * 加载待办任务
   */
  loadPending(): Document[] {
    const tasks = getAll<any>(
      `SELECT * FROM tasks WHERE user_id = ? AND status = 'pending'
       ORDER BY
         CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
         due_date ASC`,
      [this.userId]
    );

    return tasks.map((task: any) => new Document({
      pageContent: `标题：${task.title}\n描述：${task.description || '无'}\n优先级：${task.priority}\n截止日期：${task.due_date || '无'}`,
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

  /**
   * 加载已完成任务
   */
  loadCompleted(): Document[] {
    const tasks = getAll<any>(
      `SELECT * FROM tasks WHERE user_id = ? AND status = 'completed'
       ORDER BY updated_at DESC`,
      [this.userId]
    );

    return tasks.map((task: any) => new Document({
      pageContent: `标题：${task.title}\n完成时间：${task.updated_at}`,
      metadata: {
        id: task.id,
        title: task.title,
        status: 'completed',
        completedAt: task.updated_at,
        type: 'task',
      },
    }));
  }
}

// ==================== 时间线文档加载器 ====================

/**
 * 时间线文档加载器
 */
export class TimelineLoader {
  private userId: string;
  private days: number;

  constructor(config: LoaderConfig & { days?: number } = {}) {
    this.userId = config.userId ?? 'dev_user_1';
    this.days = config.days ?? 30;
  }

  /**
   * 加载时间线笔记
   */
  load(): Document[] {
    const notes = getAll<any>(
      `SELECT * FROM notes
       WHERE user_id = ? AND timestamp >= datetime('now', '-${this.days} days')
       ORDER BY timestamp DESC`,
      [this.userId]
    );

    return notes.map((note: any) => new Document({
      pageContent: `[${note.timestamp?.split(' ')[0]}] ${note.title}\n${note.content || ''}`,
      metadata: {
        id: note.id,
        title: note.title,
        category: note.category,
        timestamp: note.timestamp,
        date: note.timestamp?.split(' ')[0],
        type: 'timeline',
      },
    }));
  }

  /**
   * 按月加载
   */
  loadByMonth(year: number, month: number): Document[] {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const notes = getAll<any>(
      `SELECT * FROM notes
       WHERE user_id = ? AND timestamp >= ? AND timestamp < ?
       ORDER BY timestamp DESC`,
      [this.userId, startDate, endDate]
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
 * 创建笔记加载器
 */
export function createNotesLoader(config?: LoaderConfig): NotesLoader {
  return new NotesLoader(config);
}

/**
 * 创建任务加载器
 */
export function createTasksLoader(config?: LoaderConfig): TasksLoader {
  return new TasksLoader(config);
}

/**
 * 创建时间线加载器
 */
export function createTimelineLoader(config?: LoaderConfig & { days?: number }): TimelineLoader {
  return new TimelineLoader(config);
}

/**
 * 创建全量数据加载器
 */
export function createFullLoader(config: LoaderConfig = {}) {
  return {
    notes: new NotesLoader(config),
    tasks: new TasksLoader(config),
    timeline: new TimelineLoader({ ...config, days: 30 }),
  };
}

export default {
  NotesLoader,
  TasksLoader,
  TimelineLoader,
  createNotesLoader,
  createTasksLoader,
  createTimelineLoader,
  createFullLoader,
};
