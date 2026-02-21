# 多端开发快速实施指南

> 本文档提供 vicoo 多端开发的快速实施步骤和命令。

## 📋 前置条件

- Node.js >= 18
- pnpm 已安装
- Rust（Tauri 需要）
- Expo CLI（移动端需要）

## 🚀 实施步骤

### 阶段 1：桌面端（Tauri）

#### 1.1 创建 Tauri 项目

```bash
cd apps
npx create-tauri-app desktop --template react-ts
```

#### 1.2 配置指向 Web 构建产物

编辑 `apps/desktop/src-tauri/tauri.conf.json`：

```json
{
  "build": {
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "cd ../web && pnpm dev",
    "distDir": "../web/dist",
    "beforeBuildCommand": "cd ../web && pnpm build"
  }
}
```

#### 1.3 安装依赖并启动

```bash
cd apps/desktop
pnpm install
pnpm tauri dev
```

**验收**：
- Desktop 应用能启动并显示 Web UI
- 桌面端特定功能（如文件选择）正常工作

---

### 阶段 2：移动端（Expo）

#### 2.1 创建 Expo 项目

```bash
cd apps
npx create-expo-app mobile --template tabs
```

#### 2.2 安装共享依赖

```bash
cd apps/mobile
pnpm add @vicoo/sdk @vicoo/types
```

#### 2.3 实现核心页面

复用业务逻辑和 SDK，UI 用 React Native 重写：

```typescript
// apps/mobile/app/(tabs)/library.tsx
import { VicooSDK } from '@vicoo/sdk';

export default function LibraryScreen() {
  const [notes, setNotes] = useState([]);
  
  useEffect(() => {
    VicooSDK.notes.list().then(setNotes);
  }, []);
  
  // React Native UI...
}
```

#### 2.4 启动开发服务器

```bash
cd apps/mobile
pnpm start
```

**验收**：
- iOS/Android 能正常安装和运行
- 核心功能（CRUD、搜索）可用
- UI 风格与 Web 保持一致

**注意**：Galaxy View 在移动端暂不实现或做简化版。

---

### 阶段 3：微信小程序

#### 3.1 创建小程序项目

```bash
cd apps
# 使用微信开发者工具创建项目，或
npx @tarojs/cli init weapp
```

#### 3.2 复用 SDK 逻辑

```typescript
// apps/weapp/src/services/api.ts
// 复用 @vicoo/sdk 的逻辑（TypeScript 可编译为 JS）
import { VicooSDK } from '@vicoo/sdk';

export const api = {
  getNotes: () => VicooSDK.notes.list(),
  // ...
};
```

#### 3.3 实现轻功能

- ✅ 笔记录入（简化编辑器）
- ✅ 搜索和最近
- ✅ 分享到微信
- ❌ Galaxy View（不实现）
- ❌ 复杂动画（简化或移除）

**验收**：
- 小程序能正常发布和运行
- 核心功能可用
- 性能流畅（无卡顿）

---

## 🔧 关键配置

### Tauri 与 Web 集成

**开发环境**（使用 dev server）：
```json
{
  "build": {
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "cd ../web && pnpm dev"
  }
}
```

**生产环境**（使用构建产物）：
```json
{
  "build": {
    "distDir": "../web/dist",
    "beforeBuildCommand": "cd ../web && pnpm build"
  }
}
```

### Expo 配置

确保 `apps/mobile/app.json` 配置正确：

```json
{
  "expo": {
    "name": "Vicoo",
    "slug": "vicoo-mobile",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "sdkVersion": "50.0.0"
  }
}
```

### 微信小程序配置

`apps/weapp/app.json`：

```json
{
  "pages": [
    "pages/index/index",
    "pages/library/library",
    "pages/editor/editor",
    "pages/search/search"
  ],
  "window": {
    "navigationBarTitleText": "Vicoo"
  }
}
```

---

## ⚠️ 常见问题

### Q1: Tauri 启动失败，找不到 Web 构建产物

**解决**：
1. 确保 `apps/web` 已构建：`cd apps/web && pnpm build`
2. 检查 `tauri.conf.json` 中的 `distDir` 路径是否正确
3. 开发环境建议使用 `devUrl` 指向 dev server

### Q2: Expo 无法找到 `@vicoo/sdk`

**解决**：
1. 确保根目录已运行 `pnpm install`
2. 检查 `pnpm-workspace.yaml` 配置
3. 在 `apps/mobile` 中重新安装：`pnpm install`

### Q3: Galaxy View 在移动端卡顿

**解决**：
1. 降低节点数量（从 200+ 降到 50）
2. 禁用动画效果
3. 使用降采样渲染
4. 或移动端暂不实现 Galaxy View

### Q4: 微信小程序无法调用后端 API

**解决**：
1. 检查小程序域名白名单配置
2. 确保后端支持 HTTPS（小程序要求）
3. 检查 CORS 配置

---

## 📚 相关文档

- [多端开发策略文档](./multi-platform-strategy.md)
- [后端接入指南](../../apps/web/后端接入指南.md)
- [API 文档](../api/errors.md)

---

**文档版本**：v1.0.0  
**最后更新**：2026-02-15
