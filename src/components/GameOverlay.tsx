/**
 * GameOverlay.tsx — 游戏遮罩层（开始画面 / 游戏结束画面）
 *
 * 这个组件负责在游戏未开始或结束时显示一个居中弹窗：
 *   - IDLE 状态（未开始）：显示标题、历史最高分、"开始游戏"按钮
 *   - GAME_OVER 状态（结束）：显示本局得分、是否新纪录、上传分数表单、"再来一局"按钮
 *   - RUNNING / PAUSED 状态：组件直接返回 null，相当于"不渲染任何东西"
 *
 * 核心技术：
 *   - useState：管理表单的本地状态（昵称、提交中、已提交、错误信息）
 *   - 条件渲染：根据 status 和各种状态判断显示哪些 UI 片段
 *   - 受控组件（Controlled Component）：input 的值由 React state 控制
 */

import { useState } from 'react';
import type { GameStatus } from '../types/game';

// ── Props 类型定义 ────────────────────────────────────────────────────────────
interface Props {
  status: GameStatus;       // 当前游戏状态：'IDLE' | 'RUNNING' | 'PAUSED' | 'GAME_OVER'
  score: number;            // 本局得分
  highScore: number;        // 历史最高分（从 localStorage 读取）
  onStart: () => void;      // 回调：点击"开始游戏"时调用
  onReset: () => void;      // 回调：点击"再来一局"时调用
  onSubmitScore: (name: string) => Promise<void>; // 回调：提交分数到排行榜（异步）
}

// ── 组件主体 ──────────────────────────────────────────────────────────────────
export default function GameOverlay({ status, score, highScore, onStart, onReset, onSubmitScore }: Props) {
  // ── 本地状态（Local State）────────────────────────────────────────────────
  // 这些状态只属于这个组件，不需要传给外部
  // useState(初始值) 返回 [当前值, 修改函数] 的数组

  const [name, setName] = useState('');           // 玩家输入的昵称
  const [submitting, setSubmitting] = useState(false);  // 是否正在提交（防止重复点击）
  const [submitted, setSubmitted] = useState(false);    // 是否已成功提交
  const [submitError, setSubmitError] = useState<string | null>(null); // 提交失败的错误信息

  // ── 提前返回（Early Return）────────────────────────────────────────────────
  // 如果游戏正在进行或暂停，不显示任何遮罩
  // 返回 null 是 React 的惯用写法，表示"什么都不渲染"
  if (status === 'RUNNING' || status === 'PAUSED') return null;

  // ── 派生状态（Derived State）──────────────────────────────────────────────
  // 从已有状态计算出新的布尔值，避免存储冗余状态
  const isGameOver = status === 'GAME_OVER';
  // 新纪录条件：游戏结束 + 本局有得分 + 分数 >= 历史最高
  const isNewRecord = isGameOver && score > 0 && score >= highScore;

  // ── 事件处理函数 ──────────────────────────────────────────────────────────
  // 处理"提交分数"按钮点击
  const handleSubmit = async () => {
    if (!name.trim()) return; // 昵称为空时不提交（trim() 去掉首尾空格）

    setSubmitting(true);      // 开启"提交中"状态，按钮变为禁用
    setSubmitError(null);     // 清除上次的错误信息

    try {
      // await 等待异步操作完成（网络请求），期间 UI 不会卡住
      await onSubmitScore(name.trim());
      setSubmitted(true); // 提交成功，切换到"已上榜"提示
    } catch (err) {
      // 如果请求失败，显示错误信息
      // err instanceof Error 检查是否是标准 Error 对象
      setSubmitError(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      // finally 无论成功失败都会执行，用来关闭"提交中"状态
      setSubmitting(false);
    }
  };

  // 处理"再来一局"按钮点击
  const handleReset = () => {
    // 重置所有本地状态，以便下一局游戏结束后可以重新提交分数
    setName('');
    setSubmitted(false);
    setSubmitError(null);
    onReset(); // 调用父组件传入的重置回调
  };

  // ── JSX 返回值 ────────────────────────────────────────────────────────────
  // 条件渲染：根据 isGameOver 决定显示"游戏结束"内容还是"开始游戏"内容
  return (
    <div className="overlay">
      <div className="overlay-card">
        {/* 三元运算符：isGameOver ? 游戏结束界面 : 开始界面 */}
        {isGameOver ? (
          <>
            {/* React Fragment（<>...</>）：包裹多个元素但不产生额外 DOM 节点 */}
            <div className="overlay-icon">💀</div>
            <h2 className="overlay-title">游戏结束</h2>

            {/* 短路运算符 &&：isNewRecord 为 true 时才渲染后面的 JSX */}
            {isNewRecord && (
              <p className="overlay-badge">🏆 新纪录！</p>
            )}

            {/* 分数展示区 */}
            <div className="overlay-scores">
              <div className="overlay-score-row">
                <span>本局得分</span>
                <span className="overlay-score-val">{score}</span>
              </div>
              <div className="overlay-score-row">
                <span>历史最高</span>
                <span className="overlay-score-val overlay-score-best">{highScore}</span>
              </div>
            </div>

            {/* 上传分数区：未提交时显示表单，已提交时显示成功提示 */}
            {!submitted ? (
              <div className="submit-score">
                {/*
                  受控组件（Controlled Component）：
                  - value={name} 让 React 控制输入框显示的内容
                  - onChange={e => setName(e.target.value)} 在用户输入时同步更新 state
                  这样 name 始终和输入框内容保持一致
                */}
                <input
                  className="name-input"
                  type="text"
                  placeholder="输入昵称上传分数…"
                  maxLength={20}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  // 支持按 Enter 键提交
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  disabled={submitting} // 提交中时禁用输入框
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleSubmit}
                  // disabled：提交中，或昵称为空时禁用按钮
                  disabled={submitting || !name.trim()}
                >
                  {/* 根据 submitting 状态显示不同文案 */}
                  {submitting ? '提交中…' : '提交分数'}
                </button>
                {/* 错误信息：只有 submitError 不为 null 时才显示 */}
                {submitError && <p className="submit-error">{submitError}</p>}
              </div>
            ) : (
              <p className="submit-success">✅ 已上榜！</p>
            )}

            <button className="btn btn-primary btn-large" onClick={handleReset}>
              再来一局
            </button>
          </>
        ) : (
          /* status === 'IDLE'：游戏尚未开始，显示欢迎界面 */
          <>
            <div className="overlay-icon snake-icon">🐍</div>
            <h1 className="overlay-title overlay-title-main">贪吃蛇</h1>
            <p className="overlay-subtitle">吃掉食物，越长越厉害！</p>
            {/* 只有有历史记录时才显示最高分 */}
            {highScore > 0 && (
              <p className="overlay-record">历史最高：{highScore} 分</p>
            )}
            <button className="btn btn-primary btn-large" onClick={onStart}>
              开始游戏
            </button>
            <p className="overlay-hint">方向键 / WASD 控制 · 空格暂停</p>
          </>
        )}
      </div>
    </div>
  );
}
