# Vicoo 🟡

> **Your Visual Coordinator.** The vibe coding workspace that feels alive.

![License](https://img.shields.io/badge/license-MIT-black?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-FFD166?style=for-the-badge&labelColor=black)
![Vibe](https://img.shields.io/badge/vibe-checked-0df259?style=for-the-badge&labelColor=black)

**vicoo** 是一个以"视觉化协调器 (Visual Coordinator)"为核心理念的下一代个人知识库（PKM）应用。它旨在打破传统笔记软件枯燥、静态的列表形式，打造一本"高性能插画书"。

---

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动服务

```bash
# 启动后端（会自动创建并 seed SQLite）
pnpm dev:api

# 启动前端（新终端）
cd apps/web && pnpm dev
```

### 访问地址

- **Web**: http://localhost:3000
- **API**: http://localhost:8000
- **健康检查**: http://localhost:8000/health

---

### 移动端环境变量（Expo）

在 `apps/mobile` 中复制环境变量模板：

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

`EXPO_PUBLIC_API_BASE` 调试建议：

- **本地模拟器（iOS Simulator / Android Emulator）**：可用 `http://localhost:8000`
- **真机调试（同一局域网）**：必须改为你电脑的局域网地址，例如 `http://192.168.1.100:8000`

> 真机无法访问 `localhost`，因为 `localhost` 会指向手机本机。


## 📁 项目结构

```
vicoo/
├── apps/
│   ├── web/          # React Web 前端（主体验）
│   ├── api/          # 后端 API（Express + SQLite）
│   ├── desktop/      # Tauri 桌面端（复用 web 构建产物）
│   ├── mobile/       # React Native (Expo) 移动端
│   └── weapp/        # 微信小程序（轻功能）
│
├── packages/
│   ├── types/        # 共享类型定义
│   ├── sdk/          # 跨端统一 API Client
│   └── shared/       # 通用工具函数
│
└── docs/
    ├── api/          # API 文档
    └── architecture/ # 架构文档
```

---

## 📚 文档导航

### 核心文档

- [Web 前端 README](./apps/web/README.md) - Web 应用功能说明
- [后端接入指南](./apps/web/后端接入指南.md) - 前端对接后端说明

### 架构文档

- [多端开发策略](./docs/architecture/multi-platform-strategy.md) - **多端技术选型与架构设计**
- [多端快速实施指南](./docs/architecture/quick-start-multi-platform.md) - **多端开发实施步骤**

### API 文档

- [API 错误码](./docs/api/errors.md) - 统一错误码定义

---

## 🛠 技术栈

### 前端

- **Web**: React 19 + TypeScript + Vite + Tailwind CSS
- **Desktop**: Tauri（复用 Web 构建产物）
- **Mobile**: React Native (Expo)
- **WeApp**: 微信小程序原生/Taro

### 后端

- **框架**: Express (Node.js)
- **数据库**: SQLite（开发）→ PostgreSQL（生产）
- **契约**: OpenAPI 3.0

### 共享层

- **类型**: TypeScript 类型定义（`@vicoo/types`）
- **SDK**: 跨端统一 API Client（`@vicoo/sdk`）

---

## 🎨 设计系统

vicoo 采用 **Neubrutalism-lite（轻量新粗犷主义）** 设计风格：

| 颜色 | Hex | 用途 |
|------|-----|------|
| Primary | `#FFD166` | 强调、成功、能量 |
| Secondary | `#0df259` | Vibe 绿、确认 |
| Accent | `#EF476F` | 波普粉、创意操作 |
| Info | `#118AB2` | 深邃蓝、技术数据 |
| Ink | `#1a1a1a` | 高对比文字和边框 |

**特征**：
- 3px 粗黑边框
- 硬阴影效果（`box-shadow: 4px 4px 0px #1a1a1a`）
- Rive 风格 2D 动效

---

## 🔮 核心功能

### 🧠 认知仪表盘
- **Magic Input**: AI 深度研究代理工作流
- **认知流**: AI 优先排序的草稿、任务和回忆

### 🌌 Galaxy View（知识图谱）
- 无限画布，拖拽缩放
- 节点连接（Shift + Drag）
- 空间化知识管理

### ✍️ 编辑器
- 沉浸式深色模式
- 认知上下文侧栏（AI 实时扫描）
- Slash Commands
- 自动摘要

### 🧘 专注模式
- 番茄钟计时器
- 环境音效（Lo-fi、Deep Space、Forest Rain、Neon Drive）
- 动态可视化背景

### 🤖 吉祥物系统
- 多皮肤（Classic Bot、Cyber Cat、Core Orb）
- 响应式状态（idle、thinking、happy、working）

---

## 🚧 开发状态

### ✅ 已完成

- [x] Web 前端基础功能
- [x] 后端 API（Express + SQLite）
- [x] 共享 SDK 和类型系统
- [x] OpenAPI 契约定义

### 🚧 进行中

- [ ] 桌面端（Tauri）
- [ ] 移动端（Expo）
- [ ] 微信小程序

### 📋 计划中

- [ ] 真实 AI 集成（Google Gemini API）
- [ ] VS Code 扩展
- [ ] 多人在线协作 Galaxy View
- [ ] 向量数据库（RAG 检索）

---

## 🤝 贡献

欢迎贡献！请先阅读 [多端开发策略文档](./docs/architecture/multi-platform-strategy.md) 了解架构设计。

---

## 📄 许可证

MIT License

---

<div align="center">
  <sub>Built with 💛 by Alex Chen. Vision. Code. Cool.</sub>
</div>
