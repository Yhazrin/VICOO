export interface SdkConfig {
  baseUrl: string;
  token?: string;
}

export class VicooApiError extends Error {
  code: string;
  constructor(message: string, code: string = 'UNKNOWN') {
    super(message);
    this.name = 'VicooApiError';
    this.code = code;
    Object.setPrototypeOf(this, VicooApiError.prototype);
  }
}

interface RequestOptions extends RequestInit {
  data?: unknown;
}

function createClient(config: SdkConfig) {
  let token = config.token ?? '';

  async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { data, ...init } = options;
    const url = config.baseUrl ? `${config.baseUrl.replace(/\/$/, '')}${endpoint}` : endpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, {
      ...init,
      headers,
      body: data !== undefined ? JSON.stringify(data) : init.body,
    });

    if (!res.ok) {
      let message = 'Request failed';
      let code = 'UNKNOWN';
      try {
        const body = await res.json();
        const err = (body as { error?: { code?: string; message?: string } }).error;
        if (err) {
          message = err.message ?? message;
          code = err.code ?? code;
        }
      } catch {
        message = res.statusText || message;
      }
      throw new VicooApiError(message, code);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  return {
    setToken(t: string) {
      token = t;
    },
    getHealth() {
      return request<{ data: { ok: boolean; version: string } }>('/health');
    },
    listNotes(params?: { limit?: number; offset?: number; category?: string; tag?: string; published?: boolean }) {
      const q = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString() : '';
      return request<{ data: import('@vicoo/types').Note[]; meta?: { total: number; limit: number; offset: number } }>(`/api/notes${q ? '?' + q : ''}`);
    },
    getNote(id: string) {
      return request<{ data: import('@vicoo/types').Note }>(`/api/notes/${id}`);
    },
    createNote(note: import('@vicoo/types').NoteCreate) {
      return request<{ data: import('@vicoo/types').Note }>('/api/notes', { method: 'POST', data: note });
    },
    updateNote(id: string, note: import('@vicoo/types').NoteUpdate) {
      return request<{ data: import('@vicoo/types').Note }>(`/api/notes/${id}`, { method: 'PATCH', data: note });
    },
    deleteNote(id: string) {
      return request<void>(`/api/notes/${id}`, { method: 'DELETE' });
    },
    listTags() {
      return request<{ data: unknown[] }>('/api/tags');
    },
    createTag(tag: unknown) {
      return request<{ data: unknown }>('/api/tags', { method: 'POST', data: tag });
    },
    deleteTag(id: string) {
      return request<void>(`/api/tags/${id}`, { method: 'DELETE' });
    },
    listNodes() {
      return request<{ data: unknown[] }>('/api/nodes');
    },
    listLinks() {
      return request<{ data: unknown[] }>('/api/links');
    },
    createNode(node: unknown) {
      return request<{ data: unknown }>('/api/nodes', { method: 'POST', data: node });
    },
    updateNode(id: string, node: unknown) {
      return request<{ data: unknown }>(`/api/nodes/${id}`, { method: 'PATCH', data: node });
    },
    deleteNode(id: string) {
      return request<void>(`/api/nodes/${id}`, { method: 'DELETE' });
    },
    createLink(link: unknown) {
      return request<{ data: unknown }>('/api/links', { method: 'POST', data: link });
    },
    deleteLink(id: string) {
      return request<void>(`/api/links/${id}`, { method: 'DELETE' });
    },
    generateGraphFromNotes(clearExisting?: boolean) {
      return request<{ data: { nodes: unknown[]; links: unknown[]; summary: { notesProcessed: number; nodesCreated: number; linksCreated: number } } }>(
        `/api/graph/from-notes?clearExisting=${clearExisting !== false}`,
        { method: 'POST' }
      );
    },
    searchNotes(query: string) {
      return request<{ data: unknown[] }>(`/api/search/notes?q=${encodeURIComponent(query)}`);
    },
    semanticSearch(query: string, limit?: number) {
      const q = new URLSearchParams({ q: query });
      if (limit != null) q.set('limit', String(limit));
      return request<{ data: unknown[] }>(`/api/search/semantic?${q}`);
    },
    generateAISummary(noteId?: string, text?: string) {
      const q = new URLSearchParams();
      if (noteId) q.set('noteId', noteId);
      if (text) q.set('text', text);
      return request<{ data: { summary: string; keywords: string[]; success: boolean } }>(`/api/ai/summary?${q}`, { method: 'POST' });
    },
    suggestAITags(noteId?: string, text?: string) {
      const q = new URLSearchParams();
      if (noteId) q.set('noteId', noteId);
      if (text) q.set('text', text);
      return request<{ data: { suggestions: Array<{ tag: string; confidence: number; isExisting: boolean }> } }>(`/api/ai/suggest-tags?${q}`, { method: 'POST' });
    },
    aiChat(message: string, mode?: 'auto' | 'knowledge' | 'search' | 'action', provider?: 'auto' | 'claude' | 'coze') {
      const q = new URLSearchParams();
      if (mode) q.set('mode', mode);
      if (provider) q.set('provider', provider);
      return request<{ success: boolean; response: string; sources?: Array<{ type: string; title: string; content?: string; id?: string }>; error?: string }>(
        `/api/ai/chat?${q}`,
        { method: 'POST', data: { message } }
      );
    },
    listCategories() {
      return request<{ data: unknown[] }>('/api/categories');
    },
    listClusters() {
      return request<{ data: unknown[] }>('/api/clusters');
    },
    createCategory(category: unknown) {
      return request<{ data: unknown }>('/api/categories', { method: 'POST', data: category });
    },
    acceptCluster(id: string) {
      return request<void>(`/api/clusters/${id}/accept`, { method: 'POST' });
    },
    rejectCluster(id: string) {
      return request<void>(`/api/clusters/${id}/reject`, { method: 'POST' });
    },
    getAnalyticsOverview() {
      return request<{ data: unknown }>('/api/analytics/overview');
    },
    getActivity(days?: number) {
      return request<{ data: unknown[] }>(`/api/analytics/activity${days != null ? '?days=' + days : ''}`);
    },
    listTimeline() {
      return request<{ data: unknown[] }>('/api/timeline');
    },
    createTimelineEvent(event: unknown) {
      return request<{ data: unknown }>('/api/timeline', { method: 'POST', data: event });
    },
    deleteTimelineEvent(id: string) {
      return request<void>(`/api/timeline/${id}`, { method: 'DELETE' });
    },
    getSettings() {
      return request<{ data: unknown }>('/api/settings');
    },
    updateSettings(settings: unknown) {
      return request<{ data: unknown }>('/api/settings', { method: 'PATCH', data: settings });
    },
    getFeed() {
      return request<{ data: unknown[] }>('/api/feed');
    },
    getFocusStats() {
      return request<{ data: unknown }>('/api/focus/stats');
    },
    listMusic() {
      return request<{ data: unknown[] }>('/api/music');
    },
    addMusic(music: unknown) {
      return request<{ data: unknown }>('/api/music', { method: 'POST', data: music });
    },
    updateMusic(id: string, music: unknown) {
      return request<{ data: unknown }>(`/api/music/${id}`, { method: 'PATCH', data: music });
    },
    deleteMusic(id: string) {
      return request<void>(`/api/music/${id}`, { method: 'DELETE' });
    },
  };
}

export const createSdk = (config: SdkConfig) => createClient(config);

const defaultBaseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:8000';
export const vicoo = createClient({ baseUrl: defaultBaseUrl });
