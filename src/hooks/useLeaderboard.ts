/**
 * useLeaderboard.ts — 排行榜数据 Hook
 *
 * 负责所有和排行榜后端 API 的通信：
 *   - 页面加载时自动拉取排行榜数据（GET /api/leaderboard）
 *   - 游戏结束后提交分数（POST /api/leaderboard）
 *   - 提交成功后自动刷新榜单
 *
 * 对外暴露：
 *   { entries, loading, error, fetchLeaderboard, submitScore }
 *
 * 核心技术：
 *   - fetch API：浏览器原生的网络请求工具
 *   - async/await：以同步风格编写异步代码，比 .then().catch() 更易读
 *   - useCallback：缓存函数引用，防止 useEffect 依赖数组引发无限循环
 */

import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardEntry } from '../types/game';

export function useLeaderboard() {
  // ── 状态定义 ────────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]); // 榜单数据
  const [loading, setLoading] = useState(false);                   // 是否加载中
  const [error, setError] = useState<string | null>(null);         // 错误信息

  // ── 拉取排行榜 ──────────────────────────────────────────────────────────────
  // useCallback 缓存这个函数，使它的引用在组件重渲染时保持稳定
  // 如果不用 useCallback，每次渲染都会产生新的函数引用
  // 而 useEffect 里把它放在依赖数组中，就会导致：
  //   渲染 → effect 执行 → fetch → setState → 重渲染 → 新函数 → effect 重执行 → 无限循环
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);    // 开启加载状态（UI 显示"加载中…"）
    setError(null);      // 清除上次的错误

    try {
      // fetch：向服务器发送 GET 请求（默认就是 GET）
      // await 等待服务器响应，期间不会阻塞其他代码运行
      const res = await fetch('/api/leaderboard');

      // res.ok 为 false 表示 HTTP 状态码不是 2xx（如 404、500）
      if (!res.ok) throw new Error('请求失败');

      // res.json()：把响应体从 JSON 字符串解析成 JavaScript 对象/数组
      // await 等待解析完成（parsing 也是异步的）
      const data: LeaderboardEntry[] = await res.json();
      setEntries(data); // 更新榜单数据，触发组件重渲染
    } catch {
      // 网络错误或 throw new Error 都会跳到这里
      // 这里不显示技术性错误信息，统一显示用户友好的提示
      setError('排行榜加载失败');
    } finally {
      // 无论成功或失败，都关闭加载状态
      setLoading(false);
    }
  }, []); // 依赖数组为空：这个函数不依赖任何外部变量，只需创建一次

  // ── 页面加载时自动拉取一次 ──────────────────────────────────────────────────
  // 依赖数组包含 fetchLeaderboard：当函数引用变化时重新执行
  // 由于 fetchLeaderboard 用了 useCallback([], [])，它的引用永远不变
  // 所以实际上这个 effect 只会在组件首次挂载时执行一次
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // ── 提交分数 ────────────────────────────────────────────────────────────────
  const submitScore = useCallback(async (name: string, score: number) => {
    // 发送 POST 请求，把玩家名字和分数以 JSON 格式发给服务器
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // 告诉服务器请求体是 JSON 格式
      },
      body: JSON.stringify({ name, score }), // 把对象序列化为 JSON 字符串
    });

    // 提交失败时抛出错误（由调用方 GameOverlay 的 handleSubmit 捕获）
    if (!res.ok) {
      const body = await res.json();
      // ?? 操作符：body.error 为 null/undefined 时，使用右边的默认值
      throw new Error(body.error ?? '提交失败');
    }

    // 提交成功后重新拉取榜单，这样榜单会立即更新显示新上传的分数
    await fetchLeaderboard();
  }, [fetchLeaderboard]); // 依赖 fetchLeaderboard，引用不变所以实际只创建一次

  // ── 返回值 ────────────────────────────────────────────────────────────────
  // 把数据和方法都暴露出去，让 App.tsx 分发给需要的组件
  return { entries, loading, error, fetchLeaderboard, submitScore };
}
