// api.ts - Vicoo API Service for WeChat Mini Program
import type { Note, NoteCreate, NoteUpdate, ListResponse, ApiError } from '@vicoo/types';

const API_BASE = 'http://localhost:8000';

class ApiService {
  private token: string = '';

  setToken(token: string) {
    this.token = token;
    wx.setStorageSync('vicoo_token', token);
  }

  private async request<T>(endpoint: string, options: wx.RequestOptions = {}): Promise<T> {
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
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as T);
          } else {
            const error = (res.data as ApiError).error || {
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
  }): Promise<ListResponse<Note>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`/api/notes${query ? '?' + query : ''}`);
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
}

export const api = new ApiService();
export default api;
