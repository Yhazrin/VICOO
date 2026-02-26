# 监控告警

帮助设置应用程序监控和告警系统。

## 用法

```bash
/monitor [operation]
```

## 监控指标

### 1. 基础设施
- CPU 使用率
- 内存使用
- 磁盘 I/O
- 网络流量

### 2. 应用指标
- 请求延迟
- 错误率
- 吞吐量
- 活跃用户

### 3. 业务指标
- 订单数
- 转化率
- 收入

## 常用工具

- **Prometheus**: 指标收集
- **Grafana**: 可视化
- **Alertmanager**: 告警管理
- **Sentry**: 错误追踪

## Prometheus 指标类型

### 1. Counter
```javascript
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'status']
});
```

### 2. Gauge
```javascript
const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users'
});
```

### 3. Histogram
```javascript
const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  buckets: [0.1, 0.5, 1, 5]
});
```

## 告警规则

```yaml
groups:
  - name: api
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate
```

## 告警最佳实践

1. **避免告警风暴**: 聚合相关告警
2. **设置冷却时间**: 防止重复告警
3. **分级告警**: 区分严重程度
4. **包含上下文**: 提供足够信息

## Sentry 集成

```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-dsn',
  environment: process.env.NODE_ENV,
  release: process.env.VERSION
});
```
