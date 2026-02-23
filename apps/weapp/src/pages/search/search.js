"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// pages/search/search.ts - Unified Search with AI
const api_1 = __importDefault(require("../../services/api"));
Page({
    data: {
        searchQuery: '',
        results: [],
        recentSearches: [],
        loading: false,
        showAI: false,
        aiResponse: '',
        isAIThinking: false,
        activeTab: 'all'
    },
    onLoad() {
        // Load recent searches from storage
        const recentSearches = wx.getStorageSync('recentSearches') || [];
        this.setData({ recentSearches });
    },
    onSearch(e) {
        const query = e.detail.value || this.data.searchQuery;
        this.setData({ searchQuery: query });
        if (query.trim()) {
            this.performSearch(query);
            this.addToRecentSearches(query);
        }
        else {
            this.setData({ results: [] });
        }
    },
    onSearchInput(e) {
        this.setData({ searchQuery: e.detail.value });
    },
    async performSearch(query) {
        if (!query.trim())
            return;
        this.setData({ loading: true, results: [] });
        try {
            // Search notes
            const res = await api_1.default.listNotes({ limit: 50 });
            const notes = res.data || [];
            const queryLower = query.toLowerCase();
            const matchedNotes = notes.filter(n => n.title.toLowerCase().includes(queryLower) ||
                (n.content && n.content.toLowerCase().includes(queryLower)) ||
                (n.tags && n.tags.some((t) => t.toLowerCase().includes(queryLower))));
            const results = matchedNotes.map(note => ({
                type: 'note',
                id: note.id,
                title: note.title,
                content: note.content,
                snippet: note.snippet || (note.content ? note.content.substring(0, 100) : '')
            }));
            this.setData({
                results,
                loading: false
            });
        }
        catch (error) {
            console.error('Search failed:', error);
            this.setData({ loading: false });
        }
    },
    // AI Search
    async askAI() {
        const { searchQuery } = this.data;
        if (!searchQuery.trim()) {
            wx.showToast({ title: 'Please enter a question', icon: 'none' });
            return;
        }
        this.setData({
            isAIThinking: true,
            aiResponse: '',
            showAI: true
        });
        try {
            // Call real AI API
            const result = await api_1.default.sendChatMessage(searchQuery);
            if (result.success && result.response) {
                this.setData({
                    aiResponse: result.response,
                    isAIThinking: false
                });
            }
            else {
                wx.showToast({ title: result.error || 'AI request failed', icon: 'none' });
                this.setData({ isAIThinking: false });
            }
        }
        catch (error) {
            console.error('AI request failed:', error);
            wx.showToast({ title: error?.message || 'AI request failed', icon: 'none' });
            this.setData({ isAIThinking: false });
        }
    },
    // Quick AI action
    quickAI(action) {
        const actions = {
            'summarize': 'Summarize my recent notes and show key insights.',
            'brainstorm': 'Help me brainstorm new ideas for my project.',
            'improve': 'Improve my writing and suggest enhancements.',
            'explain': 'Explain this concept in simple terms.'
        };
        this.setData({
            searchQuery: actions[action] || action,
            showAI: true
        });
        this.askAI();
    },
    addToRecentSearches(query) {
        let recent = this.data.recentSearches;
        recent = [query, ...recent.filter(s => s !== query)].slice(0, 10);
        this.setData({ recentSearches: recent });
        wx.setStorageSync('recentSearches', recent);
    },
    onRecentSearchTap(e) {
        const query = e.currentTarget.dataset.query;
        this.setData({ searchQuery: query });
        this.performSearch(query);
    },
    clearRecentSearches() {
        this.setData({ recentSearches: [] });
        wx.setStorageSync('recentSearches', []);
    },
    goToNote(e) {
        const noteId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/editor/editor?id=${noteId}`
        });
    },
    onTabChange(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ activeTab: tab });
    },
    onShareAppMessage() {
        return {
            title: 'Vicoo Search',
            path: '/pages/search/search'
        };
    }
});
