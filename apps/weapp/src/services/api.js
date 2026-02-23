"use strict";
// api.ts - Vicoo API Service for WeChat Mini Program
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
// 使用电脑的局域网IP
const API_BASE = 'http://192.168.31.184:8000';
class ApiService {
    constructor() {
        this.token = '';
    }
    setToken(token) {
        this.token = token;
        wx.setStorageSync('vicoo_token', token);
    }
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const header = {
            'Content-Type': 'application/json',
            ...options.header
        };
        if (this.token) {
            header['Authorization'] = `Bearer ${this.token}`;
        }
        return new Promise((resolve, reject) => {
            wx.request({
                url,
                method: options.method || 'GET',
                data: options.data,
                header,
                success: (res) => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(res.data);
                    }
                    else {
                        const errorData = res.data;
                        const error = errorData.error || {
                            code: 'UNKNOWN',
                            message: 'Request failed'
                        };
                        reject(error);
                    }
                },
                fail: (err) => {
                    reject({ code: 'NETWORK_ERROR', message: err.errMsg });
                }
            });
        });
    }
    // Health check
    async getHealth() {
        return this.request('/health');
    }
    // Auth
    async generateDevToken() {
        return this.request('/auth/dev-token', { method: 'POST' });
    }
    // Notes
    async listNotes(params) {
        const queryParams = [];
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.push(`${key}=${encodeURIComponent(String(value))}`);
                }
            });
        }
        const query = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
        return this.request(`/api/notes${query}`);
    }
    async getNote(id) {
        return this.request(`/api/notes/${id}`);
    }
    async createNote(note) {
        return this.request('/api/notes', {
            method: 'POST',
            data: note
        });
    }
    async updateNote(id, note) {
        return this.request(`/api/notes/${id}`, {
            method: 'PATCH',
            data: note
        });
    }
    async deleteNote(id) {
        return this.request(`/api/notes/${id}`, {
            method: 'DELETE'
        });
    }
    // AI Chat
    async sendChatMessage(message, mode) {
        return this.request('/api/ai/chat', {
            method: 'POST',
            data: { message, mode }
        });
    }
    // AI Status
    async getAIStatus() {
        return this.request('/api/ai/status');
    }
    // AI Summary
    async generateSummary(noteId, text) {
        return this.request('/api/ai/summary', {
            method: 'POST',
            data: { noteId, text }
        });
    }
    // AI Suggest Tags
    async suggestTags(noteId, text) {
        return this.request('/api/ai/suggest-tags', {
            method: 'POST',
            data: { noteId, text }
        });
    }
}
exports.api = new ApiService();
exports.default = exports.api;
