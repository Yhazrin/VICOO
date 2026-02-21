import { getOne, initDatabase, runQuery, saveDatabase } from './index.js';
import { v4 as uuidv4 } from 'uuid';
import { DEV_SEED_NOTES, DEV_SEED_USER } from './seed-data.js';

const DEV_SEED_MARKER = 'dev-sample-v1';

function ensureSeedMetaTable() {
  runQuery(`
    CREATE TABLE IF NOT EXISTS seed_meta (
      key TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

export async function seedDatabase() {
  await initDatabase();
  ensureSeedMetaTable();

  // This seed is for local development/demo only.
  // In production, data/schema evolution should be managed by migrations.
  const seeded = getOne<{ key: string }>('SELECT key FROM seed_meta WHERE key = ?', [DEV_SEED_MARKER]);
  if (seeded) {
    console.log(`Seed marker "${DEV_SEED_MARKER}" already exists, skipping.`);
    return;
  }

  console.log('Seeding development database...');

  runQuery(
    'INSERT OR IGNORE INTO users (id, name, email) VALUES (?, ?, ?)',
    [DEV_SEED_USER.id, DEV_SEED_USER.name, DEV_SEED_USER.email]
  );

  for (const note of DEV_SEED_NOTES) {
    let existingNote = getOne<{ id: string }>('SELECT id FROM notes WHERE title = ? AND user_id = ?', [
      note.title,
      DEV_SEED_USER.id
    ]);

    if (!existingNote) {
      const noteId = uuidv4();
      runQuery(
        `INSERT INTO notes (id, user_id, title, category, snippet, content, published, color, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [noteId, DEV_SEED_USER.id, note.title, note.category, note.snippet, note.content, note.published, note.color]
      );
      existingNote = { id: noteId };
    }

    for (const tagName of note.tags) {
      const existingTag = getOne<{ id: string }>('SELECT id FROM tags WHERE name = ?', [tagName]);
      const tagId = existingTag?.id ?? uuidv4();

      runQuery('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);

      const resolvedTag = existingTag ?? getOne<{ id: string }>('SELECT id FROM tags WHERE name = ?', [tagName]);
      if (!resolvedTag) continue;

      runQuery('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)', [existingNote.id, resolvedTag.id]);
    }
  }

  runQuery('INSERT OR IGNORE INTO seed_meta (key) VALUES (?)', [DEV_SEED_MARKER]);
  saveDatabase();
  console.log('✅ Development seed completed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}
