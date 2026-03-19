import type { Direction, GameStatus } from '../types/game';

interface Props {
  status: GameStatus;
  onDirection: (d: Direction) => void;
  onStart: () => void;
  onTogglePause: () => void;
  onReset: () => void;
}

export default function Controls({
  status,
  onDirection,
  onStart,
  onTogglePause,
  onReset,
}: Props) {
  return (
    <div className="controls">
      {/* 动作按钮 */}
      <div className="action-buttons">
        {status === 'IDLE' && (
          <button className="btn btn-primary" onClick={onStart}>
            开始游戏
          </button>
        )}
        {(status === 'RUNNING' || status === 'PAUSED') && (
          <button className="btn btn-secondary" onClick={onTogglePause}>
            {status === 'RUNNING' ? '暂停' : '继续'}
          </button>
        )}
        {status !== 'IDLE' && (
          <button className="btn btn-ghost" onClick={onReset}>
            重置
          </button>
        )}
      </div>

      {/* 方向键 */}
      <div className="dpad">
        <div className="dpad-row">
          <button
            className="dpad-btn"
            onClick={() => onDirection('UP')}
            aria-label="上"
          >
            ▲
          </button>
        </div>
        <div className="dpad-row">
          <button
            className="dpad-btn"
            onClick={() => onDirection('LEFT')}
            aria-label="左"
          >
            ◀
          </button>
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
