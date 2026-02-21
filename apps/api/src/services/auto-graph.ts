/**
 * 后台知识图谱自动生成服务
 * 自动检测未生成节点的笔记，并调用 Claude Code 生成知识图谱
 */

import { getAll, runQuery, saveDatabase } from '../db/index.js';
import { callClaudeCode, generateKnowledgeGraphPrompt } from './claude-code.js';
import { v4 as uuidv4 } from 'uuid';

// 配置
const CONFIG = {
  CHECK_INTERVAL: 5 * 60 * 1000, // 每5分钟检查一次
  BATCH_SIZE: 10, // 每次最多处理的笔记数量
  MIN_NOTES_TO_GENERATE: 3, // 至少需要多少笔记才开始生成
  ENABLE_AUTO_GENERATE: process.env.ENABLE_AUTO_GRAPH !== 'false', // 默认启用
};

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

/**
 * 获取未生成节点的笔记
 */
function getUnlinkedNotes(userId: string): any[] {
  return getAll<any>(
    `SELECT n.id, n.title, n.content, n.timestamp
     FROM notes n
     LEFT JOIN nodes node ON node.linked_note_id = n.id
     WHERE n.user_id = ? AND node.id IS NULL
     ORDER BY n.timestamp DESC
     LIMIT ?`,
    [userId, CONFIG.BATCH_SIZE]
  );
}

/**
 * 获取笔记的标签
 */
function getNoteTags(noteId: string): string[] {
  return getAll<{ name: string }>(
    `SELECT t.name FROM tags t
     JOIN note_tags nt ON t.id = nt.tag_id
     WHERE nt.note_id = ?`,
    [noteId]
  ).map(t => t.name);
}

/**
 * 为单个笔记生成节点
 */
async function generateNodeForNote(
  note: { id: string; title: string; content: string },
  tags: string[]
): Promise<{ success: boolean; nodeId?: string; error?: string }> {
  try {
    // 为笔记生成一个简洁的节点
    const nodeLabel = note.title.length > 20 
      ? note.title.substring(0, 20) + '...' 
      : note.title;

    // 简单描述取内容的前100个字符
    const description = note.content.substring(0, 100).replace(/[#*`]/g, '');

    // 根据分类或标签选择颜色
    const colors = ['#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#073B4C', '#8338EC'];
    const color = colors[Math.abs(note.id.charCodeAt(0)) % colors.length];

    const id = uuidv4();
    const x = Math.random() * 800 - 400;
    const y = Math.random() * 600 - 300;

    runQuery(
      `INSERT INTO nodes (id, x, y, label, type, color, icon, description, linked_note_id, created_at)
       VALUES (?, ?, ?, ?, 'planet', ?, 'circle', ?, ?, datetime('now'))`,
      [id, x, y, nodeLabel, color, description, note.id]
    );

    console.log(`[AutoGraph] Created node for note: ${note.title}`);
    return { success: true, nodeId: id };
  } catch (error: any) {
    console.error(`[AutoGraph] Failed to create node for note ${note.id}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 从所有笔记生成完整的知识图谱（包含关联）
 */
async function generateFullGraphFromNotes(userId: string): Promise<{
  success: boolean;
  nodesCreated: number;
  linksCreated: number;
  error?: string;
}> {
  try {
    // 获取所有笔记（包括已有节点的）
    const notes = getAll<any>(
      `SELECT id, title, content FROM notes WHERE user_id = ? ORDER BY timestamp DESC`,
      [userId]
    );

    if (notes.length < CONFIG.MIN_NOTES_TO_GENERATE) {
      console.log(`[AutoGraph] Not enough notes (${notes.length}) to generate graph, need at least ${CONFIG.MIN_NOTES_TO_GENERATE}`);
      return { success: true, nodesCreated: 0, linksCreated: 0 };
    }

    console.log(`[AutoGraph] Starting full graph generation from ${notes.length} notes...`);

    // 获取笔记标签
    const notesWithTags = notes.map((note: any) => ({
      ...note,
      tags: getNoteTags(note.id)
    }));

    // 调用 Claude Code 生成知识图谱
    const prompt = generateKnowledgeGraphPrompt(notesWithTags);
    const result = await callClaudeCode(prompt, { timeout: 5 * 60 * 1000 });

    if (result.nodes.length === 0) {
      console.log(`[AutoGraph] Claude returned no nodes`);
      return { success: true, nodesCreated: 0, linksCreated: 0 };
    }

    // 清除现有节点和关联（可选）
    // runQuery('DELETE FROM links');
    // runQuery('DELETE FROM nodes');

    // 存储节点
    const nodeIdMap = new Map<string, string>();
    let nodesCreated = 0;

    for (const node of result.nodes) {
      const id = uuidv4();
      const x = Math.random() * 800 - 400;
      const y = Math.random() * 600 - 300;

      // 尝试匹配笔记
      const matchedNote = notesWithTags.find((n: any) =>
        n.title.toLowerCase().includes(node.label.toLowerCase().substring(0, 5)) ||
        node.label.toLowerCase().includes(n.title.toLowerCase().substring(0, 5))
      );

      runQuery(
        `INSERT INTO nodes (id, x, y, label, type, color, icon, description, linked_note_id, created_at)
         VALUES (?, ?, ?, ?, 'planet', ?, 'circle', ?, ?, datetime('now'))`,
        [id, x, y, node.label, node.color, node.description, matchedNote?.id || null]
      );

      nodeIdMap.set(node.label, id);
      nodesCreated++;
    }

    // 存储关联
    let linksCreated = 0;
    for (const link of result.links) {
      const sourceId = nodeIdMap.get(link.source);
      const targetId = nodeIdMap.get(link.target);

      if (sourceId && targetId) {
        const linkId = uuidv4();
        runQuery(
          'INSERT INTO links (id, source, target, type) VALUES (?, ?, ?, ?)',
          [linkId, sourceId, targetId, 'solid']
        );
        linksCreated++;
      }
    }

    saveDatabase();

    console.log(`[AutoGraph] Generated ${nodesCreated} nodes and ${linksCreated} links`);
    return { success: true, nodesCreated, linksCreated };

  } catch (error: any) {
    console.error(`[AutoGraph] Error generating graph:`, error);
    return { success: false, nodesCreated: 0, linksCreated: 0, error: error.message };
  }
}

/**
 * 检查并自动生成知识图谱
 */
async function checkAndGenerateGraph(): Promise<void> {
  if (isRunning) {
    console.log('[AutoGraph] Previous run still in progress, skipping...');
    return;
  }

  isRunning = true;

  try {
    const userId = 'dev_user_1';

    // 检查是否有足够的未处理笔记
    const unlinkedNotes = getUnlinkedNotes(userId);
    console.log(`[AutoGraph] Found ${unlinkedNotes.length} unlinked notes`);

    if (unlinkedNotes.length >= CONFIG.MIN_NOTES_TO_GENERATE) {
      // 有足够的新笔记，生成完整图谱
      const result = await generateFullGraphFromNotes(userId);
      if (result.success && result.nodesCreated > 0) {
        console.log(`[AutoGraph] Auto-generated graph: ${result.nodesCreated} nodes, ${result.linksCreated} links`);
      }
    } else if (unlinkedNotes.length > 0) {
      // 笔记不够，但有未关联的，先单独创建节点
      console.log(`[AutoGraph] ${unlinkedNotes.length} unlinked notes, creating individual nodes...`);
      
      for (const note of unlinkedNotes) {
        const tags = getNoteTags(note.id);
        await generateNodeForNote(note, tags);
      }
      
      saveDatabase();
      console.log(`[AutoGraph] Created ${unlinkedNotes.length} individual nodes`);
    }

  } catch (error: any) {
    console.error('[AutoGraph] Error in checkAndGenerateGraph:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * 启动后台任务
 */
export function startAutoGraphService(): void {
  if (!CONFIG.ENABLE_AUTO_GENERATE) {
    console.log('[AutoGraph] Auto graph generation is disabled');
    return;
  }

  console.log(`[AutoGraph] Starting auto graph service (interval: ${CONFIG.CHECK_INTERVAL / 1000}s)...`);
  
  // 立即执行一次
  setTimeout(checkAndGenerateGraph, 5000);

  // 设置定期检查
  intervalId = setInterval(checkAndGenerateGraph, CONFIG.CHECK_INTERVAL);
}

/**
 * 停止后台任务
 */
export function stopAutoGraphService(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[AutoGraph] Auto graph service stopped');
  }
}

/**
 * 手动触发一次生成（用于调试或手动刷新）
 */
export async function triggerGraphGeneration(): Promise<{
  success: boolean;
  nodesCreated: number;
  linksCreated: number;
  error?: string;
}> {
  const userId = 'dev_user_1';
  const unlinkedNotes = getUnlinkedNotes(userId);
  
  if (unlinkedNotes.length < CONFIG.MIN_NOTES_TO_GENERATE) {
    return { 
      success: false, 
      nodesCreated: 0, 
      linksCreated: 0, 
      error: `笔记数量不足 (${unlinkedNotes.length}/${CONFIG.MIN_NOTES_TO_GENERATE})` 
    };
  }

  return generateFullGraphFromNotes(userId);
}

export default {
  startAutoGraphService,
  stopAutoGraphService,
  triggerGraphGeneration,
};
