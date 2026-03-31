/**
 * Controls.tsx — 游戏控制组件（移动端 D-pad + 动作按钮）
 *
 * 提供两套控制器：
 *   1. 动作按钮区（上方）：开始 / 暂停 / 继续 / 重置
 *   2. 方向键区（下方）：上下左右 + 中间确认键
 *
 * 这个组件本身不处理任何游戏逻辑，它只是一堆按钮。
 * 当用户点击时，它通过 Props 里的回调函数通知父组件（App.tsx）去执行实际操作。
 * 这种模式叫做"向上传递事件"（Lifting State Up）。
 *
 * 核心概念：
 *   - 回调函数（Callback）：父组件传入的函数，子组件点击时调用
 *   - 状态驱动 UI：按钮的显示 / 文案 / 行为完全由 status 决定
 *   - aria-label：无障碍属性，告诉屏幕阅读器按钮的用途
 */

import type { Direction, GameStatus } from '../types/game';

// ── Props 类型定义 ────────────────────────────────────────────────────────────
interface Props {
  status: GameStatus;                  // 当前游戏状态，决定显示哪些按钮
  onDirection: (d: Direction) => void; // 回调：改变蛇的移动方向（'UP'|'DOWN'|'LEFT'|'RIGHT'）
  onStart: () => void;                 // 回调：开始新游戏
  onTogglePause: () => void;           // 回调：切换暂停/继续
  onReset: () => void;                 // 回调：重置游戏
}

// ── 组件主体 ──────────────────────────────────────────────────────────────────
export default function Controls({
  status,
  onDirection,
  onStart,
  onTogglePause,
  onReset,
}: Props) {
  return (
    <div className="controls">

      {/* ── 动作按钮区 ──────────────────────────────────────────────────── */}
      {/* 根据游戏状态，智能显示不同的按钮组合 */}
      <div className="action-buttons">

        {/* 仅在 IDLE（未开始）状态显示"开始游戏"按钮 */}
        {status === 'IDLE' && (
          <button className="btn btn-primary" onClick={onStart}>
            开始游戏
          </button>
        )}

        {/* 游戏进行中或暂停时，显示"暂停/继续"切换按钮 */}
        {(status === 'RUNNING' || status === 'PAUSED') && (
          <button className="btn btn-secondary" onClick={onTogglePause}>
            {/* 根据状态显示不同文案：运行中→"暂停"，已暂停→"继续" */}
            {status === 'RUNNING' ? '暂停' : '继续'}
          </button>
        )}

        {/* 除了 IDLE 状态之外，其他状态都显示"重置"按钮 */}
        {status !== 'IDLE' && (
          <button className="btn btn-ghost" onClick={onReset}>
            重置
          </button>
        )}
      </div>

      {/* ── 方向键区（D-pad）───────────────────────────────────────────── */}
      {/*
        D-pad 布局（3行3列的十字形）：
            [  ▲  ]
          [◀] [●] [▶]
            [  ▼  ]
        每行用 .dpad-row 包裹，用 CSS flex 布局横向排列
      */}
      <div className="dpad">

        {/* 第一行：上方向键 */}
        <div className="dpad-row">
          <button
            className="dpad-btn"
            onClick={() => onDirection('UP')}
            aria-label="上" // 无障碍属性：给屏幕阅读器用
          >
            ▲
          </button>
        </div>

        {/* 第二行：左、中、右 */}
        <div className="dpad-row">
          <button
            className="dpad-btn"
            onClick={() => onDirection('LEFT')}
            aria-label="左"
          >
            ◀
          </button>

          {/* 中间确认键：根据状态决定行为
              - IDLE：点击开始游戏
              - 其他：点击切换暂停/继续
              图标也随状态变化：运行中显示⏸，其他显示▶
          */}
          <button
            className="dpad-btn dpad-center"
            onClick={() => status === 'IDLE' ? onStart() : onTogglePause()}
            aria-label="确认"
          >
            {status === 'RUNNING' ? '⏸' : '▶'}
          </button>

          <button
            className="dpad-btn"
            onClick={() => onDirection('RIGHT')}
            aria-label="右"
          >
            ▶
          </button>
        </div>

        {/* 第三行：下方向键 */}
        <div className="dpad-row">
          <button
            className="dpad-btn"
            onClick={() => onDirection('DOWN')}
            aria-label="下"
          >
            ▼
          </button>
        </div>

      </div>
    </div>
  );
}
