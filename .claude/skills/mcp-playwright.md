# MCP Playwright 浏览器自动化

使用 MCP 进行浏览器自动化测试和操作。

## 简介

通过 MCP 协议使用 Playwright 进行浏览器自动化。

## 配置

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    }
  }
}
```

## 常用工具

### 1. 打开页面
```
工具: playwright_navigate
参数: url
```

### 2. 点击元素
```
工具: playwright_click
参数: selector
```

### 3. 填写表单
```
工具: playwright_fill
参数: selector, value
```

### 4. 获取内容
```
工具: playwright_screenshot
参数:
```

### 5. 执行 JavaScript
```
工具: playwright_evaluate
参数: script
```

## 使用场景

### 1. 自动化测试
```javascript
// 自动登录测试
await navigate('https://app.example.com/login');
await fill('#email', 'test@example.com');
await fill('#password', 'password');
await click('#submit');
await assertText('#dashboard', 'Welcome');
```

### 2. 网页截图
```javascript
await navigate('https://example.com');
await screenshot({ path: 'screenshot.png' });
```

### 3. 数据抓取
```javascript
await navigate('https://news.example.com');
const headlines = await evaluate(() => {
  return Array.from(document.querySelectorAll('h2'))
    .map(el => el.textContent);
});
```

## 最佳实践

1. **等待元素**: 使用 waitForSelector
2. **重试机制**: 处理网络不稳定
3. **清理状态**: 每次测试独立
4. **headless 模式**: CI 中使用无头模式
