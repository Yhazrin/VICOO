/**
 * MCP 服务层
 * 处理 MCP 服务器和工具的 CRUD 操作
 */

import { runQuery, getOne, getAll, getChanges } from '../db/index.js';

// MCP 服务器类型
export interface MCPServer {
  id: string;
  user_id: string;
  name: string;
  type: 'builtin' | 'mcp' | 'custom';
  description: string | null;
  icon: string;
  command: string | null;
  args: string;  // JSON string
  env: string;  // JSON string
  url: string | null;
  enabled: number;
  config: string;  // JSON string
  created_at: string;
  updated_at: string;
}

// MCP 工具类型
export interface MCPTool {
  id: string;
  server_id: string;
  mcp_tool_name: string;
  vicoo_tool_name: string | null;
  description: string | null;
  input_schema: string;  // JSON string
  enabled: number;
  created_at: string;
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 获取用户的所有 MCP 服务器
 */
export function getMCPServers(userId: string = 'dev_user_1'): MCPServer[] {
  const sql = `
    SELECT * FROM mcp_servers
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;
  return getAll<MCPServer>(sql, [userId]);
}

/**
 * 获取单个 MCP 服务器
 */
export function getMCPServer(id: string): MCPServer | undefined {
  const sql = 'SELECT * FROM mcp_servers WHERE id = ?';
  return getOne<MCPServer>(sql, [id]);
}

/**
 * 创建 MCP 服务器
 */
export function createMCPServer(
  data: {
    name: string;
    type: 'builtin' | 'mcp' | 'custom';
    description?: string;
    icon?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    config?: Record<string, any>;
    userId?: string;
  }
): MCPServer {
  const id = generateId();
  const userId = data.userId || 'dev_user_1';

  const sql = `
    INSERT INTO mcp_servers (
      id, user_id, name, type, description, icon,
      command, args, env, url, config
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  runQuery(sql, [
    id,
    userId,
    data.name,
    data.type,
    data.description || null,
    data.icon || '🔌',
    data.command || null,
    JSON.stringify(data.args || []),
    JSON.stringify(data.env || {}),
    data.url || null,
    JSON.stringify(data.config || {})
  ]);

  return getMCPServer(id)!;
}

/**
 * 更新 MCP 服务器
 */
export function updateMCPServer(
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    enabled?: boolean;
    config?: Record<string, any>;
  }
): MCPServer | undefined {
  const server = getMCPServer(id);
  if (!server) return undefined;

  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.icon !== undefined) {
    updates.push('icon = ?');
    values.push(data.icon);
  }
  if (data.command !== undefined) {
    updates.push('command = ?');
    values.push(data.command);
  }
  if (data.args !== undefined) {
    updates.push('args = ?');
    values.push(JSON.stringify(data.args));
  }
  if (data.env !== undefined) {
    updates.push('env = ?');
    values.push(JSON.stringify(data.env));
  }
  if (data.url !== undefined) {
    updates.push('url = ?');
    values.push(data.url);
  }
  if (data.enabled !== undefined) {
    updates.push('enabled = ?');
    values.push(data.enabled ? 1 : 0);
  }
  if (data.config !== undefined) {
    updates.push('config = ?');
    values.push(JSON.stringify(data.config));
  }

  if (updates.length === 0) return server;

  updates.push("updated_at = datetime('now')");
  values.push(id);

  const sql = `UPDATE mcp_servers SET ${updates.join(', ')} WHERE id = ?`;
  runQuery(sql, values);

  return getMCPServer(id);
}

/**
 * 删除 MCP 服务器
 */
export function deleteMCPServer(id: string): boolean {
  const sql = 'DELETE FROM mcp_servers WHERE id = ?';
  runQuery(sql, [id]);
  return getChanges() > 0;
}

/**
 * 切换 MCP 服务器启用状态
 */
export function toggleMCPServer(id: string, enabled: boolean): MCPServer | undefined {
  return updateMCPServer(id, { enabled });
}

/**
 * 获取 MCP 服务器的工具列表
 */
export function getMCPTools(serverId: string): MCPTool[] {
  const sql = `
    SELECT * FROM mcp_tools
    WHERE server_id = ?
    ORDER BY mcp_tool_name ASC
  `;
  return getAll<MCPTool>(sql, [serverId]);
}

/**
 * 创建 MCP 工具
 */
export function createMCPTool(
  data: {
    server_id: string;
    mcp_tool_name: string;
    vicoo_tool_name?: string;
    description?: string;
    input_schema?: Record<string, any>;
  }
): MCPTool {
  const id = generateId();

  const sql = `
    INSERT INTO mcp_tools (
      id, server_id, mcp_tool_name, vicoo_tool_name, description, input_schema
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  runQuery(sql, [
    id,
    data.server_id,
    data.mcp_tool_name,
    data.vicoo_tool_name || null,
    data.description || null,
    JSON.stringify(data.input_schema || {})
  ]);

  const result = getOne<MCPTool>('SELECT * FROM mcp_tools WHERE id = ?', [id]);
  return result!;
}

/**
 * 删除 MCP 工具
 */
export function deleteMCPTool(id: string): boolean {
  const sql = 'DELETE FROM mcp_tools WHERE id = ?';
  runQuery(sql, [id]);
  return getChanges() > 0;
}

/**
 * 获取所有启用的 MCP 服务器
 */
export function getEnabledMCPServers(userId: string = 'dev_user_1'): MCPServer[] {
  const sql = `
    SELECT * FROM mcp_servers
    WHERE user_id = ? AND enabled = 1
    ORDER BY created_at DESC
  `;
  return getAll<MCPServer>(sql, [userId]);
}

/**
 * 初始化内置 MCP 服务器
 */
export function initializeBuiltinMCPServers(userId: string = 'dev_user_1'): void {
  // 检查是否已有内置服务器
  const existing = getMCPServers(userId);
  const hasBuiltin = existing.some(s => s.type === 'builtin');

  if (hasBuiltin) return;

  // 创建内置技能
  const builtinServers = [
    {
      name: '笔记管理',
      type: 'builtin' as const,
      description: '搜索、创建、编辑、删除笔记',
      icon: '📝',
      command: null,
      args: [],
      env: {},
      url: null,
      config: {
        skills: ['search_notes', 'create_note', 'update_note', 'delete_note', 'get_note']
      }
    },
    {
      name: '任务管理',
      type: 'builtin' as const,
      description: '查看和管理待办事项',
      icon: '✅',
      command: null,
      args: [],
      env: {},
      url: null,
      config: {
        skills: ['get_tasks', 'create_task', 'complete_task', 'delete_task']
      }
    },
    {
      name: '标签管理',
      type: 'builtin' as const,
      description: '管理和搜索标签',
      icon: '🏷️',
      command: null,
      args: [],
      env: {},
      url: null,
      config: {
        skills: ['get_tags', 'get_notes_by_tag']
      }
    },
    {
      name: '知识图谱',
      type: 'builtin' as const,
      description: '查看笔记关联和知识网络',
      icon: '🕸️',
      command: null,
      args: [],
      env: {},
      url: null,
      config: {
        skills: ['get_graph', 'get_related_notes']
      }
    },
    {
      name: '联网搜索',
      type: 'builtin' as const,
      description: '搜索互联网和获取网页内容',
      icon: '🌐',
      command: null,
      args: [],
      env: {},
      url: null,
      config: {
        skills: ['search_web', 'fetch_web_content']
      }
    }
  ];

  for (const server of builtinServers) {
    createMCPServer({
      ...server,
      userId,
      enabled: true
    });
  }

  console.log('[MCP] Initialized builtin servers');
}

export default {
  getMCPServers,
  getMCPServer,
  createMCPServer,
  updateMCPServer,
  deleteMCPServer,
  toggleMCPServer,
  getMCPTools,
  createMCPTool,
  deleteMCPTool,
  getEnabledMCPServers,
  initializeBuiltinMCPServers
};
