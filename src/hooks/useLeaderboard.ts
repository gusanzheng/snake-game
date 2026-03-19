import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardEntry } from '../types/game';

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('请求失败');
      const data: LeaderboardEntry[] = await res.json();
      setEntries(data);
    } catch {
      setError('排行榜加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 页面加载时自动拉取
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const submitScore = useCallback(async (name: string, score: number) => {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? '提交失败');
    }
    // 提交成功后刷新排行榜
    await fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, loading, error, fetchLeaderboard, submitScore };
}
