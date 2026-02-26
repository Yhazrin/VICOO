# Schema 设计

帮助设计和验证数据 Schema。

## 用法

```bash
/schema [operation]
```

## Schema 类型

### 1. 数据库 Schema
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. API Schema (JSON)
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "name": { "type": "string" }
  },
  "required": ["id", "email"]
}
```

### 3. GraphQL Schema
```graphql
type User {
  id: ID!
  email: String!
  name: String
  posts: [Post!]!
}

type Query {
  user(id: ID!): User
  users: [User!]!
}
```

## 设计原则

### 1. 范式化
- 减少数据冗余
- 保证数据一致性
- 便于更新

### 2. 反范式化
- 提高查询性能
- 减少 JOIN
- 适合读取密集型

## 验证工具

### Zod (TypeScript)
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'user', 'guest'])
});

type User = z.infer<typeof UserSchema>;
```

### Yup
```javascript
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required()
});
```

## 数据库设计模式

1. **主键**: UUID vs 自增
2. **外键**: 引用完整性
3. **索引**: 查询优化
4. **约束**: 数据验证
