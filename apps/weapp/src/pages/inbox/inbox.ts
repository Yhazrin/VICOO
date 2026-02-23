// pages/inbox/inbox.ts - Inbox Page (Collection Box)
import api from '../../services/api';

type TabType = 'inbox' | 'clarified' | 'archived';

interface Note {
  id: string;
  title: string;
  content?: string;
  snippet?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  timestamp?: string;
  status?: TabType;
}

interface InboxNote extends Note {
  status?: TabType;
}

Page({
  data: {
    notes: [] as InboxNote[],
    filteredNotes: [] as InboxNote[],
    loading: true,
    activeTab: 'inbox' as TabType,
    tabs: [
      { id: 'inbox', label: 'Inbox', count: 0 },
      { id: 'clarified', label: 'Clarified', count: 0 },
      { id: 'archived', label: 'Archived', count: 0 }
    ] as { id: TabType; label: string; count: number }[]
  },

  onLoad() {
    this.loadNotes();
  },

  onShow() {
    this.loadNotes();
  },

  async loadNotes() {
    this.setData({ loading: true });

    try {
      const res = await api.listNotes({ limit: 100 });
      const notes: InboxNote[] = res.data || [];

      // Calculate tab counts
      const tabCounts = {
        inbox: notes.filter(n => !n.status || n.status === 'inbox').length,
        clarified: notes.filter(n => n.status === 'clarified').length,
        archived: notes.filter(n => n.status === 'archived').length
      };

      this.setData({
        notes,
        tabs: [
          { id: 'inbox', label: 'Inbox', count: tabCounts.inbox },
          { id: 'clarified', label: 'Clarified', count: tabCounts.clarified },
          { id: 'archived', label: 'Archived', count: tabCounts.archived }
        ],
        loading: false
      });

      this.applyFilter();
    } catch (error: any) {
      console.error('Failed to load notes:', error);
      wx.showToast({
        title: error?.message || 'Load failed',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  setActiveTab(e: any) {
    const tabId = e.currentTarget.dataset.tab as TabType;
    this.setData({ activeTab: tabId });
    this.applyFilter();
  },

  applyFilter() {
    const { notes, activeTab } = this.data;
    
    let filtered = notes.filter(note => {
      const status = note.status || 'inbox';
      return status === activeTab;
    });

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0).getTime();
      const dateB = new Date(b.timestamp || 0).getTime();
      return dateB - dateA;
    });

    this.setData({ filteredNotes: filtered });
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

  goToEditor(e: any) {
    const noteId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/editor/editor?id=${noteId}`
    });
  },

  async handleStatusChange(e: any) {
    const { id, status } = e.currentTarget.dataset;
    const newStatus = status as TabType;

    try {
      await api.updateNote(id, { status: newStatus } as any);
      wx.showToast({ title: 'Updated' });
      this.loadNotes();
    } catch (error: any) {
      wx.showToast({ title: error?.message || 'Update failed', icon: 'none' });
    }
  },

  async handleDelete(e: any) {
    const noteId = e.currentTarget.dataset.id;

    wx.showModal({
      title: 'Delete Note',
      content: 'Are you sure you want to delete this note?',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteNote(noteId);
            wx.showToast({ title: 'Deleted' });
            this.loadNotes();
          } catch (error: any) {
            wx.showToast({ title: error?.message || 'Delete failed', icon: 'none' });
          }
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: 'Vicoo Inbox',
      path: '/pages/inbox/inbox'
    };
  }
});
