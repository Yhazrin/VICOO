# Git 工作流

帮助管理 Git 版本控制和协作流程。

## 用法

```bash
/git [operation]
```

## 常用命令

### 分支操作
```bash
git checkout -b feature/new-feature  # 创建并切换分支
git branch -d feature-name           # 删除分支
git merge main                      # 合并分支
```

### 提交操作
```bash
git add -p              # 交互式暂存
git commit --amend     # 修改最后一次提交
git rebase -i HEAD~3   # 压缩提交
```

### 协作流程
```bash
git fetch origin
git rebase origin/main
git push --force-with-lease  # 安全强制推送
```

## 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- feat: 新功能
- fix: 修复 bug
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 维护

## 分支策略

- main: 生产代码
- develop: 开发分支
- feature/*: 功能分支
- bugfix/*: 修复分支
- release/*: 发布分支

## 常见场景

### 1. 解决冲突
```bash
git status
# 编辑冲突文件
git add .
git commit
```

### 2. 撤销操作
```bash
git reset --soft HEAD~1    # 撤销提交，保留修改
git reset --hard HEAD~1    # 撤销提交，丢弃修改
git revert HEAD            # 创建撤销提交
```

### 3. 暂存工作
```bash
git stash save "work in progress"
git stash pop
```
