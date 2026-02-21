// pages/editor/editor.ts - Note Editor
import api from '../../services/api';
import type { Note, NoteCreate, NoteUpdate } from '@vicoo/types';

Page({
  data: {
    noteId: null as string | null,
    title: '',
    content: '',
    category: 'idea' as 'idea' | 'code' | 'design' | 'meeting',
    tags: [] as string[],
    published: false,
    saving: false,
    categories: [
      { value: 'idea', label: '💡 Idea' },
      { value: 'code', label: '💻 Code' },
      { value: 'design', label: '🎨 Design' },
      { value: 'meeting', label: '📅 Meeting' }
    ]
  },

  onLoad(options: { id?: string }) {
    if (options.id) {
      this.setData({ noteId: options.id });
      this.loadNote(options.id);
    }
  },

  async loadNote(id: string) {
    wx.showLoading({ title: 'Loading...' });

    try {
      const res = await api.getNote(id);
      const note = res.data;
      this.setData({
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags,
        published: note.published
      });
    } catch (error: any) {
      wx.showToast({
        title: error.message || 'Failed to load note',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  onTitleChange(e: any) {
    this.setData({ title: e.detail.value });
  },

  onContentChange(e: any) {
    this.setData({ content: e.detail.value });
  },

  setCategory(e: any) {
    this.setData({ category: e.currentTarget.dataset.value });
  },

  togglePublished() {
    this.setData({ published: !this.data.published });
  },

  addTag() {
    wx.showModal({
      title: 'Add Tag',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content) {
          const tag = res.content.trim().toLowerCase();
          if (tag && !this.data.tags.includes(tag)) {
            this.setData({
              tags: [...this.data.tags, tag]
            });
          }
        }
      }
    });
  },

  removeTag(e: any) {
    const index = e.currentTarget.dataset.index;
    const tags = [...this.data.tags];
    tags.splice(index, 1);
    this.setData({ tags });
  },

  async saveNote() {
    if (!this.data.title.trim()) {
      wx.showToast({
        title: 'Title is required',
        icon: 'none'
      });
      return;
    }

    this.setData({ saving: true });

    try {
      const noteData: NoteCreate | NoteUpdate = {
        title: this.data.title,
        content: this.data.content,
        category: this.data.category,
        tags: this.data.tags,
        published: this.data.published,
        snippet: this.data.content.slice(0, 100)
      };

      if (this.data.noteId) {
        await api.updateNote(this.data.noteId, noteData);
        wx.showToast({ title: 'Updated!' });
      } else {
        const res = await api.createNote(noteData);
        this.setData({ noteId: res.data.id });
        wx.showToast({ title: 'Created!' });
      }

      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (error: any) {
      wx.showToast({
        title: error.message || 'Save failed',
        icon: 'none'
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  async deleteNote() {
    if (!this.data.noteId) return;

    wx.showModal({
      title: 'Delete Note',
      content: 'Are you sure?',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteNote(this.data.noteId!);
            wx.showToast({ title: 'Deleted' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1000);
          } catch (error: any) {
            wx.showToast({ title: error.message, icon: 'none' });
          }
        }
      }
    });
  }
});
