# API 设计

帮助设计和实现 RESTful API。

## 用法

```bash
/api [operation]
```

## RESTful 原则

| 方法 | 用途 | 幂等 |
|------|------|------|
| GET | 获取资源 | 是 |
| POST | 创建资源 | 否 |
| PUT | 完整更新 | 是 |
| PATCH | 部分更新 | 否 |
| DELETE | 删除资源 | 是 |

## URL 设计

```
GET    /api/users          # 获取用户列表
GET    /api/users/:id      # 获取单个用户
POST   /api/users          # 创建用户
PUT    /api/users/:id      # 更新用户
DELETE /api/users/:id      # 删除用户
```

## 状态码

- 200 OK - 成功
- 201 Created - 创建成功
- 204 No Content - 删除成功
- 400 Bad Request - 请求错误
- 401 Unauthorized - 未授权
- 403 Forbidden - 禁止访问
- 404 Not Found - 资源不存在
- 500 Internal Server Error - 服务器错误

## 响应格式

```json
{
  "data": {},
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

## 错误格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": []
  }
}
```

## 最佳实践

- 使用版本号: /api/v1/
- 使用复数名词: /users 不是 /user
- 使用小写字母
- 使用连字符: /user-profiles
- 避免动词: 用 GET/POST 代替 /getUsers
