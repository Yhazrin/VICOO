# Vicoo Claude Code Skills 索引

## 全部可用 Skills

### 开发流程 (Development)
| Skill | 描述 |
|-------|------|
| `/dev` | 启动开发服务器 |
| `/build` | 构建项目 |
| `/run` | 运行应用 |
| `/tauri` | Tauri 开发 |
| `/explore` | 探索代码库 |
| `/new-package` | 创建新包 |

### 代码质量 (Code Quality)
| Skill | 描述 |
|-------|------|
| `/optimize` | 代码优化 |
| `/refactor` | 代码重构 |
| `/debug` | 调试助手 |
| `/review` | 代码审查 |
| `/test` | 测试工程 |

### 编程语言/框架
| Skill | 描述 |
|-------|------|
| `/types` | TypeScript 最佳实践 |
| `/react` | React 最佳实践 |

### 后端 (Backend)
| Skill | 描述 |
|-------|------|
| `/api` | API 设计 |
| `/db` | 数据库操作 |
| `/schema` | Schema 设计 |
| `/logging` | 日志管理 |

### 运维 (DevOps)
| Skill | 描述 |
|-------|------|
| `/ci` | CI/CD 流水线 |
| `/docker` | Docker 容器化 |
| `/monitoring` | 监控告警 |
| `/security` | 安全检查 |
| `/performance` | 性能优化 |

### 版本控制 (VCS)
| Skill | 描述 |
|-------|------|
| `/git` | Git 工作流 |

### 文档 (Documentation)
| Skill | 描述 |
|-------|------|
| `/docs` | 文档生成 |

### MCP 集成 (Model Context Protocol)
| Skill | 描述 |
|-------|------|
| `/mcp` | MCP 基础 |
| `/mcp-filesystem` | 文件系统 MCP |
| `/mcp-sqlite` | SQLite MCP |
| `/mcp-github` | GitHub MCP |
| `/mcp-playwright` | Playwright MCP |

## 使用方法

```bash
# 使用 skill
/skill-name

# 例如
/debug
/optimize
/docker
```

## 创建自定义 Skill

在 `.claude/skills/` 目录下创建 `.md` 文件即可。

```markdown
# Skill 名称

描述...

## 用法

```bash
/skill-name
```

## 内容...
```
