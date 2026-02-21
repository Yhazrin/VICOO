// pages/search/search.ts - Search Page
import api from '../../services/api';
import type { Note } from '@vicoo/types';

Page({
  data: {
    query: '',
    results: [] as Note[],
    recentSearches: [] as string[],
    searching: false,
    searched: false
  },

  onLoad() {
    const recent = wx.getStorageSync('recent_searches') || [];
    this.setData({ recentSearches: recent });
  },

  onSearch(e: any) {
    const query = e.detail.value;
    this.setData({ query });

    if (query.trim().length > 0) {
      this.performSearch(query);
    } else {
      this.setData({ results: [], searched: false });
    }
  },

  onSearchConfirm(e: any) {
    const query = e.detail.value;
    this.setData({ query });
    if (query.trim()) {
      this.performSearch(query);
    }
  },

  async performSearch(query: string) {
    this.setData({ searching: true, searched: true });

    try {
      const res = await api.listNotes({ limit: 50 });
      const notes = res.data;

      // Filter locally
      const q = query.toLowerCase();
      const results = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        n.tags.some(t => t.toLowerCase().includes(q)) ||
        n.category.toLowerCase().includes(q)
      );

      this.setData({ results, searching: false });

      // Save to recent
      if (!this.data.recentSearches.includes(query)) {
        const recent = [query, ...this.data.recentSearches.slice(0, 4)];
        this.setData({ recentSearches: recent });
        wx.setStorageSync('recent_searches', recent);
      }
    } catch (error: any) {
      wx.showToast({
        title: error.message || 'Search failed',
        icon: 'none'
      });
      this.setData({ searching: false });
    }
  },

  clearSearch() {
    this.setData({
      query: '',
      results: [],
      searched: false
    });
  },

  goToNote(e: any) {
    const noteId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/editor/editor?id=${noteId}`
    });
  },

  useRecent(e: any) {
    const query = e.currentTarget.dataset.query;
    this.setData({ query });
    this.performSearch(query);
  }
});
