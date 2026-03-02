/**
 * Notion Integration Service
 * Deep sync: read/write/search Notion pages from Vicoo.
 */

import { Client } from '@notionhq/client';
import { getOne, runQuery, saveDatabase } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

// --- Token management ---

export function getNotionToken(userId: string): string | null {
  const row = getOne<any>(
    "SELECT value FROM settings WHERE key = ? AND user_id = ?",
    [`notion_token_${userId}`, userId]
  );
  return row?.value || null;
}

export function saveNotionToken(userId: string, token: string, workspaceName?: string) {
  const key = `notion_token_${userId}`;
  const existing = getOne<any>("SELECT key FROM settings WHERE key = ?", [key]);
  if (existing) {
    runQuery("UPDATE settings SET value = ? WHERE key = ?", [token, key]);
  } else {
    runQuery("INSERT INTO settings (key, value, user_id) VALUES (?, ?, ?)", [key, token, userId]);
  }
  if (workspaceName) {
    const wsKey = `notion_workspace_${userId}`;
    const ex2 = getOne<any>("SELECT key FROM settings WHERE key = ?", [wsKey]);
    if (ex2) runQuery("UPDATE settings SET value = ? WHERE key = ?", [workspaceName, wsKey]);
    else runQuery("INSERT INTO settings (key, value, user_id) VALUES (?, ?, ?)", [wsKey, workspaceName, userId]);
  }
  saveDatabase();
}

export function clearNotionToken(userId: string) {
  runQuery("DELETE FROM settings WHERE key LIKE ? AND user_id = ?", [`notion_%_${userId}`, userId]);
  saveDatabase();
}

// --- Client factory ---

function getClient(userId: string): Client | null {
  const token = getNotionToken(userId);
  if (!token) return null;
  return new Client({ auth: token, notionVersion: '2025-09-03' });
}

// --- Search ---

export async function searchNotion(userId: string, query: string, limit = 10): Promise<any[]> {
  const client = getClient(userId);
  if (!client) throw new Error('Notion 未连接');

  const res = await client.search({
    query,
    page_size: limit,
    sort: { direction: 'descending', timestamp: 'last_edited_time' },
  });

  return res.results.map((page: any) => ({
    id: page.id,
    type: page.object, // 'page' or 'data_source' (v2025-09-03)
    title: extractTitle(page),
    url: page.url,
    lastEdited: page.last_edited_time,
    icon: page.icon?.emoji || page.icon?.external?.url || null,
    cover: page.cover?.external?.url || page.cover?.file?.url || null,
  }));
}

// --- Read page ---

export async function getNotionPage(userId: string, pageId: string): Promise<any> {
  const client = getClient(userId);
  if (!client) throw new Error('Notion 未连接');

  const page = await client.pages.retrieve({ page_id: pageId });
  const blocks = await client.blocks.children.list({ block_id: pageId, page_size: 100 });

  const content = blocks.results.map((block: any) => blockToMarkdown(block)).filter(Boolean).join('\n\n');

  return {
    id: (page as any).id,
    title: extractTitle(page),
    content,
    url: (page as any).url,
    lastEdited: (page as any).last_edited_time,
    properties: (page as any).properties,
    icon: (page as any).icon?.emoji || null,
  };
}

// --- List pages ---

export async function listNotionPages(userId: string, limit = 20): Promise<any[]> {
  const client = getClient(userId);
  if (!client) throw new Error('Notion 未连接');

  const res = await client.search({
    filter: { property: 'object', value: 'page' },
    page_size: limit,
    sort: { direction: 'descending', timestamp: 'last_edited_time' },
  });

  return res.results.map((page: any) => ({
    id: page.id,
    title: extractTitle(page),
    url: page.url,
    lastEdited: page.last_edited_time,
    icon: page.icon?.emoji || null,
    parent: page.parent,
  }));
}

// --- Create page ---

export async function createNotionPage(userId: string, title: string, content: string, parentId?: string, parentType?: 'page' | 'data_source'): Promise<any> {
  const client = getClient(userId);
  if (!client) throw new Error('Notion 未连接');

  const children = markdownToBlocks(content);

  // Determine parent (v2025-09-03: data_source_id for database pages)
  let parent: any;
  if (parentId && parentType === 'data_source') {
    parent = { type: 'data_source_id', data_source_id: parentId };
  } else if (parentId) {
    parent = { type: 'page_id', page_id: parentId };
  } else {
    // Find first available page as parent
    const pages = await client.search({ filter: { property: 'object', value: 'page' }, page_size: 1 });
    if (pages.results.length > 0) {
      parent = { type: 'page_id', page_id: (pages.results[0] as any).id };
    } else {
      throw new Error('Notion 中没有可用的父级页面，请先在 Notion 中创建一个页面');
    }
  }

  const page = await client.pages.create({
    parent,
    properties: {
      title: { title: [{ text: { content: title } }] },
    },
    children,
  } as any);

  return {
    id: (page as any).id,
    title,
    url: (page as any).url,
  };
}

// --- Update page content ---

export async function updateNotionPage(userId: string, pageId: string, content: string): Promise<void> {
  const client = getClient(userId);
  if (!client) throw new Error('Notion 未连接');

  // Delete existing blocks
  const existing = await client.blocks.children.list({ block_id: pageId, page_size: 100 });
  for (const block of existing.results) {
    try { await client.blocks.delete({ block_id: (block as any).id }); } catch (_) {}
  }

  // Add new blocks
  const children = markdownToBlocks(content);
  if (children.length > 0) {
    await client.blocks.children.append({ block_id: pageId, children });
  }
}

// --- Sync Vicoo note TO Notion ---

export async function syncToNotion(userId: string, noteId: string): Promise<any> {
  const note = getOne<any>('SELECT * FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]);
  if (!note) throw new Error('笔记不存在');

  const result = await createNotionPage(userId, note.title, note.content || note.snippet || '');

  // Store the Notion page ID mapping
  runQuery(
    "INSERT OR REPLACE INTO settings (key, value, user_id) VALUES (?, ?, ?)",
    [`notion_sync_${noteId}`, result.id, userId]
  );
  saveDatabase();

  return result;
}

// --- Sync Notion page TO Vicoo ---

export async function syncFromNotion(userId: string, notionPageId: string): Promise<any> {
  const page = await getNotionPage(userId, notionPageId);

  const id = uuidv4();
  runQuery(
    `INSERT INTO notes (id, user_id, title, content, snippet, category, status, timestamp)
     VALUES (?, ?, ?, ?, ?, 'idea', 'inbox', datetime('now'))`,
    [id, userId, page.title, page.content, (page.content || '').slice(0, 120)]
  );
  saveDatabase();

  return { id, title: page.title, notionId: notionPageId };
}

// --- Helpers ---

function extractTitle(page: any): string {
  const props = page.properties || {};
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === 'title' && prop.title?.length > 0) {
      return prop.title.map((t: any) => t.plain_text).join('');
    }
  }
  return 'Untitled';
}

function blockToMarkdown(block: any): string {
  const type = block.type;
  const getText = (rich: any[]) => (rich || []).map((t: any) => {
    let text = t.plain_text || '';
    if (t.annotations?.bold) text = `**${text}**`;
    if (t.annotations?.italic) text = `*${text}*`;
    if (t.annotations?.code) text = `\`${text}\``;
    if (t.annotations?.strikethrough) text = `~~${text}~~`;
    return text;
  }).join('');

  switch (type) {
    case 'paragraph': return getText(block.paragraph?.rich_text);
    case 'heading_1': return `# ${getText(block.heading_1?.rich_text)}`;
    case 'heading_2': return `## ${getText(block.heading_2?.rich_text)}`;
    case 'heading_3': return `### ${getText(block.heading_3?.rich_text)}`;
    case 'bulleted_list_item': return `- ${getText(block.bulleted_list_item?.rich_text)}`;
    case 'numbered_list_item': return `1. ${getText(block.numbered_list_item?.rich_text)}`;
    case 'to_do': return `- [${block.to_do?.checked ? 'x' : ' '}] ${getText(block.to_do?.rich_text)}`;
    case 'toggle': return `> ${getText(block.toggle?.rich_text)}`;
    case 'quote': return `> ${getText(block.quote?.rich_text)}`;
    case 'callout': return `> ${block.callout?.icon?.emoji || '💡'} ${getText(block.callout?.rich_text)}`;
    case 'code': return `\`\`\`${block.code?.language || ''}\n${getText(block.code?.rich_text)}\n\`\`\``;
    case 'divider': return '---';
    case 'image': return `![image](${block.image?.file?.url || block.image?.external?.url || ''})`;
    case 'bookmark': return `[${block.bookmark?.url}](${block.bookmark?.url})`;
    default: return '';
  }
}

function markdownToBlocks(markdown: string): any[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const blocks: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('### ')) {
      blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: trimmed.slice(4) } }] } });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: trimmed.slice(3) } }] } });
    } else if (trimmed.startsWith('# ')) {
      blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: [{ text: { content: trimmed.slice(2) } }] } });
    } else if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [ ] ')) {
      blocks.push({ object: 'block', type: 'to_do', to_do: { rich_text: [{ text: { content: trimmed.slice(6) } }], checked: trimmed.startsWith('- [x]') } });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: trimmed.slice(2) } }] } });
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({ object: 'block', type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: trimmed.replace(/^\d+\.\s/, '') } }] } });
    } else if (trimmed.startsWith('> ')) {
      blocks.push({ object: 'block', type: 'quote', quote: { rich_text: [{ text: { content: trimmed.slice(2) } }] } });
    } else if (trimmed === '---') {
      blocks.push({ object: 'block', type: 'divider', divider: {} });
    } else if (trimmed.startsWith('```')) {
      // Skip code block markers (simplified)
      continue;
    } else {
      blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: trimmed } }] } });
    }
  }

  return blocks;
}
