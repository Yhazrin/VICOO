import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, getOne, getAll, getChanges, saveDatabase } from '../db/index.js';
import { publishService } from '../services/publish/index.js';

const router = Router();

// Supported platforms
const SUPPORTED_PLATFORMS = [
  { id: 'douyin', name: '抖音', icon: '🎵' },
  { id: 'xhs', name: '小红书', icon: '📕' },
  { id: 'bilibili', name: 'B站', icon: '📺' },
  { id: 'ks', name: '快手', icon: '📹' },
  { id: 'tencent', name: '视频号', icon: '💬' },
  { id: 'baijiahao', name: '百家号', icon: '📰' },
  { id: 'tiktok', name: 'TikTok', icon: '🌐' }
];

// GET /api/publish/platforms - Get supported platforms
router.get('/platforms', (req, res) => {
  res.json({ data: SUPPORTED_PLATFORMS });
});

// GET /api/publish/accounts - Get social accounts
router.get('/accounts', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';

  const accounts = getAll<any>(
    'SELECT * FROM social_accounts WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  res.json({
    data: accounts.map(acc => ({
      id: acc.id,
      platform: acc.platform,
      accountName: acc.account_name,
      cookiePath: acc.cookie_path,
      status: acc.status,
      createdAt: acc.created_at,
      updatedAt: acc.updated_at
    }))
  });
});

// POST /api/publish/accounts - Add social account
router.post('/accounts', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';
  const { platform, accountName, cookiePath } = req.body;

  if (!platform || !accountName) {
    return res.status(400).json({ error: 'Platform and account name are required' });
  }

  const id = uuidv4();
  runQuery(
    'INSERT INTO social_accounts (id, user_id, platform, account_name, cookie_path, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, platform, accountName, cookiePath || null, 1]
  );
  saveDatabase();

  res.json({
    data: {
      id,
      platform,
      accountName,
      cookiePath,
      status: 1
    }
  });
});

// DELETE /api/publish/accounts/:id - Delete social account
router.delete('/accounts/:id', (req, res) => {
  const { id } = req.params;

  runQuery('DELETE FROM social_accounts WHERE id = ?', [id]);
  saveDatabase();

  res.json({ success: true });
});

// POST /api/publish/accounts/:id/login - Login to platform and get cookie
router.post('/accounts/:id/login', async (req, res) => {
  const { id } = req.params;

  const account = getOne<any>('SELECT * FROM social_accounts WHERE id = ?', [id]);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  try {
    // Call Python service to perform login
    const result = await publishService.loginPlatform(account.platform);

    if (result.success) {
      // Update cookie path
      runQuery(
        'UPDATE social_accounts SET cookie_path = ?, updated_at = datetime("now") WHERE id = ?',
        [result.cookiePath, id]
      );
      saveDatabase();

      res.json({
        success: true,
        cookiePath: result.cookiePath,
        message: 'Login successful'
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/publish/accounts/:id/validate - Validate account cookie
router.post('/accounts/:id/validate', async (req, res) => {
  const { id } = req.params;

  const account = getOne<any>('SELECT * FROM social_accounts WHERE id = ?', [id]);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  if (!account.cookie_path) {
    return res.json({ valid: false, message: 'No cookie file' });
  }

  try {
    const result = await publishService.validateCookie(account.platform, account.cookie_path);

    // Update status
    const newStatus = result.valid ? 1 : 0;
    runQuery(
      'UPDATE social_accounts SET status = ?, updated_at = datetime("now") WHERE id = ?',
      [newStatus, id]
    );
    saveDatabase();

    res.json({
      valid: result.valid,
      message: result.message
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/publish/tasks - Get publish tasks
router.get('/tasks', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';
  const { status, limit = '20', offset = '0' } = req.query;

  let query = 'SELECT * FROM publish_tasks WHERE user_id = ?';
  const params: any[] = [userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const totalResult = getOne<{ total: number }>(countQuery, params);
  const total = totalResult?.total || 0;

  // Add pagination
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

  const tasks = getAll<any>(query, params);

  res.json({
    data: tasks.map(task => ({
      id: task.id,
      videoPath: task.video_path,
      title: task.title,
      tags: task.tags ? JSON.parse(task.tags) : [],
      platforms: JSON.parse(task.platforms),
      accounts: task.accounts ? JSON.parse(task.accounts) : [],
      status: task.status,
      scheduledAt: task.scheduled_at,
      publishedAt: task.published_at,
      result: task.result ? JSON.parse(task.result) : null,
      createdAt: task.created_at
    })),
    meta: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    }
  });
});

// POST /api/publish/tasks - Create publish task
router.post('/tasks', async (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';
  const { videoPath, title, tags, platforms, accounts, scheduledAt } = req.body;

  if (!videoPath || !platforms || platforms.length === 0) {
    return res.status(400).json({ error: 'Video path and at least one platform are required' });
  }

  const id = uuidv4();

  runQuery(
    `INSERT INTO publish_tasks
     (id, user_id, video_path, title, tags, platforms, accounts, status, scheduled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      videoPath,
      title || '',
      JSON.stringify(tags || []),
      JSON.stringify(platforms),
      JSON.stringify(accounts || []),
      scheduledAt ? 'scheduled' : 'pending',
      scheduledAt || null
    ]
  );
  saveDatabase();

  // If no scheduled time, execute immediately
  if (!scheduledAt) {
    try {
      const result = await publishService.publishVideo({
        videoPath,
        title: title || '',
        tags: tags || [],
        platforms,
        accounts
      });

      runQuery(
        'UPDATE publish_tasks SET status = ?, result = ?, published_at = datetime("now") WHERE id = ?',
        [result.success ? 'published' : 'failed', JSON.stringify(result), id]
      );
      saveDatabase();
    } catch (error: any) {
      runQuery(
        'UPDATE publish_tasks SET status = ?, result = ? WHERE id = ?',
        ['failed', JSON.stringify({ error: error.message }), id]
      );
      saveDatabase();
    }
  }

  res.json({
    data: {
      id,
      videoPath,
      title,
      tags: tags || [],
      platforms,
      accounts: accounts || [],
      status: scheduledAt ? 'scheduled' : 'pending',
      scheduledAt
    }
  });
});

// DELETE /api/publish/tasks/:id - Cancel/delete task
router.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;

  runQuery('DELETE FROM publish_tasks WHERE id = ?', [id]);
  saveDatabase();

  res.json({ success: true });
});

// POST /api/publish/now - Publish immediately
router.post('/now', async (req, res) => {
  const { videoPath, title, tags, platforms, accounts } = req.body;

  if (!videoPath || !platforms || platforms.length === 0) {
    return res.status(400).json({ error: 'Video path and at least one platform are required' });
  }

  try {
    const result = await publishService.publishVideo({
      videoPath,
      title: title || '',
      tags: tags || [],
      platforms,
      accounts
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/publish/validate - Validate video file
router.post('/validate', async (req, res) => {
  const { videoPath } = req.body;

  if (!videoPath) {
    return res.status(400).json({ error: 'Video path is required' });
  }

  try {
    const result = await publishService.validateVideo(videoPath);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ valid: false, message: error.message });
  }
});

export default router;
