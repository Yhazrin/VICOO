export type NoteCategory = 'idea' | 'code' | 'design' | 'meeting';

export interface Note {
  id: string;
  title: string;
  category: NoteCategory;
  snippet: string;
  content: string;
  summary?: string | null;
  timestamp: string;
  updated_at?: string | null;
  published: boolean;
  coverImage?: string | null;
  color?: string | null;
  icon?: string | null;
  tags: string[];
}

export interface NoteCreate {
  title: string;
  category?: NoteCategory;
  tags?: string[];
  content?: string;
  snippet?: string;
  published?: boolean;
  color?: string | null;
  icon?: string | null;
}

export interface NoteUpdate {
  title?: string;
  category?: NoteCategory;
  tags?: string[];
  content?: string;
  snippet?: string;
  published?: boolean;
  coverImage?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface ListMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: ListMeta;
}

export interface ApiError {
  error?: {
    code: string;
    message: string;
  };
  code?: string;
  message?: string;
}
