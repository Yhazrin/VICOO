import { runQuery, getOne, getAll, initDatabase } from './index.js';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  // Initialize database first
  await initDatabase();

  // Check if data already exists
  const existingNotes = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes');

  if ((existingNotes?.count || 0) > 0) {
    console.log('Database already has data, skipping seed');
    return;
  }

  console.log('Seeding database...');

  // Create default user
  runQuery(
    `INSERT OR IGNORE INTO users (id, name, email) VALUES (?, ?, ?)`,
    ['dev_user_1', 'Developer', 'dev@vicoo.local']
  );

  // Seed notes
  const notes = [
    {
      id: uuidv4(),
      title: 'Welcome to Vicoo',
      category: 'idea',
      snippet: 'Your visual coordinator for knowledge management',
      content: '# Welcome to Vicoo\n\nThis is your new knowledge workspace. Start creating notes and exploring the galaxy view!',
      published: 1,
      color: '#FFD166',
      tags: ['welcome', 'intro']
    },
    {
      id: uuidv4(),
      title: 'React Best Practices',
      category: 'code',
      snippet: 'Key patterns for React development',
      content: '# React Best Practices\n\n- Use functional components with hooks\n- Keep state local when possible\n- Memoize expensive computations',
      published: 1,
      color: '#118AB2',
      tags: ['react', 'javascript', 'frontend']
    },
    {
      id: uuidv4(),
      title: 'Design System Ideas',
      category: 'design',
      snippet: 'Neubrutalism-lite design concepts',
      content: '# Design System\n\n## Colors\n- Primary: #FFD166\n- Secondary: #0df259\n- Accent: #EF476F',
      published: 0,
      color: '#EF476F',
      tags: ['design', 'ui', 'ideas']
    },
    {
      id: uuidv4(),
      title: 'Project Planning Meeting',
      category: 'meeting',
      snippet: 'Q1 planning discussion notes',
      content: '# Q1 Planning\n\n- Define MVP scope\n- Set milestone dates\n- Assign team responsibilities',
      published: 1,
      color: '#0df259',
      tags: ['meeting', 'planning']
    }
  ];

  for (const note of notes) {
    // Insert note
    runQuery(
      `INSERT INTO notes (id, user_id, title, category, snippet, content, published, color, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [note.id, 'dev_user_1', note.title, note.category, note.snippet, note.content, note.published, note.color]
    );

    // Insert tags
    for (const tagName of note.tags) {
      const tagId = uuidv4();
      runQuery('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);

      const tag = getOne<{ id: string }>('SELECT id FROM tags WHERE name = ?', [tagName]);
      if (tag) {
        runQuery('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)', [note.id, tag.id]);
      }
    }
  }

  console.log('✅ Database seeded with sample data');
}

// Run if called directly
seedDatabase();
