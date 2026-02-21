import { Router } from 'express';
import { getAll, getOne } from '../db/index.js';
import { semanticAISearch, generateAISummary, suggestAITags, initializeAI } from '../services/ai.js';

const router = Router();

// 初始化 AI 服务
initializeAI(process.env.AI_PROVIDER as any || 'auto');

// GET /api/search - Full-text search (保留原有功能)
router.get('/', (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Search query is required' }
      });
    }

    const query = String(q).toLowerCase();
    const searchPattern = `%${query}%`;

    const notes = getAll<any>(
      `SELECT * FROM notes 
       WHERE title LIKE ? OR content LIKE ? OR snippet LIKE ?
       ORDER BY timestamp DESC
       LIMIT ? OFFSET ?`,
      [searchPattern, searchPattern, searchPattern, Number(limit), Number(offset)]
    );

    const total = getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notes 
       WHERE title LIKE ? OR content LIKE ? OR snippet LIKE ?`,
      [searchPattern, searchPattern, searchPattern]
    );

    // Calculate relevance score
    const results = notes.map(note => {
      let relevance = 0;
      const titleLower = (note.title || '').toLowerCase();
      const contentLower = (note.content || '').toLowerCase();
      const snippetLower = (note.snippet || '').toLowerCase();

      // Title match = highest relevance
      if (titleLower.includes(query)) relevance += 50;
      // Snippet match = medium relevance
      if (snippetLower.includes(query)) relevance += 30;
      // Content match = lower relevance
      if (contentLower.includes(query)) relevance += 10;

      return {
        id: note.id,
        title: note.title,
        category: note.category,
        snippet: note.snippet,
        relevance: Math.min(relevance / 100, 1),
        timestamp: note.timestamp,
        published: !!note.published,
        color: note.color,
        icon: note.icon
      };
    });

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    res.json({
      data: results,
      meta: {
        total: total?.count || 0,
        limit: Number(limit),
        offset: Number(offset),
        query: String(q)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Search failed' }
    });
  }
});

// POST /api/search/semantic - AI-powered Semantic Search
router.post('/semantic', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Search query is required' }
      });
    }

    // 获取所有笔记用于语义搜索
    const notes = getAll<any>(
      `SELECT id, title, content, snippet, category, tags, timestamp, color, icon 
       ORDER BY timestamp DESC
       LIMIT 100`
    );

    if (notes.length === 0) {
      return res.json({
        data: [],
        meta: { query, type: 'semantic', total: 0 }
      });
    }

    // 转换为 AI 服务需要的格式
    const noteContents = notes.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content || note.snippet || '',
      tags: note.tags ? JSON.parse(note.tags) : []
    }));

    // 调用 AI 语义搜索
    const aiResults = await semanticAISearch(query, noteContents);

    // 限制结果数量并格式化返回
    const results = aiResults.slice(0, Number(limit)).map(result => {
      const originalNote = notes.find(n => n.id === result.noteId);
      return {
        id: result.noteId,
        title: result.title,
        snippet: originalNote?.snippet || originalNote?.content?.substring(0, 150),
        relevance: result.relevance,
        explanation: result.explanation,
        timestamp: originalNote?.timestamp,
        category: originalNote?.category,
        color: originalNote?.color,
        icon: originalNote?.icon
      };
    });

    res.json({
      data: results,
      meta: {
        query,
        type: 'semantic',
        total: results.length,
        model: 'gemini-2.0-flash'
      }
    });
  } catch (error: any) {
    console.error('Semantic search error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Semantic search failed' }
    });
  }
});

// POST /api/search/ai-summary - AI 自动摘要
router.post('/ai-summary', async (req, res) => {
  try {
    const { noteId, text } = req.body;

    if (!text && !noteId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'text or noteId is required' }
      });
    }

    let contentToSummarize = text;

    // 如果提供了 noteId，获取笔记内容
    if (noteId) {
      const note = getOne<any>('SELECT content, snippet FROM notes WHERE id = ?', [noteId]);
      if (!note) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Note not found' }
        });
      }
      contentToSummarize = note.content || note.snippet || '';
    }

    if (!contentToSummarize) {
      return res.json({
        data: { summary: '', keywords: [], noteId }
      });
    }

    // 调用 AI 生成摘要
    const result = await generateAISummary(contentToSummarize);

    res.json({
      data: {
        summary: result.summary || '',
        keywords: result.keywords || [],
        noteId,
        success: result.success
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Summary generation failed' }
    });
  }
});

// POST /api/search/ai-tags - AI 智能标签建议
router.post('/ai-tags', async (req, res) => {
  try {
    const { noteId, text } = req.body;

    if (!text && !noteId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'text or noteId is required' }
      });
    }

    let contentForTags = text;
    let existingTags: string[] = [];

    // 如果提供了 noteId，获取笔记内容和现有标签
    if (noteId) {
      const note = getOne<any>('SELECT content, snippet, tags FROM notes WHERE id = ?', [noteId]);
      if (!note) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Note not found' }
        });
      }
      contentForTags = note.content || note.snippet || '';
      existingTags = note.tags ? JSON.parse(note.tags) : [];
    }

    // 获取所有现有标签
    const allTags = getAll<{ name: string }>('SELECT name FROM tags');
    const existingTagNames = allTags.map(t => t.name);

    // 合并现有标签
    const combinedExistingTags = [...new Set([...existingTags, ...existingTagNames])];

    // 调用 AI 推荐标签
    const suggestions = await suggestAITags(contentForTags, combinedExistingTags);

    res.json({
      data: {
        suggestions: suggestions.map(s => ({
          tag: s.tag,
          confidence: s.confidence,
          isExisting: existingTagNames.includes(s.tag)
        })),
        noteId
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Tag suggestion failed' }
    });
  }
});

// GET /api/search/suggest - Search suggestions/autocomplete
router.get('/suggest', (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q) {
      return res.json({ data: [] });
    }

    const query = String(q).toLowerCase();
    const searchPattern = `%${query}%`;

    // Get matching note titles
    const titles = getAll<{ id: string; title: string }>(
      `SELECT id, title FROM notes 
       WHERE title LIKE ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [searchPattern, Number(limit)]
    );

    // Get matching tags
    const tags = getAll<{ name: string }>(
      `SELECT name FROM tags 
       WHERE name LIKE ?
       LIMIT ?`,
      [searchPattern, Number(limit)]
    );

    res.json({
      data: {
        notes: titles.map(t => ({ id: t.id, title: t.title, type: 'note' })),
        tags: tags.map(t => ({ name: t.name, type: 'tag' }))
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get suggestions' }
    });
  }
});

export default router;
