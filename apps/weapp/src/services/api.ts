// api.ts - Vicoo API Service for WeChat Mini Program

// Local type definitions
interface Note {
  id: string;
  title: string;
  content?: string;
  snippet?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  timestamp?: string;
  status?: 'inbox' | 'clarified' | 'archived';
}

interface NoteCreate {
  title: string;
  content?: string;
  category?: string;
  snippet?: string;
  published?: boolean;
}

interface NoteUpdate {
  title?: string;
  content?: string;
  category?: string;
  snippet?: string;
  published?: boolean;
  status?: string;
}

interface ListResponse<T> {
  data: T[];
  total?: number;
}

interface ApiError {
  code: string;
  message: string;
}

// 使用电脑的局域网IP
const API_BASE = 'http://192.168.31.184:8000';

class ApiService {
  private token: string = '';

  setToken(token: string) {
    this.token = token;
    wx.setStorageSync('vicoo_token', token);
  }

  private async request<T>(endpoint: string, options: any = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const header: Record<string, string> = {
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
        success: (res: any) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as T);
          } else {
            const errorData = res.data as any;
            const error = errorData.error || {
              code: 'UNKNOWN',
              message: 'Request failed'
            };
            reject(error);
          }
        },
        fail: (err: any) => {
          reject({ code: 'NETWORK_ERROR', message: err.errMsg });
        }
      });
    });
  }

  // Health check
  async getHealth(): Promise<{ data: { ok: boolean; version: string } }> {
    return this.request('/health');
  }

  // Auth
  async generateDevToken(): Promise<{ data: { token: string } }> {
    return this.request('/auth/dev-token', { method: 'POST' });
  }

  // Notes
  async listNotes(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    tag?: string;
    published?: boolean;
  }): Promise<{ data: Note[] }> {
    const queryParams: string[] = [];
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

  async getNote(id: string): Promise<{ data: Note }> {
    return this.request(`/api/notes/${id}`);
  }

  async createNote(note: NoteCreate): Promise<{ data: Note }> {
    return this.request('/api/notes', {
      method: 'POST',
      data: note
    });
  }

  async updateNote(id: string, note: NoteUpdate): Promise<{ data: Note }> {
    return this.request(`/api/notes/${id}`, {
      method: 'PATCH',
      data: note
    });
  }

  async deleteNote(id: string): Promise<void> {
    return this.request(`/api/notes/${id}`, {
      method: 'DELETE'
    });
  }

  // AI Chat
  async sendChatMessage(message: string, mode?: string): Promise<{ success: boolean; response?: string; error?: string }> {
    return this.request('/api/ai/chat', {
      method: 'POST',
      data: { message, mode }
    });
  }

  // AI Status
  async getAIStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.request('/api/ai/status');
  }

  // AI Summary
  async generateSummary(noteId?: string, text?: string): Promise<{ success: boolean; summary?: string; keywords?: string[]; error?: string }> {
    return this.request('/api/ai/summary', {
      method: 'POST',
      data: { noteId, text }
    });
  }

  // AI Suggest Tags
  async suggestTags(noteId?: string, text?: string): Promise<{ success: boolean; suggestions?: any[]; error?: string }> {
    return this.request('/api/ai/suggest-tags', {
      method: 'POST',
      data: { noteId, text }
    });
  }
}

export const api = new ApiService();
export default api;
