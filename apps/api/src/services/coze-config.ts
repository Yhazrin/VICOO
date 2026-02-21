/**
 * Coze 配置
 * 
 * 使用方法：
 * 1. 在 Coze (https://coze.com) 创建工作流
 * 2. 获取 API Token 和 Workflow ID
 * 3. 在环境变量中设置：
 *    - COZE_API_TOKEN=your_api_token
 *    - COZE_WORKFLOW_ID=your_workflow_id
 * 
 * 或在运行时通过 API 设置
 */

export interface CozeConfig {
  apiToken: string;
  workflowId: string;
  baseUrl?: string;
}

// 默认配置 - 从环境变量读取
const defaultConfig: CozeConfig = {
  apiToken: process.env.COZE_API_TOKEN || '',
  workflowId: process.env.COZE_WORKFLOW_ID || '',
  baseUrl: process.env.COZE_BASE_URL || 'https://api.coze.com'
};

// 运行时配置（可动态修改）
let runtimeConfig: CozeConfig = { ...defaultConfig };

/**
 * 获取当前 Coze 配置
 */
export function getCozeConfig(): CozeConfig {
  return runtimeConfig;
}

/**
 * 设置 Coze 配置（运行时）
 */
export function setCozeConfig(config: Partial<CozeConfig>): void {
  runtimeConfig = {
    ...runtimeConfig,
    ...config
  };
}

/**
 * 检查 Coze 是否已配置
 */
export function isCozeConfigured(): boolean {
  return !!(runtimeConfig.apiToken && runtimeConfig.workflowId);
}

/**
 * Coze API 端点
 */
export const COZE_ENDPOINTS = {
  // 运行工作流
  RUN_WORKFLOW: '/v1/workflows/run',
  // 获取工作流信息
  WORKFLOW_INFO: '/v1/workflows/:workflow_id',
} as const;

export default {
  getCozeConfig,
  setCozeConfig,
  isCozeConfigured,
  COZE_ENDPOINTS
};
