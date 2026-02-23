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

    // Routes
    app.use('/health', healthRouter);
    app.use('/auth', authRouter);
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
    app.use('/api/ai', authMiddleware, aiRouter);

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
