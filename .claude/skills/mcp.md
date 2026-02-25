# MCP 服务器管理

管理 vicoo 项目的 MCP (Model Context Protocol) 服务器。

## 用法

```bash
# 初始化推荐的 MCP 服务器到数据库
/mcp init

# 查看 MCP 帮助
/mcp help
```

## 已安装的 MCP 包

```bash
# 已添加到项目依赖
@modelcontextprotocol/server-filesystem
```

## 数据库中的 MCP 服务器

已初始化以下 MCP 服务器（默认禁用）：
- 📁 文件系统 - 读取、写入和管理本地文件
- 🐙 GitHub - GitHub API 操作
- 🦁 Brave 搜索 - 网络搜索
- 🐘 PostgreSQL - 数据库查询
- ⏰ 时间工具 - 获取当前时间
- 💾 内存存储 - 键值存储

## 使用方式

1. **安装新的 MCP 包**：
   ```bash
   pnpm add -w @modelcontextprotocol/server-xxx
   ```

2. **初始化 MCP 到数据库**：
   ```bash
   pnpm --filter vicoo-api db:init-mcp
   ```

3. **自动启动时初始化**（可选）：
   在 `.env` 中设置：
   ```
   AUTO_INIT_MCP=true
   ```

4. **在 Web 界面配置**：访问 MCP 设置页面，配置 API Key 后启用

## 添加自定义 MCP

在 Web 界面添加自定义 MCP 服务器：
- **命令模式**：使用 `command` + `args` 启动子进程
- **URL 模式**：提供 MCP 服务器的 HTTP URL

## 推荐的 MCP 服务器

| MCP 包 | 功能 | 需要配置 |
|--------|------|----------|
| `@modelcontextprotocol/server-filesystem` | 文件操作 | 目录权限 |
| `@modelcontextprotocol/server-github` | GitHub API | API Token |
| `@modelcontextprotocol/server-brave-search` | Web 搜索 | BRAVE_API_KEY |
| `@modelcontextprotocol/server-postgres` | PostgreSQL | 连接字符串 |
| `@modelcontextprotocol/server-time` | 时间工具 | 无 |
| `@modelcontextprotocol/server-memory` | 内存存储 | 无 |
| `@modelcontextprotocol/server-slack` | Slack 消息 | SLACK_BOT_TOKEN |

## 注意事项

- MCP 服务器默认不启用，需要在 Web 界面手动启用
- 某些 MCP 需要额外的系统依赖
- 推荐使用 npx 自动下载运行
