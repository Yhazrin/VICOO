import React, { useState, useEffect } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { VicooIcon } from '../components/VicooIcon';
import { useApi } from '../contexts/ApiContext';

interface Plan {
  id: string;
  nameZh: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
}

export const Pricing: React.FC = () => {
  const { token } = useApi();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);

  const headers = (): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  useEffect(() => {
    fetch('/api/subscription/plans', { headers: headers() })
      .then(r => r.json()).then(d => setPlans(d.data || [])).catch(() => {});
    fetch('/api/subscription', { headers: headers() })
      .then(r => r.json()).then(d => setCurrentPlan(d.data?.plan || 'free')).catch(() => {});
  }, [token]);

  const handleUpgrade = async (planId: string, method: string) => {
    setCheckoutMsg(null);
    const res = await fetch('/api/subscription/checkout', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ planId, billingPeriod: billing, paymentMethod: method }),
    });
    const d = await res.json();
    if (d.data?.url) {
      window.location.href = d.data.url;
    } else {
      setCheckoutMsg(d.data?.message || d.error?.message || '支付通道准备中');
    }
  };

  const PLAN_STYLES: Record<string, { border: string; badge: string; icon: string }> = {
    free: { border: 'border-gray-300', badge: '', icon: '🌱' },
    pro:  { border: 'border-blue-400 ring-2 ring-blue-100', badge: '🔥 最受欢迎', icon: '⚡' },
    team: { border: 'border-purple-400', badge: '', icon: '🚀' },
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-display font-black text-ink dark:text-white mb-3">选择你的计划</h1>
        <p className="text-gray-500 font-medium mb-6">释放 AI 知识管理的全部潜力</p>
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${billing === 'monthly' ? 'bg-white dark:bg-gray-700 shadow-sm text-ink dark:text-white' : 'text-gray-500'}`}>
            月付
          </button>
          <button onClick={() => setBilling('yearly')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${billing === 'yearly' ? 'bg-white dark:bg-gray-700 shadow-sm text-ink dark:text-white' : 'text-gray-500'}`}>
            年付 <span className="text-green-600 text-xs ml-1">省 17%</span>
          </button>
        </div>
      </div>

      {checkoutMsg && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 rounded-xl text-sm font-bold text-amber-700 dark:text-amber-400">
          {checkoutMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const style = PLAN_STYLES[plan.id] || PLAN_STYLES.free;
          const price = billing === 'yearly' ? plan.priceYearly : plan.priceMonthly;
          const monthlyPrice = billing === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;
          const isCurrent = currentPlan === plan.id;

          return (
            <NeoCard key={plan.id} className={`p-6 bg-white dark:bg-gray-900 relative ${style.border}`}>
              {style.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-black px-4 py-1 rounded-full">
                  {style.badge}
                </div>
              )}
              <div className="text-center mb-6">
                <span className="text-3xl">{style.icon}</span>
                <h3 className="text-xl font-black text-ink dark:text-white mt-2">{plan.nameZh}</h3>
                <div className="mt-3">
                  {price === 0 ? (
                    <span className="text-3xl font-black text-ink dark:text-white">免费</span>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-ink dark:text-white">¥{monthlyPrice / 100}</span>
                      <span className="text-sm text-gray-500">/月</span>
                    </>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <VicooIcon name="check_circle" size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-3 text-center bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-500">
                  当前计划
                </div>
              ) : price === 0 ? null : (
                <div className="space-y-2">
                  <NeoButton className="w-full" onClick={() => handleUpgrade(plan.id, 'stripe')}>
                    银行卡支付
                  </NeoButton>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleUpgrade(plan.id, 'wechat')}
                      className="py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors">
                      微信支付
                    </button>
                    <button onClick={() => handleUpgrade(plan.id, 'alipay')}
                      className="py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors">
                      支付宝
                    </button>
                  </div>
                </div>
              )}
            </NeoCard>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;
