
export enum View {
  DASHBOARD = 'dashboard',
  SEARCH = 'search',
  LIBRARY = 'library',
  GALAXY = 'galaxy',
  TAXONOMY = 'taxonomy',
  HABITAT = 'habitat',
  EDITOR = 'editor',
  SETTINGS = 'settings',
  TIMELINE = 'timeline',
  ANALYTICS = 'analytics',
  TEMPLATES = 'templates',
  FOCUS = 'focus',
  PUBLIC_GATEWAY = 'public_gateway',
  AUTH = 'auth',
  VIBE_CODING = 'vibe_coding'
}

export interface NavItem {
  id: View;
  label: string;
  icon: string;
}

export interface Note {
  id: string;
  title: string;
  category: 'code' | 'design' | 'meeting' | 'idea';
  snippet?: string;
  tags: string[];
  timestamp: string;
  content: string;
  summary?: string;
  published?: boolean; // New field
  coverImage?: string; // New field for blog aesthetics
  color?: string; // Optional for UI consistency
  icon?: string;
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

export interface Link {
  source: string;
  target: string;
  type?: 'dashed' | 'solid';
}