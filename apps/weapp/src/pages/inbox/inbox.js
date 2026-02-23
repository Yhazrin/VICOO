"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// pages/inbox/inbox.ts - Inbox Page (Collection Box)
const api_1 = __importDefault(require("../../services/api"));
Page({
    data: {
        notes: [],
        filteredNotes: [],
        loading: true,
        activeTab: 'inbox',
        tabs: [
            { id: 'inbox', label: 'Inbox', count: 0 },
            { id: 'clarified', label: 'Clarified', count: 0 },
            { id: 'archived', label: 'Archived', count: 0 }
        ]
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
            const res = await api_1.default.listNotes({ limit: 100 });
            const notes = res.data || [];
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
        }
        catch (error) {
            console.error('Failed to load notes:', error);
            wx.showToast({
                title: error?.message || 'Load failed',
                icon: 'none'
            });
            this.setData({ loading: false });
        }
    },
    setActiveTab(e) {
        const tabId = e.currentTarget.dataset.tab;
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
    formatDate(dateStr) {
        if (!dateStr)
            return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0)
            return 'Today';
        if (days === 1)
            return 'Yesterday';
        if (days < 7)
            return `${days} days ago`;
        return date.toLocaleDateString();
    },
    goToEditor(e) {
        const noteId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/editor/editor?id=${noteId}`
        });
    },
    async handleStatusChange(e) {
        const { id, status } = e.currentTarget.dataset;
        const newStatus = status;
        try {
            await api_1.default.updateNote(id, { status: newStatus });
            wx.showToast({ title: 'Updated' });
            this.loadNotes();
        }
        catch (error) {
            wx.showToast({ title: error?.message || 'Update failed', icon: 'none' });
        }
    },
    async handleDelete(e) {
        const noteId = e.currentTarget.dataset.id;
        wx.showModal({
            title: 'Delete Note',
            content: 'Are you sure you want to delete this note?',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await api_1.default.deleteNote(noteId);
                        wx.showToast({ title: 'Deleted' });
                        this.loadNotes();
                    }
                    catch (error) {
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
