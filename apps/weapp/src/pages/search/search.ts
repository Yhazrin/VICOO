// pages/search/search.ts - Unified Search with AI
import api from '../../services/api';

interface Note {
  id: string;
  title: string;
  content?: string;
  snippet?: string;
  category?: string;
  tags?: string[];
}

interface SearchResult {
  type: 'note' | 'ai';
  id: string;
  title: string;
  content?: string;
  snippet?: string;
  score?: number;
}

Page({
  data: {
    searchQuery: '',
    results: [] as SearchResult[],
    recentSearches: [] as string[],
    loading: false,
    showAI: false,
    aiResponse: '',
    isAIThinking: false,
    activeTab: 'all' as 'all' | 'notes' | 'ai'
  },

  onLoad() {
    // Load recent searches from storage
    const recentSearches = wx.getStorageSync('recentSearches') || [];
    this.setData({ recentSearches });
  },

  onSearch(e: any) {
    const query = e.detail.value || this.data.searchQuery;
    this.setData({ searchQuery: query });
    
    if (query.trim()) {
      this.performSearch(query);
      this.addToRecentSearches(query);
    } else {
      this.setData({ results: [] });
    }
  },

  onSearchInput(e: any) {
    this.setData({ searchQuery: e.detail.value });
  },

  async performSearch(query: string) {
    if (!query.trim()) return;

    this.setData({ loading: true, results: [] });

    try {
      // Search notes
      const res = await api.listNotes({ limit: 50 });
      const notes: Note[] = res.data || [];
      
      const queryLower = query.toLowerCase();
      const matchedNotes = notes.filter(n => 
        n.title.toLowerCase().includes(queryLower) ||
        (n.content && n.content.toLowerCase().includes(queryLower)) ||
        (n.tags && n.tags.some((t: string) => t.toLowerCase().includes(queryLower)))
      );

      const results: SearchResult[] = matchedNotes.map(note => ({
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
    } catch (error) {
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
      const result = await api.sendChatMessage(searchQuery);
      
      if (result.success && result.response) {
        this.setData({
          aiResponse: result.response,
          isAIThinking: false
        });
      } else {
        wx.showToast({ title: result.error || 'AI request failed', icon: 'none' });
        this.setData({ isAIThinking: false });
      }
    } catch (error: any) {
      console.error('AI request failed:', error);
      wx.showToast({ title: error?.message || 'AI request failed', icon: 'none' });
      this.setData({ isAIThinking: false });
    }
  },

  // Quick AI action
  quickAI(action: string) {
    const actions: Record<string, string> = {
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

  addToRecentSearches(query: string) {
    let recent = this.data.recentSearches;
    recent = [query, ...recent.filter(s => s !== query)].slice(0, 10);
    this.setData({ recentSearches: recent });
    wx.setStorageSync('recentSearches', recent);
  },

  onRecentSearchTap(e: any) {
    const query = e.currentTarget.dataset.query;
    this.setData({ searchQuery: query });
    this.performSearch(query);
  },

  clearRecentSearches() {
    this.setData({ recentSearches: [] });
    wx.setStorageSync('recentSearches', []);
  },

  goToNote(e: any) {
    const noteId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/editor/editor?id=${noteId}`
    });
  },

  onTabChange(e: any) {
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
