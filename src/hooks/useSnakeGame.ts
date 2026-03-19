import { useState, useEffect, useCallback, useRef } from 'react';
import type { Direction, GameConfig, GameState, Position } from '../types/game';

const storedHighScore = (): number => Number(localStorage.getItem('snakeHighScore') ?? 0);
import {
  generateFood,
  getNextHead,
  isOutOfBounds,
  isHittingSelf,
  isOppositeDirection,
  calcLevel,
  calcSpeed,
} from '../utils/gameHelpers';

const CONFIG: GameConfig = {
  cols: 30,
  rows: 30,
  cellSize: 20,
  initialSpeed: 200,
};

const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9,  y: 10 },
  { x: 8,  y: 10 },
];

function getInitialState(): GameState {
  return {
    snake: INITIAL_SNAKE,
    food: generateFood(INITIAL_SNAKE, CONFIG),
    direction: 'RIGHT',
    status: 'IDLE',
    score: 0,
    level: 1,
    highScore: storedHighScore(),
  };
}

export function useSnakeGame() {
  const [state, setState] = useState<GameState>(getInitialState);

  // 用 ref 保存最新方向，避免 setInterval 闭包捕获旧值
  const directionRef = useRef<Direction>(state.direction);
  // 缓存下一帧要改变的方向（防止同一帧连按两键穿墙）
  const pendingDirectionRef = useRef<Direction | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** 清除计时器 */
  const clearGameLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  /** 单步移动逻辑 */
  const tick = useCallback(() => {
    setState(prev => {
      if (prev.status !== 'RUNNING') return prev;

      // 本帧应用缓存的方向
      if (pendingDirectionRef.current) {
        directionRef.current = pendingDirectionRef.current;
        pendingDirectionRef.current = null;
      }

      const newHead = getNextHead(prev.snake[0], directionRef.current);

      // 碰撞检测
      if (isOutOfBounds(newHead, CONFIG) || isHittingSelf(newHead, prev.snake)) {
        const newHigh = prev.score > prev.highScore ? prev.score : prev.highScore;
        if (newHigh > prev.highScore) localStorage.setItem('snakeHighScore', String(newHigh));
        return { ...prev, status: 'GAME_OVER', highScore: newHigh };
      }

      const ateFood = newHead.x === prev.food.x && newHead.y === prev.food.y;
      const newSnake = ateFood
        ? [newHead, ...prev.snake]
        : [newHead, ...prev.snake.slice(0, -1)];

      const newScore = ateFood ? prev.score + 10 : prev.score;
      const newLevel = calcLevel(newScore);
      const newFood = ateFood ? generateFood(newSnake, CONFIG) : prev.food;

      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        score: newScore,
        level: newLevel,
        direction: directionRef.current,
      };
    });
  }, []);

  /** 启动/重启游戏循环（每次速度变化时重建） */
  const startLoop = useCallback((speed: number) => {
    clearGameLoop();
    intervalRef.current = setInterval(tick, speed);
  }, [tick]);

  /** 等级变化时调整速度 */
  useEffect(() => {
    if (state.status === 'RUNNING') {
      startLoop(calcSpeed(state.level, CONFIG.initialSpeed));
    }
  }, [state.level, state.status, startLoop]);

  // 清理
  useEffect(() => () => clearGameLoop(), []);

  /** 公开：开始游戏 */
  const start = useCallback(() => {
    setState(prev => {
      if (prev.status !== 'IDLE') return prev;
      directionRef.current = 'RIGHT';
      return { ...prev, status: 'RUNNING' };
    });
    startLoop(calcSpeed(1, CONFIG.initialSpeed));
  }, [startLoop]);

  /** 公开：暂停 / 恢复 */
  const togglePause = useCallback(() => {
    setState(prev => {
      if (prev.status === 'RUNNING') {
        clearGameLoop();
        return { ...prev, status: 'PAUSED' };
      }
      if (prev.status === 'PAUSED') {
        startLoop(calcSpeed(prev.level, CONFIG.initialSpeed));
        return { ...prev, status: 'RUNNING' };
      }
      return prev;
    });
  }, [startLoop]);

  /** 公开：重置游戏 */
  const reset = useCallback(() => {
    clearGameLoop();
    directionRef.current = 'RIGHT';
    pendingDirectionRef.current = null;
    setState(getInitialState());
  }, []);

  /** 公开：改变方向（防止反向） */
  const changeDirection = useCallback((newDir: Direction) => {
    const current = pendingDirectionRef.current ?? directionRef.current;
    if (!isOppositeDirection(current, newDir)) {
      pendingDirectionRef.current = newDir;
    }
  }, []);

  /** 键盘监听 */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // 输入框获焦时不拦截按键，让用户正常输入昵称
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const map: Record<string, Direction> = {
        ArrowUp: 'UP', w: 'UP', W: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
      };
      if (map[e.key]) {
        e.preventDefault();
        changeDirection(map[e.key]);
      }
      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (state.status === 'IDLE') start();
        else togglePause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.status, changeDirection, start, togglePause]);

  return { gameState: state, config: CONFIG, start, togglePause, reset, changeDirection };
}
