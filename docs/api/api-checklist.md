# API 补齐清单

> 基于前端功能模块分析，整理需要补齐的后端 API 服务。

## 📊 分析概览

### 前端功能模块

| 模块 | 功能描述 | 当前状态 | 需要 API |
|------|---------|---------|----------|
| **Notes** | 笔记 CRUD | ✅ 已有基础 | 完善 |
| **Galaxy View** | 知识图谱 | ❌ Mock | 需开发 |
| **Search** | 神经搜索 | ❌ Mock | 需开发 |
| **Tags** | 标签管理 | ❌ Mock | 需开发 |
| **Taxonomy** | AI 分类 | ❌ Mock | 需开发 |
| **Analytics** | 数据统计 | ❌ Mock | 需开发 |
| **Timeline** | 时间轴 | ❌ Mock | 需开发 |
| **Settings** | 用户设置 | ❌ Mock | 需开发 |
| **Dashboard** | 仪表盘 Feed | ❌ Mock | 需开发 |
| **Focus Mode** | 番茄钟 | ❌ Mock | 可选 |
| **Habitat** | 孤儿节点 | ❌ Mock | 需开发 |
| **Public Gateway** | 公开分享 | ❌ Mock | 需开发 |

---

## ✅ 后端已有 API

### 1. 健康检查

| 端点 | 方法 | 状态 |
|------|------|------|
| `/health` | GET | ✅ 已实现 |

### 2. 认证（开发态）

| 端点 | 方法 | 状态 |
|------|------|------|
| `/auth/dev-token` | POST | ✅ 已实现 |
| `/auth/me` | GET | ✅ 已实现 |

### 3. 笔记 CRUD

| 端点 | 方法 | 状态 |
|------|------|------|
| `/api/notes` | GET | ✅ 已实现 |
| `/api/notes` | POST | ✅ 已实现 |
| `/api/notes/:id` | GET | ✅ 已实现 |
| `/api/notes/:id` | PATCH | ✅ 已实现 |
| `/api/notes/:id` | DELETE | ✅ 已实现 |

**支持参数**：
- `limit`, `offset`（分页）
- `category`（分类过滤）
- `tag`（标签过滤）
- `published`（发布状态过滤）

---

## ❌ 需要补齐的 API

### 1. 标签管理 API

**用途**：管理笔记标签，支持创建、编辑、删除标签

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/tags` | GET | 获取所有标签 |
| `/api/tags` | POST | 创建新标签 |
| `/api/tags/:id` | PATCH | 更新标签 |
| `/api/tags/:id` | DELETE | 删除标签 |
| `/api/tags/:id/notes` | GET | 获取指定标签下的笔记 |

**请求/响应示例**：

```typescript
// GET /api/tags
{
  "data": [
    { "id": "1", "name": "React", "color": "#EF476F", "count": 5 },
    { "id": "2", "name": "TypeScript", "color": "#118AB2", "count": 3 }
  ]
}

// POST /api/tags
{ "name": "NewTag", "color": "#FFD166" }
```

---

### 2. 图谱节点 API

**用途**：Galaxy View 知识图谱的节点和连线管理

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/nodes` | GET | 获取所有图谱节点 |
| `/api/nodes` | POST | 创建新节点 |
| `/api/nodes/:id` | GET | 获取指定节点 |
| `/api/nodes/:id` | PATCH | 更新节点位置/属性 |
| `/api/nodes/:id` | DELETE | 删除节点 |
| `/api/links` | GET | 获取所有连线 |
| `/api/links` | POST | 创建新连线 |
| `/api/links/:id` | DELETE | 删除连线 |

**数据模型**：

```typescript
// Node
interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'planet' | 'moon';
  color: string;
  icon: string;
  description?: string;
  linkedNoteId?: string;
  tags?: string[];
}

// Link
interface Link {
  id: string;
  source: string;
  target: string;
  type?: 'dashed' | 'solid';
}
```

---

### 3. 搜索 API

**用途**：全文搜索和语义搜索

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/search` | GET | 搜索笔记（支持关键词） |
| `/api/search/semantic` | POST | 语义搜索（AI 理解意图） |

**请求参数**：

```typescript
// GET /api/search?q=react&limit=10
{
  "data": [
    { "id": "1", "title": "React Performance", "snippet": "...", "relevance": 0.95 },
    { "id": "2", "title": "React Hooks", "snippet": "...", "relevance": 0.88 }
  ],
  "meta": { "total": 2 }
}

// POST /api/search/semantic
{ "query": "如何优化 React 性能", "limit": 5 }
```

---

### 4. 分类/聚类 API

**用途**：Taxonomy 页面的 AI 自动分类功能

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/clusters` | GET | 获取 AI 推荐的笔记聚类 |
| `/api/clusters/:id/accept` | POST | 接受聚类建议 |
| `/api/clusters/:id/reject` | POST | 拒绝聚类建议 |
| `/api/categories` | GET | 获取所有分类 |
| `/api/categories` | POST | 创建新分类 |
| `/api/categories/:id` | PATCH | 更新分类 |
| `/api/categories/:id` | DELETE | 删除分类 |

**数据模型**：

```typescript
// Cluster
interface Cluster {
  id: string;
  suggestedLabel: string;
  confidence: number;
  items: string[];
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// Category
interface Category {
  id: string;
  label: string;
  color: string;
  count: number;
  subTags: string[];
}
```

---

### 5. 统计 API

**用途**：Analytics 页面展示数据统计

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/analytics/overview` | GET | 获取总体统计 |
| `/api/analytics/activity` | GET | 获取活动数据（时间序列） |
| `/api/analytics/tags` | GET | 获取标签统计 |
| `/api/analytics/categories` | GET | 获取分类统计 |

**响应示例**：

```typescript
// GET /api/analytics/overview
{
  "data": {
    "totalNotes": 156,
    "totalNodes": 42,
    "publishedNotes": 89,
    "orphanNotes": 12,
    "last30Days": {
      "created": 45,
      "modified": 78,
      "deleted": 3
    }
  }
}

// GET /api/analytics/activity
{
  "data": [
    { "date": "2026-02-01", "notes": 5 },
    { "date": "2026-02-02", "notes": 3 }
  ]
}
```

---

### 6. 时间轴 API

**用途**：Timeline 页面的项目时间轴

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/timeline` | GET | 获取时间轴事件 |
| `/api/timeline` | POST | 创建时间轴事件 |
| `/api/timeline/:id` | PATCH | 更新事件 |
| `/api/timeline/:id` | DELETE | 删除事件 |

**数据模型**：

```typescript
interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'milestone' | 'task' | 'note';
  relatedNoteId?: string;
  color?: string;
}
```

---

### 7. 用户设置 API

**用途**：Settings 页面的用户配置管理

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/settings` | GET | 获取用户设置 |
| `/api/settings` | PATCH | 更新用户设置 |

**数据模型**：

```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh';
  mascotSkin: 'bot' | 'cat' | 'orb';
  fontSize: 'small' | 'medium' | 'large';
  focusSettings: {
    defaultDuration: number;
    breakDuration: number;
    soundEnabled: boolean;
  };
  // ... 其他设置
}
```

---

### 8. 仪表盘 Feed API

**用途**：Dashboard 页面的认知流 Feed

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/feed` | GET | 获取 Dashboard Feed |
| `/api/feed/drafts` | GET | 获取草稿列表 |
| `/api/feed/suggestions` | GET | 获取系统建议 |

**数据模型**：

```typescript
interface FeedItem {
  id: string;
  type: 'draft' | 'suggestion' | 'memory' | 'task';
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: Record<string, unknown>;
  timestamp: string;
}
```

---

### 9. 孤儿节点 API

**用途**：Habitat 页面的孤儿节点管理

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/nodes/orphans` | GET | 获取未连接的孤儿节点 |
| `/api/nodes/:id/connect` | POST | 连接节点到笔记 |

---

### 10. 公开分享 API

**用途**：PublicGateway 页面的公开笔记

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/notes/published` | GET | 获取已发布的公开笔记 |
| `/api/notes/:id/publish` | POST | 发布笔记 |
| `/api/notes/:id/unpublish` | POST | 取消发布 |
| `/api/notes/:id/shared-link` | GET | 获取分享链接 |

---

### 11. 番茄钟 API（可选）

**用途**：Focus Mode 的专注数据记录

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/focus/sessions` | GET | 获取专注记录 |
| `/api/focus/sessions` | POST | 创建专注记录 |
| `/api/focus/stats` | GET | 获取专注统计 |

---

## 📋 API 开发优先级

### P0（必须实现）

1. **Tags API** - Library 页面标签筛选必需
2. **Nodes/Links API** - Galaxy View 必需
3. **Search API** - Search 页面必需

### P1（重要）

4. **Categories API** - Taxonomy 页面
5. **Analytics API** - Analytics 页面
6. **Timeline API** - Timeline 页面

### P2（次要）

7. **Settings API** - Settings 页面
8. **Feed API** - Dashboard 页面
9. **Public API** - Public Gateway 页面

### P3（可选）

10. **Focus API** - Focus Mode 统计
11. **Habitat API** - 孤儿节点管理

---

## 🔄 实施建议

### 阶段 1：完善 Notes 相关

- 补齐 Tags API
- 确保 Notes API 支持 tags 字段

### 阶段 2：图谱核心

- Nodes/Links CRUD
- 搜索 API（先全文，后续加语义）

### 阶段 3：智能功能

- Categories/Clusters API
- Analytics API

### 阶段 4：辅助功能

- Timeline、Settings、Feed 等

---

## 📝 注意事项

1. **数据库设计**：需要添加 `tags`, `nodes`, `links`, `categories`, `timeline_events`, `focus_sessions` 等表
2. **搜索实现**：初期可用 LIKE/全文搜索，后续接入向量库（RAG）
3. **AI 集成**：Taxonomy 的聚类功能需要接入 LLM
4. **鉴权**：所有 API 需要通过 authMiddleware 验证 token
5. **分页**：列表类 API 支持 limit/offset 分页

---

**文档版本**：v1.0.0  
**最后更新**：2026-02-15
