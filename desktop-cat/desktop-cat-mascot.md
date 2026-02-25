## 桌面吉祥物 Cyber Cat 实现总览

本文档汇总当前桌面吉祥物 **cat（Cyber Cat 皮肤）** 的所有关键实现，包括：

- **架构与挂载关系**
- **事件驱动状态体系（MascotEventState）**
- **桌面拖拽逻辑与消息气泡**
- **Cat 皮肤的 SVG 外观源码与表情逻辑**
- **各业务场景如何驱动不同动作 / 动效**

> 说明：当前实现完全基于 **React + SVG + Tailwind/CSS 动画**，项目中没有 `.riv` 资源文件，也未直接使用 Rive 引擎。“Rive 动效”可以理解为未来如果迁移到 Rive 时，应复用本文件里整理的所有状态与行为设计。

---

### 1. 架构总览

- **桌面入口（Desktop Shell）**
  - 文件：`apps/desktop/src/main.tsx`
  - 作用：
    - 注入 Tailwind CDN 与自定义动画配置（如 `float`、`blink`、`wiggle` 等）。
    - 渲染 Web 端的根组件 `@web/App`，从而在桌面环境中复用 Web UI 和吉祥物。

- **Web 根组件 & 悬浮吉祥物挂载点**
  - 文件：`apps/web/App.tsx`
  - 关键点：
    - 在全局布局中以 **固定定位** 挂载：
      - `DraggableMascot`：桌面/网页右下角可拖拽的吉祥物。
    - 通过 `eventBus.emit(Events.MASCOT_STATE, {...})` 在多个场景（导航、Focus 模式切换等）驱动吉祥物状态。

- **桌面吉祥物组件（可拖拽层）**
  - 文件：`apps/web/components/DraggableMascot.tsx`
  - 作用：
    - 监听事件总线 `@vicoo/events` 中的 `MASCOT_STATE` / `MASCOT_SHOW_MESSAGE` / `MASCOT_CELEBRATE`。
    - 维护：
      - 位置：`position { x, y }`
      - 拖拽状态：`isDragging`
      - 当前状态：`mascotState` + `overrideState`
      - 当前文案：`message`
    - 通过指针事件实现拖拽，并控制“被拖拽中 / 掉落”动画与气泡文案。
    - 将扩展状态映射到基础渲染状态后，传给 `Mascot` 组件进行实际绘制。

- **吉祥物外观与皮肤（含 Cyber Cat）**
  - 文件：`apps/web/components/Mascot.tsx`
  - 作用：
    - 定义扩展状态 `ExtendedState`，覆盖所有事件状态（编辑、搜索、同步、连接、拖拽等）。
    - 根据状态计算统一的 `bodyAnim` 类，驱动整体“身体”动画（浮动、震动、弹跳等）。
    - 基于 `ThemeContext` 中的 `mascotSkin` 决定当前皮肤：
      - `bot`：经典机器人
      - `cat`：当前桌面使用的 **Cyber Cat**
      - `orb`：核心能量球
    - 对于 `cat` 皮肤，使用 SVG path/rect/circle 等图形组合出猫咪轮廓、尾巴、耳朵、胡须及不同表情。

- **事件总线与状态类型**
  - 文件：`packages/events/src/index.ts`
  - 作用：
    - 实现简单的发布订阅 `EventEmitter`。
    - 暴露全局单例 `eventBus`。
    - 定义事件常量：
      - `Events.MASCOT_STATE`
      - `Events.MASCOT_SHOW_MESSAGE`
      - `Events.MASCOT_CELEBRATE`
    - 定义吉祥物状态类型 `MascotEventState`，枚举所有可触发的动作状态。

---

### 2. 拖拽层实现（DraggableMascot）

#### 2.1 状态与映射

- 扩展状态类型：
  - `ExtendedMascotState` 基本等同于 `MascotEventState`，包含：
    - 编辑相关：`typing` / `saving` / `saved`
    - 搜索相关：`searching` / `search_found` / `search_empty`
    - AI 相关：`thinking` / `working` / `tool_using` / `command_running`
    - 同步相关：`syncing` / `synced` / `sync_error`
    - 连接相关：`connecting` / `connected` / `disconnected`
    - 导航 & Focus：`navigating` / `focus_enter` / `focus_exit`
    - 交互：`dragging` / `dropped` / `celebrating` / `surprised` / `sad` / `error`
    - 基本：`idle` / `happy`

- 渲染映射：
  - `mapToBaseState(state: ExtendedMascotState): 'idle' | 'happy' | 'thinking' | 'working'`
  - 设计思路：
    - 上层业务可以使用非常细的语义状态（如 `syncing`、`search_found`），但底层实际绘制只用 4 个“基态”：
      - `idle`：静置、轻微眨眼。
      - `happy`：成功 / 完成 / 已连接类状态。
      - `thinking`：分析 / 搜索 / 导航 / 错误恢复等。
      - `working`：在进行保存、执行命令、实时输入等。

#### 2.2 拖拽与交互逻辑

- 拖拽：
  - `pointerdown`：
    - 标记 `isDragging = true`。
    - 设置 `overrideState = 'dragging'`，文案 `"Hey! Put me down!"`。
    - 记录指针与组件左上角的偏移量 `dragOffset`。
  - `pointermove`（监听在 `window` 上）：
    - 根据当前指针位置与 `dragOffset` 计算新坐标。
    - 对 `x/y` 做 **窗口边界约束**，保证猫不会被拖出屏幕（留 100px 安全边界）。
  - `pointerup`：
    - 清理拖拽状态。
    - 短暂进入 `overrideState = 'dropped'`，文案 `"Wheee!"`，1 秒后自动恢复。

- 事件驱动：
  - 订阅：
    - `Events.MASCOT_STATE`：统一入口，外部业务通过它改变状态 & 提示语。
    - `Events.MASCOT_SHOW_MESSAGE`：只展示文案，可选附加状态。
    - `Events.MASCOT_CELEBRATE`：快速进入 `celebrating`。
  - 自动恢复：
    - 对于非 `persistent` 的事件，会在指定 `duration` 后自动清空 `overrideState` 与 `message`。

- 点击循环状态（手动玩耍）：
  - 单击（非拖拽时）会在 `['idle', 'happy', 'thinking', 'working']` 之间循环。
  - 每次点击更新 `message`，3 秒后回到默认状态。

---

### 3. Cat 皮肤外观源码（SVG 与表情）

Cyber Cat 的实际绘制全部在 `Mascot.tsx` 中 `activeSkin === 'cat'` 分支内完成，核心结构：

- **阴影/脚下投影**：`<ellipse>` 位于底部，营造立体感。
- **身体（吐司猫 / loaf 形态）**：一条连续 `path`，根据状态切换填充色（例如思考时用 `info` 色）。
- **尾巴**：右侧大曲线 `path`，在 `happy` 时带 `wiggle` 动画。
- **耳朵**：左右两个三角形 `path`，以 `accent` 色填充。
- **胡须**：左右四条水平/斜线，增强猫感。
- **表情**：
  - `idle`：小圆眼 + 眨眼动画，微笑。
  - `happy`：扬眉+弯嘴，呈高兴状态。
  - `thinking`：黄色圆眼 + 平直嘴，并在耳朵上方加“思考泡泡”圆点动画。
  - `working`：戴上完整的“赛博眼镜”，下方是键盘和动态按钮（`animate-type`）。

源码（简化为核心结构，供查阅与复用）：

```tsx
// apps/web/components/Mascot.tsx 中的 cat 皮肤分支
if (activeSkin === 'cat') {
  return (
    <div className={`relative w-32 h-32 ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
        {/* Shadow */}
        <ellipse
          cx="100"
          cy="190"
          rx="60"
          ry="10"
          fill="#1a1a1a"
          opacity="0.2"
          className="dark:fill-black"
        />

        <g className={`${bodyAnim} transition-all duration-500`}>
          {/* Tail */}
          <path
            d="M160 160 Q190 140 180 110"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="8"
            strokeLinecap="round"
            className={`dark:stroke-white ${
              state === 'happy' ? 'animate-[wiggle_1s_infinite]' : ''
            }`}
          />

          {/* Body (Loaf Shape) */}
          <path
            d="M40 180 L160 180 Q170 180 170 150 L170 120 Q170 60 100 60 Q30 60 30 120 L30 150 Q30 180 40 180"
            fill={state === 'thinking' ? '#118AB2' : '#ffffff'}
            stroke="#1a1a1a"
            strokeWidth="6"
            className="transition-colors dark:fill-gray-800 dark:stroke-white"
          />

          {/* Ears */}
          <path
            d="M40 70 L30 30 L70 50"
            fill="#EF476F"
            stroke="#1a1a1a"
            strokeWidth="6"
            strokeLinejoin="round"
            className="dark:stroke-white"
          />
          <path
            d="M160 70 L170 30 L130 50"
            fill="#EF476F"
            stroke="#1a1a1a"
            strokeWidth="6"
            strokeLinejoin="round"
            className="dark:stroke-white"
          />

          {/* Face & whiskers */}
          <g className="dark:[&_path]:stroke-white dark:[&_circle]:fill-white">
            {/* Whiskers */}
            <line x1="20" y1="120" x2="40" y2="125" stroke="#1a1a1a" strokeWidth="3" />
            <line x1="20" y1="130" x2="40" y2="130" stroke="#1a1a1a" strokeWidth="3" />
            <line x1="180" y1="120" x2="160" y2="125" stroke="#1a1a1a" strokeWidth="3" />
            <line x1="180" y1="130" x2="160" y2="130" stroke="#1a1a1a" strokeWidth="3" />

            {/* idle 表情：眨眼 + 微笑 */}
            {state === 'idle' && (
              <g className="animate-blink" style={{ transformOrigin: '100px 120px' }}>
                <circle cx="70" cy="110" r="6" fill="#1a1a1a" />
                <circle cx="130" cy="110" r="6" fill="#1a1a1a" />
                <path
                  d="M90 130 Q100 135 110 130"
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="3"
                />
              </g>
            )}

            {/* happy 表情 */}
            {state === 'happy' && (
              <g>
                <path
                  d="M60 110 Q70 100 80 110"
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M120 110 Q130 100 140 110"
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M90 125 Q100 140 110 125"
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* thinking 表情 + 思考泡泡 */}
            {state === 'thinking' && (
              <g>
                <circle cx="70" cy="110" r="8" fill="#FFD166" />
                <circle cx="130" cy="110" r="8" fill="#FFD166" />
                <path d="M90 130 L110 130" stroke="#1a1a1a" strokeWidth="3" />
                <circle cx="160" cy="80" r="4" fill="#fff">
                  <animate
                    attributeName="opacity"
                    values="0;1;0"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="170" cy="70" r="6" fill="#fff">
                  <animate
                    attributeName="opacity"
                    values="0;1;0"
                    dur="1s"
                    begin="0.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}

            {/* working 表情：赛博眼镜 + 键盘 */}
            {state === 'working' && (
              <g>
                <rect
                  x="50"
                  y="100"
                  width="100"
                  height="25"
                  rx="5"
                  fill="#1a1a1a"
                  className="dark:fill-white"
                />
                <line
                  x1="50"
                  y1="112"
                  x2="150"
                  y2="112"
                  stroke="#0df259"
                  strokeWidth="2"
                  className="dark:stroke-black"
                />
                <path d="M80 160 L120 160" stroke="#1a1a1a" strokeWidth="4" />
                <g className="animate-type">
                  <circle
                    cx="60"
                    cy="160"
                    r="10"
                    fill="#EF476F"
                    stroke="#1a1a1a"
                    strokeWidth="2"
                  />
                  <circle
                    cx="140"
                    cy="160"
                    r="10"
                    fill="#EF476F"
                    stroke="#1a1a1a"
                    strokeWidth="2"
                  />
                </g>
              </g>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
```

> 注：`bodyAnim` 是根据扩展状态统一计算出来的类名（如 `animate-float`、`animate-[wiggle_...]` 等），在 Cat / Bot / Orb 三种皮肤之间复用，保证各皮肤的动效风格一致。

---

### 4. 状态体系与动效对照

#### 4.1 事件状态 -> 渲染基态映射

`DraggableMascot` 中的 `mapToBaseState` 逻辑可概括为：

| 事件层状态组 | 渲染基态 | 典型场景 |
| --- | --- | --- |
| `happy` / `celebrating` / `search_found` / `synced` / `completed` / `saved` / `connected` | `happy` | 操作成功、同步完成、搜索有结果等 |
| `thinking` / `searching` / `search_empty` / `navigating` / `connecting` / `focus_exit` | `thinking` | AI 思考、搜索中、页面导航中、连接中等 |
| `working` / `typing` / `saving` / `tool_using` / `file_reading` / `file_writing` / `command_running` / `syncing` / `dragging` / `surprised` / `focus_enter` | `working` | 编辑 & 运行中的各类活跃状态，以及 Focus 模式进入 |
| `sad` / `error` / `sync_error` / `disconnected` / `dropped` | `thinking` | 错误、断连、同步失败、被“扔下去”等 |
| 其他 | `idle` | 默认空闲状态 |

Cat 皮肤在渲染时只看到这 4 个基态，从而简化了表情组合，同时保持与事件语义的一一对应。

#### 4.2 Cat 皮肤下各基态视觉效果

| 渲染基态 | 视觉表现 | 对应典型事件 |
| --- | --- | --- |
| `idle` | 身体白色、尾巴静止、眼睛小圆点并周期性眨眼、微笑嘴型 | 启动后未执行任务、空闲悬浮 |
| `happy` | 眉眼上扬、张嘴笑、尾巴左右摇摆（`wiggle` 动画） | 保存完成、搜索成功、回答完成、同步完成 |
| `thinking` | 眼睛变为黄色圆形、嘴平直、耳朵上方出现渐隐泡泡动画 | AI 思考、搜索中、编辑器分析/总结中、AskAI/UnifiedAI 正在想 |
| `working` | 戴上黑色赛博眼镜、下方有键盘横线，左右两个按钮做 `animate-type` 动画 | 正在保存、正在输入、正在执行命令、同步中、工作繁忙态 |

---

### 5. 事件来源：不同页面如何驱动 Cat 动效

以下列出核心页面/模块中与吉祥物相关的事件触发点，便于统一维护或迁移到 Rive：

- **全局导航 & Focus 模式（`apps/web/App.tsx`）**
  - 切换视图时：
    - `state: 'navigating'`，`message: Going to ${currentView}...`
  - 进入 Focus 模式：
    - `state: 'focus_enter'`，`message: 'Focus mode!'`
  - 退出 Focus 模式：
    - `state: 'focus_exit'`，`message: 'Back to normal'`

- **搜索页（`apps/web/pages/Search.tsx`）**
  - 开始搜索：
    - `state: 'searching'`，`message: 'AI Thinking...'`，`duration: 0`
  - 搜索有结果：
    - `state: 'search_found'`，`message: Found N sources!`
  - 搜索为空：
    - `state: 'search_empty'`，`message: 'No matches found...'`
  - 搜索失败：
    - `state: 'error'`，`message: 'Search failed!'`

- **编辑器（`apps/web/pages/Editor.tsx`）**
  - 自动保存开始：
    - `state: 'saving'`，`message: 'Saving...'`，`duration: 0`
  - 保存成功：
    - `state: 'saved'`，`message: 'Saved!'`
  - 保存失败：
    - `state: 'error'`，`message: 'Save failed!'`
  - 内容分析 / 总结：
    - 启动：`state: 'thinking'`，`message: 'Analyzing...'`
    - 完成：`state: 'celebrating'`，`message: 'Analysis complete!'`
  - 用户输入中：
    - `state: 'typing'`，`message: 'Writing...'`，`duration: 500`

- **AskAI / UnifiedAI（`apps/web/pages/AskAI.tsx` & `UnifiedAI.tsx`）**
  - 用户发送提问：
    - `state: 'thinking'`，`message: '正在思考...'`（`persistent: true`）
  - AI 正在生成回复：
    - `state: 'working'`，`message: '正在组织回复...'`
  - 回复完成：
    - `state: 'happy'`，`message: '回答完成！'`
  - 出错（网络/服务失败）：
    - `state: 'error'`，`message: '连接失败...'` / `'处理失败...'`
  - 点击吉祥物（当 isTyping 为 true 时）：
    - 通过 `Events.MASCOT_SHOW_MESSAGE` 临时展示 `'正在思考中...'`。

- **同步逻辑（`apps/web/utils/sync.ts`）**
  - 开始同步：
    - `state: 'syncing'`，`message: 'Syncing...'`，`duration: 0`
  - 同步成功：
    - `state: 'synced'`，`message: 'All synced!'`
  - 同步失败：
    - `state: 'sync_error'`，`message: 'Sync failed!'`

---

### 6. 与 Rive 动效对接的参考建议

如果未来希望将 Cyber Cat 迁移为 Rive 资源，可以按以下方式对接本实现：

- **状态映射**
  - 使用 `MascotEventState` / `ExtendedMascotState` 作为 Rive 状态机的输入参数（如 boolean、enum 或 state machine trigger）。
  - 保持 `mapToBaseState` 逻辑不变，只在底层渲染层从 SVG 切换到 Rive。

- **分层设计**
  - 当前 SVG 中分成：身体、尾巴、耳朵、面部表情、工作装（眼镜 + 键盘）。
  - 在 Rive 中可将其拆成多个动画层或节点，并为每个状态组合设计单独的 animation/pose。

- **过渡与持续时间**
  - 参考现有 `duration` 设计（如保存完成 2 秒、同步失败 5 秒等），在 Rive 状态机中设置对应的切换时间或自动回退逻辑。

通过本文件即可完整理解与迁移当前桌面吉祥物 **Cyber Cat** 的全部行为与外观实现。

