# 启动开发服务器

在 vicoo monorepo 中启动各种开发服务器。

## 用法

```bash
# 启动所有开发服务器（并行）
/dev

# 启动后端 API
/dev api

# 启动 Web 前端
/dev web

# 启动桌面端 (Tauri)
/dev desktop

# 启动移动端 (Expo)
/dev mobile
```

## 说明

- `pnpm dev` - 启动所有应用
- `pnpm dev:api` - 启动 Express + GraphQL 后端 (http://localhost:8000)
- `pnpm dev:web` - 启动 React + Vite 前端 (http://localhost:3000)
- `pnpm dev:desktop` - 启动 Tauri 桌面应用开发模式
- `pnpm dev:mobile` - 启动 Expo 移动端开发
