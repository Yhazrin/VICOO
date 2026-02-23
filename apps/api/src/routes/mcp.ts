/**
 * MCP 服务器 API 路由
 *
 * GET    /api/agent/mcp           - 获取 MCP 服务器列表
 * POST   /api/agent/mcp           - 添加 MCP 服务器
 * GET    /api/agent/mcp/:id       - 获取单个服务器
 * PUT    /api/agent/mcp/:id       - 更新服务器
 * DELETE /api/agent/mcp/:id       - 删除服务器
 * POST   /api/agent/mcp/:id/toggle - 切换启用状态
 * GET    /api/agent/mcp/:id/tools  - 获取服务器提供的工具
 * POST   /api/agent/mcp/:id/test   - 测试服务器连接
 */

import { Router, Request, Response } from 'express';
import {
  getMCPServers,
  getMCPServer,
  createMCPServer,
  updateMCPServer,
  deleteMCPServer,
  toggleMCPServer,
  getMCPTools
} from '../services/mcp.js';

const router = Router();

// GET /api/agent/mcp - 获取 MCP 服务器列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'dev_user_1';
    const servers = getMCPServers(userId);

    // 解析 JSON 字段
    const result = servers.map(server => ({
      ...server,
      args: JSON.parse(server.args || '[]'),
      env: JSON.parse(server.env || '{}'),
      config: JSON.parse(server.config || '{}')
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[MCP] Get servers error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/agent/mcp - 添加 MCP 服务器
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      type = 'mcp',
      description,
      icon,
      command,
      args,
      env,
      url,
      config,
      userId
    } = req.body;

    if (!name) {
      return res.json({
        success: false,
        error: '请提供服务器名称'
      });
    }

    const server = createMCPServer({
      name,
      type,
      description,
      icon,
      command,
      args,
      env,
      url,
      config,
      userId
    });

    res.json({
      success: true,
      data: {
        ...server,
        args: JSON.parse(server.args || '[]'),
        env: JSON.parse(server.env || '{}'),
        config: JSON.parse(server.config || '{}')
      }
    });
  } catch (error: any) {
    console.error('[MCP] Create server error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/agent/mcp/:id - 获取单个服务器
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const server = getMCPServer(id);

    if (!server) {
      return res.json({
        success: false,
        error: '服务器不存在'
      });
    }

    res.json({
      success: true,
      data: {
        ...server,
        args: JSON.parse(server.args || '[]'),
        env: JSON.parse(server.env || '{}'),
        config: JSON.parse(server.config || '{}')
      }
    });
  } catch (error: any) {
    console.error('[MCP] Get server error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/agent/mcp/:id - 更新服务器
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      icon,
      command,
      args,
      env,
      url,
      enabled,
      config
    } = req.body;

    const server = updateMCPServer(id, {
      name,
      description,
      icon,
      command,
      args,
      env,
      url,
      enabled,
      config
    });

    if (!server) {
      return res.json({
        success: false,
        error: '服务器不存在'
      });
    }

    res.json({
      success: true,
      data: {
        ...server,
        args: JSON.parse(server.args || '[]'),
        env: JSON.parse(server.env || '{}'),
        config: JSON.parse(server.config || '{}')
      }
    });
  } catch (error: any) {
    console.error('[MCP] Update server error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/agent/mcp/:id - 删除服务器
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = deleteMCPServer(id);

    res.json({
      success,
      message: success ? '删除成功' : '服务器不存在'
    });
  } catch (error: any) {
    console.error('[MCP] Delete server error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/agent/mcp/:id/toggle - 切换启用状态
router.post('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const server = toggleMCPServer(id, enabled);

    if (!server) {
      return res.json({
        success: false,
        error: '服务器不存在'
      });
    }

    res.json({
      success: true,
      data: {
        ...server,
        args: JSON.parse(server.args || '[]'),
        env: JSON.parse(server.env || '{}'),
        config: JSON.parse(server.config || '{}')
      }
    });
  } catch (error: any) {
    console.error('[MCP] Toggle server error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/agent/mcp/:id/tools - 获取服务器工具列表
router.get('/:id/tools', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const server = getMCPServer(id);

    if (!server) {
      return res.json({
        success: false,
        error: '服务器不存在'
      });
    }

    // 如果是内置服务器，返回配置的技能
    if (server.type === 'builtin') {
      const config = JSON.parse(server.config || '{}');
      const skills = config.skills || [];

      // 从 skill 配置中提取工具信息
      const tools = skills.map((skillName: string) => ({
        id: `${id}_${skillName}`,
        server_id: id,
        mcp_tool_name: skillName,
        vicoo_tool_name: skillName,
        description: getSkillDescription(skillName),
        input_schema: '{}',
        enabled: 1
      }));

      return res.json({
        success: true,
        data: tools
      });
    }

    // MCP 服务器，从数据库获取工具
    const tools = getMCPTools(id);
    const result = tools.map(tool => ({
      ...tool,
      input_schema: JSON.parse(tool.input_schema || '{}')
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[MCP] Get tools error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// 获取技能的描述
function getSkillDescription(skillName: string): string {
  const descriptions: Record<string, string> = {
    search_notes: '搜索用户的笔记内容',
    create_note: '创建新的笔记',
    update_note: '更新笔记内容',
    delete_note: '删除笔记',
    get_note: '获取单个笔记详情',
    get_tasks: '获取任务列表',
    create_task: '创建新任务',
    complete_task: '完成任务',
    delete_task: '删除任务',
    get_tags: '获取所有标签',
    get_notes_by_tag: '获取指定标签下的笔记',
    get_graph: '获取知识图谱',
    get_related_notes: '获取相关笔记',
    search_web: '搜索互联网',
    fetch_web_content: '获取网页内容'
  };

  return descriptions[skillName] || skillName;
}

export default router;
