import { useState } from 'react';
import type { GameStatus } from '../types/game';

interface Props {
  status: GameStatus;
  score: number;
  highScore: number;
  onStart: () => void;
  onReset: () => void;
  onSubmitScore: (name: string) => Promise<void>;
}

export default function GameOverlay({ status, score, highScore, onStart, onReset, onSubmitScore }: Props) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (status === 'RUNNING' || status === 'PAUSED') return null;

  const isGameOver = status === 'GAME_OVER';
  const isNewRecord = isGameOver && score > 0 && score >= highScore;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitScore(name.trim());
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    // 重置提交状态，以便下一局使用
    setName('');
    setSubmitted(false);
    setSubmitError(null);
    onReset();
  };

  return (
    <div className="overlay">
      <div className="overlay-card">
        {isGameOver ? (
          <>
            <div className="overlay-icon">💀</div>
            <h2 className="overlay-title">游戏结束</h2>
            {isNewRecord && (
              <p className="overlay-badge">🏆 新纪录！</p>
            )}
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

            {/* 提交分数 */}
            {!submitted ? (
              <div className="submit-score">
                <input
                  className="name-input"
                  type="text"
                  placeholder="输入昵称上传分数…"
                  maxLength={20}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  disabled={submitting}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleSubmit}
                  disabled={submitting || !name.trim()}
                >
                  {submitting ? '提交中…' : '提交分数'}
                </button>
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
          <>
            <div className="overlay-icon snake-icon">🐍</div>
            <h1 className="overlay-title overlay-title-main">贪吃蛇</h1>
            <p className="overlay-subtitle">吃掉食物，越长越厉害！</p>
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
