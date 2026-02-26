# React 最佳实践

帮助编写高质量的 React 组件和应用。

## 用法

```bash
/react [operation]
```

## 组件设计原则

1. **单一职责**: 每个组件只做一件事
2. **可复用**: 通过 props 定制行为
3. **可测试**: 逻辑与 UI 分离

## Hooks 最佳实践

### 1. useState
```tsx
// 使用函数初始化（只执行一次）
const [data] = useState(() => expensiveCalculation());

// 使用 useReducer 处理复杂状态
const [state, dispatch] = useReducer(reducer, initialState);
```

### 2. useEffect
```tsx
// 依赖数组要完整
useEffect(() => {
  fetchData(id);
}, [id]);  // 包含所有使用的值

// 清理副作用
useEffect(() => {
  const subscription = subscribe(id);
  return () => subscription.unsubscribe();
}, [id]);
```

### 3. useCallback / useMemo
```tsx
// 传递给子组件的函数需要 useCallback
const handleClick = useCallback(() => {
  setCount(c => c + 1);
}, []);

// 复杂计算需要 useMemo
const sortedItems = useMemo(() => {
  return items.sort((a, b) => b.score - a.score);
}, [items]);
```

### 4. 自定义 Hook
```tsx
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
```

## 性能优化

1. **React.memo** - 避免不必要的重渲染
2. **useMemo/useCallback** - 缓存计算结果
3. **懒加载** - React.lazy
4. **虚拟列表** - react-window

## 文件结构

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
      index.ts
  hooks/
  contexts/
  pages/
  services/
```
