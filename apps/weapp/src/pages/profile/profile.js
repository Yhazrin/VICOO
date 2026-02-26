// pages/profile/profile.js
const app = getApp();
const { apiBase: API } = require('../../utils/config');

Page({
  data: {
    user: { username: '', email: '', id: '', role: 'user', provider: 'local' },
    subscription: { planName: '免费版', plan: 'free' },
  },

  onLoad() {
    this.loadUser();
    this.loadSubscription();
  },

  async loadUser() {
    try {
      const res = await wx.request({ url: `${API}/auth/me`, header: { Authorization: `Bearer ${app.globalData.token}` } });
      if (res.data?.data) this.setData({ user: res.data.data });
    } catch (e) { console.error('Load user failed:', e); }
  },

  async loadSubscription() {
    try {
      const res = await wx.request({ url: `${API}/api/subscription`, header: { Authorization: `Bearer ${app.globalData.token}` } });
      if (res.data?.data) this.setData({ subscription: res.data.data });
    } catch (e) {}
  },

  editProfile() { wx.showToast({ title: '请在 Web 端编辑', icon: 'none' }); },
  goSettings() { wx.navigateTo({ url: '/pages/settings/settings' }); },
  goPricing() { wx.showToast({ title: '请在 Web 端管理订阅', icon: 'none' }); },
  exportData() { wx.showToast({ title: '请在 Web 端导出', icon: 'none' }); },
});
