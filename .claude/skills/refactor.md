# 代码重构

对现有代码进行安全重构，提高代码质量和可维护性。

## 用法

```bash
/refactor [file-path]
```

## 重构原则

1. **小步前进**: 每次只改一处，确保测试通过
2. **先测试后重构**: 确保有测试覆盖
3. **保持功能不变**: 重构不改变外部行为
4. **渐进式改进**: 从简单到复杂

## 检查清单

- [ ] 提取重复代码为函数
- [ ] 拆分过大的函数/类
- [ ] 移除死代码
- [ ] 简化条件表达式
- [ ] 重命名变量/函数以提高可读性
- [ ] 使用类型替代 any
- [ ] 提取常量
- [ ] 合并相似的条件

## 常用重构技术

### 1. 提取函数
```javascript
// Before
if (user.isActive) {
  sendEmail(user.email, 'Welcome!');
  createUserLog(user.id);
  updateDashboard(user.id);
}

// After
function activateUser(user) {
  sendEmail(user.email, 'Welcome!');
  createUserLog(user.id);
  updateDashboard(user.id);
}
```

### 2. 替换条件为多态
```javascript
// Before
function calculateShipping(order) {
  if (order.country === 'US') return 5;
  if (order.country === 'EU') return 10;
  return 20;
}

// After
const shippingRates = {
  US: 5,
  EU: 10,
  default: 20
};
function calculateShipping(order) {
  return shippingRates[order.country] || shippingRates.default;
}
```

### 3. 引入参数对象
```javascript
// Before
function createEvent(name, startDate, endDate, location, description) {}

// After
function createEvent(event) {
  const { name, startDate, endDate, location, description } = event;
}
```
