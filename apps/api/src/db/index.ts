import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database path
const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, '../../data/vicoo.db');

let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  // Ensure directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Initialize SQL.js
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize tables
  initializeTables();

  // Save database periodically
  setInterval(() => {
    saveDatabase();
  }, 5000);

  console.log('✅ Database initialized');
  return db;
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function initializeTables() {
  if (!db) return;

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Notes table
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'dev_user_1',
      title TEXT NOT NULL,
      category TEXT DEFAULT 'idea',
      snippet TEXT,
      content TEXT DEFAULT '',
      summary TEXT,
      published INTEGER DEFAULT 0,
      cover_image TEXT,
      color TEXT,
      icon TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Tags table
  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#6B7280',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Note tags junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (note_id, tag_id)
    )
  `);

  // Categories table (for Taxonomy)
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      color TEXT DEFAULT '#6B7280',
      sub_tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Clusters table (AI suggestions for Taxonomy)
  db.run(`
    CREATE TABLE IF NOT EXISTS clusters (
      id TEXT PRIMARY KEY,
      suggested_label TEXT NOT NULL,
      confidence REAL DEFAULT 0,
      items TEXT DEFAULT '[]',
      reason TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Nodes table (for Galaxy View)
  db.run(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      x REAL DEFAULT 0,
      y REAL DEFAULT 0,
      label TEXT NOT NULL,
      type TEXT DEFAULT 'planet',
      color TEXT DEFAULT '#FFD166',
      icon TEXT DEFAULT 'circle',
      description TEXT,
      linked_note_id TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Links table (for Galaxy View)
  db.run(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      target TEXT NOT NULL,
      type TEXT DEFAULT 'solid',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Timeline events table
  db.run(`
    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      type TEXT DEFAULT 'note',
      related_note_id TEXT,
      color TEXT DEFAULT '#FFD166',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Focus sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      duration INTEGER DEFAULT 25,
      break_duration INTEGER DEFAULT 5,
      completed INTEGER DEFAULT 0,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT
    )
  `);

  // User settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY DEFAULT 'dev_user_1',
      theme TEXT DEFAULT 'dark',
      language TEXT DEFAULT 'en',
      mascot_skin TEXT DEFAULT 'bot',
      font_size TEXT DEFAULT 'medium',
      focus_default_duration INTEGER DEFAULT 25,
      focus_break_duration INTEGER DEFAULT 5,
      focus_sound_enabled INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Music/Playlist table for Focus Mode
  db.run(`
    CREATE TABLE IF NOT EXISTS music (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'dev_user_1',
      title TEXT NOT NULL,
      artist TEXT,
      cover_emoji TEXT DEFAULT '🎵',
      cover_url TEXT,
      color1 TEXT DEFAULT '#FFD166',
      color2 TEXT DEFAULT '#EF476F',
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create indexes (ignore if exists)
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category)');
    db.run('CREATE INDEX IF NOT EXISTS idx_notes_published ON notes(published)');
    db.run('CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON notes(timestamp)');
    db.run('CREATE INDEX IF NOT EXISTS idx_nodes_label ON nodes(label)');
    db.run('CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)');
  } catch (e) {
    // Indexes may already exist
  }

  // Migration: Add color column to tags if it doesn't exist
  try {
    db.run('ALTER TABLE tags ADD COLUMN color TEXT DEFAULT "#6B7280"');
  } catch (e) {
    // Column may already exist
  }
}

export function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('Failed to save database:', e);
  }
}

// Helper functions for queries
export function runQuery(sql: string, params: any[] = []): void {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
}

export function getOne<T>(sql: string, params: any[] = []): T | undefined {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row as T;
  }
  stmt.free();
  return undefined;
}

export function getAll<T>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const results: T[] = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function getLastInsertRowId(): number {
  if (!db) throw new Error('Database not initialized');
  const result = db.exec('SELECT last_insert_rowid() as id');
  return result[0]?.values[0]?.[0] as number || 0;
}

export function getChanges(): number {
  if (!db) throw new Error('Database not initialized');
  const result = db.exec('SELECT changes() as changes');
  return result[0]?.values[0]?.[0] as number || 0;
}

export { db };
