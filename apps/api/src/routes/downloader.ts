/**
 * 下载器 API 路由
 * 提供统一的接口来获取各种平台的视频/文章内容
 * 与 galaxy-downloader 项目接口保持一致
 */

import { Router, Request, Response } from 'express';
import { 
  parseUrl,
  getSupportedPlatforms, 
  detectPlatform,
  type UnifiedParseResult,
  type Platform,
  createDownloaderRouter
} from '../services/downloader.js';

// 使用统一的路由器
const router = createDownloaderRouter();

// 额外的快捷接口

// GET /api/download/platforms - 获取支持的平台列表
router.get('/platforms', (req: Request, res: Response) => {
  try {
    const platforms = getSupportedPlatforms();
    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PLATFORMS_ERROR',
        message: '获取平台列表失败'
      }
    });
  }
});

// GET /api/download/detect - 检测URL所属平台
router.get('/detect', (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: '请提供有效的URL参数'
        }
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DETECT_ERROR',
        message: '检测平台失败'
      }
    });
  }
});

// GET /api/download/info - 获取媒体信息 (兼容旧接口)
router.get('/info', async (req: Request, res: Response) => {
  try {
    const { url, quality, format } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: '请提供有效的URL参数'
        }
      });
    }
    
    console.log(`[Downloader API] 获取媒体信息: ${url}`);
    
    const result = await parseUrl(url);
    
    res.json(result);
  } catch (error: any) {
    console.error('[Downloader API] 错误:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error.message || '获取媒体信息失败'
      }
    });
  }
});

// POST /api/download/info - 获取媒体信息 (POST版本)
router.post('/info', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: '请提供有效的URL参数'
        }
      });
    }
    
    const result = await parseUrl(url);
    res.json(result);
  } catch (error: any) {
    console.error('[Downloader API] 错误:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error.message || '获取媒体信息失败'
      }
    });
  }
});

// GET /api/download/bilibili/:bvid - B站视频快捷方式
router.get('/bilibili/:bvid', async (req: Request, res: Response) => {
  try {
    const { bvid } = req.params;
    const url = `https://www.bilibili.com/video/${bvid}`;
    
    const result = await parseUrl(url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'BILIBILI_ERROR',
        message: error.message || '获取B站视频失败'
      }
    });
  }
});

// GET /api/download/douyin/:id - 抖音视频快捷方式
router.get('/douyin/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const url = `https://www.douyin.com/video/${id}`;
    
    const result = await parseUrl(url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DOUYIN_ERROR',
        message: error.message || '获取抖音视频失败'
      }
    });
  }
});

// GET /api/download/xiaohongshu/:noteId - 小红书快捷方式
router.get('/xiaohongshu/:noteId', async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const url = `https://www.xiaohongshu.com/note/${noteId}`;
    
    const result = await parseUrl(url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'XIAOHONGSHU_ERROR',
        message: error.message || '获取小红书笔记失败'
      }
    });
  }
});

// GET /api/download/youtube/:videoId - YouTube视频快捷方式
router.get('/youtube/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    const result = await parseUrl(url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'YOUTUBE_ERROR',
        message: error.message || '获取YouTube视频失败'
      }
    });
  }
});

export default router;
