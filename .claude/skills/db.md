# 数据库操作

管理 vicoo 项目的 SQLite 数据库。

## 用法

```bash
# 运行数据库迁移
/db migrate

# 填充种子数据
/db seed

# 查看数据库状态
/db status
```

## 说明

- `pnpm --filter vicoo-api db:migrate` - 运行数据库迁移
- `pnpm --filter vicoo-api db:seed` - 填充种子数据

## 数据库表

项目使用 SQLite (sql.js)，主要表包括：
- users - 用户
- notes - 笔记
- note_links - 笔记双向链接
- tasks - 任务看板
- tags - 标签
- categories - 分类
- nodes - 知识图谱节点
- links - 知识图谱连线
- timeline_events - 时间线事件
- focus_sessions - 专注模式会话
- user_settings - 用户设置
- mcp_servers - MCP 服务器
- mcp_tools - MCP 工具
