# 性能优化

帮助分析和优化应用程序性能。

## 用法

```bash
/perf [target]
```

## 性能指标

- **LCP**: 最大内容绘制 (< 2.5s)
- **FID**: 首次输入延迟 (< 100ms)
- **CLS**: 累积布局偏移 (< 0.1)
- **TTFB**: 首字节时间 (< 600ms)

## 前端优化

### 1. 资源优化
- 压缩图片 (WebP, AVIF)
- 代码分割
- Tree shaking
- 压缩代码 (Gzip, Brotli)

### 2. 渲染优化
```javascript
// 使用 React.memo 避免重渲染
const MemoizedComponent = React.memo(Component);

// 使用 useMemo 缓存计算
const value = useMemo(() => compute(a, b), [a, b]);

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {}, []);
```

### 3. 加载优化
- 预加载关键资源
- 懒加载路由
- CDN 分发

## 后端优化

### 1. 数据库
- 添加索引
- 查询优化
- 连接池
- 缓存 (Redis)

### 2. API
- 分页
- 压缩
- 缓存头

### 3. 并发
- 异步处理
- 队列
- 负载均衡

## 性能分析工具

- Chrome DevTools Performance
- Lighthouse
- WebPageTest
- Node.js Profiler

## 检查清单

- [ ] 图片优化
- [ ] 代码分割
- [ ] 缓存策略
- [ ] 数据库索引
- [ ] API 响应时间
- [ ] 内存使用
