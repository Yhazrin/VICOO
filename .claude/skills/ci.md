# CI/CD 流水线

帮助设置和维护持续集成/持续部署流程。

## 用法

```bash
/ci [operation]
```

## 流水线阶段

```
代码提交 → 构建 → 测试 → 部署 → 监控
```

## 常用 CI/CD 工具

- GitHub Actions
- GitLab CI
- Jenkins
- CircleCI
- Travis CI

## GitHub Actions 示例

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
```

## 最佳实践

1. **快速反馈**: 流水线应在 10 分钟内完成
2. **并行执行**: 独立任务并行运行
3. **缓存依赖**: 加速构建
4. **失败通知**: 及时通知构建失败
5. **环境一致**: 使用 Docker 保证一致性

## 部署策略

- **蓝绿部署**: 两套环境切换
- **金丝雀发布**: 逐步放量
- **滚动更新**: 逐个替换
- **特性开关**: 动态控制功能
