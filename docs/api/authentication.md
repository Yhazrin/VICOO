# API 鉴权说明

## 鉴权模式

后端鉴权行为由以下环境变量控制：

- `NODE_ENV=production`：默认开启严格鉴权，所有受保护路由必须携带有效 Bearer Token。
- `NODE_ENV!=production`：默认放宽鉴权，便于本地开发联调。
- `AUTH_MODE=strict`：无论环境如何都强制严格鉴权。
- `AUTH_MODE=relaxed`：无论环境如何都放宽鉴权（仅建议本地调试）。

> 受保护路由包括 `/api/notes`、`/api/settings` 及其他 `/api/*` 业务路由。

## 请求头要求

严格鉴权开启时，请在请求头中附带：

```http
Authorization: Bearer <token>
```

可在开发环境通过 `POST /auth/dev-token` 获取调试 token。

## 错误码

严格鉴权下，常见错误响应：

### 1) 缺少或格式错误的 Authorization

- HTTP 状态码：`401`
- 错误码：`UNAUTHORIZED`
- 消息：`Authorization header required`

### 2) Token 无效或已过期

- HTTP 状态码：`401`
- 错误码：`UNAUTHORIZED`
- 消息：`Invalid or expired token`

## 过期策略

当前内置的开发 token 由内存存储管理：

- 在服务重启前有效；
- 服务重启后全部失效；
- 当前版本未设置固定 TTL（`expiresAt` 为 `null`）。

生产环境建议接入持久化 token 存储（如 Redis/数据库）并配置明确的过期时间与刷新策略。

## /auth/dev-token 可用性

- 仅开发环境（`NODE_ENV!=production`）可用。
- 生产环境访问该接口会返回 `404`。
