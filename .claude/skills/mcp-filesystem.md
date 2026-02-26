# MCP 文件系统

使用 Model Context Protocol 进行文件系统操作。

## 简介

MCP (Model Context Protocol) 是一种让 AI 模型与外部系统交互的协议。

## 文件系统 MCP 服务器

### 功能
- 读取文件
- 写入文件
- 列出目录
- 创建/删除文件
- 搜索文件

### 配置

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./data"]
    }
  }
}
```

## 常用工具

### 1. 读取文件
```
工具: read_file
参数: path
```

### 2. 写入文件
```
工具: write_file
参数: path, content
```

### 3. 列出目录
```
工具: list_directory
参数: path
```

### 4. 创建目录
```
工具: create_directory
参数: path
```

### 5. 搜索文件
```
工具: search_files
参数: path, pattern
```

## 安全考虑

1. **限制访问范围**: 只允许访问特定目录
2. **验证路径**: 防止路径遍历攻击
3. **审计日志**: 记录所有文件操作
4. **权限控制**: 最小权限原则

## 常见 MCP 服务器

| 服务器 | 功能 |
|--------|------|
| filesystem | 文件系统操作 |
| sqlite | 数据库操作 |
| github | GitHub API |
| git | Git 操作 |
| playwright | 浏览器自动化 |
| puppeteer | Chrome 自动化 |
