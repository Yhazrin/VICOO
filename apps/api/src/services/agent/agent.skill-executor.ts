/**
 * 智能体技能执行器
 */

import { v4 as uuidv4 } from 'uuid';
import { getAll, getOne, runQuery, saveDatabase } from '../../db/index.js';
import { extractTitle, parseGitHubContent, parseReadmeContent, parseGeneralContent, parseSearchResults } from './agent.web-parser.js';

/**
 * 执行技能函数
 */
export async function executeSkill(
  skillName: string,
  args: any,
  userId: string = 'dev_user_1'
): Promise<any> {
  switch (skillName) {
    // ========== 笔记管理 ==========
    case 'search_notes': {
      const notes = getAll<any>(
        `SELECT id, title, content, snippet, category FROM notes 
         WHERE title LIKE ? OR content LIKE ? OR snippet LIKE ?
         ORDER BY timestamp DESC LIMIT ?`,
        [`%${args.query}%`, `%${args.query}%`, `%${args.query}%`, args.limit || 5]
      );
      return { success: true, notes };
    }

    case 'get_recent_notes': {
      const categoryFilter = args.category ? `AND category = '${args.category}'` : '';
      const notes = getAll<any>(
        `SELECT id, title, snippet, category, timestamp FROM notes 
         WHERE user_id = ? ${categoryFilter}
         ORDER BY timestamp DESC LIMIT ?`,
        [userId, args.limit || 10]
      );
      return { success: true, notes };
    }

    case 'get_note': {
      const note = getOne<any>('SELECT * FROM notes WHERE id = ?', [args.noteId]);
      return note ? { success: true, note } : { success: false, error: '笔记不存在' };
    }

    case 'create_note': {
      const id = uuidv4();
      const category = args.category || 'idea';
      const color = category === 'idea' ? '#FFD166' :
                    category === 'code' ? '#118AB2' :
                    category === 'design' ? '#EF476F' :
                    category === 'meeting' ? '#0df259' : '#6B7280';

      runQuery(
        `INSERT INTO notes (id, user_id, title, category, content, snippet, published, color, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, userId, args.title, category, args.content, args.content.slice(0, 100), 1, color]
      );
      saveDatabase();
      return { success: true, noteId: id, message: '笔记创建成功' };
    }

    case 'update_note': {
      const updates: string[] = [];
      const values: any[] = [];
      
      if (args.title) { updates.push('title = ?'); values.push(args.title); }
      if (args.content) { updates.push('content = ?'); values.push(args.content); }
      if (args.category) { updates.push('category = ?'); values.push(args.category); }
      
      if (updates.length === 0) {
        return { success: false, error: '没有要更新的内容' };
      }
      
      values.push(args.noteId);
      runQuery(`UPDATE notes SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, values);
      saveDatabase();
      return { success: true, message: '笔记更新成功' };
    }

    case 'delete_note': {
      runQuery('DELETE FROM notes WHERE id = ?', [args.noteId]);
      saveDatabase();
      return { success: true, message: '笔记删除成功' };
    }

    // ========== 任务管理 ==========
    case 'get_tasks': {
      const statusFilter = args.status && args.status !== 'all' ? `AND status = '${args.status}'` : '';
      const tasks = getAll<any>(
        `SELECT * FROM tasks WHERE user_id = ? ${statusFilter} ORDER BY created_at DESC`,
        [userId]
      );
      return { success: true, tasks };
    }

    case 'create_task': {
      const id = uuidv4();
      const priority = args.priority || 'medium';
      const status = 'pending';

      runQuery(
        `INSERT INTO tasks (id, user_id, title, description, priority, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, userId, args.title, args.description || '', priority, status]
      );
      saveDatabase();
      return { success: true, taskId: id, message: '任务创建成功' };
    }

    case 'complete_task': {
      runQuery("UPDATE tasks SET status = 'completed', updated_at = datetime('now') WHERE id = ?", [args.taskId]);
      saveDatabase();
      return { success: true, message: '任务已完成' };
    }

    case 'delete_task': {
      runQuery('DELETE FROM tasks WHERE id = ?', [args.taskId]);
      saveDatabase();
      return { success: true, message: '任务删除成功' };
    }

    // ========== 标签管理 ==========
    case 'get_tags': {
      const tags = getAll<any>(`SELECT * FROM tags ORDER BY name`);
      return { success: true, tags };
    }

    case 'get_notes_by_tag': {
      const notes = getAll<any>(
        `SELECT n.* FROM notes n
         JOIN note_tags nt ON n.id = nt.note_id
         JOIN tags t ON nt.tag_id = t.id
         WHERE t.name = ?
         ORDER BY n.timestamp DESC`,
        [args.tag]
      );
      return { success: true, notes };
    }

    // ========== 知识图谱 ==========
    case 'get_graph': {
      const nodes = getAll<any>(`SELECT * FROM notes WHERE user_id = ? LIMIT 50`, [userId]);
      const links = getAll<any>(`SELECT * FROM note_links`);
      return { success: true, nodes, links };
    }

    case 'get_related_notes': {
      const links = getAll<any>(
        `SELECT target_note_id FROM note_links WHERE source_note_id = ?
         UNION
         SELECT source_note_id FROM note_links WHERE target_note_id = ?`,
        [args.noteId, args.noteId]
      );
      const relatedIds = links.map((l: any) => l.target_note_id || l.source_note_id);
      if (relatedIds.length === 0) return { success: true, notes: [] };
      
      const notes = getAll<any>(
        `SELECT * FROM notes WHERE id IN (${relatedIds.map(() => '?').join(',')})`,
        relatedIds
      );
      return { success: true, notes };
    }

    // ========== 知识库搜索 ==========
    case 'search_knowledge': {
      const { semanticSearch } = await import('./rag.js');
      const results = await semanticSearch(args.query, args.topK || 3);
      return { success: true, results };
    }

    // ========== 内容分析 ==========
    case 'analyze_content': {
      const wordCount = args.content.split(/\s+/).length;
      const charCount = args.content.length;
      return {
        success: true,
        analysis: { wordCount, charCount, preview: args.content.slice(0, 100) }
      };
    }

    // ========== AI 写作 ==========
    case 'improve_writing': {
      const style = args.style || 'creative';
      const improved = `【改进风格: ${style}】\n\n${args.content}\n\n[AI 写作改进功能待接入...]`;
      return { success: true, improved, message: '写作改进功能待接入 AI 服务' };
    }

    // ========== 统计信息 ==========
    case 'get_statistics': {
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
          tags: tagCount?.count || 0
        }
      };
    }

    // ========== 时间线 ==========
    case 'get_timeline': {
      const days = args.days || 30;
      const notes = getAll<any>(
        `SELECT id, title, category, timestamp FROM notes 
         WHERE user_id = ? AND timestamp >= datetime('now', '-${days} days')
         ORDER BY timestamp DESC`,
        [userId]
      );
      return { success: true, notes };
    }

    // ========== 联网检索 ==========
    case 'fetch_web_content': {
      try {
        const { url, type = 'general' } = args;
        
        if (!url) {
          return { success: false, error: '请提供URL地址' };
        }

        let fetchUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          fetchUrl = 'https://' + url;
        }

        const response = await fetch(fetchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (!response.ok) {
          return { success: false, error: `请求失败: ${response.status} ${response.statusText}` };
        }

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
          type,
          title: extractTitle(html) || url,
          content: content.slice(0, 8000),
          contentLength: content.length
        };
      } catch (error: any) {
        return { success: false, error: `获取网页失败: ${error.message}` };
      }
    }

    case 'search_web': {
      try {
        const { query, limit = 5 } = args;

        if (!query) {
          return { success: false, error: '请提供搜索关键词' };
        }

        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          return { success: false, error: '搜索请求失败' };
        }

        const html = await response.text();
        const results = parseSearchResults(html, limit);

        return {
          success: true,
          query,
          results,
          total: results.length
        };
      } catch (error: any) {
        return { success: false, error: `搜索失败: ${error.message}` };
      }
    }

    // ========== 社交媒体发布 ==========
    case 'publish_to_social': {
      try {
        const { video_path, platforms, title, tags, schedule } = args;

        if (!video_path) {
          return { success: false, error: '请提供视频文件路径' };
        }

        if (!platforms || platforms.length === 0) {
          return { success: false, error: '请选择至少一个发布平台' };
        }

        const { publishService } = await import('../publish/index.js');

        const result = await publishService.publishVideo({
          videoPath: video_path,
          title: title || '',
          tags: tags || [],
          platforms,
          scheduledAt: schedule
        });

        return result;
      } catch (error: any) {
        return { success: false, error: `发布失败: ${error.message}` };
      }
    }

    case 'get_publish_accounts': {
      const accounts = getAll<any>(
        'SELECT id, platform, account_name, status, created_at FROM social_accounts WHERE user_id = ?',
        [userId]
      );
      return {
        success: true,
        accounts: accounts.map((acc: any) => ({
          id: acc.id,
          platform: acc.platform,
          accountName: acc.account_name,
          status: acc.status
        }))
      };
    }

    case 'get_supported_platforms': {
      return {
        success: true,
        platforms: [
          { id: 'douyin', name: '抖音', icon: '🎵' },
          { id: 'xhs', name: '小红书', icon: '📕' },
          { id: 'bilibili', name: 'B站', icon: '📺' },
          { id: 'ks', name: '快手', icon: '📹' },
          { id: 'tencent', name: '视频号', icon: '💬' },
          { id: 'baijiahao', name: '百家号', icon: '📰' },
          { id: 'tiktok', name: 'TikTok', icon: '🌐' }
        ]
      };
    }

    case 'get_publish_tasks': {
      const statusFilter = args.status ? `AND status = '${args.status}'` : '';
      const tasks = getAll<any>(
        `SELECT id, video_path, title, platforms, status, scheduled_at, published_at, created_at
         FROM publish_tasks WHERE user_id = ? ${statusFilter} ORDER BY created_at DESC LIMIT 20`,
        [userId]
      );
      return {
        success: true,
        tasks: tasks.map((task: any) => ({
          id: task.id,
          videoPath: task.video_path,
          title: task.title,
          platforms: JSON.parse(task.platforms),
          status: task.status,
          scheduledAt: task.scheduled_at,
          publishedAt: task.published_at,
          createdAt: task.created_at
        }))
      };
    }

    default:
      return { success: false, error: `未知技能: ${skillName}` };
  }
}
