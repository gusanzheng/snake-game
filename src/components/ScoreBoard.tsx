import type { GameState } from '../types/game';

interface Props {
  gameState: GameState;
}

export default function ScoreBoard({ gameState }: Props) {
  const { score, highScore, level } = gameState;

  return (
    <div className="scoreboard">
      <div className="score-item">
        <span className="score-label">得分</span>
        <span className="score-value score-current">{score}</span>
      </div>
      <div className="score-item">
        <span className="score-label">最高分</span>
        <span className="score-value score-best">{highScore}</span>
      </div>
      <div className="score-item">
        <span className="score-label">等级</span>
        <span className="score-value score-level">Lv.{level}</span>
      </div>
    </div>
  );
}
