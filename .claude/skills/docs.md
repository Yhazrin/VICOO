# 文档生成

帮助创建和维护项目文档。

## 用法

```bash
/docs [operation]
```

## 文档类型

1. **README**: 项目概览
2. **API 文档**: 接口说明
3. **代码注释**: 函数说明
4. **架构文档**: 系统设计
5. **贡献指南**: 如何贡献

## README 结构

```markdown
# 项目名称

简短描述

## 特性

- 特性 1
- 特性 2

## 快速开始

```bash
npm install
npm run dev
```

## API

### GET /api/users

获取用户列表

## 贡献

请阅读 CONTRIBUTING.md
```

## API 文档模板

```markdown
### GET /api/users/:id

获取单个用户

**参数**
| 名称 | 类型 | 描述 |
|------|------|------|
| id | string | 用户 ID |

**响应**
```json
{
  "id": "1",
  "name": "John"
}
```

**状态码**
- 200 成功
- 404 用户不存在
```

## 代码注释

```javascript
/**
 * 计算两个位置之间的距离
 * @param {number} lat1 - 第一个位置的纬度
 * @param {number} lon1 - 第一个位置的经度
 * @param {number} lat2 - 第二个位置的纬度
 * @param {number} lon2 - 第二个位置的经度
 * @returns {number} 距离（公里）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {}
```

## 文档工具

- **Markdown**: 简单文本格式
- **Docusaurus**: React 文档网站
- **Storybook**: 组件文档
- **Swagger/OpenAPI**: API 文档
- **JSDoc**: JavaScript 注释生成文档
