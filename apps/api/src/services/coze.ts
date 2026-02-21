/**
 * Coze API 服务
 * 
 * 用于调用 Coze 工作流，执行意图理解、内容分析等任务
 */

import { getCozeConfig, isCozeConfigured, COZE_ENDPOINTS } from './coze-config.js';

/**
 * Coze 工作流输入参数
 */
export interface CozeWorkflowInput {
  // 用户输入
  user_input: string;
  // 可选：指定平台筛选 (bilibili/douyin/xiaohongshu/youtube)
  platform?: string;
  // 可选：搜索关键词
  keywords?: string;
  // 可选：内容类型偏好 (video/article/mixed)
  content_type?: string;
  // 可选：其他参数
  [key: string]: any;
}

/**
 * Coze 工作流输出结果
 */
export interface CozeWorkflowOutput {
  success: boolean;
  data?: {
    // 解析的意图
    intent?: string;
    // 搜索关键词
    keywords?: string[];
    // 目标平台
    platform?: string;
    // 内容类型
    content_type?: string;
    // 处理建议
    action?: string;
    // 原始响应
    raw_response?: any;
  };
  error?: string;
}

/**
 * 调用 Coze 工作流
 */
export async function runCozeWorkflow(input: CozeWorkflowInput): Promise<CozeWorkflowOutput> {
  if (!isCozeConfigured()) {
    return {
      success: false,
      error: 'Coze 未配置，请设置 COZE_API_TOKEN 和 COZE_WORKFLOW_ID'
    };
  }

  const config = getCozeConfig();
  const url = `${config.baseUrl}${COZE_ENDPOINTS.RUN_WORKFLOW}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiToken}`
      },
      body: JSON.stringify({
        workflow_id: config.workflowId,
        input: input,
        // 自动生成 conversation ID
        conversation_id: `conv_${Date.now()}`,
        // 不等待完成，返回 job_id 用于轮询
        is_async: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Coze API 调用失败'
      };
    }

    // 解析 Coze 返回的数据
    // Coze 返回格式: { code: 0, msg: "success", data: { ... } }
    if (data.code === 0 && data.data) {
      return {
        success: true,
        data: {
          intent: data.data.intent,
          keywords: data.data.keywords,
          platform: data.data.platform,
          content_type: data.data.content_type,
          action: data.data.action,
          raw_response: data.data
        }
      };
    }

    return {
      success: false,
      error: data.msg || '工作流执行失败'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '调用 Coze 失败'
    };
  }
}

/**
 * 简单调用 Coze 进行文本处理
 * 不依赖特定工作流
 */
export async function callCozeChat(
  messages: Array<{ role: string; content: string }>,
  extraParams?: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isCozeConfigured()) {
    return {
      success: false,
      error: 'Coze 未配置'
    };
  }

  const config = getCozeConfig();

  try {
    const response = await fetch(`${config.baseUrl}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiToken}`
      },
      body: JSON.stringify({
        app_id: config.workflowId,
        conversation_id: `conv_${Date.now()}`,
        messages,
        ...extraParams
      })
    });

    const data = await response.json();

    if (response.ok && data.code === 0) {
      return {
        success: true,
        data: data.data
      };
    }

    return {
      success: false,
      error: data.message || '调用失败'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 检查 Coze 服务状态
 */
export async function checkCozeStatus(): Promise<{ configured: boolean; status: string }> {
  if (!isCozeConfigured()) {
    return {
      configured: false,
      status: '未配置 Coze API'
    };
  }

  try {
    const config = getCozeConfig();
    const response = await fetch(`${config.baseUrl}/v1/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`
      }
    });

    if (response.ok) {
      return {
        configured: true,
        status: '正常'
      };
    }

    return {
      configured: true,
      status: '服务异常'
    };
  } catch {
    return {
      configured: true,
      status: '连接失败'
    };
  }
}

export default {
  runCozeWorkflow,
  callCozeChat,
  checkCozeStatus
};
