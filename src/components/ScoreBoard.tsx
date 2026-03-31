/**
 * ScoreBoard.tsx — 分数面板组件
 *
 * 展示三个数据：当前得分、历史最高分、当前等级。
 * 这是一个典型的"纯展示组件"（也叫哑组件 / Dumb Component / Presentational Component）：
 *   - 没有任何本地状态（不用 useState）
 *   - 没有任何副作用（不用 useEffect）
 *   - 只接收数据（Props），纯粹地把数据渲染成 HTML
 *
 * 这种组件的好处：
 *   - 逻辑简单，只需关心"显示什么"
 *   - 易于测试（相同输入永远产生相同输出）
 *   - 可以在任何地方复用
 */

import type { GameState } from '../types/game';

// ── Props 类型定义 ────────────────────────────────────────────────────────────
// 这里选择接收整个 gameState 对象，而不是单独传入 score/highScore/level
// 好处：父组件调用时写法更简洁 <ScoreBoard gameState={gameState} />
interface Props {
  gameState: GameState;
}

// ── 组件主体 ──────────────────────────────────────────────────────────────────
export default function ScoreBoard({ gameState }: Props) {
  // 解构赋值：从 gameState 对象中取出需要的三个字段
  // 等价于：
  //   const score = gameState.score;
  //   const highScore = gameState.highScore;
  //   const level = gameState.level;
  const { score, highScore, level } = gameState;

  // JSX：描述这个组件的 HTML 结构
  // 三列布局，每列包含一个标签 + 一个数值
  return (
    <div className="scoreboard">
      {/* 当前得分：每吃一个食物加分 */}
      <div className="score-item">
        <span className="score-label">得分</span>
        {/* {score} 是 JSX 的插值语法，相当于 HTML 模板中的 {{ score }} */}
        <span className="score-value score-current">{score}</span>
      </div>

      {/* 历史最高分：从 localStorage 读取，跨局保存 */}
      <div className="score-item">
        <span className="score-label">最高分</span>
        <span className="score-value score-best">{highScore}</span>
      </div>

      {/* 当前等级：每得 50 分升一级，速度同步加快 */}
      <div className="score-item">
        <span className="score-label">等级</span>
        {/* 模板字符串拼接：显示为 "Lv.1"、"Lv.2" 等 */}
        <span className="score-value score-level">Lv.{level}</span>
      </div>
    </div>
  );
}
