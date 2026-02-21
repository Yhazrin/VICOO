# 共享包依赖关系图

本文说明 Monorepo 中 `packages/*` 的共享边界，区分“可直接复用逻辑”与“仅复用类型”。

## Mermaid 依赖图

```mermaid
graph TD
  TYPES[@vicoo/types]\n(类型定义)
  SDK[@vicoo/sdk]\n(API/业务访问层)
  AUTH[@vicoo/auth]\n(认证逻辑)
  CRYPTO[@vicoo/crypto]\n(加解密逻辑)
  STORAGE[@vicoo/storage]\n(存储抽象)
  EVENTS[@vicoo/events]\n(事件模型)
  UI[@vicoo/ui]\n(组件/设计系统)

  WEB[apps/web]
  DESKTOP[apps/desktop]
  WEAPP[apps/weapp]
  MOBILE[apps/mobile]
  API[apps/api]

  WEB --> TYPES
  WEB --> SDK
  WEB --> AUTH
  WEB --> CRYPTO
  WEB --> STORAGE
  WEB --> EVENTS
  WEB --> UI

  DESKTOP --> TYPES
  DESKTOP --> SDK
  DESKTOP --> UI

  WEAPP --> TYPES
  MOBILE --> TYPES
  API --> TYPES

  SDK --> TYPES
  AUTH --> TYPES
  STORAGE --> TYPES
  EVENTS --> TYPES
```

## 复用策略

### 可直接复用逻辑（运行时代码）
- `@vicoo/sdk`：跨端 API 请求、领域服务编排。
- `@vicoo/auth`：鉴权流程、Token 生命周期管理。
- `@vicoo/crypto`：加密/签名等通用能力。
- `@vicoo/storage`：统一存储接口及适配层。
- `@vicoo/events`：事件协议与轻量事件总线实现。
- `@vicoo/ui`：Web/Desktop 共享 UI 组件与样式规范。

### 仅复用类型（或优先类型复用）
- `@vicoo/types`：跨端 DTO、实体类型、API 响应结构。
- 小程序（`apps/weapp`）优先复用 `@vicoo/types`，运行时代码按平台能力单独实现。
- 服务端（`apps/api`）可复用 `@vicoo/types` 作为契约层，不直接依赖 UI/端侧包。

## 端侧建议

- `apps/web` / `apps/desktop`：可同时复用逻辑 + 类型。
- `apps/weapp`：优先复用类型；若复用逻辑需先确保不依赖浏览器/Node 专属 API。
- `apps/mobile`：根据运行时（RN/Expo）逐步接入 `sdk/auth/storage` 等可移植逻辑。
- `apps/api`：以 `@vicoo/types` 对齐输入输出契约，避免与前端 UI 包耦合。
