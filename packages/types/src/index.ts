/**
 * Vicoo Types
 */

export interface Note {
  id: string;
  title: string;
  category: 'code' | 'design' | 'meeting' | 'idea';
  status?: 'inbox' | 'clarified' | 'archived';
  snippet?: string;
  tags: string[];
  timestamp: string;
  content: string;
  summary?: string;
  published?: boolean;
  coverImage?: string;
  color?: string;
  icon?: string;
}

export interface NoteCreate {
  title: string;
  category?: string;
  status?: string;
  content?: string;
  snippet?: string;
  published?: boolean;
  color?: string;
  icon?: string;
  tags?: string[];
}

export interface NoteUpdate {
  title?: string;
  category?: string;
  status?: string;
  content?: string;
  snippet?: string;
  published?: boolean;
  coverImage?: string;
  color?: string;
  icon?: string;
  tags?: string[];
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface TagCreate {
  name: string;
  color?: string;
}

export interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'planet' | 'moon';
  color: string;
  icon: string;
  description?: string;
  linkedNoteId?: string;
  tags?: string[];
}

export interface NodeCreate {
  x: number;
  y: number;
  label: string;
  type?: string;
  color?: string;
  icon?: string;
  description?: string;
  linkedNoteId?: string;
  tags?: string[];
}

export interface NodeUpdate {
  x?: number;
  y?: number;
  label?: string;
  type?: string;
  color?: string;
  icon?: string;
  description?: string;
  linkedNoteId?: string;
  tags?: string[];
}

export interface Link {
  id: string;
  source: string;
  target: string;
  type?: 'dashed' | 'solid';
}

export interface LinkCreate {
  source: string;
  target: string;
  type?: string;
}

export interface Category {
  id: string;
  label: string;
  color?: string;
  subTags?: string[];
}

export interface CategoryCreate {
  label: string;
  color?: string;
  subTags?: string[];
}

export interface Cluster {
  id: string;
  suggestedLabel: string;
  confidence: number;
  items: string[];
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  relevance: number;
}

export interface AnalyticsOverview {
  totalNotes: number;
  totalTags: number;
  totalNodes: number;
  notesThisWeek: number;
  notesThisMonth: number;
}

export interface ActivityData {
  date: string;
  count: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: string;
  relatedNoteId?: string;
  color?: string;
}

export interface TimelineEventCreate {
  title: string;
  description?: string;
  date: string;
  type?: string;
  relatedNoteId?: string;
  color?: string;
}

export interface UserSettings {
  theme: string;
  language: string;
  mascotSkin?: string;
  fontSize?: string;
  focusDefaultDuration?: number;
  focusBreakDuration?: number;
  focusSoundEnabled?: boolean;
}

export interface UserSettingsUpdate {
  theme?: string;
  language?: string;
  mascotSkin?: string;
  fontSize?: string;
  focusDefaultDuration?: number;
  focusBreakDuration?: number;
  focusSoundEnabled?: boolean;
}

export interface FeedItem {
  id: string;
  type: 'note' | 'node' | 'tag';
  title: string;
  snippet?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface FocusStats {
  totalSessions: number;
  totalMinutes: number;
  averageDuration: number;
  currentStreak: number;
}

export interface FocusSession {
  id: string;
  duration: number;
  breakDuration?: number;
  completed: boolean;
  startedAt: string;
  endedAt?: string;
}

export interface Music {
  id: string;
  title: string;
  artist?: string;
  coverEmoji?: string;
  coverUrl?: string;
  color1?: string;
  color2?: string;
  filename: string;
  filepath: string;
  duration?: number;
}

export interface MusicCreate {
  title: string;
  artist?: string;
  coverEmoji?: string;
  coverUrl?: string;
  color1?: string;
  color2?: string;
  filename: string;
  filepath: string;
  duration?: number;
}

export interface MusicUpdate {
  title?: string;
  artist?: string;
  coverEmoji?: string;
  coverUrl?: string;
  color1?: string;
  color2?: string;
}
