# 构建项目

在 vicoo monorepo 中构建各种应用。

## 用法

```bash
# 构建所有项目
/build

# 构建后端 API
/build api

# 构建 Web 前端
/build web

# 构建 Tauri 桌面应用
/build desktop

# 仅做 TypeScript 类型检查
/build typecheck

# 代码检查
/build lint
```

## 说明

- `pnpm build` - 构建所有 packages 和 apps
- `pnpm typecheck` - 运行 TypeScript 类型检查
- `pnpm lint` - 运行代码检查
- `pnpm tauri:build` - 构建 Tauri 桌面应用（生成 .exe）
- `npx vite build` - 构建 Vite 前端（用于 Tauri）
