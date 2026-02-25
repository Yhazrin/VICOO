# Tauri 桌面应用

管理 vicoo Tauri 桌面应用的构建和开发。

## 用法

```bash
# 启动 Tauri 开发模式
/tauri dev

# 构建桌面应用（生成 .exe）
/tauri build

# 生成应用图标
/tauri icon <image>

# 查看 Tauri 日志
/tauri logs
```

## 说明

- `pnpm tauri:dev` 或 `pnpm tauri dev` - 启动 Tauri 开发模式
- `pnpm tauri:build` 或 `pnpm tauri build` - 构建生产版本
- Tauri 桌面端复用 web 前端的构建产物

## 技术栈

- Tauri 2.0
- 前端：React 19 + Vite + Tailwind CSS
- 后端：Rust

## Windows 构建

构建完成后，.exe 文件位于：
- `apps/desktop/src-tauri/target/release/bundle/nsis/`
