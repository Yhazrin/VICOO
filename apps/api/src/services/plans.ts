/**
 * Vicoo SaaS Plan Configuration
 * Defines feature limits for each subscription tier.
 */

export type PlanId = 'free' | 'pro' | 'team';

export interface PlanLimits {
  maxNotes: number;
  aiChatPerDay: number;
  aiSummaryPerDay: number;
  aiGraphPerDay: number;
  aiWriterPerDay: number;
  maxPublishPlatforms: number;
  maxStorageMB: number;
  maxPublishedPosts: number;
  maxTeamMembers: number;
  exportFormats: string[];
  customDomain: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  nameZh: string;
  priceMonthly: number;  // cents (分)
  priceYearly: number;   // cents
  limits: PlanLimits;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    nameZh: '免费版',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      maxNotes: 50,
      aiChatPerDay: 10,
      aiSummaryPerDay: 5,
      aiGraphPerDay: 1,
      aiWriterPerDay: 3,
      maxPublishPlatforms: 2,
      maxStorageMB: 100,
      maxPublishedPosts: 3,
      maxTeamMembers: 0,
      exportFormats: ['json'],
      customDomain: false,
    },
    features: ['50 条笔记', '每日 10 次 AI 聊天', '基础知识图谱', '2 个发布平台', '100MB 存储'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameZh: '专业版',
    priceMonthly: 2900, // ¥29
    priceYearly: 29000, // ¥290 (≈¥24/月)
    limits: {
      maxNotes: -1, // unlimited
      aiChatPerDay: 200,
      aiSummaryPerDay: 100,
      aiGraphPerDay: 20,
      aiWriterPerDay: 50,
      maxPublishPlatforms: 7,
      maxStorageMB: 5120,
      maxPublishedPosts: -1,
      maxTeamMembers: 0,
      exportFormats: ['json', 'markdown'],
      customDomain: false,
    },
    features: ['无限笔记', '每日 200 次 AI 聊天', '高级知识图谱', '全平台发布', '5GB 存储', '邮件支持'],
  },
  team: {
    id: 'team',
    name: 'Team',
    nameZh: '团队版',
    priceMonthly: 9900, // ¥99
    priceYearly: 99000, // ¥990 (≈¥82.5/月)
    limits: {
      maxNotes: -1,
      aiChatPerDay: -1,
      aiSummaryPerDay: -1,
      aiGraphPerDay: -1,
      aiWriterPerDay: -1,
      maxPublishPlatforms: 7,
      maxStorageMB: 51200,
      maxPublishedPosts: -1,
      maxTeamMembers: 10,
      exportFormats: ['json', 'markdown', 'csv', 'pdf'],
      customDomain: true,
    },
    features: ['一切 Pro 功能', '无限 AI 用量', '10 人团队协作', '50GB 存储', '自定义域名', '专属支持群'],
  },
};

export function getPlan(planId: string): Plan {
  return PLANS[planId as PlanId] || PLANS.free;
}

export function checkLimit(plan: Plan, feature: keyof PlanLimits, currentUsage: number): { allowed: boolean; limit: number; remaining: number } {
  const limit = plan.limits[feature] as number;
  if (limit === -1) return { allowed: true, limit: -1, remaining: -1 };
  return { allowed: currentUsage < limit, limit, remaining: Math.max(0, limit - currentUsage) };
}
