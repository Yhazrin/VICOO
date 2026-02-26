# MCP GitHub 集成

使用 MCP 进行 GitHub 操作。

## 简介

通过 MCP 协议与 GitHub API 交互。

## 功能

- 仓库管理
- Issue 操作
- PR 管理
- 代码搜索

## 配置

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    }
  }
}
```

## 常用工具

### 1. 搜索仓库
```
工具: search_repositories
参数: query
```

### 2. 获取 Issue
```
工具: get_issue
参数: owner, repo, issue_number
```

### 3. 创建 Issue
```
工具: create_issue
参数: owner, repo, title, body
```

### 4. 创建 PR
```
工具: create_pull_request
参数: owner, repo, title, head, base, body
```

### 5. 代码搜索
```
工具: search_code
参数: query, repo
```

## 示例工作流

### 1. 创建 Issue 并关联 PR
```javascript
// 创建 Issue
create_issue({
  owner: 'user',
  repo: 'project',
  title: 'Bug: 登录失败',
  body: '描述问题...'
});

// 创建 PR 修复
create_pull_request({
  owner: 'user',
  repo: 'project',
  title: 'Fix: 修复登录问题',
  head: 'fix-branch',
  base: 'main'
});
```

### 2. 代码审查
```javascript
// 获取 PR 变更
get_pull_request({
  owner: 'user',
  repo: 'project',
  pull_number: 123
});
```

## 权限要求

- repo: 完整仓库访问
- read:user: 读取用户信息
- workflow: GitHub Actions
