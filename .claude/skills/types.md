# TypeScript 最佳实践

帮助编写高质量的 TypeScript 代码。

## 用法

```bash
/ts [operation]
```

## 类型推断

```typescript
// 让 TypeScript 推断类型
const name = 'John';  // string

// 显式类型
const age: number = 30;
```

## 接口 vs 类型

```typescript
// 接口 - 更适合对象结构
interface User {
  id: string;
  name: string;
}

// 类型 - 更灵活
type Status = 'pending' | 'active' | 'done';
type ID = string | number;
```

## 常用模式

### 1. 可选属性
```typescript
interface User {
  name: string;
  email?: string;  // 可选
}
```

### 2. 泛型
```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

### 3. 映射类型
```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};
```

### 4. 条件类型
```typescript
type NonNullable<T> = T extends null | undefined ? never : T;
```

## 最佳实践

1. **启用 strict 模式**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

2. **避免使用 any**
```typescript
// 不好
const data: any = getData();

// 好
const data: unknown = getData();
// 或定义具体类型
```

3. **使用类型守卫**
```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

4. **导出工具类型**
```typescript
// types/user.ts
export interface User {
  id: string;
  name: string;
}

export type CreateUserDTO = Omit<User, 'id'>;
export type UpdateUserDTO = Partial<User>;
```

## 常见错误处理

```typescript
// 处理 null/undefined
const name = user?.name ?? 'Unknown';

// 处理可能不存在的属性
const city = (user.address as Address)?.city ?? 'Unknown';
```
