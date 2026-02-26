/**
 * Subscription & Payment API Routes
 *
 * GET  /api/subscription          — current subscription status
 * GET  /api/subscription/plans    — available plans
 * GET  /api/subscription/usage    — today's usage stats
 * POST /api/subscription/checkout — create payment session (Stripe/WeChat/Alipay)
 * POST /api/subscription/webhook  — payment provider webhook
 * POST /api/subscription/cancel   — cancel subscription
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getOne, getAll, runQuery, saveDatabase } from '../db/index.js';
import { PLANS, getPlan, type PlanId } from '../services/plans.js';
import { getUserPlan, getTodayUsage } from '../middleware/plan-guard.js';

const router = Router();

// GET /api/subscription — current user's subscription
router.get('/', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const sub = getOne<any>('SELECT * FROM subscriptions WHERE user_id = ?', [userId]);
  const plan = getPlan(sub?.plan_id || 'free');

  res.json({
    data: {
      plan: plan.id,
      planName: plan.nameZh,
      status: sub?.status || 'active',
      currentPeriodEnd: sub?.current_period_end || null,
      cancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
      features: plan.features,
      limits: plan.limits,
    }
  });
});

// GET /api/subscription/plans — all available plans
router.get('/plans', (_req: Request, res: Response) => {
  res.json({
    data: Object.values(PLANS).map(p => ({
      id: p.id,
      name: p.name,
      nameZh: p.nameZh,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      features: p.features,
      limits: p.limits,
    }))
  });
});

// GET /api/subscription/usage — today's usage for current user
router.get('/usage', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const plan = getUserPlan(userId);
  const today = new Date().toISOString().slice(0, 10);

  const usageRows = getAll<any>(
    'SELECT feature, count FROM usage_tracking WHERE user_id = ? AND date = ?',
    [userId, today]
  );

  const usage: Record<string, { used: number; limit: number; remaining: number }> = {};
  const features = ['aiChatPerDay', 'aiSummaryPerDay', 'aiGraphPerDay', 'aiWriterPerDay'];

  for (const f of features) {
    const row = usageRows.find(r => r.feature === f);
    const used = row?.count || 0;
    const limit = (plan.limits as any)[f] as number;
    usage[f] = { used, limit, remaining: limit === -1 ? -1 : Math.max(0, limit - used) };
  }

  res.json({ data: { plan: plan.id, planName: plan.nameZh, date: today, usage } });
});

// POST /api/subscription/checkout — initiate payment
router.post('/checkout', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { planId, billingPeriod = 'monthly', paymentMethod = 'stripe' } = req.body;

  if (!planId || !PLANS[planId as PlanId]) {
    return res.status(400).json({ error: { code: 'INVALID_PLAN', message: '无效的订阅计划' } });
  }

  const plan = PLANS[planId as PlanId];
  const amount = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;

  if (amount === 0) {
    return res.status(400).json({ error: { code: 'FREE_PLAN', message: '免费版无需付费' } });
  }

  const paymentId = uuidv4();

  // Create payment record
  runQuery(
    `INSERT INTO payments (id, user_id, amount, currency, provider, plan_id, billing_period, status)
     VALUES (?, ?, ?, 'CNY', ?, ?, ?, 'pending')`,
    [paymentId, userId, amount, paymentMethod, planId, billingPeriod]
  );
  saveDatabase();

  // Generate checkout info based on payment method
  let checkoutData: any = { paymentId, amount, currency: 'CNY' };

  switch (paymentMethod) {
    case 'stripe':
      // In production: create Stripe Checkout Session
      checkoutData.type = 'redirect';
      checkoutData.message = 'Stripe 支付未配置。请设置 STRIPE_SECRET_KEY 环境变量。';
      checkoutData.configured = !!process.env.STRIPE_SECRET_KEY;
      if (process.env.STRIPE_SECRET_KEY) {
        // Would create real Stripe session here
        checkoutData.url = `https://checkout.stripe.com/pay/${paymentId}`;
      }
      break;

    case 'wechat':
      // In production: call WeChat Pay API to generate QR code
      checkoutData.type = 'qrcode';
      checkoutData.message = '微信支付未配置。请设置 WECHAT_PAY_APP_ID 和 WECHAT_PAY_MCH_ID。';
      checkoutData.configured = !!process.env.WECHAT_PAY_APP_ID;
      checkoutData.qrcodeUrl = null; // Would be a QR code image URL
      break;

    case 'alipay':
      // In production: call Alipay API
      checkoutData.type = 'redirect';
      checkoutData.message = '支付宝未配置。请设置 ALIPAY_APP_ID 和 ALIPAY_PRIVATE_KEY。';
      checkoutData.configured = !!process.env.ALIPAY_APP_ID;
      checkoutData.url = null;
      break;

    default:
      return res.status(400).json({ error: { code: 'INVALID_PROVIDER', message: '不支持的支付方式' } });
  }

  res.json({ data: checkoutData });
});

// POST /api/subscription/webhook — payment callback
router.post('/webhook', async (req: Request, res: Response) => {
  const { paymentId, status, providerPaymentId } = req.body;

  if (!paymentId) {
    return res.status(400).json({ error: { code: 'INVALID', message: 'Missing paymentId' } });
  }

  const payment = getOne<any>('SELECT * FROM payments WHERE id = ?', [paymentId]);
  if (!payment) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Payment not found' } });
  }

  // Update payment status
  runQuery(
    `UPDATE payments SET status = ?, provider_payment_id = ?, metadata = ? WHERE id = ?`,
    [status || 'completed', providerPaymentId || null, JSON.stringify(req.body), paymentId]
  );

  if (status === 'completed' || status === 'succeeded') {
    // Activate subscription
    const now = new Date();
    const periodEnd = new Date(now);
    if (payment.billing_period === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const existingSub = getOne<any>('SELECT id FROM subscriptions WHERE user_id = ?', [payment.user_id]);
    if (existingSub) {
      runQuery(
        `UPDATE subscriptions SET plan_id = ?, status = 'active', payment_provider = ?, payment_id = ?,
         current_period_start = ?, current_period_end = ?, cancel_at_period_end = 0, updated_at = datetime('now')
         WHERE user_id = ?`,
        [payment.plan_id, payment.provider, paymentId, now.toISOString(), periodEnd.toISOString(), payment.user_id]
      );
    } else {
      runQuery(
        `INSERT INTO subscriptions (id, user_id, plan_id, status, payment_provider, payment_id, current_period_start, current_period_end)
         VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`,
        [uuidv4(), payment.user_id, payment.plan_id, payment.provider, paymentId, now.toISOString(), periodEnd.toISOString()]
      );
    }
    saveDatabase();
  }

  res.json({ data: { success: true } });
});

// POST /api/subscription/cancel — cancel subscription
router.post('/cancel', (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const sub = getOne<any>('SELECT * FROM subscriptions WHERE user_id = ?', [userId]);
  if (!sub || sub.plan_id === 'free') {
    return res.status(400).json({ error: { code: 'NO_SUBSCRIPTION', message: '没有活跃的付费订阅' } });
  }

  runQuery(
    `UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = datetime('now') WHERE user_id = ?`,
    [userId]
  );
  saveDatabase();

  res.json({
    data: {
      message: `订阅将在 ${sub.current_period_end} 到期后取消`,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: sub.current_period_end,
    }
  });
});

// GET /api/subscription/payments — payment history
router.get('/payments', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const payments = getAll<any>(
    'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    [userId]
  );

  res.json({
    data: payments.map(p => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      provider: p.provider,
      planId: p.plan_id,
      billingPeriod: p.billing_period,
      status: p.status,
      createdAt: p.created_at,
    }))
  });
});

export default router;
