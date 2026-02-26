# 日志管理

帮助设置和管理应用程序日志。

## 用法

```bash
/logging [operation]
```

## 日志级别

| 级别 | 用途 | 数值 |
|------|------|------|
| error | 错误 | 0 |
| warn | 警告 | 1 |
| info | 信息 | 2 |
| debug | 调试 | 3 |
| trace | 跟踪 | 4 |

## 日志格式

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "error",
  "message": "Failed to connect to database",
  "context": {
    "userId": "123",
    "action": "login",
    "error": "Connection refused"
  }
}
```

## 最佳实践

### 1. 结构化日志
```javascript
// 不好
logger.error('User login failed for user ' + userId);

// 好
logger.error('User login failed', { userId, action: 'login' });
```

### 2. 包含上下文
```javascript
logger.info('Request processed', {
  requestId: req.id,
  method: req.method,
  path: req.path,
  duration: endTime - startTime
});
```

### 3. 敏感信息过滤
```javascript
const maskSensitive = (data) => {
  if (typeof data !== 'object') return data;
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      ['password', 'token', 'secret'].includes(k.toLowerCase())
        ? '***'
        : v
    ])
  );
};
```

## 日志库

- **Node.js**: Winston, Pino, Bunyan
- **Python**: logging, loguru
- **Java**: Log4j, SLF4J

## 工具

- **ELK Stack**: Elasticsearch + Logstash + Kibana
- **Loki**: Grafana 日志聚合
- **Datadog**: 云日志服务
- **CloudWatch**: AWS 日志
