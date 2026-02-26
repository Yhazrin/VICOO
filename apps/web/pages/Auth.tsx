import React, { useState } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mascot } from '../components/Mascot';
import { VicooIcon } from '../components/VicooIcon';
import { useApi } from '../contexts/ApiContext';

interface AuthProps { onLogin: () => void }
type AuthMode = 'login' | 'register';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { setToken } = useApi();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'thinking' | 'happy' | 'sad'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', username: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMascotState('thinking');
    setError(null);

    try {
      if (mode === 'register') {
        if (form.password !== form.confirmPassword) throw new Error('两次输入的密码不一致');
        if (form.password.length < 6) throw new Error('密码至少6位');
        if (!form.username.trim()) throw new Error('请输入用户名');

        const res = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || '注册失败');

        setToken(data.data.token);
        localStorage.setItem('vicoo_user', JSON.stringify(data.data.user));
      } else {
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || '登录失败');

        setToken(data.data.token);
        localStorage.setItem('vicoo_user', JSON.stringify(data.data.user));
      }

      setMascotState('happy');
      setTimeout(() => { setLoading(false); onLogin(); }, 400);
    } catch (err: any) {
      setError(err.message);
      setMascotState('sad');
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    window.location.href = `/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-light dark:bg-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-10 dark:opacity-5 pointer-events-none" />
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full opacity-20 blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-accent rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Left: branding */}
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
          <h1 className="text-7xl font-display font-black text-ink dark:text-white tracking-tight">vicoo</h1>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-bold text-gray-500 tracking-widest uppercase">Visual Core</span>
          </div>
          <Mascot state={mascotState} className="w-40 h-40" />
          <p className="text-xl font-bold text-ink dark:text-white">
            {mode === 'login' ? '欢迎回来！' : '开启知识之旅'}
          </p>
          <p className="text-gray-500 font-medium max-w-sm">
            {mode === 'login' ? '你的第二大脑在等你。' : 'AI 驱动的知识管理，从这里开始。'}
          </p>
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center">
          <NeoCard className="w-full max-w-md p-8" color="white">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-display font-black text-ink dark:text-white mb-1">
                {mode === 'login' ? '登录' : '注册'}
              </h2>
              <span className="text-sm text-gray-500">
                {mode === 'login' ? '没有账号？' : '已有账号？'}
                <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                  className="text-primary font-bold hover:underline ml-1">
                  {mode === 'login' ? '去注册' : '去登录'}
                </button>
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 rounded-xl">
                <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-black text-ink dark:text-gray-200 mb-1 uppercase tracking-wider">用户名</label>
                  <input name="username" value={form.username} onChange={handleChange} required
                    placeholder="你的昵称"
                    className="w-full px-4 py-3 bg-light dark:bg-gray-900 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-ink dark:text-white focus:border-primary focus:outline-none" />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-ink dark:text-gray-200 mb-1 uppercase tracking-wider">邮箱</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-light dark:bg-gray-900 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-ink dark:text-white focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-black text-ink dark:text-gray-200 mb-1 uppercase tracking-wider">密码</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-light dark:bg-gray-900 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-ink dark:text-white focus:border-primary focus:outline-none" />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-black text-ink dark:text-gray-200 mb-1 uppercase tracking-wider">确认密码</label>
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-light dark:bg-gray-900 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-ink dark:text-white focus:border-primary focus:outline-none" />
                </div>
              )}

              <NeoButton type="submit" className="w-full py-4 text-lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <VicooIcon name="sync" size={20} className="animate-spin" />
                    {mode === 'login' ? '登录中...' : '注册中...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {mode === 'login' ? '登录' : '注册'}
                    <VicooIcon name="arrow_forward" size={20} />
                  </span>
                )}
              </NeoButton>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-gray-200 dark:border-gray-700" /></div>
                <div className="relative flex justify-center"><span className="px-4 bg-white dark:bg-gray-800 text-gray-400 text-xs font-bold">或者</span></div>
              </div>

              {/* OAuth */}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => handleOAuth('google')}
                  className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09A6.97 6.97 0 0 1 5.49 12c0-.72.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </button>
                <button type="button" onClick={() => handleOAuth('github')}
                  className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
                </button>
              </div>
            </form>
          </NeoCard>
        </div>
      </div>
    </div>
  );
};
