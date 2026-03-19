import { useSnakeGame } from './hooks/useSnakeGame';
import { useLeaderboard } from './hooks/useLeaderboard';
import GameBoard from './components/GameBoard';
import ScoreBoard from './components/ScoreBoard';
import Controls from './components/Controls';
import GameOverlay from './components/GameOverlay';
import Leaderboard from './components/Leaderboard';
import './App.css';

export default function App() {
  const { gameState, config, start, togglePause, reset, changeDirection } = useSnakeGame();
  const { entries, loading, error, submitScore } = useLeaderboard();

  const handleSubmitScore = (name: string) => submitScore(name, gameState.score);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🐍 Snake Game</h1>
      </header>

      <main className="game-layout">
        {/* 左侧：游戏画板 */}
        <div className="board-wrapper">
          <GameBoard gameState={gameState} config={config} />
          <GameOverlay
            status={gameState.status}
            score={gameState.score}
            highScore={gameState.highScore}
            onStart={start}
            onReset={reset}
            onSubmitScore={handleSubmitScore}
          />
        </div>

        {/* 右侧：面板 */}
        <aside className="side-panel">
          <ScoreBoard gameState={gameState} />

          <Leaderboard entries={entries} loading={loading} error={error} />

          <div className="info-card">
            <h3>操作说明</h3>
            <ul className="tip-list">
              <li><kbd>↑↓←→</kbd> 或 <kbd>WASD</kbd> 移动</li>
              <li><kbd>Space</kbd> 开始 / 暂停</li>
              <li><kbd>Esc</kbd> 暂停</li>
            </ul>
          </div>

          <Controls
            status={gameState.status}
            onDirection={changeDirection}
            onStart={start}
            onTogglePause={togglePause}
            onReset={reset}
          />
        </aside>
      </main>
    </div>
  );
}
