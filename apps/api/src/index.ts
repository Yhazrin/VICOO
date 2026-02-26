import 'dotenv/config';
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
import { initDatabase, saveDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { initializeBuiltinMCPServers } from './services/mcp.js';
import { initializeRecommendedMCPs } from './scripts/init-mcp.js';
import { graphqlHTTP } from 'express-graphql';
import { schema } from './graphql/schema.js';
import { startAutoGraphService } from './services/auto-graph.js';
import aiRouter from './routes/ai.js';
import publishRouter from './routes/publish.js';
import publishedRouter from './routes/published.js';
import mcpRouter from './routes/mcp.js';
import writerRouter from './routes/writer.js';
import tasksRouter from './routes/tasks.js';
import ragRouter from './routes/rag.js';
import noteLinksRouter from './routes/note-links.js';
import subscriptionRouter from './routes/subscription.js';
import adminRouter from './routes/admin.js';
import uploadRouter from './routes/upload.js';
import importRouter from './routes/import.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
import { securityHeaders, globalRateLimiter, authRateLimiter, aiRateLimiter, sanitizeInput } from './middleware/security.js';
app.use(securityHeaders);
app.use(globalRateLimiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput); // Must be AFTER body parsers

// Serve uploaded files
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Initialize database and start server
async function start() {
  try {
    // Initialize database
    await initDatabase();

    // Optional development seed only.
    // For production, use explicit migration scripts instead of runtime seed data.
    if (process.env.AUTO_SEED_ON_START === 'true') {
      await seedDatabase();
    }

    // Backfill timeline events & categories for existing notes
    try {
      const { getAll: gAll, runQuery: rQ, saveDatabase: sDB } = await import('./db/index.js');
      const uuid = await import('uuid');
      const existingNotes = gAll<any>('SELECT id, title, category, timestamp FROM notes WHERE user_id = ?', ['dev_user_1']);
      let backfilled = 0;
      for (const n of existingNotes) {
        try {
          rQ('INSERT INTO timeline_events (id, title, type, date, description, related_note_id) VALUES (?, ?, ?, ?, ?, ?)',
            [uuid.v4(), `笔记: ${n.title}`, 'Idea', n.timestamp, `笔记「${n.title}」`, n.id]);
          backfilled++;
        } catch (_) {}
        try {
          rQ('INSERT OR IGNORE INTO categories (id, label, color) VALUES (?, ?, ?)',
            [uuid.v4(), n.category, '#6B7280']);
        } catch (_) {}
      }
      sDB();
      if (backfilled > 0) console.log(`[Backfill] Created ${backfilled} timeline events from existing notes`);
    } catch (e: any) { console.error('[Backfill] Error:', e.message); }

    // Initialize MCP servers
    initializeBuiltinMCPServers();
    if (process.env.AUTO_INIT_MCP === 'true') {
      initializeRecommendedMCPs();
    }

    // Public routes (no auth required)
    app.use('/health', healthRouter);
    app.use('/auth', authRouter); // rate limiting applied per-route inside auth.ts
    app.use('/api/published', publishedRouter);

    // Protected routes
    app.use('/api/notes', authMiddleware, notesRouter);
    app.use('/api/tags', authMiddleware, tagsRouter);
    app.use('/api/nodes', authMiddleware, graphRouter);
    app.use('/api/links', authMiddleware, graphRouter);
    app.use('/api/graph', authMiddleware, graphRouter);
    app.use('/api/search', authMiddleware, searchRouter);
    app.use('/api/categories', authMiddleware, taxonomyRouter);
    app.use('/api/clusters', authMiddleware, taxonomyRouter);
    app.use('/api/analytics', authMiddleware, analyticsRouter);
    app.use('/api/timeline', authMiddleware, timelineRouter);
    app.use('/api/settings', authMiddleware, settingsRouter);
    app.use('/api/feed', authMiddleware, feedRouter);
    app.use('/api/focus', authMiddleware, focusRouter);
    app.use('/api/music', authMiddleware, musicRouter);
    app.use('/api/download', authMiddleware, downloaderRouter);
    app.use('/api/workflow', authMiddleware, workflowRouter);
    app.use('/api/claude', authMiddleware, claudeRouter);
    app.use('/api/ai', authMiddleware, aiRateLimiter, aiRouter);
    app.use('/api/publish', authMiddleware, publishRouter);
    app.use('/api/agent/mcp', mcpRouter);
    app.use('/api/writer', authMiddleware, writerRouter);
    app.use('/api/tasks', authMiddleware, tasksRouter);
    app.use('/api/rag', authMiddleware, ragRouter);
    app.use('/api/note-links', authMiddleware, noteLinksRouter);
    app.use('/api/subscription', authMiddleware, subscriptionRouter);
    app.use('/api/admin', authMiddleware, adminRouter);
    app.use('/api/upload', authMiddleware, uploadRouter);
    app.use('/api/import', authMiddleware, importRouter);

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

    // Create HTTP server and attach WebSocket collaboration
    const http = await import('http');
    const { setupCollaborationServer } = await import('./services/collaboration.js');
    const server = http.createServer(app);
    setupCollaborationServer(server);

    server.listen(PORT, () => {
      console.log(`🚀 Vicoo API running on http://localhost:${PORT}`);
      console.log(`📚 OpenAPI docs available at http://localhost:${PORT}/openapi.json`);
      console.log(`🔄 WebSocket collaboration at ws://localhost:${PORT}/ws/collab`);
      
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
