import React, { useState, useEffect, useCallback } from 'react';

const API = '';

interface DashboardData {
  totalUsers: number;
  totalNotes: number;
  activeSubscriptions: number;
  totalRevenue: number;
  todayNewUsers: number;
  todayRevenue: number;
  planBreakdown: Array<{ plan: string; count: number }>;
}

interface User {
  id: string;
  username: string;
  email: string;
  provider: string;
  role: string;
  plan: string;
  subStatus: string;
  createdAt: string;
}

interface Payment {
  id: string;
  username: string;
  email: string;
  amount: number;
  provider: string;
  planId: string;
  status: string;
  createdAt: string;
}

type Tab = 'dashboard' | 'users' | 'payments' | 'plans';

function App() {
  const [token, setToken] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const headers = useCallback((): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const handleLogin = async () => {
    setLoginError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.data?.token) {
        setToken(data.data.token);
        setLoggedIn(true);
      } else {
        setLoginError(data.error?.message || '登录失败');
      }
    } catch {
      setLoginError('网络错误');
    }
  };

  // Load dashboard
  useEffect(() => {
    if (!loggedIn) return;
    fetch(`${API}/api/admin/dashboard`, { headers: headers() })
      .then(r => r.json())
      .then(d => setDashboard(d.data))
      .catch(() => {});
  }, [loggedIn, headers]);

  // Load users
  useEffect(() => {
    if (!loggedIn || tab !== 'users') return;
    const url = userSearch
      ? `${API}/api/admin/users?search=${encodeURIComponent(userSearch)}`
      : `${API}/api/admin/users`;
    fetch(url, { headers: headers() })
      .then(r => r.json())
      .then(d => setUsers(d.data || []))
      .catch(() => {});
  }, [loggedIn, tab, userSearch, headers]);

  // Load payments
  useEffect(() => {
    if (!loggedIn || tab !== 'payments') return;
    fetch(`${API}/api/admin/payments`, { headers: headers() })
      .then(r => r.json())
      .then(d => setPayments(d.data || []))
      .catch(() => {});
  }, [loggedIn, tab, headers]);

  const updateUserRole = async (userId: string, role: string) => {
    await fetch(`${API}/api/admin/users/${userId}`, {
      method: 'PATCH', headers: headers(), body: JSON.stringify({ role }),
    });
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
  };

  const updateUserPlan = async (userId: string, planId: string) => {
    await fetch(`${API}/api/admin/users/${userId}`, {
      method: 'PATCH', headers: headers(), body: JSON.stringify({ planId }),
    });
    setUsers(users.map(u => u.id === userId ? { ...u, plan: planId } : u));
  };

  // --- Login Screen ---
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-black text-center mb-1">Vicoo Admin</h1>
          <p className="text-sm text-gray-500 text-center mb-6">运营管理后台</p>
          {loginError && <p className="text-red-600 text-sm font-bold mb-3 bg-red-50 p-2 rounded-lg">{loginError}</p>}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="管理员邮箱"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 font-bold focus:border-blue-500 focus:outline-none" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-4 font-bold focus:border-blue-500 focus:outline-none" />
          <button onClick={handleLogin}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">
            登录
          </button>
        </div>
      </div>
    );
  }

  // --- Admin Dashboard ---
  const PLAN_COLORS: Record<string, string> = { free: 'bg-gray-100 text-gray-700', pro: 'bg-blue-100 text-blue-700', team: 'bg-purple-100 text-purple-700' };
  const PLAN_NAMES: Record<string, string> = { free: '免费版', pro: '专业版', team: '团队版' };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black">Vicoo</span>
          <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <button onClick={() => { setLoggedIn(false); setToken(''); }}
          className="text-sm font-bold text-gray-500 hover:text-red-500">退出</button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-49px)] p-4 space-y-1">
          {([['dashboard', '📊', '概览'], ['users', '👥', '用户管理'], ['payments', '💳', '订单管理'], ['plans', '📋', '套餐配置']] as const).map(([id, icon, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors ${tab === id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-6">
          {/* Dashboard */}
          {tab === 'dashboard' && dashboard && (
            <div>
              <h2 className="text-2xl font-black mb-6">运营概览</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: '总用户', value: dashboard.totalUsers, color: 'bg-blue-500' },
                  { label: '付费用户', value: dashboard.activeSubscriptions, color: 'bg-green-500' },
                  { label: '总收入', value: `¥${(dashboard.totalRevenue / 100).toFixed(2)}`, color: 'bg-amber-500' },
                  { label: '总笔记', value: dashboard.totalNotes, color: 'bg-purple-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm font-bold text-gray-500 mb-1">{s.label}</p>
                    <p className="text-3xl font-black">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold mb-4">套餐分布</h3>
                <div className="flex gap-4">
                  {dashboard.planBreakdown.map(p => (
                    <div key={p.plan} className="flex-1 text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-black">{p.count}</p>
                      <p className="text-sm font-bold text-gray-500">{PLAN_NAMES[p.plan] || p.plan}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">用户管理</h2>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="搜索用户..."
                  className="border-2 border-gray-200 rounded-xl px-4 py-2 font-bold text-sm w-64 focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold">用户</th>
                      <th className="text-left px-4 py-3 font-bold">邮箱</th>
                      <th className="text-left px-4 py-3 font-bold">登录方式</th>
                      <th className="text-left px-4 py-3 font-bold">套餐</th>
                      <th className="text-left px-4 py-3 font-bold">角色</th>
                      <th className="text-left px-4 py-3 font-bold">注册时间</th>
                      <th className="text-left px-4 py-3 font-bold">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold">{u.username}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3"><span className="text-xs font-bold">{u.provider}</span></td>
                        <td className="px-4 py-3">
                          <select value={u.plan} onChange={e => updateUserPlan(u.id, e.target.value)}
                            className={`text-xs font-bold px-2 py-1 rounded-lg border-0 ${PLAN_COLORS[u.plan] || ''}`}>
                            <option value="free">免费版</option>
                            <option value="pro">专业版</option>
                            <option value="team">团队版</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)}
                            className="text-xs font-bold px-2 py-1 rounded-lg border border-gray-200">
                            <option value="user">用户</option>
                            <option value="admin">管理员</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{u.createdAt?.slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          <button className="text-xs text-red-500 font-bold hover:underline">删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <div>
              <h2 className="text-2xl font-black mb-6">订单管理</h2>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold">订单号</th>
                      <th className="text-left px-4 py-3 font-bold">用户</th>
                      <th className="text-left px-4 py-3 font-bold">金额</th>
                      <th className="text-left px-4 py-3 font-bold">支付方式</th>
                      <th className="text-left px-4 py-3 font-bold">套餐</th>
                      <th className="text-left px-4 py-3 font-bold">状态</th>
                      <th className="text-left px-4 py-3 font-bold">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400">暂无订单</td></tr>
                    ) : payments.map(p => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3 font-bold">{p.username}</td>
                        <td className="px-4 py-3 font-black text-green-600">¥{(p.amount / 100).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs font-bold">{p.provider === 'wechat' ? '微信' : p.provider === 'alipay' ? '支付宝' : p.provider}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-lg ${PLAN_COLORS[p.planId] || ''}`}>{PLAN_NAMES[p.planId] || p.planId}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-lg ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status === 'completed' ? '已完成' : '待支付'}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{p.createdAt?.slice(0, 16)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Plans */}
          {tab === 'plans' && (
            <div>
              <h2 className="text-2xl font-black mb-6">套餐配置</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['free', 'pro', 'team'].map(planId => {
                  const plan = { free: { name: '免费版', price: '¥0', features: ['50条笔记', '10次/天AI', '2个平台', '100MB'] }, pro: { name: '专业版', price: '¥29/月', features: ['无限笔记', '200次/天AI', '全平台', '5GB', '邮件支持'] }, team: { name: '团队版', price: '¥99/月', features: ['无限笔记', '无限AI', '10人团队', '50GB', '专属支持'] } }[planId]!;
                  return (
                    <div key={planId} className={`bg-white rounded-2xl border-2 p-6 ${planId === 'pro' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                      <h3 className="text-xl font-black mb-1">{plan.name}</h3>
                      <p className="text-3xl font-black text-blue-600 mb-4">{plan.price}</p>
                      <ul className="space-y-2">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm"><span className="text-green-500">✓</span>{f}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
