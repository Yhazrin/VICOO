// api.ts - Vicoo API Service for Mobile
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolveApiBase } from '@vicoo/sdk/env';

const API_URL = resolveApiBase({
  platform: Platform.OS as 'web' | 'ios' | 'android',
  expoExtraApiBase: Constants.expoConfig?.extra?.apiBase as string | undefined,
  processEnvApiBase: process.env.EXPO_PUBLIC_API_BASE
});

interface ApiError {
  code: string;
  message: string;
}

class ApiService {
  private token: string = '';

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const data = await response.json();
      const error: ApiError = data.error || { code: 'UNKNOWN', message: 'Request failed' };
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Health
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
  }): Promise<{ data: any[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/api/notes${query ? '?' + query : ''}`);
  }

  async getNote(id: string): Promise<{ data: any }> {
    return this.request(`/api/notes/${id}`);
  }

  async createNote(note: {
    title: string;
    category?: string;
    content?: string;
    tags?: string[];
    published?: boolean;
  }): Promise<{ data: any }> {
    return this.request('/api/notes', {
      method: 'POST',
      body: JSON.stringify(note)
    });
  }

  async updateNote(id: string, note: any): Promise<{ data: any }> {
    return this.request(`/api/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(note)
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
