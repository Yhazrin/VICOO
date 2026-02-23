/**
 * Vicoo SDK
 */

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

// 从 localStorage 获取 API base，如果没有则使用相对路径
const getStoredApiBase = (): string => {
  if (!isBrowser) return '';
  return localStorage.getItem('vicoo_api_base') || '';
};

// 获取 API base URL
const getApiBase = (): string => {
  const stored = getStoredApiBase();
  if (stored) return stored;

  // 开发环境使用相对路径（通过 Vite 代理）
  if (isBrowser && window.location.hostname === 'localhost') {
    return '';
  }

  // 生产环境默认使用同源（假设 API 和前端部署在同一域名下）
  return '';
};

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('vicoo_token', token);
  }
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T }> {
  const response = await fetch(`${getApiBase()}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Health
export async function getHealth() {
  return request<any>('/health');
}

// Notes
export const listNotes = (params?: { limit?: number; offset?: number; status?: string }) => {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.offset) query.set('offset', params.offset.toString());
  if (params?.status) query.set('status', params.status);
  return request<any[]>(`/api/notes?${query}`);
};

export const getNote = (id: string) => request<any>(`/api/notes/${id}`);

export const createNote = (data: any) =>
  request<any>('/api/notes', { method: 'POST', body: JSON.stringify(data) });

export const updateNote = (id: string, data: any) =>
  request<any>(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteNote = (id: string) =>
  request<any>(`/api/notes/${id}`, { method: 'DELETE' });

// Tags
export const listTags = () => request<any[]>('/api/tags');

export const createTag = (data: any) =>
  request<any>('/api/tags', { method: 'POST', body: JSON.stringify(data) });

// Nodes
export const listNodes = () => request<any[]>('/api/nodes');

export const createNode = (data: any) =>
  request<any>('/api/nodes', { method: 'POST', body: JSON.stringify(data) });

export const updateNode = (id: string, data: any) =>
  request<any>(`/api/nodes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteNode = (id: string) =>
  request<any>(`/api/nodes/${id}`, { method: 'DELETE' });

// Links
export const listLinks = () => request<any[]>('/api/links');

export const createLink = (data: any) =>
  request<any>('/api/links', { method: 'POST', body: JSON.stringify(data) });

export const deleteLink = (id: string) =>
  request<any>(`/api/links/${id}`, { method: 'DELETE' });

// Search
export const searchNotes = (query: string) =>
  request<any[]>(`/api/search?q=${encodeURIComponent(query)}`);

// AI
export const aiChat = (message: string, mode?: string) =>
  request<any>('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message, mode }) });

export const generateAISummary = (noteId?: string, text?: string) =>
  request<any>('/api/ai/summary', { method: 'POST', body: JSON.stringify({ noteId, text }) });

export const semanticSearch = (query: string, limit?: number) =>
  request<any[]>('/api/rag/search', { method: 'POST', body: JSON.stringify({ query, limit }) });

// Tasks
export const listTasks = (status?: string) => {
  const query = status ? `?status=${status}` : '';
  return request<any[]>(`/api/tasks${query}`);
};

export const createTask = (data: any) =>
  request<any>('/api/tasks', { method: 'POST', body: JSON.stringify(data) });

export const updateTask = (id: string, data: any) =>
  request<any>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteTask = (id: string) =>
  request<any>(`/api/tasks/${id}`, { method: 'DELETE' });

// Settings
export const getSettings = () => request<any>('/api/settings');

export const updateSettings = (data: any) =>
  request<any>('/api/settings', { method: 'PATCH', body: JSON.stringify(data) });

// Focus
export const getFocusStats = () => request<any>('/api/focus/stats');

export const createFocusSession = (data: any) =>
  request<any>('/api/focus/sessions', { method: 'POST', body: JSON.stringify(data) });

export const updateFocusSession = (id: string, data: any) =>
  request<any>(`/api/focus/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// Music / Playlist
export const listMusic = () => request<any[]>('/api/music');

export const addMusic = (data: any) =>
  request<any>('/api/music', { method: 'POST', body: JSON.stringify(data) });

export const updateMusic = (id: string, data: any) =>
  request<any>(`/api/music/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteMusic = (id: string) =>
  request<any>(`/api/music/${id}`, { method: 'DELETE' });

// Timeline
export const getTimeline = () => request<any[]>('/api/timeline');
export const listTimeline = getTimeline; // 别名

export const createTimelineEvent = (data: any) =>
  request<any>('/api/timeline', { method: 'POST', body: JSON.stringify(data) });

export const deleteTimelineEvent = (id: string) =>
  request<any>(`/api/timeline/${id}`, { method: 'DELETE' });

// Analytics
export const getAnalytics = () => request<any>('/api/analytics/overview');
export const getAnalyticsOverview = getAnalytics; // 别名
export const getActivity = (days: number) => request<any>(`/api/analytics/activity?days=${days}`);

// Taxonomy
export const getCategories = () => request<any[]>('/api/categories');
export const listCategories = getCategories; // 别名

export const getClusters = () => request<any[]>('/api/clusters');
export const listClusters = getClusters; // 别名

export const createCategory = (data: any) =>
  request<any>('/api/categories', { method: 'POST', body: JSON.stringify(data) });

export const acceptCluster = (id: string) =>
  request<any>(`/api/clusters/${id}/accept`, { method: 'POST' });

export const rejectCluster = (id: string) =>
  request<any>(`/api/clusters/${id}/reject`, { method: 'POST' });

// Feed
export const getFeed = () => request<any[]>('/api/feed');

// Graph
export const generateGraph = (clearExisting?: boolean) =>
  request<any>('/api/graph/generate', { method: 'POST', body: JSON.stringify({ clearExisting }) });

export const generateGraphFromNotes = generateGraph; // 别名

export const vicoo = {
  getHealth,
  setToken,
  // Notes
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  // Tags
  listTags,
  createTag,
  // Nodes
  listNodes,
  createNode,
  updateNode,
  deleteNode,
  // Links
  listLinks,
  createLink,
  deleteLink,
  // Search
  searchNotes,
  // AI
  aiChat,
  generateAISummary,
  suggestAITags: () => request<any[]>('/api/ai/suggest-tags', { method: 'POST', body: JSON.stringify({}) }),
  semanticSearch,
  // Tasks
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  // Settings
  getSettings,
  updateSettings,
  // Focus
  getFocusStats,
  createFocusSession,
  updateFocusSession,
  // Music
  listMusic,
  addMusic,
  updateMusic,
  deleteMusic,
  // Timeline
  getTimeline,
  listTimeline,
  createTimelineEvent,
  deleteTimelineEvent,
  // Analytics
  getAnalytics,
  getAnalyticsOverview,
  getActivity,
  // Taxonomy
  getCategories,
  listCategories,
  createCategory,
  getClusters,
  listClusters,
  acceptCluster,
  rejectCluster,
  // Feed
  getFeed,
  // Graph
  generateGraph,
  generateGraphFromNotes,
};

export class VicooApiError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'VicooApiError';
  }
}

export default vicoo;
