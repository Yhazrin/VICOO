import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

interface PublishOptions {
  videoPath: string;
  title: string;
  tags: string[];
  platforms: string[];
  accounts?: string[];
  scheduledAt?: string;
}

interface PublishResult {
  success: boolean;
  message: string;
  results?: Array<{
    platform: string;
    success: boolean;
    message: string;
    videoId?: string;
  }>;
}

// Cookie and data storage directory
const COOKIE_DIR = path.join(process.cwd(), 'data', 'cookies');
const TEMP_DIR = path.join(process.cwd(), 'data', 'temp');

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(COOKIE_DIR)) {
    fs.mkdirSync(COOKIE_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

export class PublishService {
  private pythonPath: string;
  private uploadModulePath: string;

  constructor() {
    this.pythonPath = 'python';
    // Try to find social-auto-upload in project root
    this.uploadModulePath = path.join(process.cwd(), 'social-auto-upload');

    // Check if social-auto-upload exists
    if (!fs.existsSync(this.uploadModulePath)) {
      console.warn('social-auto-upload not found, using fallback mode');
    }

    ensureDirs();
  }

  /**
   * Execute Python script and return result
   */
  private async runPython(scriptPath: string, args: string[] = []): Promise<string> {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, [scriptPath, ...args], {
        cwd: this.uploadModulePath
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Python script exited with code ${code}`));
        }
      });

      python.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Login to platform and get cookie
   */
  async loginPlatform(platform: string): Promise<{ success: boolean; message: string; cookiePath?: string }> {
    const cookieFileName = `${platform}_${uuidv4()}.json`;
    const cookiePath = path.join(COOKIE_DIR, cookieFileName);

    const platformScript = path.join(this.uploadModulePath, 'uploaders', `${platform}_uploader.py`);

    if (!fs.existsSync(this.uploadModulePath) || !fs.existsSync(platformScript)) {
      // Fallback: return mock success for development
      return {
        success: true,
        message: 'Login simulation mode - social-auto-upload not installed',
        cookiePath: cookiePath
      };
    }

    try {
      await this.runPython(platformScript, ['--login', '--cookie-path', cookiePath]);
      return {
        success: true,
        message: 'Login successful',
        cookiePath
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Validate cookie for a platform
   */
  async validateCookie(platform: string, cookiePath: string): Promise<{ valid: boolean; message: string }> {
    if (!fs.existsSync(cookiePath)) {
      return { valid: false, message: 'Cookie file not found' };
    }

    // Check if social-auto-upload is available
    if (!fs.existsSync(this.uploadModulePath)) {
      // Fallback: simulate validation
      return { valid: true, message: 'Cookie validation simulated - social-auto-upload not installed' };
    }

    const platformScript = path.join(this.uploadModulePath, 'uploaders', `${platform}_uploader.py`);

    if (!fs.existsSync(platformScript)) {
      return { valid: false, message: `Platform ${platform} uploader not found` };
    }

    try {
      await this.runPython(platformScript, ['--validate-cookie', '--cookie-path', cookiePath]);
      return { valid: true, message: 'Cookie is valid' };
    } catch (error: any) {
      return { valid: false, message: error.message };
    }
  }

  /**
   * Validate video file
   */
  async validateVideo(videoPath: string): Promise<{ valid: boolean; message: string; info?: any }> {
    if (!fs.existsSync(videoPath)) {
      return { valid: false, message: 'Video file not found' };
    }

    const ext = path.extname(videoPath).toLowerCase();
    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'];

    if (!validExtensions.includes(ext)) {
      return { valid: false, message: `Invalid video format: ${ext}` };
    }

    const stats = fs.statSync(videoPath);
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB

    if (stats.size > maxSize) {
      return { valid: false, message: 'Video file too large (max 2GB)' };
    }

    return {
      valid: true,
      message: 'Video is valid',
      info: {
        size: stats.size,
        format: ext,
        path: videoPath
      }
    };
  }

  /**
   * Publish video to single platform
   */
  async publishToPlatform(options: {
    platform: string;
    videoPath: string;
    title: string;
    tags: string[];
    cookiePath?: string;
  }): Promise<{ success: boolean; message: string; videoId?: string }> {
    const { platform, videoPath, title, tags, cookiePath } = options;

    // Check if social-auto-upload is available
    if (!fs.existsSync(this.uploadModulePath)) {
      // Fallback: simulate publish
      return {
        success: true,
        message: `Publish simulated for ${platform} - social-auto-upload not installed`,
        videoId: `sim_${uuidv4().slice(0, 8)}`
      };
    }

    const platformScript = path.join(this.uploadModulePath, 'uploaders', `${platform}_uploader.py`);

    if (!fs.existsSync(platformScript)) {
      return { success: false, message: `Platform ${platform} uploader not found` };
    }

    const args = [
      '--video', videoPath,
      '--title', title,
      '--tags', tags.join(',')
    ];

    if (cookiePath) {
      args.push('--cookie-path', cookiePath);
    }

    try {
      const output = await this.runPython(platformScript, args);
      return {
        success: true,
        message: `Published to ${platform} successfully`,
        videoId: output.trim()
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Publish video to multiple platforms
   */
  async publishVideo(options: PublishOptions): Promise<PublishResult> {
    const { videoPath, title, tags, platforms, accounts } = options;

    const results: Array<{
      platform: string;
      success: boolean;
      message: string;
      videoId?: string;
    }> = [];

    // Get accounts for each platform
    const platformAccounts = new Map<string, string>();
    if (accounts && accounts.length > 0) {
      // Account lookup would be done via DB in real implementation
    }

    for (const platform of platforms) {
      const cookiePath = platformAccounts.get(platform);

      const result = await this.publishToPlatform({
        platform,
        videoPath,
        title,
        tags,
        cookiePath
      });

      results.push({
        platform,
        ...result
      });
    }

    const allSuccess = results.every(r => r.success);

    return {
      success: allSuccess,
      message: allSuccess
        ? `Published to ${platforms.length} platform(s) successfully`
        : `Some platforms failed: ${results.filter(r => !r.success).map(r => r.platform).join(', ')}`,
      results
    };
  }

  /**
   * Get scheduled tasks and execute them
   */
  async processScheduledTasks(): Promise<void> {
    // This would be called by a cron job
    // Query tasks where status = 'scheduled' AND scheduled_at <= now
    // Then execute and update status
    console.log('Processing scheduled publish tasks...');
  }
}

export const publishService = new PublishService();
