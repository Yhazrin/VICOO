# Docker 容器化

帮助创建和管理 Docker 容器。

## 用法

```bash
/docker [operation]
```

## 常用命令

```bash
docker build -t myapp .              # 构建镜像
docker run -p 3000:3000 myapp       # 运行容器
docker ps                           # 查看运行中的容器
docker logs -f container_id          # 查看日志
docker exec -it container_id sh     # 进入容器
docker-compose up -d                # 启动服务
```

## Dockerfile 最佳实践

```dockerfile
# 使用多阶段构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产镜像
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## 优化技巧

1. **减少层数**: 合并 RUN 命令
2. **使用 .dockerignore**: 排除不需要的文件
3. **使用特定版本**: 不使用 latest
4. **清理缓存**: 在同一层删除临时文件

## docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    volumes:
      - db-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  db-data:
```

## 安全建议

- 不以 root 用户运行容器
- 使用只读文件系统
- 定期更新基础镜像
- 扫描容器漏洞
