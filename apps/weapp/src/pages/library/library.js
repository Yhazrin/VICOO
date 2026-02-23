"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// pages/library/library.ts - Notes Library
const api_1 = __importDefault(require("../../services/api"));
Page({
    data: {
        notes: [],
        filteredNotes: [],
        filter: 'All',
        categories: ['All', 'idea', 'code', 'design', 'meeting'],
        loading: true,
        searchQuery: '',
        viewMode: 'grid'
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
            this.setData({
                notes,
                loading: false
            });
            this.applyFilter();
        }
        catch (error) {
            wx.showToast({
                title: error?.message || 'Failed to load',
                icon: 'none'
            });
            this.setData({ loading: false });
        }
    },
    setFilter(e) {
        const filter = e.currentTarget.dataset.filter;
        this.setData({ filter });
        this.applyFilter();
    },
    onSearch(e) {
        this.setData({ searchQuery: e.detail.value });
        this.applyFilter();
    },
    toggleViewMode() {
        this.setData({
            viewMode: this.data.viewMode === 'grid' ? 'list' : 'grid'
        });
    },
    applyFilter() {
        let notes = this.data.notes;
        // Filter by category
        if (this.data.filter !== 'All') {
            notes = notes.filter(n => n.category === this.data.filter);
        }
        // Filter by search
        if (this.data.searchQuery) {
            const query = this.data.searchQuery.toLowerCase();
            notes = notes.filter(n => n.title.toLowerCase().includes(query) ||
                (n.content && n.content.toLowerCase().includes(query)) ||
                (n.snippet && n.snippet.toLowerCase().includes(query)) ||
                (n.tags && n.tags.some((t) => t.toLowerCase().includes(query))));
        }
        // Sort by timestamp (newest first)
        notes.sort((a, b) => {
            const dateA = new Date(a.timestamp || 0).getTime();
            const dateB = new Date(b.timestamp || 0).getTime();
            return dateB - dateA;
        });
        this.setData({ filteredNotes: notes });
    },
    goToEditor(e) {
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
    async deleteNote(e) {
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
            title: 'Vicoo Library',
            path: '/pages/library/library'
        };
    }
});
