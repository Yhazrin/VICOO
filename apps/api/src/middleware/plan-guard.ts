/**
 * Plan enforcement middleware.
 * Checks usage limits before allowing AI / feature requests.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getOne, runQuery } from '../db/index.js';
import { getPlan, checkLimit, type PlanLimits } from '../services/plans.js';

function getUserPlan(userId: string) {
  const sub = getOne<any>('SELECT plan_id FROM subscriptions WHERE user_id = ? AND status = ?', [userId, 'active']);
  return getPlan(sub?.plan_id || 'free');
}

function getTodayUsage(userId: string, feature: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const row = getOne<any>(
    'SELECT count FROM usage_tracking WHERE user_id = ? AND date = ? AND feature = ?',
    [userId, today, feature]
  );
  return row?.count || 0;
}

function incrementUsage(userId: string, feature: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const existing = getOne<any>(
    'SELECT id FROM usage_tracking WHERE user_id = ? AND date = ? AND feature = ?',
    [userId, today, feature]
  );
  if (existing) {
    runQuery('UPDATE usage_tracking SET count = count + 1 WHERE id = ?', [existing.id]);
  } else {
    runQuery(
      'INSERT INTO usage_tracking (id, user_id, date, feature, count) VALUES (?, ?, ?, ?, 1)',
      [uuidv4(), userId, today, feature]
    );
  }
}

/**
 * Creates a middleware that checks plan limits for a specific feature.
 */
export function planGuard(feature: keyof PlanLimits) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;
    if (!userId) return next();

    const plan = getUserPlan(userId);
    const usage = getTodayUsage(userId, feature);
    const { allowed, limit, remaining } = checkLimit(plan, feature, usage);

    if (!allowed) {
      return res.status(429).json({
        error: {
          code: 'PLAN_LIMIT_EXCEEDED',
          message: `已达到 ${plan.nameZh} 的每日限额（${limit} 次）。升级到更高级别以获取更多用量。`,
          plan: plan.id,
          feature,
          limit,
          usage,
        }
      });
    }

    // Store increment function for routes to call after success
    (req as any).trackUsage = () => incrementUsage(userId, feature);
    (req as any).currentPlan = plan;
    next();
  };
}

export { getUserPlan, getTodayUsage, incrementUsage };
