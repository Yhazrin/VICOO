# 创建新包

在 vicoo monorepo 的 packages 目录下创建新的共享包。

## 用法

```bash
# 创建新包（会引导你输入包名和描述）
/new-package
```

## 说明

此命令会在 `packages/` 目录下创建新的共享包，包含：
- `package.json` - 符合 monorepo 规范的配置
- `tsconfig.json` - TypeScript 配置
- `src/index.ts` - 入口文件
- `src/index.ts` - 导出生成的类型

## 现有包参考

项目已有的共享包：
- `@vicoo/types` - 共享类型定义
- `@vicoo/sdk` - 跨端统一 API Client
- `@vicoo/auth` - 认证模块
- `@vicoo/crypto` - 加密模块
- `@vicoo/events` - 事件系统
- `@vicoo/storage` - 存储模块
- `@vicoo/ui` - UI 组件库
- `@vicoo/plugin-system` - 插件系统

## 命名规范

- 包名以 `@vicoo/` 开头
- 使用 kebab-case（如 `@vicoo/my-feature`）
- 目录名与包名一致（如 `packages/my-feature`）
