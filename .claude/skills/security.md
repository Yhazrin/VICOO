# 安全检查

帮助识别和修复代码中的安全漏洞。

## 用法

```bash
/security [target]
```

## OWASP Top 10

1. **注入**: SQL 注入、XSS、命令注入
2. **身份验证失效**: 弱密码、会话管理
3. **敏感数据泄露**: 明文存储、传输加密
4. **XML 外部实体**: XXE
5. **访问控制失效**: 权限检查
6. **安全配置错误**: 默认配置、错误处理
7. **跨站请求伪造**: CSRF
8. **使用有漏洞的组件**: 过期依赖
9. **不足的日志监控**: 审计缺失

## 常见漏洞修复

### 1. SQL 注入
```javascript
// 危险
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// 安全
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### 2. XSS
```javascript
// 危险
element.innerHTML = userInput;

// 安全
element.textContent = userInput;
// 或使用 DOMPurify
```

### 3. 命令注入
```javascript
// 危险
exec(`ls ${directory}`);

// 安全
execFile('ls', [directory]);
```

### 4. 敏感信息
```javascript
// 错误 - 暴露密钥
const apiKey = 'sk-xxx';

// 正确 - 使用环境变量
const apiKey = process.env.API_KEY;
```

## 安全检查清单

- [ ] 输入验证
- [ ] 输出编码
- [ ] 身份验证
- [ ] 授权
- [ ] 加密
- [ ] 日志审计
- [ ] 依赖安全

## 工具

- npm audit
- Snyk
- SonarQube
- OWASP ZAP
