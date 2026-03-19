// 坐标位置
export interface Position {
  x: number;
  y: number;
}

// 移动方向
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// 游戏状态
export type GameStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'GAME_OVER';

// 游戏配置
export interface GameConfig {
  cols: number;       // 网格列数
  rows: number;       // 网格行数
  cellSize: number;   // 每格像素大小
  initialSpeed: number; // 初始移动间隔 (ms)
}

// 排行榜条目
export interface LeaderboardEntry {
  _id: string;
  name: string;
  score: number;
  createdAt: string;
}

// 游戏状态快照（传给组件的数据）
export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  status: GameStatus;
  score: number;
  highScore: number;
  level: number;
}
