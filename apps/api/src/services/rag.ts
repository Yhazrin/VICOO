/**
 * RAG (Retrieval-Augmented Generation) Service
 *
 * Provides semantic search capabilities using embeddings
 * and AI-powered question answering over your knowledge base.
 */

import { getOne, getAll, runQuery, saveDatabase } from '../db/index.js';
import { runAIAssistant } from './ai-assistant.js';

// Types
export interface Embedding {
  noteId: string;
  chunk: string;
  embedding: number[];
  createdAt: string;
}

export interface SearchResult {
  noteId: string;
  title: string;
  content: string;
  relevance: number;
  matchedChunk?: string;
}

// Simple embedding simulation (in production, use actual embeddings)
async function generateEmbedding(text: string): Promise<number[]> {
  // Simple hash-based embedding simulation
  // In production, replace with actual embedding API (OpenAI, Cohere, etc.)
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  // Generate a 384-dimensional vector (matching common embedding models)
  const embedding: number[] = [];
  let seed = Math.abs(hash);
  for (let i = 0; i < 384; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    embedding.push((seed / 0x7fffffff) * 2 - 1);
  }

  return embedding;
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 0.0001);
}

// Chunk text into smaller pieces for embedding
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);

  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    currentLength += word.length + 1;
    currentChunk.push(word);

    if (currentLength >= chunkSize) {
      chunks.push(currentChunk.join(' '));
      // Keep overlap words
      currentChunk = currentChunk.slice(-Math.floor(overlap / 5));
      currentLength = 0;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// Index a note for semantic search
export async function indexNote(noteId: string): Promise<void> {
  const note = getOne<any>('SELECT * FROM notes WHERE id = ?', [noteId]);
  if (!note || !note.content) return;

  // Remove old embeddings for this note
  runQuery('DELETE FROM note_embeddings WHERE note_id = ?', [noteId]);

  // Chunk the content
  const chunks = chunkText(note.content);

  // Generate embeddings for each chunk
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk);

    runQuery(
      `INSERT INTO note_embeddings (id, note_id, chunk, embedding, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [require('uuid').v4(), noteId, chunk, JSON.stringify(embedding)]
    );
  }

  saveDatabase();
  console.log(`[RAG] Indexed note ${noteId} with ${chunks.length} chunks`);
}

// Semantic search across all notes
export async function semanticSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Get all embeddings from database
  const embeddings = getAll<any>('SELECT * FROM note_embeddings', []);

  // Calculate similarity scores
  const scores: Map<string, { noteId: string; title: string; content: string; score: number; chunk: string }> = new Map();

  for (const emb of embeddings) {
    try {
      const embedding = JSON.parse(emb.embedding);
      const similarity = cosineSimilarity(queryEmbedding, embedding);

      const note = getOne<any>('SELECT id, title, content FROM notes WHERE id = ?', [emb.note_id]);
      if (!note) continue;

      const existing = scores.get(emb.note_id);
      if (!existing || similarity > existing.score) {
        scores.set(emb.note_id, {
          noteId: emb.note_id,
          title: note.title,
          content: note.content || '',
          score: similarity,
          chunk: emb.chunk
        });
      }
    } catch (e) {
      console.error('[RAG] Error parsing embedding:', e);
    }
  }

  // Sort by score and return top results
  const results = Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => ({
      noteId: r.noteId,
      title: r.title,
      content: r.content,
      relevance: r.score,
      matchedChunk: r.chunk
    }));

  return results;
}

// RAG-powered question answering
export async function askQuestion(question: string): Promise<{
  answer: string;
  sources: Array<{ title: string; id: string; matchedContent: string }>;
}> {
  // Search for relevant context
  const searchResults = await semanticSearch(question, 3);

  if (searchResults.length === 0) {
    return {
      answer: 'I couldn\'t find any relevant information in your knowledge base to answer this question.',
      sources: []
    };
  }

  // Build context from search results
  const context = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.matchedChunk || r.content.slice(0, 500)}`)
    .join('\n\n');

  // Generate answer using AI
  const result = await runAIAssistant({
    message: `Based on the following context from the user's knowledge base, please answer the question.\n\nContext:\n${context}\n\nQuestion: ${question}\n\nPlease provide a clear, accurate answer based only on the context provided. If the context doesn't contain enough information to answer the question, please say so.`,
    mode: 'knowledge'
  });

  return {
    answer: result.response || 'Sorry, I couldn\'t generate an answer.',
    sources: searchResults.map(r => ({
      title: r.title,
      id: r.noteId,
      matchedContent: r.matchedChunk || ''
    }))
  };
}

// Initialize embeddings table if not exists
export function initializeEmbeddingsTable(): void {
  try {
    runQuery(`
      CREATE TABLE IF NOT EXISTS note_embeddings (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL,
        chunk TEXT NOT NULL,
        embedding TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    runQuery('CREATE INDEX IF NOT EXISTS idx_embeddings_note_id ON note_embeddings(note_id)');

    console.log('[RAG] Embeddings table initialized');
  } catch (e) {
    console.error('[RAG] Failed to initialize embeddings table:', e);
  }
}

export default {
  indexNote,
  semanticSearch,
  askQuestion,
  initializeEmbeddingsTable
};
