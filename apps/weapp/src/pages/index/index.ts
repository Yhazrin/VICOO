// pages/index/index.ts - Vicoo Dashboard (Home)
import api from '../../services/api';

interface Note {
  id: string;
  title: string;
  content?: string;
  snippet?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  timestamp?: string;
}

interface Stats {
  total: number;
  ideas: number;
  code: number;
  design: number;
  meeting: number;
}

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
    } as Stats,
    loading: true,
    version: '1.0.0',
    // Navigation items matching web sidebar
    navItems: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: true },
      { id: 'projects', label: 'Projects', icon: 'view_kanban' },
      { id: 'editor', label: 'Write', icon: 'edit_note' },
      { id: 'ai', label: 'AI Assistant', icon: 'psychology' },
    ] as const
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
      // Get API health/version
      const health = await api.getHealth();
      this.setData({ version: health.data?.version || '1.0.0' });

      // Get notes
      const res = await api.listNotes({ limit: 20 });
      const notes = res.data || [];

      // Calculate stats
      const stats = {
        total: notes.length,
        ideas: notes.filter((n: Note) => n.category === 'idea').length,
        code: notes.filter((n: Note) => n.category === 'code').length,
        design: notes.filter((n: Note) => n.category === 'design').length,
        meeting: notes.filter((n: Note) => n.category === 'meeting').length
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
        title: error?.message || 'Load failed',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // Navigation handlers
  goToLibrary() {
    wx.switchTab({ url: '/pages/library/library' });
  },

  goToSearch() {
    wx.switchTab({ url: '/pages/search/search' });
  },

  goToProjects() {
    wx.navigateTo({ url: '/pages/projects/projects' });
  },

  goToAI() {
    wx.navigateTo({ url: '/pages/ai/ai' });
  },

  goToInbox() {
    wx.navigateTo({ url: '/pages/inbox/inbox' });
  },

  goToEditor(e: any) {
    const noteId = e.currentTarget.dataset.id;
    if (noteId) {
      wx.navigateTo({
        url: `/pages/editor/editor?id=${noteId}`
      });
    } else {
      wx.navigateTo({ url: '/pages/editor/editor' });
    }
  },

  createNote() {
    wx.navigateTo({
      url: '/pages/editor/editor'
    });
  },

  // Format date
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  },

  onShareAppMessage() {
    return {
      title: 'Vicoo - Your Visual Coordinator',
      path: '/pages/index/index'
    };
  }
});
