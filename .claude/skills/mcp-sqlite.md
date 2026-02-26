# MCP SQLite 数据库

使用 MCP 进行 SQLite 数据库操作。

## 简介

通过 MCP 协议直接操作 SQLite 数据库。

## 功能

- 执行 SQL 查询
- 获取表信息
- 数据库诊断

## 配置

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "./data.db"]
    }
  }
}
```

## 常用工具

### 1. 执行查询
```
工具: execute_sql
参数: sql, params
```

### 2. 获取表列表
```
工具: list_tables
```

### 3. 获取表结构
```
工具: table_schema
参数: table_name
```

## 示例

### 读取数据
```sql
SELECT * FROM users WHERE active = 1 LIMIT 10;
```

### 插入数据
```sql
INSERT INTO users (name, email) VALUES (?, ?);
```

### 更新数据
```sql
UPDATE users SET name = ? WHERE id = ?;
```

## 最佳实践

1. **使用参数化查询**: 防止 SQL 注入
2. **添加索引**: 优化查询性能
3. **定期备份**: 防止数据丢失
4. **监控慢查询**: 使用 EXPLAIN 分析

## 诊断命令

```sql
-- 查看查询计划
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = ?;

-- 查看表大小
SELECT * FROM sqlite_master WHERE type = 'table';

-- 查看索引
.indexes users
```
