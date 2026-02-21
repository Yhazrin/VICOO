import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { vicoo, VicooApiError } from '@vicoo/sdk';
import type { 
  Note, NoteCreate, NoteUpdate,
  Tag, TagCreate,
  Node, NodeCreate, NodeUpdate,
  Link, LinkCreate,
  Category, CategoryCreate,
  Cluster,
  SearchResult,
  AnalyticsOverview, ActivityData,
  TimelineEvent, TimelineEventCreate,
  UserSettings, UserSettingsUpdate,
  FeedItem,
  FocusStats, FocusSession,
  Music, MusicCreate, MusicUpdate
} from '@vicoo/types';

interface ApiContextType {
  // Auth
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;

  // Notes
  notes: Note[];
  loading: boolean;
  error: string | null;
  refreshNotes: () => Promise<void>;
  getNote: (id: string) => Promise<Note>;
  createNote: (note: NoteCreate) => Promise<Note>;
  updateNote: (id: string, note: NoteUpdate) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;

  // Tags
  tags: Tag[];
  refreshTags: () => Promise<void>;
  createTag: (tag: TagCreate) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;

  // Nodes (Galaxy View)
  nodes: Node[];
  links: Link[];
  refreshGraph: () => Promise<void>;
  createNode: (node: NodeCreate) => Promise<Node>;
  updateNode: (id: string, node: NodeUpdate) => Promise<Node>;
  deleteNode: (id: string) => Promise<void>;
  createLink: (link: LinkCreate) => Promise<Link>;
  deleteLink: (id: string) => Promise<void>;
  generateGraphFromNotes: (clearExisting?: boolean) => Promise<{
    nodes: Node[];
    links: Link[];
    summary: { notesProcessed: number; nodesCreated: number; linksCreated: number };
  }>;

  // Search
  searchNotes: (query: string) => Promise<SearchResult[]>;

  // AI Search
  semanticSearch: (query: string, limit?: number) => Promise<any[]>;
  generateAISummary: (noteId?: string, text?: string) => Promise<{ summary: string; keywords: string[]; success: boolean }>;
  aiChat: (message: string, mode?: 'auto' | 'knowledge' | 'search' | 'action', provider?: 'auto' | 'claude' | 'coze') => Promise<{
    success: boolean;
    response: string;
    sources?: Array<{ type: string; title: string; content?: string; id?: string }>;
    error?: string;
  }>;
  suggestAITags: (noteId?: string, text?: string) => Promise<Array<{ tag: string; confidence: number; isExisting: boolean }>>;

  // Taxonomy
  categories: Category[];
  clusters: Cluster[];
  refreshTaxonomy: () => Promise<void>;
  createCategory: (category: CategoryCreate) => Promise<Category>;
  acceptCluster: (id: string) => Promise<void>;
  rejectCluster: (id: string) => Promise<void>;

  // Analytics
  analytics: AnalyticsOverview | null;
  activity: ActivityData[];
  refreshAnalytics: () => Promise<void>;

  // Timeline
  timelineEvents: TimelineEvent[];
  refreshTimeline: () => Promise<void>;
  createTimelineEvent: (event: TimelineEventCreate) => Promise<TimelineEvent>;
  deleteTimelineEvent: (id: string) => Promise<void>;

  // Settings
  settings: UserSettings | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (settings: UserSettingsUpdate) => Promise<UserSettings>;

  // Feed
  feedItems: FeedItem[];
  refreshFeed: () => Promise<void>;

  // Focus
  focusStats: FocusStats | null;
  playlist: Music[];
  refreshFocusStats: () => Promise<void>;
  // Playlist / Music
  playlist: Music[];
  refreshPlaylist: () => Promise<void>;
  addToPlaylist: (music: MusicCreate) => Promise<Music>;
  updateMusic: (id: string, music: MusicUpdate) => Promise<Music>;
  removeFromPlaylist: (id: string) => Promise<void>;

  // Health
  health: { ok: boolean; version: string } | null;
}

const ApiContext = createContext<ApiContextType | null>(null);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem('vicoo_token');
  });

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tags state
  const [tags, setTags] = useState<Tag[]>([]);

  // Graph state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  // Taxonomy state
  const [categories, setCategories] = useState<Category[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [activity, setActivity] = useState<ActivityData[]>([]);

  // Timeline state
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Feed state
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  // Focus state
  const [focusStats, setFocusStats] = useState<FocusStats | null>(null);

  // Music/Playlist state
  const [playlist, setPlaylist] = useState<Music[]>([]);

  // Health state
  const [health, setHealth] = useState<{ ok: boolean; version: string } | null>(null);

  const setToken = useCallback((newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('vicoo_token', newToken);
    } else {
      localStorage.removeItem('vicoo_token');
    }
    setTokenState(newToken);
  }, []);

  // Set token on SDK client when it changes
  useEffect(() => {
    if (token) {
      vicoo.setToken(token);
    }
  }, [token]);

  // Check health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await vicoo.getHealth();
        setHealth(res.data);
      } catch (err) {
        console.error('API health check failed:', err);
        setHealth(null);
      }
    };
    checkHealth();
  }, []);

  // ==================== Notes ====================

  const refreshNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vicoo.listNotes();
      setNotes(res.data);
    } catch (err) {
      if (err instanceof VicooApiError) {
        setError(err.message);
      } else {
        setError('Failed to load notes');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getNote = useCallback(async (id: string): Promise<Note> => {
    const res = await vicoo.getNote(id);
    return res.data;
  }, []);

  const createNote = useCallback(async (note: NoteCreate): Promise<Note> => {
    const res = await vicoo.createNote(note);
    await refreshNotes();
    await refreshTags();
    return res.data;
  }, [refreshNotes]);

  const updateNote = useCallback(async (id: string, note: NoteUpdate): Promise<Note> => {
    const res = await vicoo.updateNote(id, note);
    await refreshNotes();
    return res.data;
  }, [refreshNotes]);

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    await vicoo.deleteNote(id);
    await refreshNotes();
  }, [refreshNotes]);

  // ==================== Tags ====================

  const refreshTags = useCallback(async () => {
    try {
      const res = await vicoo.listTags();
      setTags(res.data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  const createTag = useCallback(async (tag: TagCreate): Promise<Tag> => {
    const res = await vicoo.createTag(tag);
    await refreshTags();
    return res.data;
  }, [refreshTags]);

  const deleteTag = useCallback(async (id: string): Promise<void> => {
    await vicoo.deleteTag(id);
    await refreshTags();
  }, [refreshTags]);

  // ==================== Nodes/Links ====================

  const refreshGraph = useCallback(async () => {
    try {
      const [nodesRes, linksRes] = await Promise.all([
        vicoo.listNodes(),
        vicoo.listLinks()
      ]);
      setNodes(nodesRes.data);
      setLinks(linksRes.data);
    } catch (err) {
      console.error('Failed to load graph:', err);
    }
  }, []);

  const createNode = useCallback(async (node: NodeCreate): Promise<Node> => {
    const res = await vicoo.createNode(node);
    await refreshGraph();
    return res.data;
  }, [refreshGraph]);

  const updateNode = useCallback(async (id: string, node: NodeUpdate): Promise<Node> => {
    const res = await vicoo.updateNode(id, node);
    await refreshGraph();
    return res.data;
  }, [refreshGraph]);

  const deleteNode = useCallback(async (id: string): Promise<void> => {
    await vicoo.deleteNode(id);
    await refreshGraph();
  }, [refreshGraph]);

  const createLink = useCallback(async (link: LinkCreate): Promise<Link> => {
    const res = await vicoo.createLink(link);
    await refreshGraph();
    return res.data;
  }, [refreshGraph]);

  const deleteLink = useCallback(async (id: string): Promise<void> => {
    await vicoo.deleteLink(id);
    await refreshGraph();
  }, [refreshGraph]);

  const generateGraphFromNotes = useCallback(async (clearExisting: boolean = true) => {
    const res = await vicoo.generateGraphFromNotes(clearExisting);
    await refreshGraph();
    return res.data;
  }, [refreshGraph]);

  // ==================== Search ====================

  const searchNotes = useCallback(async (query: string): Promise<SearchResult[]> => {
    const res = await vicoo.searchNotes(query);
    return res.data;
  }, []);

  // ==================== AI Search ====================

  const semanticSearch = useCallback(async (query: string, limit?: number) => {
    const res = await vicoo.semanticSearch(query, limit);
    return res.data;
  }, []);

  const generateAISummary = useCallback(async (noteId?: string, text?: string) => {
    const res = await vicoo.generateAISummary(noteId, text);
    return res.data;
  }, []);

  const suggestAITags = useCallback(async (noteId?: string, text?: string) => {
    const res = await vicoo.suggestAITags(noteId, text);
    return res.data.suggestions;
  }, []);

  const aiChat = useCallback(async (message: string, mode?: 'auto' | 'knowledge' | 'search' | 'action', provider?: 'auto' | 'claude' | 'coze') => {
    const res = await vicoo.aiChat(message, mode, provider);
    return res;
  }, []);

  // ==================== Taxonomy ====================

  const refreshTaxonomy = useCallback(async () => {
    try {
      const [categoriesRes, clustersRes] = await Promise.all([
        vicoo.listCategories(),
        vicoo.listClusters()
      ]);
      setCategories(categoriesRes.data);
      setClusters(clustersRes.data);
    } catch (err) {
      console.error('Failed to load taxonomy:', err);
    }
  }, []);

  const createCategory = useCallback(async (category: CategoryCreate): Promise<Category> => {
    const res = await vicoo.createCategory(category);
    await refreshTaxonomy();
    return res.data;
  }, [refreshTaxonomy]);

  const acceptCluster = useCallback(async (id: string): Promise<void> => {
    await vicoo.acceptCluster(id);
    await refreshTaxonomy();
  }, [refreshTaxonomy]);

  const rejectCluster = useCallback(async (id: string): Promise<void> => {
    await vicoo.rejectCluster(id);
    await refreshTaxonomy();
  }, [refreshTaxonomy]);

  // ==================== Analytics ====================

  const refreshAnalytics = useCallback(async () => {
    try {
      const [overviewRes, activityRes] = await Promise.all([
        vicoo.getAnalyticsOverview(),
        vicoo.getActivity(30)
      ]);
      setAnalytics(overviewRes.data);
      setActivity(activityRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }, []);

  // ==================== Timeline ====================

  const refreshTimeline = useCallback(async () => {
    try {
      const res = await vicoo.listTimeline();
      setTimelineEvents(res.data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    }
  }, []);

  const createTimelineEventFn = useCallback(async (event: TimelineEventCreate): Promise<TimelineEvent> => {
    const res = await vicoo.createTimelineEvent(event);
    await refreshTimeline();
    return res.data;
  }, [refreshTimeline]);

  const deleteTimelineEvent = useCallback(async (id: string): Promise<void> => {
    await vicoo.deleteTimelineEvent(id);
    await refreshTimeline();
  }, [refreshTimeline]);

  // ==================== Settings ====================

  const refreshSettings = useCallback(async () => {
    try {
      const res = await vicoo.getSettings();
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  const updateSettingsFn = useCallback(async (settingsUpdate: UserSettingsUpdate): Promise<UserSettings> => {
    const res = await vicoo.updateSettings(settingsUpdate);
    setSettings(res.data);
    return res.data;
  }, []);

  // ==================== Feed ====================

  const refreshFeed = useCallback(async () => {
    try {
      const res = await vicoo.getFeed();
      setFeedItems(res.data);
    } catch (err) {
      console.error('Failed to load feed:', err);
    }
  }, []);

  // ==================== Focus ====================

  const refreshFocusStats = useCallback(async () => {
    try {
      const res = await vicoo.getFocusStats();
      setFocusStats(res.data);
    } catch (err) {
      console.error('Failed to load focus stats:', err);
    }
  }, []);

  // ==================== Music / Playlist ====================

  const refreshPlaylist = useCallback(async () => {
    try {
      const res = await vicoo.listMusic();
      setPlaylist(res.data);
    } catch (err) {
      console.error('Failed to load playlist:', err);
    }
  }, []);

  const addToPlaylist = useCallback(async (music: MusicCreate) => {
    try {
      const res = await vicoo.addMusic(music);
      setPlaylist(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.error('Failed to add music:', err);
      throw err;
    }
  }, []);

  const updateMusic = useCallback(async (id: string, music: MusicUpdate) => {
    try {
      const res = await vicoo.updateMusic(id, music);
      setPlaylist(prev => prev.map(m => m.id === id ? res.data : m));
      return res.data;
    } catch (err) {
      console.error('Failed to update music:', err);
      throw err;
    }
  }, []);

  const removeFromPlaylist = useCallback(async (id: string) => {
    try {
      await vicoo.deleteMusic(id);
      setPlaylist(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to remove music:', err);
      throw err;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    refreshNotes();
    refreshTags();
    refreshGraph();
    refreshTaxonomy();
    refreshAnalytics();
    refreshTimeline();
    refreshSettings();
    refreshFeed();
    refreshFeed();
    refreshFocusStats();
    refreshPlaylist();
  }, []);

  return (
    <ApiContext.Provider
      value={{
        token,
        setToken,
        isAuthenticated: !!token,
        notes,
        loading,
        error,
        refreshNotes,
        getNote,
        createNote,
        updateNote,
        deleteNote,
        tags,
        refreshTags,
        createTag,
        deleteTag,
        nodes,
        links,
        refreshGraph,
        createNode,
        updateNode,
        deleteNode,
        createLink,
        deleteLink,
        generateGraphFromNotes,
        searchNotes,
        semanticSearch,
        generateAISummary,
        aiChat,
        suggestAITags,
        categories,
        clusters,
        refreshTaxonomy,
        createCategory,
        acceptCluster,
        rejectCluster,
        analytics,
        activity,
        refreshAnalytics,
        timelineEvents,
        refreshTimeline,
        createTimelineEvent: createTimelineEventFn,
        deleteTimelineEvent,
        settings,
        refreshSettings,
        updateSettings: updateSettingsFn,
        feedItems,
        refreshFeed,
        focusStats,
        playlist,
        refreshPlaylist,
        addToPlaylist,
        updateMusic,
        removeFromPlaylist,
        refreshFocusStats,
        health
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};
