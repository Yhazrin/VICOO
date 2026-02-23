/**
 * MCP 客户端
 * 实现 Model Context Protocol 协议客户端
 * 支持 stdio 和 HTTP 两种连接方式
 */

import { spawn, ChildProcess } from 'child_process';
import { getMCPServer, getMCPTools, type MCPServer, type MCPTool } from './mcp.js';

// MCP 协议类型
interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
}

/**
 * MCP 客户端基类
 */
abstract class MCPClient {
  protected serverId: string;
  protected tools: MCPToolDefinition[] = [];
  protected requestId = 0;

  constructor(serverId: string) {
    this.serverId = serverId;
  }

  /**
   * 发送请求
   */
  protected abstract sendRequest(method: string, params?: any): Promise<any>;

  /**
   * 初始化连接
   */
  async initialize(): Promise<void> {
    // 获取工具列表
    const response = await this.sendRequest('tools/list');
    if (response?.tools) {
      this.tools = response.tools;
    }
  }

  /**
   * 调用工具
   */
  async callTool(name: string, args: any): Promise<string> {
    const response = await this.sendRequest('tools/call', {
      name,
      arguments: args
    });

    if (response?.content) {
      // 返回内容，可能是文本或结构化数据
      return JSON.stringify(response.content);
    }

    return JSON.stringify(response);
  }

  /**
   * 获取可用工具
   */
  getTools(): MCPToolDefinition[] {
    return this.tools;
  }

  /**
   * 关闭连接
   */
  abstract close(): void;
}

/**
 * Stdio MCP 客户端
 * 通过子进程stdin/stdout通信
 */
export class StdioMCPClient extends MCPClient {
  private process: ChildProcess | null = null;
  private pendingRequests: Map<number | string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = new Map();
  private messageBuffer = '';

  constructor(serverId: string, private command: string, private args: string[], private env: Record<string, string> = {}) {
    super(serverId);
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 启动子进程
        this.process = spawn(this.command, this.args, {
          env: { ...process.env, ...this.env },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        this.process.stdout?.on('data', (data) => {
          this.handleMessage(data.toString());
        });

        this.process.stderr?.on('data', (data) => {
          console.error(`[MCP Stdio] stderr: ${data.toString()}`);
        });

        this.process.on('error', (error) => {
          console.error(`[MCP Stdio] Process error: ${error.message}`);
          reject(error);
        });

        this.process.on('exit', (code) => {
          console.log(`[MCP Stdio] Process exited with code ${code}`);
          this.close();
        });

        // 等待进程启动，然后初始化
        setTimeout(async () => {
          try {
            await super.initialize();
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 1000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: string): void {
    this.messageBuffer += data;

    // 尝试解析完整的 JSON-RPC 消息
    const lines = this.messageBuffer.split('\n');
    this.messageBuffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const response: MCPResponse = JSON.parse(line);

        // 处理通知（没有id）
        if (response.id === undefined) {
          continue;
        }

        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
          this.pendingRequests.delete(response.id);
        }
      } catch (error) {
        console.error(`[MCP Stdio] Failed to parse message: ${line}`);
      }
    }
  }

  async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.process?.stdin?.writable) {
      throw new Error('Process stdin not available');
    }

    const id = ++this.requestId;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.process!.stdin!.write(JSON.stringify(request) + '\n');

      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 30000);
    });
  }

  close(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.pendingRequests.clear();
  }
}

/**
 * HTTP MCP 客户端
 * 通过 HTTP SSE 或轮询通信
 */
export class HttpMCPClient extends MCPClient {
  private baseUrl: string;

  constructor(serverId: string, baseUrl: string) {
    super(serverId);
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async sendRequest(method: string, params?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++this.requestId,
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: MCPResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result;
  }

  close(): void {
    // HTTP 连接无需特殊关闭
  }
}

/**
 * MCP 客户端工厂
 */
export class MCPClientFactory {
  private static clients: Map<string, MCPClient> = new Map();

  /**
   * 创建 MCP 客户端
   */
  static async createClient(server: MCPServer): Promise<MCPClient> {
    const existing = this.clients.get(server.id);
    if (existing) {
      return existing;
    }

    let client: MCPClient;

    if (server.url) {
      // HTTP MCP 服务器
      client = new HttpMCPClient(server.id, server.url);
    } else if (server.command) {
      // Stdio MCP 服务器
      const args = JSON.parse(server.args || '[]');
      const env = JSON.parse(server.env || '{}');
      client = new StdioMCPClient(server.id, server.command, args, env);
    } else {
      throw new Error('Invalid MCP server configuration');
    }

    await client.initialize();
    this.clients.set(server.id, client);

    return client;
  }

  /**
   * 获取或创建客户端
   */
  static async getClient(serverId: string): Promise<MCPClient | null> {
    const server = getMCPServer(serverId);
    if (!server || !server.enabled) {
      return null;
    }

    return this.createClient(server);
  }

  /**
   * 关闭指定客户端
   */
  static closeClient(serverId: string): void {
    const client = this.clients.get(serverId);
    if (client) {
      client.close();
      this.clients.delete(serverId);
    }
  }

  /**
   * 关闭所有客户端
   */
  static closeAll(): void {
    for (const client of this.clients.values()) {
      client.close();
    }
    this.clients.clear();
  }

  /**
   * 将 MCP 工具转换为 LangChain 工具
   */
  static toLangChainTools(mcpClient: MCPClient) {
    const tools = mcpClient.getTools();

    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      schema: tool.inputSchema,
      func: async (args: any) => {
        return mcpClient.callTool(tool.name, args);
      }
    }));
  }
}

/**
 * 从 MCP 服务器加载工具
 */
export async function loadMCPTools(serverId: string): Promise<any[]> {
  const client = await MCPClientFactory.getClient(serverId);

  if (!client) {
    return [];
  }

  return MCPClientFactory.toLangChainTools(client);
}

/**
 * 获取所有启用的 MCP 工具
 */
export async function getAllMCPEnabledTools(): Promise<any[]> {
  const { getEnabledMCPServers } = await import('./mcp.js');

  const servers = getEnabledMCPServers();
  const allTools: any[] = [];

  for (const server of servers) {
    try {
      const tools = await loadMCPTools(server.id);
      allTools.push(...tools);
    } catch (error) {
      console.error(`[MCP] Failed to load tools from ${server.name}:`, error);
    }
  }

  return allTools;
}

export default {
  MCPClientFactory,
  loadMCPTools,
  getAllMCPEnabledTools,
  StdioMCPClient,
  HttpMCPClient
};
