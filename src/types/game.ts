/**
 * game.ts — 全局 TypeScript 类型定义
 *
 * 这个文件是整个项目的"数据契约"——定义了所有模块共用的数据结构。
 * 它处于架构的最底层，不依赖任何其他文件，所有层（utils、hooks、components）都可以从这里导入。
 *
 * TypeScript 类型的作用：
 *   - 在编码阶段就发现数据传错、字段拼错等低级错误，而不是等到运行时
 *   - 让编辑器能自动补全字段名，提升开发效率
 *   - 相当于代码里的"说明书"，一眼就能看懂数据的结构
 *
 * interface vs type 的区别（本文件中用到了两种）：
 *   - interface：定义"对象的形状"（有哪些字段、字段是什么类型）
 *   - type：更灵活，可以定义联合类型（A | B | C）、基本类型别名等
 */

// ── Position（坐标位置）──────────────────────────────────────────────────────
// 游戏中所有需要表达"在哪个格子"的地方都用这个类型：蛇的每一节、食物的位置
// x 是列（横轴，从左到右 0 → cols-1）
// y 是行（纵轴，从上到下 0 → rows-1）
export interface Position {
  x: number;
  y: number;
}

// ── Direction（移动方向）─────────────────────────────────────────────────────
// 联合类型（Union Type）：用 | 分隔，表示"只能是这几个值之一"
// 好处：如果你写了 direction = 'LEFT2'，TypeScript 会立刻报错
// 使用者：useSnakeGame（存储当前方向）、gameHelpers（计算下一步位置）、Controls（发送方向事件）
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// ── GameStatus（游戏状态机）──────────────────────────────────────────────────
// 游戏在任意时刻只能处于这四个状态之一，状态之间的合法转换：
//
//   IDLE ──[点击开始]──→ RUNNING
//   RUNNING ──[暂停]──→ PAUSED
//   PAUSED ──[继续]──→ RUNNING
//   RUNNING ──[撞墙/撞自身]──→ GAME_OVER
//   GAME_OVER ──[重置]──→ IDLE
//
// 这种设计叫"状态机"，用有限的状态值代替一堆 isStarted/isPaused/isDead 布尔变量
// 好处：状态互斥，不会出现"既暂停又游戏结束"这种矛盾情况
export type GameStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'GAME_OVER';

// ── GameConfig（游戏配置）────────────────────────────────────────────────────
// 描述游戏棋盘的固定参数，在 useSnakeGame.ts 里被定义为常量 CONFIG，运行时不会改变
export interface GameConfig {
  cols: number;         // 网格列数（横向格子总数），当前值：30
  rows: number;         // 网格行数（纵向格子总数），当前值：30
  cellSize: number;     // 每个格子的像素大小，当前值：20px → 画布总大小 600×600px
  initialSpeed: number; // 初始移动间隔，单位毫秒（ms），当前值：200ms = 每秒移动 5 格
}

// ── LeaderboardEntry（排行榜条目）────────────────────────────────────────────
// 对应 MongoDB 数据库 scores 集合里的一条文档结构
// 由后端 API（/api/leaderboard）返回，在 useLeaderboard hook 和 Leaderboard 组件中使用
export interface LeaderboardEntry {
  _id: string;        // MongoDB 自动生成的唯一 ID，用作 React 列表渲染的 key
  name: string;       // 玩家昵称（后端限制最多 20 个字符）
  score: number;      // 得分
  createdAt: string;  // 创建时间（ISO 8601 格式字符串，如 "2024-01-01T12:00:00.000Z"）
}

// ── GameState（游戏状态快照）─────────────────────────────────────────────────
// 游戏在某一时刻的完整状态，由 useSnakeGame hook 通过 useState 管理
// 每次蛇移动、吃食物、游戏结束时，都会生成一个新的 GameState 对象传给组件
export interface GameState {
  snake: Position[];    // 蛇身坐标数组，snake[0] 是蛇头，最后一个元素是蛇尾
  food: Position;       // 当前食物的坐标
  direction: Direction; // 当前移动方向（注意：实际运动方向存在 directionRef，这里用于同步展示）
  status: GameStatus;   // 当前游戏状态（控制 UI 显示哪个界面）
  score: number;        // 本局累计得分（每吃一个食物 +10 分）
  highScore: number;    // 历史最高分（从 localStorage 读取，游戏结束时更新）
  level: number;        // 当前等级（每 50 分升一级，影响移动速度）
}
