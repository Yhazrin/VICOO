/**
 * 简单的 MCP 服务器初始化
 * 直接插入数据库，无需运行服务
 */

import { getAll, runQuery, initDatabase } from '../db/index.js';

// MCP 服务器数据
const mcpServers = [
  {
    id: 'mcp_filesystem_001',
    name: '文件系统',
    type: 'mcp',
    description: '读取、写入和管理本地文件',
    icon: '📁',
    command: 'npx',
    args: '["-y", "@modelcontextprotocol/server-filesystem", "./"]',
    env: '{}',
    url: null,
    config: '{"allowedDirectories": ["."]}',
    enabled: 0
  },
  {
    id: 'mcp_github_001',
    name: 'GitHub',
    type: 'mcp',
    description: 'GitHub API 操作',
    icon: '🐙',
    command: 'npx',
    args: '["-y", "@modelcontextprotocol/server-github"]',
    env: '{}',
    url: null,
    config: '{}',
    enabled: 0
  },
  {
    id: 'mcp_brave_001',
    name: 'Brave 搜索',
    type: 'mcp',
    description: '使用 Brave 搜索引擎进行网络搜索',
    icon: '🦁',
    command: 'npx',
    args: '["-y", "@modelcontextprotocol/server-brave-search"]',
    env: '{"BRAVE_API_KEY": ""}',
    url: null,
    config: '{}',
    enabled: 0
  },
  {
    id: 'mcp_postgres_001',
    name: 'PostgreSQL',
    type: 'mcp',
    description: '连接和查询 PostgreSQL 数据库',
    icon: '🐘',
    command: 'npx',
    args: '["-y", "@modelcontextprotocol/server-postgres"]',
    env: '{}',
    url: null,
    config: '{"connectionString": ""}',
    enabled: 0
  },
  {
    id: 'mcp_time_001',
    name: '时间工具',
    type: 'mcp',
    description: '获取当前时间、时区转换等',
    icon: '⏰',
    command: 'npx',
    args: '["-y", "@modelcontextprotocol/server-time"]',
    env: '{}',
    url: null,
    config: '{}',
    enabled: 0
  },
  {
    id: 'mcp_memory_001',
    name: '内存存储',
    type: 'mcp',
    description: '键值存储，用于跨会话保存数据',
    icon: '💾',
    command: 'npx',
    args: '["-y", "@modelcontextprotocol/server-memory"]',
    env: '{}',
    url: null,
    config: '{}',
    enabled: 0
  }
];

const userId = 'dev_user_1';

async function initMCPServers() {
  console.log('[MCP] Initializing MCP servers...');

  // Initialize database first
  await initDatabase();

  // 先清理旧的 MCP 记录（使用错误用户ID的）
  try {
    runQuery("DELETE FROM mcp_servers WHERE user_id = 'dev_user_001'", []);
    console.log('[MCP] Cleaned up old MCP records');
  } catch (e) {
    // 忽略错误
  }

  for (const server of mcpServers) {
    try {
      // 检查是否已存在
      const existing = getAll('SELECT id FROM mcp_servers WHERE id = ?', [server.id]);

      if (existing.length > 0) {
        console.log(`[MCP] Already exists: ${server.name}`);
        continue;
      }

      const sql = `
        INSERT INTO mcp_servers (
          id, user_id, name, type, description, icon,
          command, args, env, url, config, enabled,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      runQuery(sql, [
        server.id,
        userId,
        server.name,
        server.type,
        server.description,
        server.icon,
        server.command,
        server.args,
        server.env,
        server.url,
        server.config,
        server.enabled
      ]);

      console.log(`[MCP] Added: ${server.name}`);
    } catch (error) {
      console.error(`[MCP] Error adding ${server.name}:`, error);
    }
  }

  console.log('[MCP] Done!');
}

initMCPServers().catch(console.error);
