// pages/settings/settings.js
const app = getApp();
const { apiBase: API } = require('../../utils/config');

Page({
  data: {
    darkMode: false,
    language: 'zh',
    aiProvider: 'MiniMax',
    aiUsage: '0/10',
  },

  onLoad() {
    this.loadUsage();
  },

  async loadUsage() {
    try {
      const res = await wx.request({ url: `${API}/api/subscription/usage`, header: { Authorization: `Bearer ${app.globalData.token}` } });
      const usage = res.data?.data?.usage?.aiChatPerDay;
      if (usage) this.setData({ aiUsage: `${usage.used}/${usage.limit}` });
    } catch (e) {}
  },

  toggleDark(e) { this.setData({ darkMode: e.detail.value }); },
  setLang(e) { this.setData({ language: e.currentTarget.dataset.lang }); },
  goAIConfig() { wx.showToast({ title: '请在 Web 端配置', icon: 'none' }); },
  clearCache() {
    wx.clearStorageSync();
    wx.showToast({ title: '缓存已清除', icon: 'success' });
  },
  about() {
    wx.showModal({ title: 'Vicoo v1.0.0', content: 'AI 驱动的个人知识管理工作台\n\nvicoo.app', showCancel: false });
  },
});
