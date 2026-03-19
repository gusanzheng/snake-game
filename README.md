# 🐍 Snake Game — Vite + React + TypeScript 重构版

> 本项目将一个传统 HTML/JS 贪吃蛇，用现代前端工程技术完整重构，适合学习 React 组件化、自定义 Hook、TypeScript 类型系统、Canvas 渲染等核心概念。

---

## 目录

- [技术栈](#技术栈)
- [快速启动](#快速启动)
- [项目结构](#项目结构)
- [src 文件详解](#src-文件详解)
- [核心概念详解](#核心概念详解)
  - [1. TypeScript 类型定义](#1-typescript-类型定义)
  - [2. 工具函数（纯函数）](#2-工具函数纯函数)
  - [3. 自定义 Hook — useSnakeGame](#3-自定义-hook--usesnakegame)
  - [4. Canvas 渲染 — GameBoard](#4-canvas-渲染--gameboard)
  - [5. 组件拆分原则](#5-组件拆分原则)
  - [6. CSS 设计令牌 & 主题](#6-css-设计令牌--主题)
- [与原版的对比](#与原版的对比)
- [游戏玩法](#游戏玩法)
- [进一步学习](#进一步学习)

---

## 技术栈

| 工具 | 版本 | 用途 |
|------|------|------|
| **Vite** | 6.x | 构建工具，提供极速热更新（HMR） |
| **React** | 19.x | UI 框架，声明式渲染 |
| **TypeScript** | 5.x | 为 JavaScript 添加静态类型 |
| **npm** | — | 包管理器 |
| **Canvas API** | 浏览器内置 | 高性能游戏画面渲染 |

---

## 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（热更新）
npm run dev

# 3. 构建生产版本
npm run build

# 4. 预览生产版本
npm run preview
```

打开浏览器访问 `http://localhost:5173` 即可游玩。

---

## 项目结构

```
src/
├── types/
│   └── game.ts              # TypeScript 类型定义（所有数据结构）
├── utils/
│   └── gameHelpers.ts       # 纯函数工具（不依赖 React）
├── hooks/
│   └── useSnakeGame.ts      # 自定义 Hook，封装全部游戏逻辑
├── components/
│   ├── GameBoard.tsx        # Canvas 画板（纯渲染）
│   ├── ScoreBoard.tsx       # 得分展示
│   ├── Controls.tsx         # 方向键 + 操作按钮
│   └── GameOverlay.tsx      # 开始/结束遮罩层
├── App.tsx                  # 根组件，组合所有模块
└── index.css                # 全局样式与设计令牌
```

**分层思路**：`类型 → 工具函数 → Hook（逻辑）→ 组件（UI）→ App（组装）`，每层只依赖下层，职责清晰。

---

## src 文件详解

### 哪些是框架自动生成的？

运行 `npm create vite` 脚手架命令后，`src/` 下会自动生成以下文件：

```
src/
├── main.tsx        ✦ 框架生成，一般不需要改
├── App.tsx         ✦ 框架生成，但需要完全重写为自己的根组件
├── App.css         ✦ 框架生成，本项目已清空（样式全部集中在 index.css）
├── index.css       ✦ 框架生成，但需要完全重写为自己的全局样式
└── assets/         ✦ 框架生成，存放静态资源（本项目未使用）
```

以下目录和文件是**完全手动创建**的，框架不会生成：

```
src/
├── types/          ✎ 手动创建
├── utils/          ✎ 手动创建
├── hooks/          ✎ 手动创建
└── components/     ✎ 手动创建
```

---

### 逐文件说明

#### `main.tsx` — 框架生成，无需修改

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
)
```

这是整个应用的**启动入口**，做三件事：
1. 找到 `index.html` 里的 `<div id="root">` 挂载点
2. 用 `createRoot` 创建 React 渲染树
3. 把根组件 `<App />` 渲染进去

`StrictMode` 是 React 的开发辅助组件，会对组件做额外检查（如检测副作用是否写对），**只在开发环境生效，不影响生产性能**。

> 实际项目中几乎不需要修改这个文件，除非需要在根层添加全局 Provider（如路由、主题）。

---

#### `index.css` — 框架生成骨架，完全重写

框架只生成了基础 reset 样式，本项目将其**完全替换**为游戏专属的全局样式系统。

核心思路是用 **CSS 自定义属性（变量）** 作为设计令牌：

```css
/* 在 :root 上声明，全局可用 */
:root {
  --green:     #00ff88;   /* 所有绿色元素统一用这个变量 */
  --bg-page:   #0d0f14;
  --radius-md: 12px;
}

/* 使用变量，而不是硬编码颜色值 */
.score-current { color: var(--green); }
```

这样修改主题色时只需改一处变量，而不需要全局搜索替换。

`index.css` 被 `main.tsx` 引入，因此自动作用于整个应用的所有组件。

---

#### `App.tsx` — 框架生成骨架，完全重写

框架生成的是 Vite 欢迎页代码，本项目将其替换为**根组件**，职责是：

1. 调用 `useSnakeGame()` 获取游戏数据和操作函数
2. 把数据通过 `props` 分发给各子组件
3. 定义页面整体布局（header + 游戏区 + 侧边栏）

```tsx
export default function App() {
  // ① 从 Hook 拿到所有数据和操作
  const { gameState, config, start, togglePause, reset, changeDirection } = useSnakeGame();

  return (
    <div className="app">
      <GameBoard gameState={gameState} config={config} />     {/* ② 分发数据 */}
      <GameOverlay ... onStart={start} onReset={reset} />     {/* ③ 分发回调 */}
      <ScoreBoard gameState={gameState} />
      <Controls onDirection={changeDirection} ... />
    </div>
  );
}
```

`App` 本身不持有任何状态，它只是**数据的搬运工**，把 Hook 里的数据传下去，把子组件的事件传回去。

---

#### `types/game.ts` — 手动创建

定义整个项目共享的 TypeScript 类型。**这是最先写的文件**，相当于先把数据结构设计好，后续所有文件都引用这里的类型。

```
Position      坐标点 {x, y}
Direction     方向联合类型 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
GameStatus    状态机 'IDLE' | 'RUNNING' | 'PAUSED' | 'GAME_OVER'
GameConfig    游戏配置（网格大小、初始速度）
GameState     传递给组件的完整快照（蛇、食物、分数等）
```

**被哪些文件引用**：`utils/gameHelpers.ts`、`hooks/useSnakeGame.ts`、全部 `components/`。它处于依赖链最底层，自己不引用任何项目文件。

---

#### `utils/gameHelpers.ts` — 手动创建

存放**纯函数**：函数只依赖输入参数，不读写外部状态，不导入 React。

| 函数 | 作用 |
|------|------|
| `generateFood` | 随机生成食物坐标，确保不与蛇身重叠 |
| `getNextHead` | 根据方向计算蛇头下一步坐标 |
| `isOutOfBounds` | 检测坐标是否超出网格边界 |
| `isHittingSelf` | 检测蛇头是否撞到自身 |
| `isOppositeDirection` | 判断两个方向是否相反（防止180°掉头） |
| `calcLevel` | 由分数算出当前等级 |
| `calcSpeed` | 由等级算出移动间隔（ms） |

**被哪些文件引用**：只有 `hooks/useSnakeGame.ts` 引用它。把这些逻辑抽出来的好处是：将来可以单独用 Vitest 测试这些函数，不需要启动 React 环境。

---

#### `hooks/useSnakeGame.ts` — 手动创建

项目的**核心文件**，封装了所有游戏状态和逻辑，是连接"纯逻辑层"和"UI层"的桥梁。

内部包含：

```
useState       → 游戏完整状态（snake, food, score, status, highScore...）
useRef × 3     → directionRef（当前方向）
               → pendingDirectionRef（缓冲下一帧方向，防穿墙）
               → intervalRef（保存 setInterval 句柄用于清理）
useCallback × 5→ tick / startLoop / start / togglePause / reset / changeDirection
useEffect × 3  → 等级变化时重建游戏循环
               → 键盘事件监听
               → 组件卸载时清理定时器
```

对外只暴露 `{ gameState, config, start, togglePause, reset, changeDirection }`，组件不需要知道内部实现细节。

**被哪些文件引用**：只有 `App.tsx`。

---

#### `components/GameBoard.tsx` — 手动创建

**唯一使用 Canvas API 的文件**。接收 `gameState` 和 `config` 作为 props，每次数据变化就重新绘制整张画布。

```tsx
// ① Canvas 元素通过 ref 拿到原生 DOM 引用
const canvasRef = useRef<HTMLCanvasElement>(null);

// ② 每次 snake/food/status 变化时触发重绘
useEffect(() => {
  const ctx = canvasRef.current.getContext('2d');
  ctx.clearRect(...);       // 清空
  // 绘制网格线、食物光晕、蛇身渐变...
}, [snake, food, status]);

// ③ 组件只返回一个 <canvas> 标签
return <canvas ref={canvasRef} width={600} height={600} />;
```

这个组件**没有自己的状态**，完全由 props 驱动，被称为"纯渲染组件"。

---

#### `components/GameOverlay.tsx` — 手动创建

根据 `status` 决定显示什么内容：
- `status === 'IDLE'` → 游戏开始页（标题 + 操作提示）
- `status === 'GAME_OVER'` → 结束页（本局分数 + 最高分 + 再来一局）
- `status === 'RUNNING'` 或 `'PAUSED'` → 返回 `null`（不渲染任何内容）

用 `position: absolute` 叠在 `GameBoard` 的画布上方，形成遮罩效果。

---

#### `components/ScoreBoard.tsx` — 手动创建

纯展示组件，接收 `gameState`，显示当前分数、历史最高分、当前等级，无任何逻辑。

---

#### `components/Controls.tsx` — 手动创建

提供两套控制方式：
1. **操作按钮**：开始 / 暂停 / 重置（根据 `status` 决定显示哪些）
2. **方向键 D-Pad**：4个方向按钮，供触屏设备使用

所有点击事件通过 props 回调（`onStart`、`onDirection` 等）向上传递，组件本身不执行任何游戏逻辑。

---

### 文件依赖关系图

```
main.tsx
  └── App.tsx
        ├── uses: hooks/useSnakeGame.ts
        │           ├── imports: types/game.ts
        │           └── imports: utils/gameHelpers.ts
        │
        ├── renders: components/GameBoard.tsx
        │               └── imports: types/game.ts
        ├── renders: components/GameOverlay.tsx
        │               └── imports: types/game.ts
        ├── renders: components/ScoreBoard.tsx
        │               └── imports: types/game.ts
        └── renders: components/Controls.tsx
                        └── imports: types/game.ts
```

**规律**：`types/game.ts` 被所有人引用，但它自己不引用任何人。`utils/gameHelpers.ts` 只被 Hook 引用。组件只和 `types/` 打交道，看不到 `utils/` 和 `hooks/` 的实现细节。

---

## 核心概念详解

### 1. TypeScript 类型定义

文件：`src/types/game.ts`

```typescript
// 联合类型：方向只能是这四个字符串之一
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// 联合类型：游戏状态机的四种状态
export type GameStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'GAME_OVER';

// 接口：描述一个坐标点的形状
export interface Position {
  x: number;
  y: number;
}
```

**学习点**：
- `type` vs `interface`：简单别名用 `type`，描述对象形状用 `interface`
- 联合类型（Union Type）：`'UP' | 'DOWN'` 比 `string` 更安全，编译器会检查拼写错误
- TypeScript 的核心价值：**在编译期捕获运行时可能出现的错误**

---

### 2. 工具函数（纯函数）

文件：`src/utils/gameHelpers.ts`

```typescript
// 纯函数：相同输入永远返回相同输出，没有副作用
export function getNextHead(head: Position, direction: Direction): Position {
  const moves: Record<Direction, Position> = {
    UP:    { x: head.x,     y: head.y - 1 },
    DOWN:  { x: head.x,     y: head.y + 1 },
    LEFT:  { x: head.x - 1, y: head.y     },
    RIGHT: { x: head.x + 1, y: head.y     },
  };
  return moves[direction];
}
```

**学习点**：
- **纯函数**（Pure Function）：不读写全局状态，易于单元测试
- `Record<K, V>`：TypeScript 内置工具类型，表示键为 K、值为 V 的对象
- 将逻辑从组件中抽离，代码复用性更强

---

### 3. 自定义 Hook — useSnakeGame

文件：`src/hooks/useSnakeGame.ts`

这是项目最重要的文件，封装了所有游戏状态和逻辑。

```typescript
export function useSnakeGame() {
  const [state, setState] = useState<GameState>(...);
  const directionRef = useRef<Direction>('RIGHT');  // ① useRef 避免闭包问题
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {           // ② useCallback 避免重复创建函数
    setState(prev => {                       // ③ 函数式更新，获取最新状态
      const newHead = getNextHead(...);
      if (isOutOfBounds(newHead, CONFIG)) {
        return { ...prev, status: 'GAME_OVER' };  // ④ 不可变更新（展开运算符）
      }
      // ...
    });
  }, []);

  useEffect(() => {                          // ⑤ 副作用：启动/停止游戏循环
    if (state.status === 'RUNNING') {
      intervalRef.current = setInterval(tick, speed);
    }
    return () => clearInterval(intervalRef.current);  // 清理副作用
  }, [state.status]);

  return { gameState, start, togglePause, reset, changeDirection };
}
```

**关键 React Hooks 解析**：

| Hook | 使用场景 | 本项目中的作用 |
|------|----------|----------------|
| `useState` | 需要触发重新渲染的状态 | 蛇、食物、分数、游戏状态 |
| `useRef` | 不需要触发渲染的可变值 | 当前方向（避免 setInterval 闭包捕获旧值） |
| `useEffect` | 同步副作用（定时器、事件监听） | 游戏循环、键盘监听、保存最高分 |
| `useCallback` | 缓存函数引用，避免子组件不必要重渲染 | `tick`、`start`、`changeDirection` |

**为什么方向要用 `useRef` 而不是 `useState`？**

`setInterval` 的回调在创建时"捕获"了当时的变量值（JavaScript 闭包特性）。如果用 `useState`，每次方向变化都要重建 interval，可能导致速度不稳定。用 `useRef` 则可以在不重建 interval 的前提下读取到最新方向值。

---

### 4. Canvas 渲染 — GameBoard

文件：`src/components/GameBoard.tsx`

```typescript
export default function GameBoard({ gameState, config }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');  // 获取 2D 绘图上下文

    ctx.clearRect(0, 0, width, height);  // 每帧先清空画布

    // 绘制蛇身（带渐变色 + 光晕）
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#00ff88' : `rgb(${r}, ${g}, ${b})`;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = index === 0 ? 16 : 0;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, radius);  // 圆角矩形
      ctx.fill();
    });
  }, [snake, food, status]);  // 依赖项变化时重新绘制

  return <canvas ref={canvasRef} width={600} height={600} />;
}
```

**为什么用 Canvas 而不是 DOM？**

原版用 `<div>` 做每个格子，每帧需要增删大量 DOM 节点，性能较差。Canvas 直接操作像素，绘制更快，且能轻松实现光晕、渐变等视觉效果。

**Canvas 绘图基本流程**：
1. 获取 `ctx`（2D 绘图上下文）
2. `clearRect` 清空画布
3. 调用绘图指令（`fillRect`、`arc`、`beginPath` 等）
4. React 的 `useEffect` 在状态变化后自动触发重绘

---

### 5. 组件拆分原则

```
App（协调者，持有数据）
├── GameBoard    → 只负责"画"，接收数据，不持有状态
├── GameOverlay  → 只负责"展示"开始/结束界面
├── ScoreBoard   → 只负责"展示"分数
└── Controls     → 只负责"触发"操作，回调由父级传入
```

这种模式称为**受控组件** + **单向数据流**：
- 状态集中在 `useSnakeGame` Hook（单一数据源）
- `App` 从 Hook 拿到数据，通过 `props` 分发给各子组件
- 子组件通过 `props` 中的回调函数（如 `onStart`）向上传递事件

---

### 6. CSS 设计令牌 & 主题

文件：`src/index.css`

```css
:root {
  --green:      #00ff88;   /* 蛇的主色 */
  --red:        #ff5050;   /* 食物颜色 */
  --bg-page:    #0d0f14;   /* 页面背景 */
  --radius-md:  12px;      /* 统一圆角 */
}

/* 使用令牌 */
.score-current { color: var(--green); }
```

**设计令牌**（Design Tokens）是将颜色、间距、字体等设计决策提取为 CSS 变量，修改一处即全局生效，这是现代设计系统（如 Ant Design、Material UI）的核心实践。

---

## 与原版的对比

| 维度 | 原版（HTML/JS） | 重构版（React/TS） |
|------|-----------------|-------------------|
| 类型安全 | ❌ 无类型检查 | ✅ TypeScript 全覆盖 |
| 状态管理 | 散落的全局变量 | 集中在自定义 Hook |
| 渲染方式 | 每帧增删 DOM 节点 | Canvas 直接绘制 |
| 组件化 | 单文件，逻辑混杂 | 5 个职责清晰的组件 |
| 可测试性 | 难以单元测试 | 工具函数可独立测试 |
| 暂停功能 | ❌ | ✅ 支持暂停/继续 |
| 等级系统 | ❌ | ✅ 每50分升级，速度加快 |
| 最高分持久化 | ❌ | ✅ localStorage |
| 防同帧双键穿墙 | ❌ | ✅ pendingDirection 缓冲 |

---

## 游戏玩法

| 操作 | 按键 |
|------|------|
| 移动方向 | `↑↓←→` 方向键 或 `W A S D` |
| 开始游戏 | `Space` 或点击"开始游戏"按钮 |
| 暂停/继续 | `Space` / `Esc` |
| 重置 | 点击"重置"按钮 |

- 每吃一个食物 **+10 分**
- 每 **50 分** 升一级，移动速度加快（最快 100ms/格）
- 撞墙或咬到自己即游戏结束

---

## 进一步学习

想继续深入，可以尝试以下扩展练习：

1. **添加音效** — 使用 Web Audio API 在吃食物/死亡时播放音效
2. **平滑动画** — 用 `requestAnimationFrame` 替代 `setInterval` 实现插值动画
3. **多食物模式** — 将 `food: Position` 改为 `food: Position[]` 数组
4. **在线排行榜** — 接入后端 API 存储最高分
5. **单元测试** — 用 Vitest 对 `gameHelpers.ts` 中的纯函数编写测试

**推荐阅读**：
- [React 官方文档 — 自定义 Hook](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [TypeScript 手册](https://www.typescriptlang.org/docs/handbook/intro.html)
- [MDN Canvas API](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)
- [Vite 中文文档](https://cn.vitejs.dev/)
