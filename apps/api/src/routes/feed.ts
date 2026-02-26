import { Router } from 'express';
import { getAll, getOne } from '../db/index.js';

const router = Router();

// Types for feed items
interface FeedItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  priority?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  action?: Record<string, unknown>;
}

interface DraftNote {
  id: string;
  title: string;
  timestamp: string;
  category?: string;
  snippet?: string;
}

// Helper to transform database rows to feed items
function transformDrafts(drafts: DraftNote[]): FeedItem[] {
  return drafts.map(draft => ({
    id: `draft-${draft.id}`,
    type: 'draft',
    title: draft.title,
    description: 'Unpublished note',
    priority: 'medium',
    timestamp: draft.timestamp,
    metadata: { noteId: draft.id }
  }));
}

function transformSuggestions(notes: DraftNote[], type: string, actionType: string): FeedItem[] {
  return notes.map(note => ({
    id: `${type}-${note.id}`,
    type,
    title: type === 'publish' ? 'Consider publishing' : type === 'tag' ? 'Add tags' : 'Add to Galaxy',
    description: type === 'publish' ? `"${note.title}" is ready to share`
      : type === 'tag' ? `"${note.title}" has no tags`
      : `Add "${note.title}" to your knowledge graph`,
    action: { type: actionType, noteId: note.id }
  }));
}

// GET /api/feed - Get dashboard feed items
router.get('/', (req, res) => {
  try {
    // Get draft notes (unpublished)
    const drafts = getAll<DraftNote>(
      "SELECT id, title, timestamp FROM notes WHERE published = 0 ORDER BY timestamp DESC LIMIT 5"
    );

    // Get recent notes for suggestions
    const recentNotes = getAll<DraftNote>(
      'SELECT id, title, category, timestamp FROM notes ORDER BY timestamp DESC LIMIT 3'
    );

    // Build items using map and concat instead of forEach + push
    const draftItems = transformDrafts(drafts);
    const suggestionItems = recentNotes.map(note => ({
      id: `suggestion-${note.id}`,
      type: 'suggestion',
      title: `Review: ${note.title}`,
      description: `Category: ${note.category}`,
      priority: 'low',
      timestamp: note.timestamp,
      metadata: { noteId: note.id }
    }));

    // Add mock memory item
    const memoryItem: FeedItem = {
      id: 'memory-1',
      type: 'memory',
      title: 'You wrote about React last week',
      description: 'Consider revisiting your React notes',
      priority: 'low',
      timestamp: new Date().toISOString()
    };

    // Combine and sort by timestamp
    const items = [memoryItem, ...draftItems, ...suggestionItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.json({ data: items });
  } catch (error) {
    console.error('[Feed] Failed to fetch feed:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch feed' }
    });
  }
});

// GET /api/feed/drafts - Get draft notes
router.get('/drafts', (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100); // Cap at 100
    const offset = Number(req.query.offset) || 0;

    const drafts = getAll<DraftNote>(
      'SELECT * FROM notes WHERE published = 0 ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
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
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('[Feed] Failed to fetch drafts:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch drafts' }
    });
  }
});

// GET /api/feed/suggestions - Get system suggestions
router.get('/suggestions', (req, res) => {
  try {
    // Suggest publishing unpublished notes
    const unpublished = getAll<DraftNote>(
      "SELECT id, title, timestamp FROM notes WHERE published = 0 ORDER BY timestamp DESC LIMIT 3"
    );

    // Suggest adding tags to notes without tags
    const noTags = getAll<DraftNote>(
      `SELECT n.id, n.title FROM notes n
       LEFT JOIN note_tags nt ON n.id = nt.note_id
       WHERE nt.note_id IS NULL
       LIMIT 3`
    );

    // Suggest creating nodes for orphan notes
    const orphanNotes = getAll<DraftNote>(
      `SELECT n.id, n.title FROM notes n
       LEFT JOIN nodes n2 ON n.id = n2.linked_note_id
       WHERE n2.linked_note_id IS NULL
       LIMIT 3`
    );

    // Build suggestions using concat instead of forEach + push
    const suggestions = [
      ...transformSuggestions(unpublished, 'publish', 'publish'),
      ...transformSuggestions(noTags, 'tag', 'add_tag'),
      ...transformSuggestions(orphanNotes, 'galaxy', 'add_node')
    ];

    res.json({ data: suggestions });
  } catch (error) {
    console.error('[Feed] Failed to fetch suggestions:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch suggestions' }
    });
  }
});

export default router;
