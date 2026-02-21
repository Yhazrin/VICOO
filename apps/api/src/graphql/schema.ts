import { makeExecutableSchema } from '@graphql-tools/schema';
import { getOne, getAll, runQuery, saveDatabase } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

// GraphQL Type Definitions
const typeDefs = `
  type Note {
    id: ID!
    title: String!
    content: String
    category: String
    snippet: String
    published: Boolean
    color: String
    icon: String
    tags: [String!]!
    timestamp: String
    updatedAt: String
  }

  type Tag {
    id: ID!
    name: String!
    count: Int
  }

  type Category {
    id: ID!
    name: String!
    count: Int
  }

  type Node {
    id: ID!
    label: String
    type: String
    x: Float
    y: Float
    color: String
    icon: String
  }

  type Link {
    id: ID!
    source: String!
    target: String!
    type: String
  }

  type SearchResult {
    notes: [Note!]!
    total: Int!
  }

  type NoteConnection {
    notes: [Note!]!
    total: Int!
    hasMore: Boolean!
  }

  input NoteInput {
    title: String!
    content: String
    category: String
    snippet: String
    tags: [String!]
    published: Boolean
    color: String
    icon: String
  }

  input NoteUpdateInput {
    title: String
    content: String
    category: String
    snippet: String
    tags: [String!]
    published: Boolean
    color: String
    icon: String
  }

  type Query {
    # Notes
    note(id: ID!): Note
    notes(limit: Int, offset: Int, category: String, tag: String): NoteConnection!
    publishedNotes(limit: Int, offset: Int): NoteConnection!

    # Tags
    tags: [Tag!]!

    # Categories
    categories: [Category!]!

    # Search
    searchNotes(query: String!, limit: Int): SearchResult!

    # Graph
    nodes: [Node!]!
    links: [Link!]!
  }

  type Mutation {
    # Notes
    createNote(input: NoteInput!): Note!
    updateNote(id: ID!, input: NoteUpdateInput!): Note!
    deleteNote(id: ID!): Boolean!

    # Bulk operations
    bulkCreateNotes(notes: [NoteInput!]!): [Note!]!
    bulkDeleteNotes(ids: [ID!]!): Int!

    # Tags
    createTag(name: String!): Tag!
    deleteTag(id: ID!): Boolean!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    note: (_: any, { id }: { id: string }) => {
      const userId = 'dev_user_1';
      const note = getOne<any>('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
      if (!note) return null;

      const tags = getAll<{ name: string }>(
        `SELECT t.name FROM tags t
         JOIN note_tags nt ON t.id = nt.tag_id
         WHERE nt.note_id = ?`,
        [note.id]
      ).map(t => t.name);

      return {
        ...note,
        published: Boolean(note.published),
        tags,
      };
    },

    notes: (_: any, args: { limit?: number; offset?: number; category?: string; tag?: string }) => {
      const { limit = 20, offset = 0, category, tag } = args;
      const userId = 'dev_user_1';

      let query = 'SELECT * FROM notes WHERE user_id = ?';
      const params: any[] = [userId];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const totalResult = getOne<{ total: number }>(countQuery, params);
      const total = totalResult?.total || 0;

      query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const notes = getAll<any>(query, params);

      const notesWithTags = notes.map((note: any) => {
        const tags = getAll<{ name: string }>(
          `SELECT t.name FROM tags t
           JOIN note_tags nt ON t.id = nt.tag_id
           WHERE nt.note_id = ?`,
          [note.id]
        ).map(t => t.name);

        return {
          ...note,
          published: Boolean(note.published),
          tags,
        };
      });

      // Handle tag filter
      let filtered = notesWithTags;
      if (tag) {
        filtered = notesWithTags.filter((n: any) => n.tags.includes(tag));
      }

      return {
        notes: filtered,
        total,
        hasMore: offset + notes.length < total,
      };
    },

    publishedNotes: (_: any, args: { limit?: number; offset?: number }) => {
      const { limit = 20, offset = 0 } = args;

      const notes = getAll<any>(
        'SELECT * FROM notes WHERE published = 1 ORDER BY timestamp DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      const total = getOne<{ count: number }>('SELECT COUNT(*) as count FROM notes WHERE published = 1');

      return {
        notes: notes.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          category: n.category,
          snippet: n.snippet,
          published: true,
          color: n.color,
          icon: n.icon,
          tags: [],
          timestamp: n.timestamp,
        })),
        total: total?.count || 0,
        hasMore: offset + notes.length < (total?.count || 0),
      };
    },

    tags: () => {
      const tags = getAll<any>('SELECT * FROM tags ORDER BY name');
      return tags.map((tag: any) => {
        const count = getOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM note_tags WHERE tag_id = ?',
          [tag.id]
        );
        return { ...tag, count: count?.count || 0 };
      });
    },

    categories: () => {
      const categories = getAll<any>('SELECT DISTINCT category FROM notes WHERE category IS NOT NULL');
      return categories.map((c: any) => {
        const count = getOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM notes WHERE category = ?',
          [c.category]
        );
        return {
          id: c.category,
          name: c.category,
          count: count?.count || 0,
        };
      });
    },

    searchNotes: (_: any, { query, limit = 20 }: { query: string; limit?: number }) => {
      const userId = 'dev_user_1';
      const searchQuery = `%${query}%`;

      const notes = getAll<any>(
        `SELECT * FROM notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ?) ORDER BY timestamp DESC LIMIT ?`,
        [userId, searchQuery, searchQuery, limit]
      );

      const total = getOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)`,
        [userId, searchQuery, searchQuery]
      );

      return {
        notes: notes.map((note: any) => ({
          ...note,
          published: Boolean(note.published),
          tags: [],
        })),
        total: total?.count || 0,
      };
    },

    nodes: () => {
      return getAll<any>('SELECT * FROM nodes');
    },

    links: () => {
      return getAll<any>('SELECT * FROM links');
    },
  },

  Mutation: {
    createNote: (_: any, { input }: { input: any }) => {
      const userId = 'dev_user_1';
      const id = uuidv4();
      const timestamp = new Date().toISOString();

      runQuery(
        `INSERT INTO notes (id, user_id, title, category, snippet, content, published, color, icon, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, input.title, input.category || 'idea', input.snippet || (input.content?.slice(0, 100) || ''), input.content || '', input.published ? 1 : 0, input.color, input.icon, timestamp]
      );

      // Handle tags
      if (input.tags && Array.isArray(input.tags)) {
        for (const tagName of input.tags) {
          const tagId = uuidv4();
          runQuery('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
          const tag = getOne<{ id: string }>('SELECT id FROM tags WHERE name = ?', [tagName]);
          if (tag) {
            runQuery('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)', [id, tag.id]);
          }
        }
      }

      saveDatabase();

      const note = getOne<any>('SELECT * FROM notes WHERE id = ?', [id]);
      return { ...note, published: Boolean(note?.published), tags: input.tags || [] };
    },

    updateNote: (_: any, { id, input }: { id: string; input: any }) => {
      const userId = 'dev_user_1';
      const updates: string[] = [];
      const params: any[] = [];

      if (input.title !== undefined) { updates.push('title = ?'); params.push(input.title); }
      if (input.category !== undefined) { updates.push('category = ?'); params.push(input.category); }
      if (input.content !== undefined) { updates.push('content = ?'); params.push(input.content); }
      if (input.snippet !== undefined) { updates.push('snippet = ?'); params.push(input.snippet); }
      if (input.published !== undefined) { updates.push('published = ?'); params.push(input.published ? 1 : 0); }
      if (input.color !== undefined) { updates.push('color = ?'); params.push(input.color); }
      if (input.icon !== undefined) { updates.push('icon = ?'); params.push(input.icon); }

      updates.push("updated_at = datetime('now')");

      if (updates.length > 0) {
        params.push(id, userId);
        runQuery(`UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
      }

      // Update tags if provided
      if (input.tags !== undefined) {
        runQuery('DELETE FROM note_tags WHERE note_id = ?', [id]);

        for (const tagName of input.tags) {
          const tagId = uuidv4();
          runQuery('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
          const tag = getOne<{ id: string }>('SELECT id FROM tags WHERE name = ?', [tagName]);
          if (tag) {
            runQuery('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)', [id, tag.id]);
          }
        }
      }

      saveDatabase();

      const note = getOne<any>('SELECT * FROM notes WHERE id = ?', [id]);
      const tags = getAll<{ name: string }>(
        `SELECT t.name FROM tags t JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = ?`,
        [id]
      ).map(t => t.name);

      return { ...note, published: Boolean(note?.published), tags };
    },

    deleteNote: (_: any, { id }: { id: string }) => {
      runQuery('DELETE FROM note_tags WHERE note_id = ?', [id]);
      runQuery('DELETE FROM notes WHERE id = ?', [id]);
      saveDatabase();
      return true;
    },

    bulkCreateNotes: (_: any, { notes }: { notes: any[] }) => {
      const userId = 'dev_user_1';
      const created: any[] = [];

      for (const input of notes) {
        const id = uuidv4();
        const timestamp = new Date().toISOString();

        runQuery(
          `INSERT INTO notes (id, user_id, title, category, snippet, content, published, color, icon, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, userId, input.title, input.category || 'idea', input.snippet || (input.content?.slice(0, 100) || ''), input.content || '', input.published ? 1 : 0, input.color, input.icon, timestamp]
        );

        created.push({ id, ...input });
      }

      saveDatabase();
      return created;
    },

    bulkDeleteNotes: (_: any, { ids }: { ids: string[] }) => {
      for (const id of ids) {
        runQuery('DELETE FROM note_tags WHERE note_id = ?', [id]);
        runQuery('DELETE FROM notes WHERE id = ?', [id]);
      }
      saveDatabase();
      return ids.length;
    },

    createTag: (_: any, { name }: { name: string }) => {
      const id = uuidv4();
      runQuery('INSERT INTO tags (id, name) VALUES (?, ?)', [id, name]);
      saveDatabase();
      return { id, name, count: 0 };
    },

    deleteTag: (_: any, { id }: { id: string }) => {
      runQuery('DELETE FROM note_tags WHERE tag_id = ?', [id]);
      runQuery('DELETE FROM tags WHERE id = ?', [id]);
      saveDatabase();
      return true;
    },
  },
};

// Create executable schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export default schema;
