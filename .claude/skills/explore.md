# 项目探索

探索和理解 vicoo 项目结构。

## 用法

```bash
# 查看项目结构
/explore

# 查找特定文件
/explore <pattern>

# 查找代码
/explore --code <pattern>
```

## 说明

此命令使用 Claude Code 的 Explore agent 探索代码库。

## 项目架构

Vicoo 是一个多端应用 monorepo：

```
apps/
├── api/       # Express + GraphQL 后端
├── web/       # React + Vite 前端
├── desktop/   # Tauri 桌面端
├── mobile/    # React Native (Expo) 移动端
└── weapp/     # 微信小程序

packages/      # 共享包
├── types/     # 类型定义
├── sdk/       # API Client
├── auth/      # 认证
├── events/    # 事件系统
├── ui/        # UI 组件
└── ...
```

## 技术栈

| 端 | 技术 |
|---|---|
| 后端 | Express, GraphQL, SQLite/sql.js, LangChain |
| 前端 | React 19, TypeScript, Vite, Tailwind CSS |
| 桌面 | Tauri 2.0, Rust |
| 移动 | React Native (Expo) |
| 设计 | Neubrutalism-lite (主色 #FFD166) |
