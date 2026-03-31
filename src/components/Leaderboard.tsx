/**
 * Leaderboard.tsx — 在线排行榜组件
 *
 * 展示从服务器（MongoDB）获取的 Top 10 分数列表。
 * 这个组件本身不发起网络请求，数据由父组件（App.tsx）通过 useLeaderboard hook 获取后传入。
 *
 * 显示逻辑：
 *   - loading=true：显示"加载中…"
 *   - error 不为空：显示错误信息
 *   - entries 为空列表：显示"暂无记录"提示
 *   - entries 有数据：渲染排名列表，前三名用奖牌图标
 *
 * 核心概念：
 *   - 列表渲染（List Rendering）：用 .map() 把数组转成 JSX 元素
 *   - key 属性：React 用它识别列表中的每个元素，必须唯一且稳定
 *   - 多状态条件渲染：用 && 短路运算符逐一处理不同状态
 */

import type { LeaderboardEntry } from '../types/game';

// ── Props 类型定义 ────────────────────────────────────────────────────────────
interface Props {
  entries: LeaderboardEntry[]; // 排行榜数据数组（来自服务器）
  loading: boolean;            // 是否正在加载中
  error: string | null;        // 加载失败时的错误信息，无错误时为 null
}

// ── 常量 ──────────────────────────────────────────────────────────────────────
// 前三名的奖牌图标，用索引访问：MEDALS[0]='🥇', MEDALS[1]='🥈', MEDALS[2]='🥉'
const MEDALS = ['🥇', '🥈', '🥉'];

// ── 组件主体 ──────────────────────────────────────────────────────────────────
export default function Leaderboard({ entries, loading, error }: Props) {
  return (
    <div className="info-card leaderboard">
      <h3>🏆 在线排行榜</h3>

      {/* ── 加载状态 ────────────────────────────────────────────────────── */}
      {/* loading 为 true 时显示"加载中…"文字 */}
      {loading && <p className="lb-status">加载中…</p>}

      {/* ── 错误状态 ─────────────────────────────────────────────────────── */}
      {/* error 不为 null/undefined/'' 时显示错误信息 */}
      {error   && <p className="lb-status lb-error">{error}</p>}

      {/* ── 空列表状态 ────────────────────────────────────────────────────── */}
      {/* 加载完成、没有错误、但列表为空时，提示用户去上榜 */}
      {!loading && !error && entries.length === 0 && (
        <p className="lb-status">暂无记录，快来上榜！</p>
      )}

      {/* ── 列表渲染 ─────────────────────────────────────────────────────── */}
      {/* entries.length > 0 时才渲染列表 */}
      {entries.length > 0 && (
        // <ol> 有序列表（1,2,3...），但这里我们自己控制编号样式，所以视觉上不用默认序号
        <ol className="lb-list">
          {/*
            .map() 把数组的每个元素转换成 JSX 元素
            参数：(当前元素 entry, 当前索引 i)
            返回：一个 <li> 元素

            key 属性：
              - React 用 key 来高效地更新列表（diff 算法）
              - 必须在同一列表的兄弟元素中唯一
              - 这里用数据库的 _id 字段，保证唯一且稳定
              - 不要用 index（i）作为 key，因为列表顺序变化时会引起 bug
          */}
          {entries.map((entry, i) => (
            <li key={entry._id} className={`lb-row ${i < 3 ? 'lb-top' : ''}`}>
              {/* 前三名高亮，class 名为 lb-top */}

              {/* 名次列：前三名显示奖牌图标，其余显示数字 */}
              <span className="lb-rank">
                {i < 3 ? MEDALS[i] : `${i + 1}`}
                {/* i+1 是因为索引从 0 开始，显示时要从 1 开始 */}
              </span>

              {/* 玩家昵称（最多 20 个字符，服务器端已截断） */}
              <span className="lb-name">{entry.name}</span>

              {/* 得分 */}
              <span className="lb-score">{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
