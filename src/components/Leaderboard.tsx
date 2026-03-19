import type { LeaderboardEntry } from '../types/game';

interface Props {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ entries, loading, error }: Props) {
  return (
    <div className="info-card leaderboard">
      <h3>🏆 在线排行榜</h3>

      {loading && <p className="lb-status">加载中…</p>}
      {error   && <p className="lb-status lb-error">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="lb-status">暂无记录，快来上榜！</p>
      )}

      {entries.length > 0 && (
        <ol className="lb-list">
          {entries.map((entry, i) => (
            <li key={entry._id} className={`lb-row ${i < 3 ? 'lb-top' : ''}`}>
              <span className="lb-rank">
                {i < 3 ? MEDALS[i] : `${i + 1}`}
              </span>
              <span className="lb-name">{entry.name}</span>
              <span className="lb-score">{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
