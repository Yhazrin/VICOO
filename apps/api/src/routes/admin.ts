/**
 * Admin API Routes — operator backend management
 *
 * All routes require admin role.
 * Prefix: /api/admin
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getOne, getAll, runQuery, saveDatabase } from '../db/index.js';
import { PLANS } from '../services/plans.js';

const router = Router();

// Admin auth check
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  const user = getOne<any>('SELECT role FROM users WHERE id = ?', [userId]);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: '需要管理员权限' } });
  }
  next();
}

router.use(requireAdmin);

// GET /api/admin/dashboard — overview stats
router.get('/dashboard', (_req: Request, res: Response) => {
  const totalUsers = getOne<any>('SELECT COUNT(*) as c FROM users')?.c || 0;
  const totalNotes = getOne<any>('SELECT COUNT(*) as c FROM notes')?.c || 0;
  const totalSubs = getOne<any>("SELECT COUNT(*) as c FROM subscriptions WHERE plan_id != 'free' AND status = 'active'")?.c || 0;
  const totalRevenue = getOne<any>("SELECT SUM(amount) as s FROM payments WHERE status = 'completed'")?.s || 0;
  const todayUsers = getOne<any>("SELECT COUNT(*) as c FROM users WHERE created_at >= date('now')")?.c || 0;
  const todayRevenue = getOne<any>("SELECT SUM(amount) as s FROM payments WHERE status = 'completed' AND created_at >= date('now')")?.s || 0;

  const planBreakdown = Object.keys(PLANS).map(planId => {
    const count = getOne<any>('SELECT COUNT(*) as c FROM subscriptions WHERE plan_id = ? AND status = ?', [planId, 'active'])?.c || 0;
    return { plan: planId, count };
  });

  res.json({
    data: {
      totalUsers,
      totalNotes,
      activeSubscriptions: totalSubs,
      totalRevenue,
      todayNewUsers: todayUsers,
      todayRevenue,
      planBreakdown,
    }
  });
});

// GET /api/admin/users — list users
router.get('/users', (req: Request, res: Response) => {
  const { limit = '50', offset = '0', search } = req.query;
  let query = 'SELECT u.*, s.plan_id, s.status as sub_status, s.current_period_end FROM users u LEFT JOIN subscriptions s ON u.id = s.user_id';
  const params: any[] = [];

  if (search) {
    query += ' WHERE u.username LIKE ? OR u.email LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const users = getAll<any>(query, params);
  const total = getOne<any>('SELECT COUNT(*) as c FROM users')?.c || 0;

  res.json({
    data: users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      avatar_url: u.avatar_url,
      provider: u.provider,
      role: u.role,
      plan: u.plan_id || 'free',
      subStatus: u.sub_status || 'none',
      periodEnd: u.current_period_end,
      createdAt: u.created_at,
    })),
    meta: { total, limit: Number(limit), offset: Number(offset) }
  });
});

// PATCH /api/admin/users/:id — update user (role, plan)
router.patch('/users/:id', (req: Request, res: Response) => {
  const { role, planId } = req.body;
  const userId = req.params.id;

  if (role) {
    runQuery('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?', [role, userId]);
  }

  if (planId) {
    const existing = getOne<any>('SELECT id FROM subscriptions WHERE user_id = ?', [userId]);
    if (existing) {
      runQuery('UPDATE subscriptions SET plan_id = ?, updated_at = datetime("now") WHERE user_id = ?', [planId, userId]);
    } else {
      const { v4: uuid } = require('uuid');
      runQuery('INSERT INTO subscriptions (id, user_id, plan_id, status) VALUES (?, ?, ?, "active")', [uuid(), userId, planId]);
    }
  }

  saveDatabase();
  res.json({ data: { success: true } });
});

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', (req: Request, res: Response) => {
  const userId = req.params.id;
  runQuery('DELETE FROM notes WHERE user_id = ?', [userId]);
  runQuery('DELETE FROM subscriptions WHERE user_id = ?', [userId]);
  runQuery('DELETE FROM usage_tracking WHERE user_id = ?', [userId]);
  runQuery('DELETE FROM payments WHERE user_id = ?', [userId]);
  runQuery('DELETE FROM users WHERE id = ?', [userId]);
  saveDatabase();
  res.json({ data: { success: true } });
});

// GET /api/admin/payments — all payments
router.get('/payments', (req: Request, res: Response) => {
  const { limit = '50', offset = '0' } = req.query;
  const payments = getAll<any>(
    `SELECT p.*, u.username, u.email FROM payments p
     LEFT JOIN users u ON p.user_id = u.id
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  );
  const total = getOne<any>('SELECT COUNT(*) as c FROM payments')?.c || 0;

  res.json({
    data: payments.map(p => ({
      id: p.id,
      userId: p.user_id,
      username: p.username,
      email: p.email,
      amount: p.amount,
      currency: p.currency,
      provider: p.provider,
      planId: p.plan_id,
      status: p.status,
      createdAt: p.created_at,
    })),
    meta: { total }
  });
});

// GET /api/admin/revenue — revenue analytics
router.get('/revenue', (_req: Request, res: Response) => {
  const last30days = getAll<any>(
    `SELECT date(created_at) as day, SUM(amount) as total, COUNT(*) as count
     FROM payments WHERE status = 'completed' AND created_at >= date('now', '-30 days')
     GROUP BY day ORDER BY day`,
    []
  );

  res.json({ data: { daily: last30days } });
});

export default router;
