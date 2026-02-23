"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// pages/ai/ai.ts - AI Chat Assistant
const api_1 = __importDefault(require("../../services/api"));
const QUICK_PROMPTS = [
    { id: 'brainstorm', label: 'Brainstorm Ideas', icon: 'lightbulb', prompt: 'Help me brainstorm new ideas for my project' },
    { id: 'summarize', label: 'Summarize Notes', icon: 'summarize', prompt: 'Summarize my recent notes and show key insights' },
    { id: 'improve', label: 'Improve Writing', icon: 'edit', prompt: 'Help me improve my writing style' },
    { id: 'explain', label: 'Explain Concept', icon: 'school', prompt: 'Explain this concept in simple terms' },
];
Page({
    data: {
        messages: [],
        inputValue: '',
        isTyping: false,
        quickPrompts: QUICK_PROMPTS,
        showWelcome: true
    },
    onLoad() {
        // Load chat history
        const history = wx.getStorageSync('ai_chat_history') || [];
        this.setData({
            messages: history,
            showWelcome: history.length === 0
        });
    },
    onUnload() {
        // Save chat history
        wx.setStorageSync('ai_chat_history', this.data.messages);
    },
    onInput(e) {
        this.setData({ inputValue: e.detail.value });
    },
    async sendMessage() {
        const { inputValue, messages } = this.data;
        if (!inputValue.trim() || this.data.isTyping)
            return;
        // Add user message
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: Date.now()
        };
        this.setData({
            messages: [...messages, userMessage],
            inputValue: '',
            isTyping: true,
            showWelcome: false
        });
        // Scroll to bottom
        this.scrollToBottom();
        try {
            // Call real AI API
            const result = await api_1.default.sendChatMessage(inputValue);
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.success ? (result.response || 'No response') : (result.error || 'AI request failed'),
                timestamp: Date.now()
            };
            this.setData({
                messages: [...this.data.messages, assistantMessage],
                isTyping: false
            });
            // Save to history
            wx.setStorageSync('ai_chat_history', this.data.messages);
            this.scrollToBottom();
        }
        catch (error) {
            wx.showToast({ title: error?.message || 'AI request failed', icon: 'none' });
            this.setData({ isTyping: false });
        }
    },
    // Quick prompt handler
    onQuickPrompt(e) {
        const prompt = e.currentTarget.dataset.prompt;
        this.setData({ inputValue: prompt });
        this.sendMessage();
    },
    // Clear chat
    clearChat() {
        wx.showModal({
            title: 'Clear Chat',
            content: 'Are you sure you want to clear the chat history?',
            success: (res) => {
                if (res.confirm) {
                    this.setData({
                        messages: [],
                        showWelcome: true
                    });
                    wx.setStorageSync('ai_chat_history', []);
                }
            }
        });
    },
    // Copy message
    copyMessage(e) {
        const content = e.currentTarget.dataset.content;
        wx.setClipboardData({
            data: content,
            success: () => {
                wx.showToast({ title: 'Copied', icon: 'success' });
            }
        });
    },
    // Scroll to bottom
    scrollToBottom() {
        setTimeout(() => {
            wx.pageScrollTo({
                scrollTop: 99999,
                duration: 300
            });
        }, 100);
    },
    onShareAppMessage() {
        return {
            title: 'Vicoo AI Assistant',
            path: '/pages/ai/ai'
        };
    }
});
