# Vicoo 多端开发策略文档

> 本文档定义 vicoo 项目的跨平台架构选型、实施路径和平台适配策略。

## 📋 目录

1. [架构选型结论](#架构选型结论)
2. [目录结构设计](#目录结构设计)
3. [技术栈与工具链](#技术栈与工具链)
4. [平台适配边界](#平台适配边界)
5. [实施优先级](#实施优先级)
6. [风险点与应对方案](#风险点与应对方案)

---

## 架构选型结论

### ✅ 最终方案：React Native (Expo) + Tauri + 微信小程序原生

**核心理念**：保护现有 React + TypeScript + Tailwind 投入，最大化代码复用。

### 为什么不是 Flutter？

- ❌ **迁移成本过高**：需要重写所有 React 代码和组件
- ❌ **学习曲线陡峭**：团队需学习 Dart 和 Flutter 生态
- ❌ **Tailwind CSS 不可用**：现有设计系统无法复用
- ✅ **但 Flutter 的优势**：真正的跨平台统一、性能优秀、动画流畅

**结论**：除非从零开始，否则不推荐 Flutter。

### 为什么不是 Electron？

- ❌ **仅支持桌面端**：无法覆盖移动端
- ❌ **体积和内存成本高**：~100MB+ 体积，内存占用大
- ✅ **但 Electron 的优势**：Node.js 生态丰富、开发简单

**结论**：除非必须使用大量 Node.js 原生能力，否则不优先。

---

## 目录结构设计

### 目标结构

```
vicoo/
├── apps/
│   ├── web/              # React Web（已有，主体验）
│   ├── api/              # 后端 API（已有）
│   ├── desktop/          # Tauri 桌面端（独立应用）
│   ├── mobile/           # React Native (Expo) 移动端
│   └── weapp/            # 微信小程序（原生或 Taro）
│
├── packages/
│   ├── types/            # 共享类型定义
│   ├── sdk/              # 跨端统一 API Client
│   └── shared/           # 通用工具函数
│
└── docs/
    └── architecture/     # 架构文档（本文档）
```

### 关键设计原则

#### 1. Tauri 独立放置（❌ 错误做法）

```bash
# ❌ 不要这样做
cd apps/web
npx tauri init
```

**问题**：
- Web 和 Desktop 耦合，构建链复杂
- CI/CD 难以拆分
- 维护混乱

#### 2. Tauri 独立应用（✅ 正确做法）

```bash
# ✅ 正确结构
apps/
  web/        # 纯 Web 应用
  desktop/    # Tauri 壳，引用 web 构建产物或 dev server
```

**优势**：
- 职责清晰：Web 专注 Web，Desktop 专注桌面集成
- 构建独立：可分别构建和部署
- 复用最大化：Desktop 使用 Web 的构建产物

---

## 技术栈与工具链

### Web（已有）

- **框架**：React 19 + TypeScript
- **样式**：Tailwind CSS
- **构建**：Vite
- **状态**：React Context API

### Desktop（Tauri）

- **前端**：复用 `apps/web` 的构建产物
- **壳层**：Tauri (Rust)
- **集成能力**：
  - 文件系统访问
  - 系统托盘
  - 全局快捷键
  - 原生通知
  - 开机自启

**实施命令**：
```bash
cd apps
npx create-tauri-app desktop --template react-ts
# 然后配置指向 web 的构建产物或 dev server
```

### Mobile（React Native - Expo）

- **框架**：Expo（推荐起步）而非 React Native CLI
- **原因**：
  - ✅ 上手快，配置少
  - ✅ 生态成熟（Expo SDK）
  - ✅ 适合内容/工具类 App
  - ✅ OTA 更新支持
- ❌ **CLI 路线**：更自由但配置复杂，适合需要深度原生集成的场景

**实施命令**：
```bash
cd apps
npx create-expo-app mobile --template
# 或使用 Expo Router（推荐）
npx create-expo-app mobile --template tabs
```

### 微信小程序

- **方案 A（推荐）**：原生小程序框架
  - 优点：性能最好，官方支持完善
  - 缺点：需要单独维护一套代码
- **方案 B（可选）**：Taro / uni-app
  - 优点：可复用部分 TS 逻辑和组件思路
  - 缺点：复杂交互和动画适配成本高

**建议**：对于 vicoo 这种“动效+强交互”的产品，小程序端做**轻功能**：
- ✅ 录入、搜索、最近、分享、复盘
- ❌ 不硬刚复杂动画和 Galaxy View

---

## 平台适配边界

### 高复用部分（跨平台一致）

| 内容 | 复用方式 |
|------|---------|
| **页面 UI** | Web/Desktop 直接复用，Mobile 需适配组件 |
| **业务逻辑** | 100% 复用（TypeScript） |
| **SDK 调用** | 100% 复用（`@vicoo/sdk`） |
| **状态管理** | 100% 复用（Context/Redux） |
| **API 契约** | 100% 复用（OpenAPI） |

### 需要平台适配的部分

| 平台 | 适配内容 | 技术方案 |
|------|---------|---------|
| **Desktop (Tauri)** | 文件系统、系统托盘、全局快捷键、通知 | Tauri API (`@tauri-apps/api`) |
| **Mobile (Expo)** | 文件系统、相机、推送通知、生物识别 | Expo SDK (`expo-file-system`, `expo-camera`, etc.) |
| **WeApp** | 文件系统、相机、分享、支付 | 微信小程序 API |

### 平台特定能力示例

#### Desktop (Tauri)

```typescript
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

// 文件选择
const file = await open({
  multiple: false,
  filters: [{ name: 'Markdown', extensions: ['md'] }]
});

// 系统通知
import { sendNotification } from '@tauri-apps/api/notification';
await sendNotification({ title: 'Vicoo', body: '笔记已保存' });
```

#### Mobile (Expo)

```typescript
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

// 文件读写
const content = await FileSystem.readAsStringAsync(uri);

// 相机
const result = await ImagePicker.launchCameraAsync();
```

#### WeApp

```typescript
// 文件系统
wx.getFileSystemManager().readFile({
  filePath: 'path/to/file.md',
  success: (res) => { /* ... */ }
});

// 分享
wx.shareAppMessage({ title: '分享笔记', path: '/pages/note?id=123' });
```

---

## 实施优先级

### 阶段 1：Web 继续做主体验（当前）

- ✅ Web 功能完善
- ✅ 后端 API 对接
- ✅ SDK 和类型系统完善

### 阶段 2：桌面端（Tauri）- 快速验证

**目标**：复用 Web 代码，快速上线桌面端

**步骤**：
1. 创建 `apps/desktop`（Tauri 项目）
2. 配置指向 `apps/web` 的构建产物或 dev server
3. 添加桌面端特定功能（系统托盘、全局快捷键等）
4. 打包和分发

**验收**：
- Desktop 应用能启动并显示 Web UI
- 桌面端特定功能（如文件选择）正常工作
- 打包产物体积 < 20MB

### 阶段 3：移动端（Expo）- 核心闭环

**目标**：移动端核心功能可用，Galaxy View 延后或降级

**步骤**：
1. 创建 `apps/mobile`（Expo 项目）
2. 复用 `@vicoo/sdk` 和业务逻辑
3. 实现核心页面：
   - ✅ 笔记列表（Library）
   - ✅ 编辑器（Editor）
   - ✅ 搜索（Search）
   - ✅ 设置（Settings）
   - ⚠️ Galaxy View（简化版或延后）
4. UI 组件用 React Native 重写（保持设计风格）

**验收**：
- iOS/Android 能正常安装和运行
- 核心功能（CRUD、搜索）可用
- UI 风格与 Web 保持一致

### 阶段 4：微信小程序 - 轻入口

**目标**：小程序作为轻量入口，不做复杂交互

**功能范围**：
- ✅ 笔记录入（简化编辑器）
- ✅ 搜索和最近
- ✅ 分享到微信
- ✅ 数据复盘（简化版）
- ❌ Galaxy View（不实现）
- ❌ 复杂动画（简化或移除）

**验收**：
- 小程序能正常发布和运行
- 核心功能可用
- 性能流畅（无卡顿）

---

## 风险点与应对方案

### 风险 1：Galaxy View 在移动端性能问题

**问题**：
- Canvas 渲染性能在移动端可能不足
- 粒子效果、拖拽缩放等复杂交互可能卡顿

**应对方案**：

#### 方案 A：简化移动端图形（推荐）

```typescript
// 移动端 Galaxy View 配置
const MOBILE_GALAXY_CONFIG = {
  maxNodes: 50,        // 降低节点数量（Web 可 200+）
  particleCount: 100,  // 降低粒子数（Web 可 500+）
  enableAnimations: false, // 禁用动画
  renderQuality: 'low'    // 降采样渲染
};
```

#### 方案 B：使用更适合移动的渲染方案

- **React Native Skia**：高性能 2D 图形库
- **react-native-svg**：SVG 渲染（性能较好）
- **原生 Canvas**：通过原生模块调用

#### 方案 C：移动端暂不实现 Galaxy View

- 先做输入/搜索/库/复盘等核心功能
- 可视化功能留给 Web/Desktop
- 后续根据用户反馈决定是否实现

**建议**：采用**方案 C**（先不做），或**方案 A**（简化版）。

### 风险 2：Tauri 与 Web 构建产物集成

**问题**：如何让 Tauri 使用 Web 的构建产物？

**解决方案**：

#### 方案 A：使用 Web Dev Server（开发环境）

```typescript
// apps/desktop/src-tauri/tauri.conf.json
{
  "build": {
    "devUrl": "http://localhost:3000",  // 指向 web dev server
    "beforeDevCommand": "cd ../web && pnpm dev"
  }
}
```

#### 方案 B：使用构建产物（生产环境）

```typescript
// apps/desktop/src-tauri/tauri.conf.json
{
  "build": {
    "distDir": "../web/dist",  // 指向 web 构建产物
    "beforeBuildCommand": "cd ../web && pnpm build"
  }
}
```

**推荐**：开发用方案 A，生产用方案 B。

### 风险 3：微信小程序复杂交互适配

**问题**：小程序对复杂动画和交互支持有限

**应对**：
- ✅ 小程序做轻功能，不硬刚复杂交互
- ✅ 复杂功能（Galaxy View、Focus Mode）仅 Web/Desktop
- ✅ 小程序专注：录入、搜索、分享、复盘

### 风险 4：Expo 的限制

**问题**：Expo 对某些原生能力有限制

**应对**：
- ✅ 大部分功能 Expo SDK 已覆盖
- ✅ 如需深度原生集成，可使用 `expo-dev-client`（自定义开发客户端）
- ✅ 或 eject 到 React Native CLI（不推荐，除非必须）

---

## 总结

### 技术选型矩阵

| 平台 | 技术栈 | 代码复用率 | 优先级 |
|------|--------|-----------|--------|
| **Web** | React + Vite | 100% | P0（已有） |
| **Desktop** | Tauri + Web 产物 | ~95% | P1（快速验证） |
| **Mobile** | Expo + RN | ~70% | P2（核心闭环） |
| **WeApp** | 原生/Taro | ~30% | P3（轻入口） |

### 关键原则

1. ✅ **保护现有投入**：最大化复用 React/TS/Tailwind 代码
2. ✅ **渐进式实施**：先 Web，再 Desktop，再 Mobile，最后 WeApp
3. ✅ **平台适配有边界**：明确什么能复用，什么需要适配
4. ✅ **风险提前识别**：Galaxy View、复杂交互等提前规划降级方案

---

## 下一步行动

1. **创建 `apps/desktop`（Tauri 项目）**
2. **配置 Tauri 指向 Web 构建产物**
3. **创建 `apps/mobile`（Expo 项目）**
4. **实现移动端核心页面（不含 Galaxy View）**
5. **创建 `apps/weapp`（小程序项目）**
6. **实现小程序轻功能**

---

**文档版本**：v1.0.0  
**最后更新**：2026-02-15  
**维护者**：Vicoo Team
