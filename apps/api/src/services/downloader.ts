/**
 * 统一的下载器服务
 * 支持多种平台的内容获取：B站视频、抖音视频、小红书文章等
 * 
 * 参考 galaxy-downloader 项目设计:
 * - 统一入口: /v1/parse (解析链接获取视频信息)
 * - 支持多P视频
 * - 支持提取音频
 * 
 * API文档:
 * GET /api/v1/parse?url=xxx - 解析URL获取视频信息
 */

import type { Request, Response } from 'express';
import { Router } from 'express';

// 平台类型定义 - 与 galaxy-downloader 保持一致
export type Platform = 'bili' | 'bilibili' | 'douyin' | 'xiaohongshu' | 'youtube' | 'article' | 'unknown';

// 多P视频的单个分P信息
export interface PageInfo {
  page: number;
  cid: string;
  part: string;
  duration: number;
  downloadAudioUrl: string | null;
  downloadVideoUrl: string | null;
}

// 统一解析结果 - 与 galaxy-downloader 的 UnifiedParseResult 保持一致
export interface UnifiedParseResult {
  success: boolean;
  data?: {
    title: string;
    desc?: string;
    platform: string;
    downloadAudioUrl: string | null;
    downloadVideoUrl: string | null;
    originDownloadVideoUrl: string | null;
    url: string;
    // 时长（秒）
    duration?: number;
    // 多P视频相关字段
    isMultiPart?: boolean;
    currentPage?: number;
    pages?: PageInfo[];
    // 小红书相关字段
    noteType?: 'video' | 'image';
    images?: string[];
  };
  error?: string;
  url?: string;
}

// 兼容旧接口
export interface MediaInfo {
  id: string;
  platform: Platform;
  title: string;
  description?: string;
  author?: string;
  authorAvatar?: string;
  publishTime?: string;
  duration?: number;
  coverUrl?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  videoUrl?: string;
  videoUrls?: Array<{
    quality: string;
    url: string;
    format: string;
  }>;
  audioUrl?: string;
  content?: string;
  images?: string[];
  rawData?: any;
}

export interface DownloadOptions {
  quality?: 'low' | 'medium' | 'high' | 'highest';
  format?: 'mp4' | 'webm' | 'audio';
  includeComments?: boolean;
  includeSubtitles?: boolean;
}

/**
 * 检测链接所属平台
 */
export function detectPlatform(url: string): Platform {
  const lowerUrl = url.toLowerCase();
  
  // B站
  if (lowerUrl.includes('bilibili.com') || lowerUrl.includes('b23.tv')) {
    return 'bilibili';
  }
  
  // 抖音
  if (lowerUrl.includes('douyin.com') || lowerUrl.includes('v.douyin.com')) {
    return 'douyin';
  }
  
  // 小红书
  if (lowerUrl.includes('xiaohongshu.com') || lowerUrl.includes('xhsm') || lowerUrl.includes('xhslink.com')) {
    return 'xiaohongshu';
  }
  
  // YouTube
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  // 通用文章
  if (lowerUrl.includes('medium.com') || 
      lowerUrl.includes('juejin.cn') || 
      lowerUrl.includes('zhihu.com') ||
      lowerUrl.includes('news.ycombinator.com')) {
    return 'article';
  }
  
  return 'unknown';
}

/**
 * 提取视频/内容ID
 */
export function extractId(url: string, platform: Platform): string {
  try {
    const urlObj = new URL(url);
    
    switch (platform) {
      case 'bilibili':
        const pathBilibili = urlObj.pathname;
        if (pathBilibili.includes('/video/')) {
          const bvMatch = pathBilibili.match(/BV[\w]+/);
          if (bvMatch) return bvMatch[0];
          const avMatch = pathBilibili.match(/av\d+/);
          if (avMatch) return avMatch[0];
        }
        if (pathBilibili.includes('/bangumi/')) {
          return pathBilibili.split('/').filter(Boolean).pop() || '';
        }
        return urlObj.searchParams.get('bvid') || '';
        
      case 'douyin':
        // 抖音短链格式: https://v.douyin.com/xxxxx
        if (lowerUrl.includes('v.douyin.com')) {
          return urlObj.pathname.replace('/', '') || urlObj.searchParams.get('from') || '';
        }
        return urlObj.pathname.match(/\/video\/(\d+)/)?.[1] || '';
        
      case 'youtube':
        return urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop() || '';
        
      case 'xiaohongshu':
        return urlObj.pathname.match(/\/note\/([a-zA-Z0-9]+)/)?.[1] || '';
        
      default:
        return url;
    }
  } catch {
    return url;
  }
}

// 辅助函数：修复URL
function fixUrl(url: string): string {
  if (url && !url.startsWith('http')) {
    return 'https:' + url;
  }
  return url.replace('http://', 'https://');
}

// ==================== B站 (Bilibili) 视频获取 ====================

/**
 * 获取B站视频信息
 * 使用B站公开API
 */
export async function getBilibiliMediaInfo(url: string): Promise<UnifiedParseResult> {
  const videoId = extractId(url, 'bilibili');
  let bvid = videoId.startsWith('BV') ? videoId : '';
  let aid = videoId.startsWith('av') ? parseInt(videoId.replace('av', '')) : 0;
  
  // 如果没有BV号，先获取BV号
  if (!bvid && aid) {
    try {
      const cidResponse = await fetch(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`);
      const cidData = await cidResponse.json();
      if (cidData.data) {
        bvid = cidData.data.bvid;
      }
    } catch (e) {
      console.error('获取B站BV号失败:', e);
    }
  }
  
  // 获取视频详细信息
  const apiUrl = bvid 
    ? `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
    : `https://api.bilibili.com/x/web-interface/view?aid=${aid}`;
    
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  if (!data.data) {
    throw new Error(`B站视频不存在: ${videoId}`);
  }
  
  const videoData = data.data;
  
  // 获取视频播放地址 (最高画质)
  const playUrl = `https://api.bilibili.com/x/player/playurl?avid=${videoData.aid}&cid=${videoData.cid}&qn=80&fnval=16`;
  const playResponse = await fetch(playUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.bilibili.com'
    }
  });
  const playData = await playResponse.json();
  
  // 处理多P视频
  const pages = videoData.pages?.map((p: any) => ({
    page: p.page,
    cid: p.cid,
    part: p.part,
    duration: p.duration,
    downloadAudioUrl: null, // 需要单独获取
    downloadVideoUrl: null
  })) || [];
  
  const downloadVideoUrl = playData.data?.durl?.[0]?.url || '';
  const downloadAudioUrl = null; // B站音频需要单独接口
  
  return {
    success: true,
    data: {
      title: videoData.title,
      desc: videoData.desc,
      platform: 'bilibili',
      downloadAudioUrl,
      downloadVideoUrl: fixUrl(downloadVideoUrl),
      originDownloadVideoUrl: fixUrl(downloadVideoUrl),
      url,
      duration: videoData.duration,
      isMultiPart: pages.length > 1,
      currentPage: 1,
      pages: pages.length > 0 ? pages : undefined
    }
  };
}

// ==================== 抖音 (Douyin) 视频获取 ====================

/**
 * 获取抖音视频信息
 */
export async function getDouyinMediaInfo(url: string): Promise<UnifiedParseResult> {
  const videoId = extractId(url, 'douyin');
  
  try {
    // 解析短链获取真实URL
    let finalUrl = url;
    if (url.includes('v.douyin.com')) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        redirect: 'follow'
      });
      finalUrl = response.url;
    }
    
    // 通过爱提取解析无水印视频 (公共接口)
    const parseUrl = `https://api.aizhanzhan.com/douyin/parse?url=${encodeURIComponent(finalUrl)}`;
    const parseResponse = await fetch(parseUrl);
    const parseData = await parseResponse.json();
    
    if (parseData.code === 200 && parseData.data) {
      return {
        success: true,
        data: {
          title: parseData.data.desc || '抖音视频',
          desc: parseData.data.desc,
          platform: 'douyin',
          downloadAudioUrl: parseData.data.music_url || null,
          downloadVideoUrl: parseData.data.video_url || null,
          originDownloadVideoUrl: parseData.data.video_url || null,
          url,
          duration: parseData.data.duration
        }
      };
    }
    
    // 备选：尝试其他解析接口
    throw new Error('解析失败');
  } catch (error) {
    // 返回基本信息，让前端处理
    return {
      success: true,
      data: {
        title: '抖音视频',
        platform: 'douyin',
        downloadAudioUrl: null,
        downloadVideoUrl: null,
        originDownloadVideoUrl: null,
        url
      }
    };
  }
}

// ==================== 小红书内容获取 ====================

/**
 * 获取小红书笔记信息
 */
export async function getXiaohongshuMediaInfo(url: string): Promise<UnifiedParseResult> {
  const noteId = extractId(url, 'xiaohongshu');
  
  // 小红书 API 需要登录态，这里返回基本信息
  // 实际实现可能需要模拟请求或使用其他方式
  return {
    success: true,
    data: {
      title: '小红书笔记',
      desc: '请在小红书APP中查看详细内容',
      platform: 'xiaohongshu',
      downloadAudioUrl: null,
      downloadVideoUrl: null,
      originDownloadVideoUrl: null,
      url,
      noteType: 'video'
    }
  };
}

// ==================== YouTube 视频获取 ====================

/**
 * 获取YouTube视频信息
 */
export async function getYouTubeMediaInfo(url: string): Promise<UnifiedParseResult> {
  const videoId = extractId(url, 'youtube');
  
  // 使用 Invidious API 获取视频信息
  try {
    const invideoUrl = `https://inv.nadeko.net/api/v1/videos/${videoId}`;
    const invideoResponse = await fetch(invideoUrl);
    
    if (invideoResponse.ok) {
      const invideoData = await invideoResponse.json();
      
      return {
        success: true,
        data: {
          title: invideoData.title || 'YouTube视频',
          desc: invideoData.description,
          platform: 'youtube',
          downloadAudioUrl: invideoData.audioStreams?.[0]?.url || null,
          downloadVideoUrl: invideoData.videoStreams?.[0]?.url || null,
          originDownloadVideoUrl: invideoData.videoStreams?.[0]?.url || null,
          url,
          duration: invideoData.lengthSeconds
        }
      };
    }
  } catch (e) {
    console.log('使用备选方案获取YouTube视频信息');
  }
  
  // 备选：使用 oembed
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const oembedResponse = await fetch(oembedUrl);
    const oembedData = await oembedResponse.json();
    
    return {
      success: true,
      data: {
        title: oembedData.title || 'YouTube视频',
        platform: 'youtube',
        downloadAudioUrl: null,
        downloadVideoUrl: null,
        originDownloadVideoUrl: null,
        url,
        coverUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    };
  } catch (e) {
    throw new Error('获取YouTube视频信息失败');
  }
}

// ==================== 文章内容获取 ====================

/**
 * 获取文章/网页内容
 */
export async function getArticleMediaInfo(url: string): Promise<UnifiedParseResult> {
  const platform = detectPlatform(url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = await response.text();
    
    // 简单的标题提取
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '未知文章';
    
    // 提取 meta 描述
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1] : '';
    
    // 尝试提取正文内容 (简化版)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let content = '';
    if (bodyMatch) {
      content = bodyMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000);
    }
    
    return {
      success: true,
      data: {
        title,
        desc: description,
        platform: platform === 'unknown' ? 'article' : platform,
        downloadAudioUrl: null,
        downloadVideoUrl: null,
        originDownloadVideoUrl: null,
        url,
        content
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `获取文章内容失败: ${error}`,
      url
    };
  }
}

// ==================== 统一入口 ====================

/**
 * 获取媒体信息 - 统一入口
 * 根据URL自动识别平台并获取相应信息
 * 与 galaxy-downloader 项目的 /v1/parse 接口保持一致
 */
export async function parseUrl(url: string): Promise<UnifiedParseResult> {
  const platform = detectPlatform(url);
  
  console.log(`[Downloader] 检测到平台: ${platform}, URL: ${url}`);
  
  try {
    switch (platform) {
      case 'bilibili':
        return await getBilibiliMediaInfo(url);
        
      case 'douyin':
        return await getDouyinMediaInfo(url);
        
      case 'xiaohongshu':
        return await getXiaohongshuMediaInfo(url);
        
      case 'youtube':
        return await getYouTubeMediaInfo(url);
        
      case 'article':
        return await getArticleMediaInfo(url);
        
      default:
        return await getArticleMediaInfo(url);
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '解析失败',
      url
    };
  }
}

// 兼容旧接口
export async function getMediaInfo(url: string, options?: DownloadOptions): Promise<MediaInfo> {
  const result = await parseUrl(url);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || '解析失败');
  }
  
  return {
    id: result.data.url,
    platform: result.data.platform as Platform,
    title: result.data.title,
    description: result.data.desc,
    duration: result.data.duration,
    coverUrl: result.data.coverUrl,
    videoUrl: result.data.downloadVideoUrl || undefined,
    audioUrl: result.data.downloadAudioUrl || undefined,
    rawData: result
  };
}

/**
 * 获取支持的平台列表
 */
export function getSupportedPlatforms(): { platform: Platform; name: string; icon: string }[] {
  return [
    { platform: 'bilibili', name: '哔哩哔哩', icon: '🟡' },
    { platform: 'douyin', name: '抖音', icon: '🎵' },
    { platform: 'xiaohongshu', name: '小红书', icon: '📕' },
    { platform: 'youtube', name: 'YouTube', icon: '🔴' },
    { platform: 'article', name: '网页文章', icon: '📄' }
  ];
}

// Express 路由处理器
export function createDownloaderRouter() {
  const router = Router();
  
  // GET /api/v1/parse - 统一解析接口 (与 galaxy-downloader 保持一致)
  router.get('/v1/parse', async (req: Request, res: Response) => {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.json({
        success: false,
        error: '请提供有效的URL参数'
      });
    }
    
    console.log(`[Downloader API] 解析: ${url}`);
    
    const result = await parseUrl(url);
    res.json(result);
  });
  
  // POST /api/v1/parse - 统一解析接口 (POST版本)
  router.post('/v1/parse', async (req: Request, res: Response) => {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.json({
        success: false,
        error: '请提供有效的URL参数'
      });
    }
    
    const result = await parseUrl(url);
    res.json(result);
  });
  
  // GET /api/download/platforms - 获取支持的平台
  router.get('/platforms', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: getSupportedPlatforms()
    });
  });
  
  // GET /api/download/detect - 检测URL所属平台
  router.get('/detect', (req: Request, res: Response) => {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.json({
        success: false,
        error: '请提供有效的URL参数'
      });
    }
    
    const platform = detectPlatform(url);
    res.json({
      success: true,
      data: {
        url,
        platform,
        platformName: getSupportedPlatforms().find(p => p.platform === platform)?.name || '未知平台'
      }
    });
  });
  
  return router;
}

export default {
  detectPlatform,
  extractId,
  parseUrl,
  getMediaInfo,
  getSupportedPlatforms,
  getBilibiliMediaInfo,
  getDouyinMediaInfo,
  getXiaohongshuMediaInfo,
  getYouTubeMediaInfo,
  getArticleMediaInfo,
  createDownloaderRouter
};
