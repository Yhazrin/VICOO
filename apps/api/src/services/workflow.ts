/**
 * 智能工作流搜索引擎
 * 
 * 工作流程：
 * 1. 用户输入自然语言查询
 * 2. 调用 Coze 工作流进行意图分析
 * 3. 根据分析结果调用相应的下载器 API
 * 4. 对下载的内容进行二次处理（筛选/排序/总结）
 * 5. 返回最终结果
 */

import { parseUrl, type UnifiedParseResult } from './downloader.js';
import { runCozeWorkflow, checkCozeStatus, type CozeWorkflowInput } from './coze.js';
import { getCozeConfig, isCozeConfigured } from './coze-config.js';

/**
 * 搜索请求
 */
export interface WorkflowSearchRequest {
  // 用户查询
  query: string;
  // 可选：强制指定平台
  platform?: 'bilibili' | 'douyin' | 'xiaohongshu' | 'youtube' | 'article';
  // 可选：内容类型
  contentType?: 'video' | 'article' | 'mixed';
  // 可选：是否启用 Coze 意图分析
  useIntentAnalysis?: boolean;
  // 可选：结果数量限制
  limit?: number;
}

/**
 * 搜索结果项
 */
export interface WorkflowSearchResult {
  // 标题
  title: string;
  // 描述
  description?: string;
  // 平台
  platform: string;
  // 内容类型
  contentType: string;
  // 视频/内容 URL
  url: string;
  // 封面图
  coverUrl?: string;
  // 原始数据
  rawData: any;
  // 相关性分数
  relevanceScore?: number;
}

/**
 * 搜索响应
 */
export interface WorkflowSearchResponse {
  success: boolean;
  data?: {
    // 原始用户查询
    query: string;
    // 意图分析结果
    intentAnalysis?: {
      intent: string;
      keywords: string[];
      platform?: string;
      contentType?: string;
    };
    // 搜索结果
    results: WorkflowSearchResult[];
    // 结果统计
    total: number;
    // 处理时间 (ms)
    processingTime: number;
  };
  error?: string;
}

/**
 * 执行智能搜索工作流
 * 
 * @param request 搜索请求
 * @returns 搜索响应
 */
export async function executeSearchWorkflow(request: WorkflowSearchRequest): Promise<WorkflowSearchResponse> {
  const startTime = Date.now();
  const { query, platform, contentType, useIntentAnalysis = true, limit = 10 } = request;

  try {
    // 步骤 1: 意图分析 (通过 Coze)
    let intentResult = null;
    
    if (useIntentAnalysis) {
      const cozeInput: CozeWorkflowInput = {
        user_input: query,
        platform: platform,
        content_type: contentType || 'mixed'
      };

      const cozeResponse = await runCozeWorkflow(cozeInput);
      
      if (cozeResponse.success && cozeResponse.data) {
        intentResult = {
          intent: cozeResponse.data.intent || 'search',
          keywords: cozeResponse.data.keywords || [],
          platform: cozeResponse.data.platform || platform,
          contentType: cozeResponse.data.content_type || contentType || 'mixed'
        };
      }
    }

    // 使用意图分析结果或直接使用请求参数
    const targetPlatform = intentResult?.platform || platform || 'unknown';
    const targetContentType = intentResult?.contentType || contentType || 'mixed';

    // 步骤 2: 构建搜索查询
    // 由于没有真正的搜索 API，我们使用关键词作为内容 ID 或直接解析
    // 这里我们演示：使用 URL 解析方式获取内容
    const results: WorkflowSearchResult[] = [];

    // 如果用户输入看起来像 URL，直接解析
    if (isValidUrl(query)) {
      const parseResult = await parseUrl(query);
      if (parseResult.success && parseResult.data) {
        results.push({
          title: parseResult.data.title,
          description: parseResult.data.desc,
          platform: parseResult.data.platform,
          contentType: parseResult.data.pages?.length ? 'video' : 'video',
          url: parseResult.data.url,
          coverUrl: parseResult.data.coverUrl,
          rawData: parseResult.data,
          relevanceScore: 1.0
        });
      }
    } else {
      // 步骤 3: 关键词搜索 (模拟)
      // 这里我们使用简化的搜索逻辑：尝试构建可能的 URL
      const keywords = intentResult?.keywords || [query];
      
      // 对每个关键词尝试解析
      for (const keyword of keywords.slice(0, limit)) {
        // 尝试识别 B站视频 ID
        const biliMatch = keyword.match(/(BV[\w]+)/);
        if (biliMatch || targetPlatform === 'bilibili') {
          const bvid = biliMatch?.[1] || keyword;
          try {
            const result = await parseUrl(`https://www.bilibili.com/video/${bvid}`);
            if (result.success && result.data) {
              results.push({
                title: result.data.title,
                description: result.data.desc,
                platform: 'bilibili',
                contentType: 'video',
                url: result.data.url,
                coverUrl: result.data.coverUrl,
                rawData: result.data,
                relevanceScore: 0.8
              });
            }
          } catch (e) {
            // 忽略解析错误
          }
        }

        // 尝试识别 YouTube 视频 ID
        const ytMatch = keyword.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch || targetPlatform === 'youtube') {
          const videoId = ytMatch?.[1] || keyword;
          try {
            const result = await parseUrl(`https://www.youtube.com/watch?v=${videoId}`);
            if (result.success && result.data) {
              results.push({
                title: result.data.title,
                description: result.data.desc,
                platform: 'youtube',
                contentType: 'video',
                url: result.data.url,
                coverUrl: result.data.coverUrl,
                rawData: result.data,
                relevanceScore: 0.8
              });
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    // 步骤 4: 内容筛选和排序
    // 按相关性分数排序
    results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        query,
        intentAnalysis: intentResult || undefined,
        results: results.slice(0, limit),
        total: results.length,
        processingTime
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '搜索失败'
    };
  }
}

/**
 * 简单搜索 - 不使用意图分析
 */
export async function simpleSearch(query: string, platform?: string): Promise<WorkflowSearchResponse> {
  return executeSearchWorkflow({
    query,
    platform: platform as any,
    useIntentAnalysis: false
  });
}

/**
 * 获取工作流状态
 */
export async function getWorkflowStatus() {
  const cozeStatus = await checkCozeStatus();
  
  return {
    success: true,
    data: {
      coze: cozeStatus,
      downloader: {
        status: 'ready',
        supportedPlatforms: ['bilibili', 'douyin', 'xiaohongshu', 'youtube', 'article']
      }
    }
  };
}

/**
 * 验证 URL
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export default {
  executeSearchWorkflow,
  simpleSearch,
  getWorkflowStatus
};
