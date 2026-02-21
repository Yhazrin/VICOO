import { Router } from 'express';
import { getAll, getOne } from '../db/index.js';

const router = Router();

// GET /api/feed - Get dashboard feed items
router.get('/', (req, res) => {
  try {
    const items: any[] = [];

    // Get draft notes (unpublished)
    const drafts = getAll<any>(
      "SELECT id, title, timestamp FROM notes WHERE published = 0 ORDER BY timestamp DESC LIMIT 5"
    );
    drafts.forEach(draft => {
      items.push({
        id: `draft-${draft.id}`,
        type: 'draft',
        title: draft.title,
        description: 'Unpublished note',
        priority: 'medium',
        timestamp: draft.timestamp,
        metadata: { noteId: draft.id }
      });
    });

    // Get recent notes for suggestions
    const recentNotes = getAll<any>(
      'SELECT id, title, category, timestamp FROM notes ORDER BY timestamp DESC LIMIT 3'
    );
    recentNotes.forEach(note => {
      items.push({
        id: `suggestion-${note.id}`,
        type: 'suggestion',
        title: `Review: ${note.title}`,
        description: `Category: ${note.category}`,
        priority: 'low',
        timestamp: note.timestamp,
        metadata: { noteId: note.id }
      });
    });

    // Add some mock memory items
    items.push({
      id: 'memory-1',
      type: 'memory',
      title: 'You wrote about React last week',
      description: 'Consider revisiting your React notes',
      priority: 'low',
      timestamp: new Date().toISOString()
    });

    // Sort by timestamp
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ data: items });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch feed' }
    });
  }
});

// GET /api/feed/drafts - Get draft notes
router.get('/drafts', (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const drafts = getAll<any>(
      'SELECT * FROM notes WHERE published = 0 ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [Number(limit), Number(offset)]
    );

    const total = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes WHERE published = 0');

    res.json({
      data: drafts.map(n => ({
        id: n.id,
        title: n.title,
        snippet: n.snippet,
        category: n.category,
        timestamp: n.timestamp
      })),
      meta: {
        total: total?.count || 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch drafts' }
    });
  }
});

// GET /api/feed/suggestions - Get system suggestions
router.get('/suggestions', (req, res) => {
  try {
    const suggestions: any[] = [];

    // Suggest publishing unpublished notes
    const unpublished = getAll<any>(
      "SELECT id, title, timestamp FROM notes WHERE published = 0 ORDER BY timestamp DESC LIMIT 3"
    );
    unpublished.forEach(note => {
      suggestions.push({
        id: `publish-${note.id}`,
        type: 'publish',
        title: 'Consider publishing',
        description: `"${note.title}" is ready to share`,
        action: { type: 'publish', noteId: note.id }
      });
    });

    // Suggest adding tags to notes without tags
    const noTags = getAll<any>(
      `SELECT n.id, n.title FROM notes n
       LEFT JOIN note_tags nt ON n.id = nt.note_id
       WHERE nt.note_id IS NULL
       LIMIT 3`
    );
    noTags.forEach(note => {
      suggestions.push({
        id: `tag-${note.id}`,
        type: 'tag',
        title: 'Add tags',
        description: `"${note.title}" has no tags`,
        action: { type: 'add_tag', noteId: note.id }
      });
    });

    // Suggest creating nodes for orphan notes
    const orphanNotes = getAll<any>(
      `SELECT n.id, n.title FROM notes n
       LEFT JOIN nodes n2 ON n.id = n2.linked_note_id
       WHERE n2.linked_note_id IS NULL
       LIMIT 3`
    );
    orphanNotes.forEach(note => {
      suggestions.push({
        id: `node-${note.id}`,
        type: 'galaxy',
        title: 'Add to Galaxy',
        description: `Add "${note.title}" to your knowledge graph`,
        action: { type: 'add_node', noteId: note.id }
      });
    });

    res.json({ data: suggestions });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch suggestions' }
    });
  }
});

export default router;
