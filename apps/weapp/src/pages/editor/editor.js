"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// pages/editor/editor.ts - Note Editor Page
const api_1 = __importDefault(require("../../services/api"));
Page({
    data: {
        noteId: null,
        title: '',
        content: '',
        category: 'idea',
        isPublished: false,
        isSaving: false,
        lastSaved: null,
        showSummary: false,
        isSummarizing: false,
        loading: true,
        categories: [
            { id: 'idea', label: 'Idea', icon: 'lightbulb' },
            { id: 'code', label: 'Code', icon: 'code' },
            { id: 'design', label: 'Design', icon: 'palette' },
            { id: 'meeting', label: 'Meeting', icon: 'groups' },
            { id: 'default', label: 'Note', icon: 'description' }
        ],
        detectedConcepts: [],
        wikiLinks: [],
        showToolbar: true,
        // Pre-computed values for WXML
        summaryText: '',
        conceptsTerms: '',
        firstConceptType: ''
    },
    onLoad(options) {
        const noteId = options.id;
        if (noteId) {
            this.loadNote(noteId);
        }
        else {
            // New note
            this.setData({
                noteId: null,
                title: '',
                content: '',
                category: 'idea',
                isPublished: false,
                loading: false
            });
        }
    },
    async loadNote(noteId) {
        try {
            const res = await api_1.default.getNote(noteId);
            const note = res.data;
            this.setData({
                noteId: note.id,
                title: note.title || '',
                content: note.content || '',
                category: note.category || 'default',
                isPublished: note.published || false,
                loading: false
            });
            // Parse wiki links
            this.parseWikiLinks();
        }
        catch (error) {
            wx.showToast({
                title: error?.message || 'Failed to load note',
                icon: 'none'
            });
            this.setData({ loading: false });
        }
    },
    // Title input handler
    onTitleInput(e) {
        this.setData({ title: e.detail.value });
        this.autoSave();
    },
    // Content input handler
    onContentInput(e) {
        this.setData({ content: e.detail.value });
        this.parseWikiLinks();
        this.detectConcepts();
        this.autoSave();
    },
    // Parse [[wiki links]] from content
    parseWikiLinks() {
        const content = this.data.content;
        const regex = /\[\[([^\]]+)\]\]/g;
        const links = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            links.push(match[1]);
        }
        this.setData({ wikiLinks: links });
    },
    // Detect concepts in content (mock implementation)
    detectConcepts() {
        const content = this.data.content.toLowerCase();
        const mockConcepts = [
            { id: '1', term: 'React', type: 'Technology', desc: 'A JS library for building UIs.' },
            { id: '2', term: 'Auth', type: 'Security', desc: 'Authentication and Authorization patterns.' },
            { id: '3', term: 'Design', type: 'Concept', desc: 'A collection of reusable components.' },
            { id: '4', term: 'API', type: 'Technology', desc: 'Application Programming Interface.' },
        ];
        const detected = mockConcepts.filter(c => content.includes(c.term.toLowerCase()));
        // Pre-compute values for WXML
        const conceptsTerms = detected.map(c => c.term).join(', ');
        const firstConceptType = detected.length > 0 ? detected[0].type.toLowerCase() : 'general';
        this.setData({
            detectedConcepts: detected,
            conceptsTerms: conceptsTerms,
            firstConceptType: firstConceptType
        });
    },
    // Auto-save with debounce
    autoSaveTimer: null,
    autoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        this.autoSaveTimer = setTimeout(() => {
            this.saveNote(false);
        }, 2000);
    },
    // Save note
    async saveNote(showToast = true) {
        const { noteId, title, content, category, isPublished } = this.data;
        if (!title.trim()) {
            return;
        }
        this.setData({ isSaving: true });
        try {
            const noteData = {
                title,
                content,
                category,
                snippet: content.substring(0, 100),
                published: isPublished
            };
            if (noteId) {
                // Update existing note
                await api_1.default.updateNote(noteId, noteData);
            }
            else {
                // Create new note
                const res = await api_1.default.createNote(noteData);
                this.setData({ noteId: res.data.id });
            }
            this.setData({
                isSaving: false,
                lastSaved: new Date().toLocaleTimeString()
            });
            if (showToast) {
                wx.showToast({ title: 'Saved', icon: 'success' });
            }
        }
        catch (error) {
            wx.showToast({ title: error?.message || 'Save failed', icon: 'none' });
            this.setData({ isSaving: false });
        }
    },
    // Manual save
    onSave() {
        this.saveNote(true);
    },
    // Toggle publish
    async togglePublish() {
        const newPublished = !this.data.isPublished;
        this.setData({ isPublished: newPublished });
        await this.saveNote(true);
    },
    // Category change
    onCategoryChange(e) {
        const category = e.currentTarget.dataset.category;
        this.setData({ category });
        this.autoSave();
    },
    // Summarize content
    async handleSummarize() {
        if (this.data.showSummary) {
            this.setData({ showSummary: false });
            return;
        }
        this.setData({ isSummarizing: true });
        try {
            const result = await api_1.default.generateSummary(undefined, this.data.content);
            let summaryText = '';
            if (result.success && result.summary) {
                summaryText = result.summary;
                if (result.keywords && result.keywords.length > 0) {
                    summaryText += `\n\n关键词: ${result.keywords.join(', ')}`;
                }
            }
            else {
                summaryText = result.error || '无法生成摘要';
            }
            this.setData({
                isSummarizing: false,
                showSummary: true,
                summaryText: summaryText
            });
        }
        catch (error) {
            wx.showToast({ title: error?.message || 'Summary failed', icon: 'none' });
            this.setData({ isSummarizing: false });
        }
    },
    // Add wiki link
    addWikiLink(e) {
        const link = e.currentTarget.dataset.link;
        const newContent = this.data.content + ` [[${link}]]`;
        this.setData({ content: newContent });
        this.parseWikiLinks();
        this.autoSave();
    },
    // Delete note
    onDeleteNote() {
        if (!this.data.noteId)
            return;
        wx.showModal({
            title: 'Delete Note',
            content: 'Are you sure you want to delete this note?',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await api_1.default.deleteNote(this.data.noteId);
                        wx.showToast({ title: 'Deleted' });
                        setTimeout(() => {
                            wx.navigateBack();
                        }, 500);
                    }
                    catch (error) {
                        wx.showToast({ title: error?.message || 'Delete failed', icon: 'none' });
                    }
                }
            }
        });
    },
    // Toggle toolbar
    toggleToolbar() {
        this.setData({ showToolbar: !this.data.showToolbar });
    },
    onShareAppMessage() {
        return {
            title: this.data.title || 'Vicoo Note',
            path: `/pages/editor/editor?id=${this.data.noteId}`
        };
    }
});
