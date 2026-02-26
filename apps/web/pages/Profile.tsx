import React, { useState, useEffect, useRef } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { VicooIcon } from '../components/VicooIcon';
import { useApi } from '../contexts/ApiContext';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string;
  provider: string;
  role: string;
  created_at: string;
}

export const Profile: React.FC = () => {
  const { token } = useApi();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const headers = (): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  useEffect(() => {
    fetch('/auth/me', { headers: headers() })
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setUser(d.data);
          setEditForm({ username: d.data.username, bio: d.data.bio || '' });
        }
      })
      .catch(() => {});
  }, [token]);

  const saveProfile = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/auth/profile', {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify(editForm),
      });
      const d = await res.json();
      if (d.data) {
        setUser(prev => prev ? { ...prev, ...d.data } : prev);
        setEditing(false);
        setMsg({ type: 'ok', text: '个人信息已更新' });
      }
    } catch { setMsg({ type: 'err', text: '更新失败' }); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setMsg({ type: 'err', text: '两次输入的新密码不一致' }); return;
    }
    if (pwForm.newPassword.length < 6) {
      setMsg({ type: 'err', text: '新密码至少6位' }); return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/auth/change-password', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: '密码修改成功' });
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMsg({ type: 'err', text: d.error?.message || '修改失败' });
      }
    } catch { setMsg({ type: 'err', text: '请求失败' }); }
    setSaving(false);
  };

  const uploadAvatar = async (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    setSaving(true);
    try {
      const h: Record<string, string> = {};
      if (token) h['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/auth/avatar', { method: 'POST', headers: h, body: fd });
      const d = await res.json();
      if (d.data?.avatar_url) {
        setUser(prev => prev ? { ...prev, avatar_url: d.data.avatar_url } : prev);
        setMsg({ type: 'ok', text: '头像更新成功' });
      }
    } catch { setMsg({ type: 'err', text: '上传失败' }); }
    setSaving(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <VicooIcon name="sync" size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-4xl font-display font-black text-ink dark:text-white mb-8">个人中心</h1>

      {msg && (
        <div className={`mb-6 p-3 rounded-xl border-2 font-bold text-sm ${
          msg.type === 'ok' ? 'bg-green-50 border-green-400 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
          'bg-red-50 border-red-400 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Avatar + Basic Info */}
      <NeoCard className="p-6 mb-6 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border-4 border-ink dark:border-white overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-gray-400">{user.username?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary border-2 border-ink rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <VicooIcon name="edit" size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); }} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-ink dark:text-white">{user.username}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                user.provider === 'google' ? 'bg-blue-100 text-blue-700' :
                user.provider === 'github' ? 'bg-gray-100 text-gray-700' :
                'bg-green-100 text-green-700'
              }`}>
                {user.provider === 'google' ? '🔵 Google' : user.provider === 'github' ? '⚫ GitHub' : '📧 邮箱注册'}
              </span>
              <span className="text-xs text-gray-400">加入于 {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <NeoButton size="sm" onClick={() => setEditing(!editing)}>
            {editing ? '取消' : '编辑资料'}
          </NeoButton>
        </div>
      </NeoCard>

      {/* Edit Profile */}
      {editing && (
        <NeoCard className="p-6 mb-6 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-bold mb-4">编辑个人信息</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">用户名</label>
              <input value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-ink dark:border-gray-600 rounded-xl font-bold bg-light dark:bg-gray-800 text-ink dark:text-white focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">个人简介</label>
              <textarea value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                className="w-full px-4 py-3 border-2 border-ink dark:border-gray-600 rounded-xl font-bold bg-light dark:bg-gray-800 text-ink dark:text-white focus:border-primary focus:outline-none resize-none" />
            </div>
            <NeoButton onClick={saveProfile} disabled={saving}>
              {saving ? '保存中...' : '保存修改'}
            </NeoButton>
          </div>
        </NeoCard>
      )}

      {/* Change Password */}
      {user.provider === 'local' && (
        <NeoCard className="p-6 mb-6 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-bold mb-4">修改密码</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">当前密码</label>
              <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-ink dark:border-gray-600 rounded-xl font-bold bg-light dark:bg-gray-800 text-ink dark:text-white focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">新密码</label>
              <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-ink dark:border-gray-600 rounded-xl font-bold bg-light dark:bg-gray-800 text-ink dark:text-white focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">确认新密码</label>
              <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-ink dark:border-gray-600 rounded-xl font-bold bg-light dark:bg-gray-800 text-ink dark:text-white focus:border-primary focus:outline-none" />
            </div>
            <NeoButton onClick={changePassword} disabled={saving}>
              {saving ? '修改中...' : '修改密码'}
            </NeoButton>
          </div>
        </NeoCard>
      )}

      {/* Subscription */}
      <NeoCard className="p-6 mb-6 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">订阅套餐</h3>
            <p className="text-sm text-gray-500 mt-1">管理你的订阅和用量</p>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: 'pricing' })); }}
            className="px-4 py-2 bg-primary border-2 border-ink rounded-xl font-bold text-sm shadow-neo-sm hover:shadow-neo transition-all">
            查看套餐 →
          </a>
        </div>
      </NeoCard>

      {/* Account Info */}
      <NeoCard className="p-6 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-bold mb-4">账号信息</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <span className="font-bold text-gray-500">用户 ID</span>
            <span className="font-mono text-xs text-gray-400">{user.id}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <span className="font-bold text-gray-500">角色</span>
            <span className="font-bold">{user.role === 'admin' ? '管理员' : '普通用户'}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <span className="font-bold text-gray-500">登录方式</span>
            <span className="font-bold">{user.provider === 'google' ? 'Google' : user.provider === 'github' ? 'GitHub' : '邮箱密码'}</span>
          </div>
        </div>
      </NeoCard>
    </div>
  );
};

export default Profile;
