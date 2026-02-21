import { Router } from 'express';
import { getAll, getOne, runQuery } from '../db/index.js';

const router = Router();

// GET /api/analytics/overview - Get overall statistics
router.get('/overview', (req, res) => {
  try {
    const totalNotes = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes');
    const publishedNotes = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes WHERE published = 1');
    const orphanNotes = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes WHERE id NOT IN (SELECT linked_note_id FROM nodes WHERE linked_note_id IS NOT NULL)');
    const totalNodes = getOne<{ count: number }>('SELECT COUNT(*) as count FROM nodes');
    const totalTags = getOne<{ count: number }>('SELECT COUNT(*) as count FROM tags');

    // Last 30 days stats
    const last30Days = getOne<any>(`
      SELECT 
        COALESCE(SUM(CASE WHEN published = 1 THEN 1 ELSE 0 END), 0) as created,
        COALESCE(SUM(CASE WHEN updated_at > datetime('now', '-30 days') THEN 1 ELSE 0 END), 0) as modified
      FROM notes
    `);

    res.json({
      data: {
        totalNotes: totalNotes?.count || 0,
        totalNodes: totalNodes?.count || 0,
        totalTags: totalTags?.count || 0,
        publishedNotes: publishedNotes?.count || 0,
        orphanNotes: orphanNotes?.count || 0,
        last30Days: {
          created: last30Days?.created || 0,
          modified: last30Days?.modified || 0,
          deleted: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' }
    });
  }
});

// GET /api/analytics/activity - Get activity over time
router.get('/activity', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const numDays = Number(days);

    // Get notes created per day for the last N days
    const activity = getAll<any>(`
      SELECT 
        date(timestamp) as date,
        COUNT(*) as count
      FROM notes
      WHERE timestamp >= datetime('now', '-${numDays} days')
      GROUP BY date(timestamp)
      ORDER BY date ASC
    `);

    // Fill in missing dates with 0
    const result = [];
    const today = new Date();
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const existing = activity.find((a: any) => a.date === dateStr);
      result.push({
        date: dateStr,
        notes: existing ? existing.count : 0
      });
    }

    res.json({ data: result });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch activity' }
    });
  }
});

// GET /api/analytics/tags - Get tag statistics
router.get('/tags', (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const tags = getAll<any>(`
      SELECT t.id, t.name, t.color, COUNT(nt.note_id) as count
      FROM tags t
      LEFT JOIN note_tags nt ON t.id = nt.tag_id
      GROUP BY t.id
      ORDER BY count DESC
      LIMIT ?
    `, [Number(limit)]);

    const total = getOne<{ count: number }>('SELECT COUNT(*) as count FROM note_tags');

    res.json({
      data: tags.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color || '#6B7280',
        count: t.count
      })),
      meta: {
        total: total?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tag analytics' }
    });
  }
});

// GET /api/analytics/categories - Get category statistics
router.get('/categories', (req, res) => {
  try {
    const categories = getAll<any>(`
      SELECT category, COUNT(*) as count
      FROM notes
      GROUP BY category
      ORDER BY count DESC
    `);

    const total = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes');

    const colorMap: Record<string, string> = {
      idea: '#FFD166',
      code: '#118AB2',
      design: '#EF476F',
      meeting: '#0df259'
    };

    res.json({
      data: categories.map(c => ({
        category: c.category,
        count: c.count,
        color: colorMap[c.category] || '#6B7280',
        percentage: total?.count ? Math.round((c.count / total.count) * 100) : 0
      })),
      meta: {
        total: total?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch category analytics' }
    });
  }
});

// GET /api/analytics/publish-ratio - Get published vs draft ratio
router.get('/publish-ratio', (req, res) => {
  try {
    const published = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes WHERE published = 1');
    const draft = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes WHERE published = 0');
    const total = (published?.count || 0) + (draft?.count || 0);

    res.json({
      data: {
        published: published?.count || 0,
        draft: draft?.count || 0,
        total: total,
        ratio: total ? Math.round((published?.count / total) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch publish ratio' }
    });
  }
});

export default router;
