# 运行命令

在 monorepo 的特定包中运行命令。

## 用法

```bash
# 在特定包中运行命令
/run <package> <command>

# 示例
/run web dev
/run api dev
/run web build
/run mobile start
```

## 说明

使用 `pnpm --filter <package> <command>` 在特定包中运行命令。

## 可用包

Apps:
- vicoo-api (后端 API)
- vicoo-web (Web 前端)
- vicoo-desktop (桌面端)
- vicoo-mobile (移动端)
- vicoo-weapp (微信小程序)

## 常用命令

```bash
# 启动开发
pnpm --filter vicoo-api dev
pnpm --filter vicoo-web dev

# 构建
pnpm --filter vicoo-web build
pnpm --filter vicoo-api build

# 类型检查
pnpm --filter vicoo-api exec tsc --noEmit
pnpm --filter vicoo-web exec tsc --noEmit
```
