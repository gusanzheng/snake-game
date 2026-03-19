import type { Position, Direction, GameConfig } from '../types/game';

/** 随机生成食物位置，确保不与蛇身重叠 */
export function generateFood(snake: Position[], config: GameConfig): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * config.cols),
      y: Math.floor(Math.random() * config.rows),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

/** 根据方向计算新蛇头位置 */
export function getNextHead(head: Position, direction: Direction): Position {
  const moves: Record<Direction, Position> = {
    UP:    { x: head.x,     y: head.y - 1 },
    DOWN:  { x: head.x,     y: head.y + 1 },
    LEFT:  { x: head.x - 1, y: head.y     },
    RIGHT: { x: head.x + 1, y: head.y     },
  };
  return moves[direction];
}

/** 检测是否撞墙 */
export function isOutOfBounds(pos: Position, config: GameConfig): boolean {
  return pos.x < 0 || pos.x >= config.cols || pos.y < 0 || pos.y >= config.rows;
}

/** 检测是否撞到自身（跳过索引0，即蛇头本身） */
export function isHittingSelf(head: Position, snake: Position[]): boolean {
  return snake.slice(1).some(s => s.x === head.x && s.y === head.y);
}

/** 判断两个方向是否相反（防止180°掉头） */
export function isOppositeDirection(a: Direction, b: Direction): boolean {
  return (
    (a === 'UP'    && b === 'DOWN')  ||
    (a === 'DOWN'  && b === 'UP')    ||
    (a === 'LEFT'  && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  );
}

/** 根据分数计算当前等级 */
export function calcLevel(score: number): number {
  return Math.floor(score / 50) + 1;
}

/** 根据等级计算移动间隔（越高越快，最低100ms） */
export function calcSpeed(level: number, initialSpeed: number): number {
  return Math.max(100, initialSpeed - (level - 1) * 20);
}
