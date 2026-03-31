/**
 * gameHelpers.ts — 游戏纯函数工具库
 *
 * "纯函数"的含义：
 *   - 相同的输入，永远返回相同的输出
 *   - 不读写任何外部变量，不操作 DOM，不调用 React API
 *   - 唯一的例外：generateFood 使用了 Math.random()（随机性是刻意的）
 *
 * 为什么要把这些逻辑单独抽出来？
 *   1. 职责分离：hook 只负责"状态流转"，计算逻辑放这里
 *   2. 易于测试：纯函数不需要 React 环境，直接传参验证输出即可
 *   3. 易于阅读：每个函数只做一件事，命名即文档
 */

import type { Position, Direction, GameConfig } from '../types/game';

// ── generateFood ─────────────────────────────────────────────────────────────
/**
 * 随机生成食物位置，保证不与蛇身任何一节重叠。
 *
 * 算法：do-while 循环（先生成，再检查）
 *   1. 随机生成一个格子坐标
 *   2. 检查这个坐标是否和蛇身的任意一节重合
 *   3. 如果重合，重新随机；否则返回该坐标
 *
 * @param snake  当前蛇身数组（Position[]），用于避开
 * @param config 游戏配置，提供网格的列数和行数（确定随机范围）
 */
export function generateFood(snake: Position[], config: GameConfig): Position {
  let pos: Position;
  do {
    pos = {
      // Math.random() 返回 [0, 1) 的小数
      // 乘以列数/行数后取整，得到 [0, cols-1] 范围内的随机整数
      x: Math.floor(Math.random() * config.cols),
      y: Math.floor(Math.random() * config.rows),
    };
  // Array.some()：只要有一节蛇身与 pos 坐标相同，就返回 true，继续循环
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

// ── getNextHead ───────────────────────────────────────────────────────────────
/**
 * 根据当前方向，计算蛇头移动一格后的新位置。
 *
 * 坐标系说明：
 *   - 原点 (0,0) 在左上角
 *   - x 向右增大，y 向下增大（和数学坐标系的 y 轴方向相反）
 *   - 所以 UP 是 y-1，DOWN 是 y+1
 *
 * @param head      当前蛇头坐标
 * @param direction 当前移动方向
 */
export function getNextHead(head: Position, direction: Direction): Position {
  // 用对象映射代替 if-else 或 switch，更简洁
  // Record<Direction, Position> 表示"以 Direction 的每个值为 key，Position 为 value 的对象"
  const moves: Record<Direction, Position> = {
    UP:    { x: head.x,     y: head.y - 1 }, // 向上：y 减 1
    DOWN:  { x: head.x,     y: head.y + 1 }, // 向下：y 加 1
    LEFT:  { x: head.x - 1, y: head.y     }, // 向左：x 减 1
    RIGHT: { x: head.x + 1, y: head.y     }, // 向右：x 加 1
  };
  return moves[direction];
}

// ── isOutOfBounds ─────────────────────────────────────────────────────────────
/**
 * 检测某个位置是否超出网格边界（撞墙判断）。
 *
 * 有效范围：x ∈ [0, cols-1]，y ∈ [0, rows-1]
 * 任意一个坐标超出范围即为越界。
 *
 * @param pos    要检测的坐标
 * @param config 游戏配置，提供边界值
 */
export function isOutOfBounds(pos: Position, config: GameConfig): boolean {
  return (
    pos.x < 0 ||              // 超出左边界
    pos.x >= config.cols ||   // 超出右边界（cols=30，合法范围是 0~29）
    pos.y < 0 ||              // 超出上边界
    pos.y >= config.rows      // 超出下边界
  );
}

// ── isHittingSelf ─────────────────────────────────────────────────────────────
/**
 * 检测蛇头是否撞到自己的身体（自撞判断）。
 *
 * 注意：用 slice(1) 跳过索引 0（蛇头自身）。
 * 否则每次移动都会误判为"蛇头撞到自己"。
 *
 * @param head  新的蛇头坐标（即将移动到的位置）
 * @param snake 当前完整蛇身数组（包含旧蛇头）
 */
export function isHittingSelf(head: Position, snake: Position[]): boolean {
  // slice(1)：从索引 1 开始截取，跳过 snake[0]（旧蛇头位置）
  // some()：遍历身体的每一节，只要有一节和新蛇头重合就返回 true
  return snake.slice(1).some(s => s.x === head.x && s.y === head.y);
}

// ── isOppositeDirection ───────────────────────────────────────────────────────
/**
 * 判断两个方向是否互为相反方向。
 *
 * 用途：防止玩家让蛇 180° 掉头穿过自身身体。
 * 例如：正在向右移动时，按下左方向键，这个输入应该被忽略。
 *
 * 相反方向对：UP ↔ DOWN，LEFT ↔ RIGHT
 *
 * @param a 当前方向（或待处理的方向）
 * @param b 玩家新输入的方向
 * @returns  true = 两个方向相反（应忽略新输入）
 */
export function isOppositeDirection(a: Direction, b: Direction): boolean {
  return (
    (a === 'UP'    && b === 'DOWN')  ||
    (a === 'DOWN'  && b === 'UP')    ||
    (a === 'LEFT'  && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  );
}

// ── calcLevel ─────────────────────────────────────────────────────────────────
/**
 * 根据当前分数计算游戏等级。
 *
 * 规则：每 50 分升一级，从 Lv.1 开始。
 *   score=0~49  → Lv.1
 *   score=50~99 → Lv.2
 *   score=100~  → Lv.3
 *   ...
 *
 * Math.floor(score / 50) + 1 的推导：
 *   score=0:  floor(0/50)+1  = 0+1 = 1
 *   score=49: floor(49/50)+1 = 0+1 = 1
 *   score=50: floor(50/50)+1 = 1+1 = 2
 *
 * @param score 当前得分
 */
export function calcLevel(score: number): number {
  return Math.floor(score / 50) + 1;
}

// ── calcSpeed ─────────────────────────────────────────────────────────────────
/**
 * 根据等级计算蛇的移动间隔（单位：毫秒）。
 *
 * 规则：每升一级减少 20ms，但最快不低于 100ms。
 *   Lv.1: 200ms（initialSpeed）
 *   Lv.2: 180ms
 *   Lv.3: 160ms
 *   ...
 *   Lv.6: 100ms（触底，不再加速）
 *
 * 公式：max(100, initialSpeed - (level-1) × 20)
 *   (level-1) 是因为 Lv.1 不减速，从 Lv.2 开始每级减 20ms
 *
 * Math.max(100, ...)：设置下限，防止速度无限加快导致游戏无法操作
 *
 * @param level        当前等级
 * @param initialSpeed 初始速度（ms），来自 GameConfig
 */
export function calcSpeed(level: number, initialSpeed: number): number {
  return Math.max(100, initialSpeed - (level - 1) * 20);
}
