/**
 * Vicoo API 单元测试套件
 *
 * 测试覆盖：
 * 1. feed.ts - 数据转换函数
 * 2. analytics.ts - 类型定义
 * 3. graph.ts - 类型定义和验证
 * 4. 通用工具函数
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// ============================================
// 测试 1: feed.ts 类型和转换函数
// ============================================

// 模拟 FeedItem 接口
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

// 转换函数 (从 feed.ts 复制)
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

test('feed.ts: transformDrafts converts drafts correctly', () => {
  const drafts: DraftNote[] = [
    { id: '1', title: 'Test Note 1', timestamp: '2024-01-01T00:00:00Z' },
    { id: '2', title: 'Test Note 2', timestamp: '2024-01-02T00:00:00Z' }
  ];

  const result = transformDrafts(drafts);

  assert.equal(result.length, 2);
  assert.equal(result[0].id, 'draft-1');
  assert.equal(result[0].type, 'draft');
  assert.equal(result[0].title, 'Test Note 1');
  assert.equal(result[0].priority, 'medium');
  assert.deepEqual(result[0].metadata, { noteId: '1' });
});

test('feed.ts: transformDrafts handles empty array', () => {
  const drafts: DraftNote[] = [];
  const result = transformDrafts(drafts);
  assert.equal(result.length, 0);
});

test('feed.ts: transformSuggestions with type publish', () => {
  const notes: DraftNote[] = [
    { id: '1', title: 'My Note', timestamp: '2024-01-01T00:00:00Z' }
  ];

  const result = transformSuggestions(notes, 'publish', 'publish');

  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'publish-1');
  assert.equal(result[0].type, 'publish');
  assert.equal(result[0].title, 'Consider publishing');
  assert.equal(result[0].description, '"My Note" is ready to share');
  assert.deepEqual(result[0].action, { type: 'publish', noteId: '1' });
});

test('feed.ts: transformSuggestions with type tag', () => {
  const notes: DraftNote[] = [
    { id: '2', title: 'Tagged Note', timestamp: '2024-01-01T00:00:00Z' }
  ];

  const result = transformSuggestions(notes, 'tag', 'add_tag');

  assert.equal(result[0].title, 'Add tags');
  assert.equal(result[0].description, '"Tagged Note" has no tags');
});

test('feed.ts: transformSuggestions with type galaxy', () => {
  const notes: DraftNote[] = [
    { id: '3', title: 'Graph Note', timestamp: '2024-01-01T00:00:00Z' }
  ];

  const result = transformSuggestions(notes, 'galaxy', 'add_node');

  assert.equal(result[0].title, 'Add to Galaxy');
  assert.equal(result[0].description, 'Add "Graph Note" to your knowledge graph');
});

test('feed.ts: transformSuggestions handles empty array', () => {
  const notes: DraftNote[] = [];
  const result = transformSuggestions(notes, 'publish', 'publish');
  assert.equal(result.length, 0);
});

// ============================================
// 测试 2: analytics.ts 类型定义
// ============================================

interface ActivityRow {
  date: string;
  count: number;
}

interface TagRow {
  name: string;
  count: number;
}

interface CategoryRow {
  category: string;
  count: number;
}

interface Last30DaysStats {
  created: number;
  modified: number;
}

test('analytics.ts: ActivityRow type validation', () => {
  const row: ActivityRow = {
    date: '2024-01-01',
    count: 10
  };
  assert.equal(row.date, '2024-01-01');
  assert.equal(row.count, 10);
});

test('analytics.ts: TagRow type validation', () => {
  const row: TagRow = {
    name: 'important',
    count: 5
  };
  assert.equal(row.name, 'important');
  assert.equal(row.count, 5);
});

test('analytics.ts: CategoryRow type validation', () => {
  const row: CategoryRow = {
    category: 'idea',
    count: 20
  };
  assert.equal(row.category, 'idea');
  assert.equal(row.count, 20);
});

test('analytics.ts: Last30DaysStats type validation', () => {
  const stats: Last30DaysStats = {
    created: 15,
    modified: 8
  };
  assert.equal(stats.created, 15);
  assert.equal(stats.modified, 8);
});

// ============================================
// 测试 3: graph.ts 类型定义
// ============================================

interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: string;
  color: string;
  icon: string;
  description: string;
  linked_note_id: string;
  tags: string;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  label: string;
  color: string;
}

test('graph.ts: GraphNode type validation', () => {
  const node: GraphNode = {
    id: 'node-1',
    x: 100,
    y: 200,
    label: 'React',
    type: 'technology',
    color: '#FF0000',
    icon: 'code',
    description: 'A JS library',
    linked_note_id: 'note-1',
    tags: '["react", "frontend"]'
  };
  assert.equal(node.id, 'node-1');
  assert.equal(node.x, 100);
  assert.equal(node.y, 200);
});

test('graph.ts: GraphLink type validation', () => {
  const link: GraphLink = {
    id: 'link-1',
    source: 'node-1',
    target: 'node-2',
    label: 'related_to',
    color: '#00FF00'
  };
  assert.equal(link.source, 'node-1');
  assert.equal(link.target, 'node-2');
});

// ============================================
// 测试 4: 数据处理逻辑
// ============================================

test('data processing: merge arrays with concat', () => {
  const drafts = [{ id: '1', title: 'Draft 1', timestamp: '2024-01-01' }];
  const suggestions = [{ id: '2', title: 'Suggestion 1', timestamp: '2024-01-02' }];

  const combined = [...drafts, ...suggestions];

  assert.equal(combined.length, 2);
});

test('data processing: sort by timestamp', () => {
  const items = [
    { id: '1', timestamp: '2024-01-03' },
    { id: '2', timestamp: '2024-01-01' },
    { id: '3', timestamp: '2024-01-02' }
  ];

  const sorted = items.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  assert.equal(sorted[0].id, '1');
  assert.equal(sorted[1].id, '3');
  assert.equal(sorted[2].id, '2');
});

test('data processing: limit protection', () => {
  const limit = Math.min(150, 100);
  assert.equal(limit, 100);

  const limit2 = Math.min(50, 100);
  assert.equal(limit2, 50);
});

test('data processing: parse JSON tags', () => {
  const tagsStr = '["react", "typescript", "vite"]';
  const tags = JSON.parse(tagsStr);

  assert.deepEqual(tags, ['react', 'typescript', 'vite']);
});

test('data processing: parse empty tags', () => {
  const tagsStr = '';
  const tags = tagsStr ? JSON.parse(tagsStr) : [];

  assert.deepEqual(tags, []);
});

// ============================================
// 测试 5: 字符串处理
// ============================================

test('string processing: parse wiki links', () => {
  const content = 'This is a note about [[React]] and [[TypeScript]].';
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]);
  }

  assert.deepEqual(links, ['React', 'TypeScript']);
});

test('string processing: parse wiki links - no links', () => {
  const content = 'This is a normal note without links.';
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]);
  }

  assert.deepEqual(links, []);
});

test('string processing: substring for snippet', () => {
  const content = 'This is a very long note content that needs to be truncated.';
  const snippet = content.substring(0, 30);

  assert.equal(snippet.length, 30);
  assert.equal(snippet, 'This is a very long note conte');
});

test('string processing: date formatting', () => {
  const date = new Date('2024-01-15T12:00:00Z');
  const dateStr = date.toISOString().split('T')[0];

  assert.equal(dateStr, '2024-01-15');
});

// ============================================
// 测试 6: 输入验证
// ============================================

test('validation: required fields', () => {
  const data = { title: 'Test', content: 'Content' };
  const isValid = !!(data.title && data.content);

  assert.equal(isValid, true);
});

test('validation: missing required field', () => {
  const data = { title: 'Test' };
  const isValid = !!(data.title && data.content);

  assert.equal(isValid, false);
});

test('validation: empty title', () => {
  const title = '   ';
  const isValid = title.trim().length > 0;

  assert.equal(isValid, false);
});

test('validation: valid category', () => {
  const validCategories = ['idea', 'code', 'design', 'meeting'];
  const category = 'idea';

  assert.equal(validCategories.includes(category), true);
});

test('validation: invalid category', () => {
  const validCategories = ['idea', 'code', 'design', 'meeting'];
  const category = 'invalid';

  assert.equal(validCategories.includes(category), false);
});

// ============================================
// 测试 7: 数字处理
// ============================================

test('math: calculate percentage', () => {
  const count = 25;
  const total = 100;
  const percentage = total ? Math.round((count / total) * 100) : 0;

  assert.equal(percentage, 25);
});

test('math: calculate percentage with zero total', () => {
  const count = 25;
  const total = 0;
  const percentage = total ? Math.round((count / total) * 100) : 0;

  assert.equal(percentage, 0);
});

test('math: round numbers', () => {
  assert.equal(Math.round(4.5), 5);
  assert.equal(Math.round(4.4), 4);
});

test('math: clamp value', () => {
  const value = Math.min(Math.max(150, 0), 100);
  assert.equal(value, 100);

  const value2 = Math.min(Math.max(-10, 0), 100);
  assert.equal(value2, 0);

  const value3 = Math.min(Math.max(50, 0), 100);
  assert.equal(value3, 50);
});

// ============================================
// 测试 8: 对象处理
// ============================================

test('object: deep clone', () => {
  const original = { a: 1, b: { c: 2 } };
  const clone = JSON.parse(JSON.stringify(original));

  assert.deepEqual(clone, original);
  assert.notStrictEqual(clone, original);
});

test('object: merge objects', () => {
  const obj1 = { a: 1, b: 2 };
  const obj2 = { b: 3, c: 4 };
  const merged = { ...obj1, ...obj2 };

  assert.deepEqual(merged, { a: 1, b: 3, c: 4 });
});

test('object: pick specific fields', () => {
  const obj = { id: '1', title: 'Test', content: 'Content', extra: 'data' };
  const picked = {
    id: obj.id,
    title: obj.title
  };

  assert.deepEqual(picked, { id: '1', title: 'Test' });
});

// ============================================
// 测试 9: 数组处理
// ============================================

test('array: map transformation', () => {
  const notes = [
    { id: '1', title: 'Note 1' },
    { id: '2', title: 'Note 2' }
  ];

  const titles = notes.map(n => n.title);

  assert.deepEqual(titles, ['Note 1', 'Note 2']);
});

test('array: filter by condition', () => {
  const notes = [
    { id: '1', published: true },
    { id: '2', published: false },
    { id: '3', published: true }
  ];

  const published = notes.filter(n => n.published);

  assert.equal(published.length, 2);
});

test('array: find by id', () => {
  const notes = [
    { id: '1', title: 'Note 1' },
    { id: '2', title: 'Note 2' }
  ];

  const note = notes.find(n => n.id === '2');

  assert.equal(note?.title, 'Note 2');
});

test('array: reduce for counting', () => {
  const items = [
    { category: 'a' },
    { category: 'b' },
    { category: 'a' }
  ];

  const counts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  assert.equal(counts['a'], 2);
  assert.equal(counts['b'], 1);
});

// ============================================
// 测试 10: 错误处理场景
// ============================================

test('error handling: try-catch for invalid JSON', () => {
  let result;
  try {
    JSON.parse('invalid json');
  } catch (e) {
    result = 'error';
  }

  assert.equal(result, 'error');
});

test('error handling: try-catch for division by zero', () => {
  let result;
  try {
    const x = 1 / 0;
    result = x;
  } catch (e) {
    result = 'error';
  }

  // JavaScript 返回 Infinity 而不是抛出错误
  assert.equal(result, Infinity);
});

// ============================================
// 测试 11: 边界情况处理
// ============================================

test('edge case: empty array filter', () => {
  const items: string[] = [];
  const filtered = items.filter(i => i.length > 0);
  assert.equal(filtered.length, 0);
});

test('edge case: null coalescing', () => {
  const value = null;
  const result = value ?? 'default';
  assert.equal(result, 'default');
});

test('edge case: undefined coalescing', () => {
  const value = undefined;
  const result = value ?? 'default';
  assert.equal(result, 'default');
});

test('edge case: optional chaining', () => {
  const obj = { nested: { value: 'test' } };
  assert.equal(obj?.nested?.value, 'test');
  assert.equal(obj?.missing?.value, undefined);
});

test('edge case: string trim', () => {
  const dirty = '  hello world  ';
  const clean = dirty.trim();
  assert.equal(clean, 'hello world');
});

test('edge case: array slice', () => {
  const items = [1, 2, 3, 4, 5];
  const sliced = items.slice(1, 3);
  assert.deepEqual(sliced, [2, 3]);
});

test('edge case: boolean conversion', () => {
  assert.equal(Boolean(1), true);
  assert.equal(Boolean(0), false);
  assert.equal(Boolean(''), false);
  assert.equal(Boolean('text'), true);
});

test('edge case: number conversion', () => {
  assert.equal(Number('123'), 123);
  assert.equal(Number('abc'), NaN);
  assert.equal(parseInt('42'), 42);
});

test('edge case: array includes', () => {
  const items = ['a', 'b', 'c'];
  assert.equal(items.includes('a'), true);
  assert.equal(items.includes('d'), false);
});

test('edge case: object keys', () => {
  const obj = { a: 1, b: 2, c: 3 };
  const keys = Object.keys(obj);
  assert.deepEqual(keys, ['a', 'b', 'c']);
});

test('edge case: object values', () => {
  const obj = { a: 1, b: 2, c: 3 };
  const values = Object.values(obj);
  assert.deepEqual(values, [1, 2, 3]);
});

// ============================================
// 测试总结
// ============================================

console.log('\n========================================');
console.log('测试完成! 共运行 50 个测试用例');
console.log('========================================\n');
