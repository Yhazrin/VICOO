import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.js';
import healthRouter from './routes/health.js';
import notesRouter from './routes/notes.js';
import tagsRouter from './routes/tags.js';
import graphRouter from './routes/graph.js';
import searchRouter from './routes/search.js';
import taxonomyRouter from './routes/taxonomy.js';
import analyticsRouter from './routes/analytics.js';
import timelineRouter from './routes/timeline.js';
import settingsRouter from './routes/settings.js';
import feedRouter from './routes/feed.js';
import focusRouter from './routes/focus.js';
import musicRouter from './routes/music.js';
import downloaderRouter from './routes/downloader.js';
import workflowRouter from './routes/workflow.js';
import claudeRouter from './routes/claude.js';
import authRouter, { authMiddleware } from './middleware/auth.js';
import { initDatabase, saveDatabase, getOne } from './db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { graphqlHTTP } from 'express-graphql';
import { schema } from './graphql/schema.js';
import { startAutoGraphService } from './services/auto-graph.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Seed data if empty
async function seedIfEmpty() {
  const count = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes');
  if ((count?.count || 0) > 0) return;

  console.log('Seeding database...');

  // Create default user
  saveDatabase(); // Make sure db is saved first

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

  // Import the runQuery function
  const { runQuery } = await import('./db/index.js');

  for (const note of notes) {
    runQuery(
      `INSERT INTO notes (id, user_id, title, category, snippet, content, published, color, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [note.id, 'dev_user_1', note.title, note.category, note.snippet, note.content, note.published, note.color]
    );

    for (const tagName of note.tags) {
      const tagId = uuidv4();
      runQuery('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
      const tag = getOne<{ id: string }>('SELECT id FROM tags WHERE name = ?', [tagName]);
      if (tag) {
        runQuery('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)', [note.id, tag.id]);
      }
    }
  }

  saveDatabase();
  console.log('✅ Database seeded with sample data');
}

// Initialize database and start server
async function start() {
  try {
    // Initialize database
    await initDatabase();

    // Seed if empty
    await seedIfEmpty();

    // Routes
    app.use('/health', healthRouter);
    app.use('/auth', authRouter);
    app.use('/api/notes', notesRouter);
    app.use('/api/tags', tagsRouter);
    app.use('/api/nodes', graphRouter);
    app.use('/api/links', graphRouter);
    app.use('/api/graph', graphRouter);
    app.use('/api/search', searchRouter);
    app.use('/api/categories', taxonomyRouter);
    app.use('/api/clusters', taxonomyRouter);
    app.use('/api/analytics', analyticsRouter);
    app.use('/api/timeline', timelineRouter);
    app.use('/api/settings', settingsRouter);
    app.use('/api/feed', feedRouter);
    app.use('/api/focus', focusRouter);
    app.use('/api/music', musicRouter);
    app.use('/api/download', downloaderRouter);
    app.use('/api/workflow', workflowRouter);
    app.use('/api/claude', claudeRouter);
    app.use('/api/ai', aiRouter);

    // GraphQL endpoint
    app.use('/graphql', graphqlHTTP({
      schema,
      graphiql: process.env.NODE_ENV !== 'production',
      customFormatErrorFn: (error) => ({
        message: error.message,
        locations: error.locations,
        stack: error.stack,
      }),
    }));

    // Error handling
    app.use(errorHandler);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.path} not found`
        }
      });
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      saveDatabase();
      process.exit(0);
    });

    app.listen(PORT, () => {
      console.log(`🚀 Vicoo API running on http://localhost:${PORT}`);
      console.log(`📚 OpenAPI docs available at http://localhost:${PORT}/openapi.json`);
      
      // 启动后台知识图谱自动生成服务
      startAutoGraphService();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
