/**
 * LangChain 工具定义
 * 将现有 agent.skills 转换为 LangChain Tools
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getAll, getOne, runQuery, saveDatabase } from '../../../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import {
  extractTitle,
  parseGitHubContent,
  parseReadmeContent,
  parseGeneralContent,
  parseSearchResults,
} from '../../agent/agent.web-parser.js';

// 导入自定义工具
import { customTools } from './custom.js';

// ==================== 笔记工具 ====================

/**
 * 搜索笔记
 */
export const searchNotes = tool(
  async ({ query, limit = 5 }: { query: string; limit?: number }) => {
    const notes = getAll<any>(
      `SELECT id, title, content, snippet, category FROM notes
       WHERE title LIKE ? OR content LIKE ? OR snippet LIKE ?
       ORDER BY timestamp DESC LIMIT ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`, limit]
    );
    return { success: true, notes };
  },
  {
    name: 'search_notes',
    description: '搜索用户的笔记内容。当用户想要查找特定笔记或相关内容时使用。',
    schema: z.object({
      query: z.string().describe('搜索关键词'),
      limit: z.number().optional().describe('返回数量限制，默认5'),
    }),
  }
);

/**
 * 获取最近笔记
 */
export const getRecentNotes = tool(
  async ({ limit = 10, category }: { limit?: number; category?: string }) => {
    const userId = 'dev_user_1';
    const categoryFilter = category ? `AND category = '${category}'` : '';
    const notes = getAll<any>(
      `SELECT id, title, snippet, category, timestamp FROM notes
       WHERE user_id = ? ${categoryFilter}
       ORDER BY timestamp DESC LIMIT ?`,
      [userId, limit]
    );
    return { success: true, notes };
  },
  {
    name: 'get_recent_notes',
    description: '获取用户最近创建的笔记列表。',
    schema: z.object({
      limit: z.number().optional().describe('返回数量限制，默认10'),
      category: z.string().optional().describe('可选，按分类筛选(idea/code/design/meeting/todo)'),
    }),
  }
);

/**
 * 获取笔记详情
 */
export const getNote = tool(
  async ({ noteId }: { noteId: string }) => {
    const note = getOne<any>('SELECT * FROM notes WHERE id = ?', [noteId]);
    return note ? { success: true, note } : { success: false, error: '笔记不存在' };
  },
  {
    name: 'get_note',
    description: '获取指定笔记的详细内容。',
    schema: z.object({
      noteId: z.string().describe('笔记ID'),
    }),
  }
);

/**
 * 创建笔记
 */
export const createNote = tool(
  async ({ title, content, category = 'idea', tags }: {
    title: string;
    content: string;
    category?: string;
    tags?: string;
  }) => {
    const userId = 'dev_user_1';
    const id = uuidv4();
    const color = category === 'idea' ? '#FFD166' :
                  category === 'code' ? '#118AB2' :
                  category === 'design' ? '#EF476F' :
                  category === 'meeting' ? '#0df259' : '#6B7280';

    runQuery(
      `INSERT INTO notes (id, user_id, title, category, content, snippet, published, color, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, userId, title, category, content, content.slice(0, 100), 1, color]
    );
    saveDatabase();
    return { success: true, noteId: id, message: '笔记创建成功' };
  },
  {
    name: 'create_note',
    description: '创建新的笔记。当用户想要保存或记录内容时使用。',
    schema: z.object({
      title: z.string().describe('笔记标题'),
      content: z.string().describe('笔记内容（支持 Markdown）'),
      category: z.string().optional().describe('分类：idea/code/design/meeting/todo'),
      tags: z.string().optional().describe('标签，逗号分隔'),
    }),
  }
);

/**
 * 更新笔记
 */
export const updateNote = tool(
  async ({ noteId, title, content, category }: {
    noteId: string;
    title?: string;
    content?: string;
    category?: string;
  }) => {
    const updates: string[] = [];
    const values: any[] = [];

    if (title) { updates.push('title = ?'); values.push(title); }
    if (content) { updates.push('content = ?'); values.push(content); }
    if (category) { updates.push('category = ?'); values.push(category); }

    if (updates.length === 0) {
      return { success: '没有要更新的内容' };
    }

    values.push(noteId);
    runQuery(`UPDATE notes SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, values);
    saveDatabase();
    return { success: true, message: '笔记更新成功' };
  },
  {
    name: 'update_note',
    description: '更新现有笔记的内容。',
    schema: z.object({
      noteId: z.string().describe('笔记ID'),
      title: z.string().optional().describe('新标题'),
      content: z.string().optional().describe('新内容'),
      category: z.string().optional().describe('新分类'),
    }),
  }
);

/**
 * 删除笔记
 */
export const deleteNote = tool(
  async ({ noteId }: { noteId: string }) => {
    runQuery('DELETE FROM notes WHERE id = ?', [noteId]);
    saveDatabase();
    return { success: true, message: '笔记删除成功' };
  },
  {
    name: 'delete_note',
    description: '删除指定的笔记。',
    schema: z.object({
      noteId: z.string().describe('笔记ID'),
    }),
  }
);

// 导出所有笔记工具
export const NoteTools = [
  searchNotes,
  getRecentNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
];

// ==================== 任务工具 ====================

/**
 * 获取任务列表
 */
export const getTasks = tool(
  async ({ status = 'pending' }: { status?: string }) => {
    const userId = 'dev_user_1';
    const statusFilter = status && status !== 'all' ? `AND status = '${status}'` : '';
    const tasks = getAll<any>(
      `SELECT * FROM tasks WHERE user_id = ? ${statusFilter} ORDER BY created_at DESC`,
      [userId]
    );
    return { success: true, tasks };
  },
  {
    name: 'get_tasks',
    description: '获取用户的任务列表。',
    schema: z.object({
      status: z.string().optional().describe('筛选状态：pending/completed/all，默认 pending'),
    }),
  }
);

/**
 * 创建任务
 */
export const createTask = tool(
  async ({ title, description, priority = 'medium' }: {
    title: string;
    description?: string;
    priority?: string;
  }) => {
    const userId = 'dev_user_1';
    const id = uuidv4();
    const status = 'pending';

    runQuery(
      `INSERT INTO tasks (id, user_id, title, description, priority, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, userId, title, description || '', priority, status]
    );
    saveDatabase();
    return { success: true, taskId: id, message: '任务创建成功' };
  },
  {
    name: 'create_task',
    description: '创建新的任务。',
    schema: z.object({
      title: z.string().describe('任务标题'),
      description: z.string().optional().describe('任务描述'),
      priority: z.string().optional().describe('优先级：low/medium/high，默认 medium'),
    }),
  }
);

/**
 * 完成任务
 */
export const completeTask = tool(
  async ({ taskId }: { taskId: string }) => {
    runQuery("UPDATE tasks SET status = 'completed', updated_at = datetime('now') WHERE id = ?", [taskId]);
    saveDatabase();
    return { success: true, message: '任务已完成' };
  },
  {
    name: 'complete_task',
    description: '标记任务为完成状态。',
    schema: z.object({
      taskId: z.string().describe('任务ID'),
    }),
  }
);

/**
 * 删除任务
 */
export const deleteTask = tool(
  async ({ taskId }: { taskId: string }) => {
    runQuery('DELETE FROM tasks WHERE id = ?', [taskId]);
    saveDatabase();
    return { success: true, message: '任务删除成功' };
  },
  {
    name: 'delete_task',
    description: '删除指定的任务。',
    schema: z.object({
      taskId: z.string().describe('任务ID'),
    }),
  }
);

export const TaskTools = [
  getTasks,
  createTask,
  completeTask,
  deleteTask,
];

// ==================== 标签工具 ====================

/**
 * 获取所有标签
 */
export const getTags = tool(
  async () => {
    const tags = getAll<any>(`SELECT * FROM tags ORDER BY name`);
    return { success: true, tags };
  },
  {
    name: 'get_tags',
    description: '获取用户所有的标签列表。',
    schema: z.object({}),
  }
);

/**
 * 获取指定标签下的笔记
 */
export const getNotesByTag = tool(
  async ({ tag }: { tag: string }) => {
    const notes = getAll<any>(
      `SELECT n.* FROM notes n
       JOIN note_tags nt ON n.id = nt.note_id
       JOIN tags t ON nt.tag_id = t.id
       WHERE t.name = ?
       ORDER BY n.timestamp DESC`,
      [tag]
    );
    return { success: true, notes };
  },
  {
    name: 'get_notes_by_tag',
    description: '获取指定标签下的所有笔记。',
    schema: z.object({
      tag: z.string().describe('标签名称'),
    }),
  }
);

export const TagTools = [getTags, getNotesByTag];

// ==================== 知识图谱工具 ====================

/**
 * 获取知识图谱
 */
export const getGraph = tool(
  async () => {
    const userId = 'dev_user_1';
    const nodes = getAll<any>(`SELECT * FROM notes WHERE user_id = ? LIMIT 50`, [userId]);
    const links = getAll<any>(`SELECT * FROM note_links`);
    return { success: true, nodes, links };
  },
  {
    name: 'get_graph',
    description: '获取用户的知识图谱，了解笔记之间的关联。',
    schema: z.object({}),
  }
);

/**
 * 获取相关笔记
 */
export const getRelatedNotes = tool(
  async ({ noteId }: { noteId: string }) => {
    const links = getAll<any>(
      `SELECT target_note_id FROM note_links WHERE source_note_id = ?
       UNION
       SELECT source_note_id FROM note_links WHERE target_note_id = ?`,
      [noteId, noteId]
    );
    const relatedIds = links.map((l: any) => l.target_note_id || l.source_note_id);
    if (relatedIds.length === 0) return { success: true, notes: [] };

    const notes = getAll<any>(
      `SELECT * FROM notes WHERE id IN (${relatedIds.map(() => '?').join(',')})`,
      relatedIds
    );
    return { success: true, notes };
  },
  {
    name: 'get_related_notes',
    description: '获取与指定笔记相关的其他笔记。',
    schema: z.object({
      noteId: z.string().describe('笔记ID'),
    }),
  }
);

export const KnowledgeGraphTools = [getGraph, getRelatedNotes];

// ==================== 统计工具 ====================

/**
 * 获取统计信息
 */
export const getStatistics = tool(
  async () => {
    const userId = 'dev_user_1';
    const noteCount = getOne<any>(`SELECT COUNT(*) as count FROM notes WHERE user_id = ?`, [userId]);
    const taskCount = getOne<any>(`SELECT COUNT(*) as count FROM tasks WHERE user_id = ?`, [userId]);
    const completedTaskCount = getOne<any>(`SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'completed'`, [userId]);
    const tagCount = getOne<any>(`SELECT COUNT(*) as count FROM tags`);

    return {
      success: true,
      statistics: {
        notes: noteCount?.count || 0,
        tasks: taskCount?.count || 0,
        completedTasks: completedTaskCount?.count || 0,
        tags: tagCount?.count || 0,
      },
    };
  },
  {
    name: 'get_statistics',
    description: '获取用户的笔记和任务统计信息。',
    schema: z.object({}),
  }
);

/**
 * 获取时间线
 */
export const getTimeline = tool(
  async ({ days = 30 }: { days?: number }) => {
    const userId = 'dev_user_1';
    const notes = getAll<any>(
      `SELECT id, title, category, timestamp FROM notes
       WHERE user_id = ? AND timestamp >= datetime('now', '-${days} days')
       ORDER BY timestamp DESC`,
      [userId]
    );
    return { success: true, notes };
  },
  {
    name: 'get_timeline',
    description: '获取笔记的时间线，按日期查看历史。',
    schema: z.object({
      days: z.number().optional().describe('查看最近多少天，默认30'),
    }),
  }
);

export const InfoTools = [getStatistics, getTimeline];

// ==================== 联网工具 ====================

/**
 * 网页搜索（DuckDuckGo）
 */
export const searchWeb = tool(
  async ({ query, limit = 5 }: { query: string; limit?: number }) => {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!response.ok) return { success: false, error: '搜索请求失败' };
      const html = await response.text();
      const results = parseSearchResults(html, limit);
      return { success: true, query, results, total: results.length };
    } catch (e: any) {
      return { success: false, error: `搜索失败: ${e.message}` };
    }
  },
  {
    name: 'search_web',
    description: '使用搜索引擎搜索相关信息。当需要查找最新信息、新闻、技术文档时使用。',
    schema: z.object({
      query: z.string().describe('搜索关键词'),
      limit: z.number().optional().describe('返回结果数量，默认5'),
    }),
  }
);

/**
 * 获取网页内容
 */
export const fetchWebContent = tool(
  async ({ url, type = 'general' }: { url: string; type?: string }) => {
    try {
      let fetchUrl = url.startsWith('http') ? url : 'https://' + url;
      const response = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      if (!response.ok) return { success: false, error: `请求失败: ${response.status}` };
      const html = await response.text();
      let content = '';
      if (type === 'github' || fetchUrl.includes('github.com')) {
        content = parseGitHubContent(html, fetchUrl);
      } else if (type === 'readme') {
        content = parseReadmeContent(html);
      } else {
        content = parseGeneralContent(html);
      }
      return {
        success: true,
        url: fetchUrl,
        title: extractTitle(html) || url,
        content: content.slice(0, 8000),
      };
    } catch (e: any) {
      return { success: false, error: `获取网页失败: ${e.message}` };
    }
  },
  {
    name: 'fetch_web_content',
    description: '获取指定URL的网页内容。当用户询问外部链接、GitHub项目或其他网页内容时使用。',
    schema: z.object({
      url: z.string().describe('要获取的URL地址'),
      type: z.enum(['github', 'readme', 'general']).optional().describe('内容类型，默认 general'),
    }),
  }
);

export const WebTools = [searchWeb, fetchWebContent];

// ==================== 导出所有工具 ====================

export const AllTools = [
  ...NoteTools,
  ...TaskTools,
  ...TagTools,
  ...KnowledgeGraphTools,
  ...InfoTools,
  ...WebTools,
  ...customTools,
];

export default {
  NoteTools,
  TaskTools,
  TagTools,
  KnowledgeGraphTools,
  InfoTools,
  customTools,
  AllTools,
};
