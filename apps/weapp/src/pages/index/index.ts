// pages/index/index.ts - Vicoo Dashboard (Home)
import api from '../../services/api';
import type { Note } from '@vicoo/types';

Page({
  data: {
    notes: [] as Note[],
    recentNotes: [] as Note[],
    stats: {
      total: 0,
      ideas: 0,
      code: 0,
      design: 0,
      meeting: 0
    },
    loading: true,
    version: '1.0.0'
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      // Check health
      const health = await api.getHealth();
      this.setData({ version: health.data.version });

      // Get notes
      const res = await api.listNotes({ limit: 10 });
      const notes = res.data;

      // Calculate stats
      const stats = {
        total: notes.length,
        ideas: notes.filter(n => n.category === 'idea').length,
        code: notes.filter(n => n.category === 'code').length,
        design: notes.filter(n => n.category === 'design').length,
        meeting: notes.filter(n => n.category === 'meeting').length
      };

      this.setData({
        notes,
        recentNotes: notes.slice(0, 5),
        stats,
        loading: false
      });
    } catch (error: any) {
      console.error('Failed to load data:', error);
      wx.showToast({
        title: error.message || 'Load failed',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  goToLibrary() {
    wx.switchTab({ url: '/pages/library/library' });
  },

  goToSearch() {
    wx.switchTab({ url: '/pages/search/search' });
  },

  goToEditor(e: any) {
    const noteId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/editor/editor?id=${noteId}`
    });
  },

  createNote() {
    wx.navigateTo({
      url: '/pages/editor/editor'
    });
  },

  onShareAppMessage() {
    return {
      title: 'Vicoo - Your Visual Coordinator',
      path: '/pages/index/index'
    };
  }
});
