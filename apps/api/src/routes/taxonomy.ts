import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAll, getOne, runQuery, saveDatabase } from '../db/index.js';

const router = Router();

// ==================== CATEGORIES ====================

// GET /api/categories - Get all categories
router.get('/', (req, res) => {
  try {
    const categories = getAll<any>('SELECT * FROM categories ORDER BY label');

    const categoriesWithCounts = categories.map(cat => {
      const count = getOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM notes WHERE category = ?',
        [cat.label.toLowerCase()]
      );
      return {
        id: cat.id,
        label: cat.label,
        color: cat.color,
        subTags: cat.sub_tags ? JSON.parse(cat.sub_tags) : [],
        count: count?.count || 0
      };
    });

    res.json({ data: categoriesWithCounts });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories' }
    });
  }
});

// POST /api/categories - Create a new category
router.post('/', (req, res) => {
  try {
    const { label, color = '#6B7280', subTags = [] } = req.body;

    if (!label) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Category label is required' }
      });
    }

    const id = uuidv4();
    const subTagsJson = JSON.stringify(subTags);

    runQuery(
      'INSERT INTO categories (id, label, color, sub_tags) VALUES (?, ?, ?, ?)',
      [id, label, color, subTagsJson]
    );
    saveDatabase();

    res.status(201).json({
      data: { id, label, color, subTags }
    });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: { code: 'DUPLICATE_CATEGORY', message: 'Category already exists' }
      });
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create category' }
    });
  }
});

// PATCH /api/categories/:id - Update a category
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { label, color, subTags } = req.body;

    const existing = getOne<any>('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Category not found' }
      });
    }

    if (label) runQuery('UPDATE categories SET label = ? WHERE id = ?', [label, id]);
    if (color) runQuery('UPDATE categories SET color = ? WHERE id = ?', [color, id]);
    if (subTags) runQuery('UPDATE categories SET sub_tags = ? WHERE id = ?', [JSON.stringify(subTags), id]);

    saveDatabase();

    const updated = getOne<any>('SELECT * FROM categories WHERE id = ?', [id]);

    res.json({
      data: {
        id: updated.id,
        label: updated.label,
        color: updated.color,
        subTags: updated.sub_tags ? JSON.parse(updated.sub_tags) : []
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update category' }
    });
  }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = getOne<any>('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Category not found' }
      });
    }

    runQuery('DELETE FROM categories WHERE id = ?', [id]);
    saveDatabase();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete category' }
    });
  }
});

// ==================== CLUSTERS (AI Suggestions) ====================

// GET /api/clusters - Get AI-suggested clusters
router.get('/../clusters', (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM clusters';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY confidence DESC';
    const clusters = getAll<any>(query, params);

    res.json({
      data: clusters.map(c => ({
        id: c.id,
        suggestedLabel: c.suggested_label,
        confidence: c.confidence,
        items: c.items ? JSON.parse(c.items) : [],
        reason: c.reason,
        status: c.status
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch clusters' }
    });
  }
});

// POST /api/clusters - Create a new cluster suggestion
router.post('/../clusters', (req, res) => {
  try {
    const { suggestedLabel, confidence = 0, items = [], reason } = req.body;

    if (!suggestedLabel || items.length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Label and items are required' }
      });
    }

    const id = uuidv4();
    const itemsJson = JSON.stringify(items);

    runQuery(
      'INSERT INTO clusters (id, suggested_label, confidence, items, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, suggestedLabel, confidence, itemsJson, reason || null, 'pending']
    );
    saveDatabase();

    res.status(201).json({
      data: { id, suggestedLabel, confidence, items, reason, status: 'pending' }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create cluster' }
    });
  }
});

// POST /api/clusters/:id/accept - Accept a cluster suggestion
router.post('/../clusters/:id/accept', (req, res) => {
  try {
    const { id } = req.params;

    const cluster = getOne<any>('SELECT * FROM clusters WHERE id = ?', [id]);
    if (!cluster) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cluster not found' }
      });
    }

    runQuery('UPDATE clusters SET status = ? WHERE id = ?', ['accepted', id]);
    saveDatabase();

    // Create a category from the cluster
    const categoryId = uuidv4();
    const items = cluster.items ? JSON.parse(cluster.items) : [];
    runQuery(
      'INSERT OR IGNORE INTO categories (id, label, color, sub_tags) VALUES (?, ?, ?, ?)',
      [categoryId, cluster.suggested_label, '#FFD166', JSON.stringify(items)]
    );
    saveDatabase();

    res.json({
      data: { success: true, message: 'Cluster accepted and category created' }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to accept cluster' }
    });
  }
});

// POST /api/clusters/:id/reject - Reject a cluster suggestion
router.post('/../clusters/:id/reject', (req, res) => {
  try {
    const { id } = req.params;

    const cluster = getOne<any>('SELECT id FROM clusters WHERE id = ?', [id]);
    if (!cluster) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cluster not found' }
      });
    }

    runQuery('UPDATE clusters SET status = ? WHERE id = ?', ['rejected', id]);
    saveDatabase();

    res.json({ data: { success: true, message: 'Cluster rejected' } });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to reject cluster' }
    });
  }
});

// DELETE /api/clusters/:id - Delete a cluster
router.delete('/../clusters/:id', (req, res) => {
  try {
    const { id } = req.params;

    const cluster = getOne<any>('SELECT id FROM clusters WHERE id = ?', [id]);
    if (!cluster) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cluster not found' }
      });
    }

    runQuery('DELETE FROM clusters WHERE id = ?', [id]);
    saveDatabase();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete cluster' }
    });
  }
});

export default router;
