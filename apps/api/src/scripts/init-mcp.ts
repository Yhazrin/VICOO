/**
 * MCP 服务器初始化脚本
 * 用于添加推荐的 MCP 服务器到数据库
 */

import { createMCPServer } from '../services/mcp.js';

const userId = 'dev_user_1';

/**
 * 推荐的 MCP 服务器配置
 */
const recommendedMCPs = [
  {
    name: '文件系统',
    type: 'mcp' as const,
    description: '读取、写入和管理本地文件',
    icon: '📁',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', './'],
    env: {},
    url: null,
    config: {
      allowedDirectories: ['.']
    }
  },
  {
    name: 'Git',
    type: 'mcp' as const,
    description: '执行 Git 操作（查看状态、提交、日志等）',
    icon: '🔀',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {},
    url: null,
    config: {
      repository: 'https://github.com/Yhazrin/vicoo'
    }
  },
  {
    name: 'Brave 搜索',
    type: 'mcp' as const,
    description: '使用 Brave 搜索引擎进行网络搜索',
    icon: '🦁',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: {
      BRAVE_API_KEY: ''
    },
    url: null,
    config: {}
  },
  {
    name: '数据库',
    type: 'mcp' as const,
    description: '探索和查询 SQLite 数据库',
    icon: '🗄️',
    command: 'npx',
    args: ['-y', 'mcp-server-dbraver'],
    env: {},
    url: null,
    config: {
      dbPath: './data/vicoo.db'
    }
  },
  {
    name: '浏览器自动化',
    type: 'mcp' as const,
    description: '使用 Playwright 进行浏览器自动化操作',
    icon: '🌐',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-playwright'],
    env: {},
    url: null,
    config: {}
  },
  {
    name: 'Puppeteer',
    type: 'mcp' as const,
    description: '使用 Puppeteer 控制浏览器',
    icon: '🕸️',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    env: {},
    url: null,
    config: {}
  },
  {
    name: '时间工具',
    type: 'mcp' as const,
    description: '获取当前时间、时区转换等',
    icon: '⏰',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-time'],
    env: {},
    url: null,
    config: {}
  },
  {
    name: '内存存储',
    type: 'mcp' as const,
    description: '键值存储，用于跨会话保存数据',
    icon: '💾',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    env: {},
    url: null,
    config: {}
  },
  {
    name: 'Slack',
    type: 'mcp' as const,
    description: '发送消息到 Slack 频道',
    icon: '💬',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: {
      SLACK_BOT_TOKEN: '',
      SLACK_TEAM_ID: ''
    },
    url: null,
    config: {}
  },
  {
    name: 'PostgreSQL',
    type: 'mcp' as const,
    description: '连接和查询 PostgreSQL 数据库',
    icon: '🐘',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    env: {},
    url: null,
    config: {
      connectionString: ''
    }
  }
];

/**
 * 初始化推荐的 MCP 服务器
 */
export function initializeRecommendedMCPs(): void {
  console.log('[MCP] Initializing recommended MCP servers...');

  for (const mcp of recommendedMCPs) {
    try {
      createMCPServer({
        ...mcp,
        userId,
        enabled: false // 默认不启用，需要用户手动配置并启用
      });
      console.log(`[MCP] Created: ${mcp.name}`);
    } catch (error) {
      // 忽略重复创建错误
      console.log(`[MCP] Skipped (already exists): ${mcp.name}`);
    }
  }

  console.log('[MCP] Recommended MCP servers initialized');
}

/**
 * 添加单个 MCP 服务器
 */
export function addMCP(
  name: string,
  command: string,
  args: string[] = [],
  env: Record<string, string> = {},
  config: Record<string, any> = {},
  description: string = '',
  icon: string = '🔌',
  enabled: boolean = false
): void {
  createMCPServer({
    name,
    type: 'mcp',
    description,
    icon,
    command,
    args,
    env,
    config,
    userId,
    enabled
  });
  console.log(`[MCP] Added: ${name}`);
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeRecommendedMCPs();
}

export default { initializeRecommendedMCPs, addMCP };
