/**
 * Auth middleware + routes
 * Real JWT auth with register/login + Google/GitHub OAuth stubs
 */

import { Request, Response, NextFunction, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { runQuery, getOne, saveDatabase } from '../db/index.js';
import { authRateLimiter } from './security.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'vicoo-dev-secret-change-in-prod';
const JWT_EXPIRES = '30d';

// --- Helpers ---

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload.sub || null;
  } catch {
    return null;
  }
}

function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}

// --- Middleware ---

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const userId = verifyToken(token);
    if (userId) {
      (req as any).userId = userId;
      return next();
    }
  }

  // Dev fallback: allow unauthenticated in dev mode
  if (isDev()) {
    (req as any).userId = 'dev_user_1';
    return next();
  }

  return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authorization required' } });
}

// --- Avatar upload ---
const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, AVATAR_DIR),
  filename: (_, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// --- Routes ---

const authRouter = Router();

// POST /auth/register
authRouter.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: '用户名、邮箱和密码必填' } });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: '密码至少6位' } });
    }

    const existing = getOne<any>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: '该邮箱已注册' } });
    }

    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);

    runQuery(
      `INSERT INTO users (id, username, email, password_hash, provider) VALUES (?, ?, ?, ?, 'local')`,
      [id, username, email, hash]
    );
    saveDatabase();

    const token = signToken(id);

    res.status(201).json({
      data: { token, user: { id, username, email, avatar_url: null, bio: '', provider: 'local' } }
    });
  } catch (err: any) {
    console.error('[Auth Register]', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /auth/login
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: '邮箱和密码必填' } });
    }

    const user = getOne<any>('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: { code: 'AUTH_FAILED', message: '邮箱或密码错误' } });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: { code: 'AUTH_FAILED', message: '邮箱或密码错误' } });
    }

    const token = signToken(user.id);

    res.json({
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url, bio: user.bio, provider: user.provider }
      }
    });
  } catch (err: any) {
    console.error('[Auth Login]', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /auth/dev-token — dev mode only
authRouter.post('/dev-token', (req, res) => {
  if (!isDev()) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not available in production' } });
  }

  // Ensure dev user exists
  const devUser = getOne<any>('SELECT id FROM users WHERE id = ?', ['dev_user_1']);
  if (!devUser) {
    runQuery(`INSERT OR IGNORE INTO users (id, username, email, provider) VALUES (?, ?, ?, ?)`,
      ['dev_user_1', 'Alex Chen', 'dev@vicoo.local', 'local']);
    saveDatabase();
  }

  const token = signToken('dev_user_1');
  res.json({ data: { token, expiresAt: null } });
});

// GET /auth/me — current user profile
authRouter.get('/me', authMiddleware, (req, res) => {
  const userId = (req as any).userId;
  const user = getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);

  if (!user) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  res.json({
    data: {
      id: user.id,
      username: user.username || user.name || 'User',
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio || '',
      provider: user.provider || 'local',
      role: user.role || 'user',
      created_at: user.created_at
    }
  });
});

// PATCH /auth/profile — update profile info
authRouter.patch('/profile', authMiddleware, (req, res) => {
  const userId = (req as any).userId;
  const { username, bio } = req.body;

  const updates: string[] = [];
  const params: any[] = [];

  if (username !== undefined) { updates.push('username = ?'); params.push(username); }
  if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
  updates.push("updated_at = datetime('now')");
  params.push(userId);

  if (updates.length > 1) {
    runQuery(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDatabase();
  }

  const user = getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
  res.json({ data: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url, bio: user.bio } });
});

// POST /auth/change-password
authRouter.post('/change-password', authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: '新密码至少6位' } });
  }

  const user = getOne<any>('SELECT password_hash FROM users WHERE id = ?', [userId]);

  if (user?.password_hash && currentPassword) {
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: { code: 'AUTH_FAILED', message: '当前密码错误' } });
    }
  }

  const hash = await bcrypt.hash(newPassword, 10);
  runQuery(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`, [hash, userId]);
  saveDatabase();

  res.json({ data: { success: true, message: '密码修改成功' } });
});

// POST /auth/avatar — upload avatar
authRouter.post('/avatar', authMiddleware, avatarUpload.single('avatar'), (req, res) => {
  const userId = (req as any).userId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: '请上传头像文件' } });
  }

  const apiUrl = process.env.API_URL || 'http://localhost:8000';
  const avatarUrl = `${apiUrl}/uploads/avatars/${file.filename}`;

  runQuery(`UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?`, [avatarUrl, userId]);
  saveDatabase();

  res.json({ data: { avatar_url: avatarUrl } });
});

// --- OAuth stubs (ready for credentials) ---

// GET /auth/google — redirect to Google OAuth
authRouter.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/auth/google/callback';

  if (!clientId) {
    return res.status(501).json({ error: { code: 'NOT_CONFIGURED', message: 'Google OAuth 未配置。请设置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET 环境变量。' } });
  }

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
  res.redirect(url);
});

// GET /auth/google/callback
authRouter.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/auth/google/callback';

  if (!clientId || !clientSecret || !code) {
    return res.redirect('/?error=google_auth_failed');
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: code as string, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const tokens = await tokenRes.json() as any;

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await userRes.json() as any;

    // Find or create user
    let user = getOne<any>('SELECT * FROM users WHERE provider = ? AND provider_id = ?', ['google', profile.id]);
    if (!user) {
      user = getOne<any>('SELECT * FROM users WHERE email = ?', [profile.email]);
    }

    if (!user) {
      const id = uuidv4();
      runQuery(`INSERT INTO users (id, username, email, avatar_url, provider, provider_id) VALUES (?, ?, ?, ?, 'google', ?)`,
        [id, profile.name, profile.email, profile.picture, profile.id]);
      saveDatabase();
      user = { id, username: profile.name, email: profile.email };
    }

    const token = signToken(user.id);
    res.redirect(`http://localhost:3001/?token=${token}`);
  } catch (err: any) {
    console.error('[Google OAuth]', err);
    res.redirect('/?error=google_auth_failed');
  }
});

// GET /auth/github — redirect to GitHub OAuth
authRouter.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return res.status(501).json({ error: { code: 'NOT_CONFIGURED', message: 'GitHub OAuth 未配置。请设置 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET 环境变量。' } });
  }

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
  res.redirect(url);
});

// GET /auth/github/callback
authRouter.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret || !code) {
    return res.redirect('/?error=github_auth_failed');
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const tokens = await tokenRes.json() as any;

    // Get user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json' },
    });
    const profile = await userRes.json() as any;

    // Get email if not public
    let email = profile.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json' },
      });
      const emails = await emailRes.json() as any[];
      email = emails?.find((e: any) => e.primary)?.email || emails?.[0]?.email;
    }

    // Find or create user
    let user = getOne<any>('SELECT * FROM users WHERE provider = ? AND provider_id = ?', ['github', String(profile.id)]);
    if (!user && email) {
      user = getOne<any>('SELECT * FROM users WHERE email = ?', [email]);
    }

    if (!user) {
      const id = uuidv4();
      runQuery(`INSERT INTO users (id, username, email, avatar_url, provider, provider_id) VALUES (?, ?, ?, ?, 'github', ?)`,
        [id, profile.login, email || `${profile.id}@github.local`, profile.avatar_url, String(profile.id)]);
      saveDatabase();
      user = { id, username: profile.login, email };
    }

    const token = signToken(user.id);
    res.redirect(`http://localhost:3001/?token=${token}`);
  } catch (err: any) {
    console.error('[GitHub OAuth]', err);
    res.redirect('/?error=github_auth_failed');
  }
});

export default authRouter;
