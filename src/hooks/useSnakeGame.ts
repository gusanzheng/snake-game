/**
 * useSnakeGame.ts — 游戏核心逻辑 Hook
 *
 * 这是整个游戏最重要的文件，所有的游戏状态和逻辑都在这里。
 *
 * 什么是 Custom Hook（自定义 Hook）？
 *   - 以 "use" 开头的函数，内部可以使用 React 的 useState/useEffect 等
 *   - 作用：把复杂逻辑从组件里抽离出来，组件只负责显示
 *   - 好处：逻辑复用、代码整洁、易于测试
 *
 * 这个 hook 对外暴露：
 *   { gameState, config, start, togglePause, reset, changeDirection }
 *
 * 内部使用了四个核心 React Hook：
 *   - useState：存储游戏状态（蛇、食物、分数等）
 *   - useRef：存储"不需要触发重渲染"的值（计时器 ID、当前方向）
 *   - useEffect：处理副作用（启动计时器、监听键盘）
 *   - useCallback：缓存函数引用，避免不必要的重新创建
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Direction, GameConfig, GameState, Position } from '../types/game';

// ── 辅助函数：从 localStorage 读取历史最高分 ──────────────────────────────────
// localStorage 是浏览器提供的持久化存储，关闭页面后数据不丢失
// getItem 返回字符串或 null，Number() 把它转成数字，?? 0 处理 null 的情况
const storedHighScore = (): number => Number(localStorage.getItem('snakeHighScore') ?? 0);

// 导入纯函数工具（这些函数不依赖 React，只做计算）
import {
  generateFood,          // 在随机位置生成食物（避开蛇身）
  getNextHead,           // 根据方向计算蛇头的下一个位置
  isOutOfBounds,         // 判断位置是否超出边界
  isHittingSelf,         // 判断蛇头是否撞到自己的身体
  isOppositeDirection,   // 判断两个方向是否相反（防止 180° 掉头）
  calcLevel,             // 根据分数计算当前等级
  calcSpeed,             // 根据等级计算游戏速度（毫秒/帧）
} from '../utils/gameHelpers';

// ── 游戏配置常量 ───────────────────────────────────────────────────────────────
// 写成常量而不是 state，因为这些值在运行时永远不会改变
const CONFIG: GameConfig = {
  cols: 30,          // 网格列数（横向格子数）
  rows: 30,          // 网格行数（纵向格子数）
  cellSize: 20,      // 每格的像素大小（20px × 20px）
  initialSpeed: 200, // 初始速度：每 200ms 移动一格
};

// ── 蛇的初始位置 ───────────────────────────────────────────────────────────────
// 初始为 3 节，头在 (10,10)，向右排列
// 数组第一个元素是蛇头，最后一个是蛇尾
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 }, // 蛇头
  { x: 9,  y: 10 }, // 身体第二节
  { x: 8,  y: 10 }, // 尾巴
];

// ── 初始游戏状态工厂函数 ────────────────────────────────────────────────────────
// 每次开始新游戏都调用这个函数生成干净的初始状态
// 写成函数（而不是对象常量）是因为 generateFood 需要在每次调用时随机生成
function getInitialState(): GameState {
  return {
    snake: INITIAL_SNAKE,
    food: generateFood(INITIAL_SNAKE, CONFIG), // 随机生成食物位置（避开蛇身）
    direction: 'RIGHT',   // 初始朝向：向右
    status: 'IDLE',       // 初始状态：待开始（还没点"开始游戏"）
    score: 0,
    level: 1,
    highScore: storedHighScore(), // 从 localStorage 读取，页面刷新后不丢失
  };
}

// ── Hook 主体 ─────────────────────────────────────────────────────────────────
export function useSnakeGame() {

  // useState：存储整个游戏状态对象
  // 传入函数 getInitialState（而不是调用结果）是性能优化：
  //   - 传函数：React 只在首次渲染时调用一次
  //   - 传值：每次渲染都重新计算（即使用不上）
  const [state, setState] = useState<GameState>(getInitialState);

  // ── useRef：存储"不需要触发重渲染"的值 ──────────────────────────────────────
  //
  // 为什么方向要用 ref 而不是 state？
  //   setInterval 的回调函数在创建时会"闭包"捕获当时的变量值。
  //   如果用 state，回调里拿到的永远是创建时的旧值，不会随 setState 更新。
  //   用 ref 则不同：ref.current 是一个对象引用，读取时永远是最新值。
  //
  // 简单比喻：
  //   state 像是给快递员一张纸条（值拷贝），之后改地址快递员不知道
  //   ref 像是给快递员一个门牌号（引用），门牌指向的地方随时可以换
  const directionRef = useRef<Direction>(state.direction);

  // pendingDirectionRef：缓存"下一帧要应用的方向"
  // 问题场景：玩家在一帧内快速按了 右→下，如果立即应用，第二次按键会被丢弃
  // 解决方案：把新方向先存在 pending 里，等下一帧 tick 时统一应用
  // 同时也防止在同一帧内 右→左（180°掉头穿过自己）
  const pendingDirectionRef = useRef<Direction | null>(null);

  // intervalRef：存储 setInterval 返回的计时器 ID，用于后续 clearInterval
  // ReturnType<typeof setInterval> 是 TypeScript 的工具类型，表示 setInterval 的返回值类型
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 清除游戏循环计时器 ─────────────────────────────────────────────────────
  const clearGameLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current); // 停止计时器
      intervalRef.current = null;         // 清空 ref，避免重复清除
    }
  };

  // ── tick：游戏的"一步"逻辑 ──────────────────────────────────────────────────
  // 这个函数每隔 N 毫秒被 setInterval 调用一次，代表蛇移动一格
  //
  // useCallback：缓存函数引用，只在依赖变化时重新创建
  //   - 好处：避免 tick 每次渲染都是新函数，导致 startLoop 也重新创建，形成循环
  //   - 依赖数组为 []：表示 tick 永远不需要重新创建（它所需的值都通过 ref 读取）
  const tick = useCallback(() => {
    // setState 的函数式更新：接收"上一个状态 prev"，返回"下一个状态"
    // 好处：读取 prev 保证拿到的是最新状态，而不是闭包里的旧值
    setState(prev => {
      // 如果游戏不在运行中，直接返回原状态（不做任何改变）
      if (prev.status !== 'RUNNING') return prev;

      // 应用缓存的方向：如果玩家在上一帧按了新方向键，现在生效
      if (pendingDirectionRef.current) {
        directionRef.current = pendingDirectionRef.current;
        pendingDirectionRef.current = null; // 清空缓存
      }

      // 计算蛇头的下一个位置（根据当前方向移动一格）
      const newHead = getNextHead(prev.snake[0], directionRef.current);

      // ── 碰撞检测 ──────────────────────────────────────────────────────────
      // 两种死亡条件：撞墙 或 撞到自己
      if (isOutOfBounds(newHead, CONFIG) || isHittingSelf(newHead, prev.snake)) {
        // 更新最高分（如果本局超过历史记录）
        const newHigh = prev.score > prev.highScore ? prev.score : prev.highScore;
        if (newHigh > prev.highScore) {
          // 持久化到 localStorage，页面刷新后仍然保留
          localStorage.setItem('snakeHighScore', String(newHigh));
        }
        // 返回游戏结束状态（不需要 clearInterval，useEffect 监听 status 会处理）
        return { ...prev, status: 'GAME_OVER', highScore: newHigh };
      }

      // ── 判断是否吃到食物 ────────────────────────────────────────────────────
      const ateFood = newHead.x === prev.food.x && newHead.y === prev.food.y;

      // 更新蛇身：
      //   吃到食物：头部加入新头，保留全部身体（蛇变长 1 节）[newHead, ...prev.snake]
      //   没吃到：头部加入新头，去掉最后一节尾巴（总长度不变）[newHead, ...prev.snake.slice(0, -1)]
      const newSnake = ateFood
        ? [newHead, ...prev.snake]
        : [newHead, ...prev.snake.slice(0, -1)];

      // 吃到食物加 10 分，否则分数不变
      const newScore = ateFood ? prev.score + 10 : prev.score;
      // 根据新分数重新计算等级（每 50 分升一级）
      const newLevel = calcLevel(newScore);
      // 吃到食物后在新位置生成食物，否则食物位置不变
      const newFood = ateFood ? generateFood(newSnake, CONFIG) : prev.food;

      // 展开运算符 {...prev}：复制原状态的所有字段，再覆盖变化的字段
      // React 要求不能直接修改 state，必须返回新对象
      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        score: newScore,
        level: newLevel,
        direction: directionRef.current,
      };
    });
  }, []); // 依赖为空：tick 内部通过 ref 读取最新值，不需要重新创建

  // ── 启动/重启游戏循环 ─────────────────────────────────────────────────────
  // 每次速度变化时，需要先停掉旧计时器，再用新速度启动新计时器
  const startLoop = useCallback((speed: number) => {
    clearGameLoop();                                    // 先停掉旧计时器
    intervalRef.current = setInterval(tick, speed);    // 以新速度启动
  }, [tick]);

  // ── 等级变化时自动调整速度 ─────────────────────────────────────────────────
  // 监听 state.level：每次等级升级，重新计算速度并重启计时器
  // calcSpeed(level, initialSpeed)：等级越高，返回的毫秒数越小（移动越快）
  useEffect(() => {
    if (state.status === 'RUNNING') {
      startLoop(calcSpeed(state.level, CONFIG.initialSpeed));
    }
    // 注意：这里不需要 return clearGameLoop，因为游戏结束由 status 的另一个 effect 处理
  }, [state.level, state.status, startLoop]);

  // ── 组件卸载时清理计时器 ───────────────────────────────────────────────────
  // useEffect 返回的函数是"清理函数"，在组件卸载时自动执行
  // 防止内存泄漏（组件已消失但计时器还在跑）
  useEffect(() => () => clearGameLoop(), []);

  // ── 公开方法：开始游戏 ─────────────────────────────────────────────────────
  const start = useCallback(() => {
    setState(prev => {
      // 只允许从 IDLE 状态开始（防止游戏中途再次调用 start）
      if (prev.status !== 'IDLE') return prev;
      directionRef.current = 'RIGHT'; // 重置方向为初始朝向
      return { ...prev, status: 'RUNNING' };
    });
    // 以第一级的速度启动游戏循环
    startLoop(calcSpeed(1, CONFIG.initialSpeed));
  }, [startLoop]);

  // ── 公开方法：暂停 / 继续 ─────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    setState(prev => {
      if (prev.status === 'RUNNING') {
        clearGameLoop();               // 停止计时器（蛇停止移动）
        return { ...prev, status: 'PAUSED' };
      }
      if (prev.status === 'PAUSED') {
        // 以当前等级的速度恢复计时器
        startLoop(calcSpeed(prev.level, CONFIG.initialSpeed));
        return { ...prev, status: 'RUNNING' };
      }
      return prev; // 其他状态（IDLE/GAME_OVER）不响应
    });
  }, [startLoop]);

  // ── 公开方法：重置游戏 ─────────────────────────────────────────────────────
  const reset = useCallback(() => {
    clearGameLoop();                          // 停止计时器
    directionRef.current = 'RIGHT';          // 重置方向
    pendingDirectionRef.current = null;      // 清空待处理方向
    setState(getInitialState());             // 恢复初始状态（注意这里调用函数，不是传函数）
  }, []);

  // ── 公开方法：改变方向 ─────────────────────────────────────────────────────
  // 由 Controls 组件（点击方向键）和键盘监听器调用
  const changeDirection = useCallback((newDir: Direction) => {
    // 读取最新的"当前方向"：优先用 pending（如果本帧已按过一次键），否则用 directionRef
    const current = pendingDirectionRef.current ?? directionRef.current;
    // 防止 180° 掉头（如正在向右，不能立刻向左）
    if (!isOppositeDirection(current, newDir)) {
      pendingDirectionRef.current = newDir; // 存入缓存，等下一帧 tick 时应用
    }
  }, []);

  // ── 键盘事件监听 ───────────────────────────────────────────────────────────
  // useEffect 在每次 state.status / changeDirection / start / togglePause 变化时
  // 先执行清理函数（移除旧监听器），再重新绑定新监听器
  // 这样可以保证监听器里用到的是最新的函数引用
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // 如果用户正在输入框里打字，不拦截按键（避免干扰昵称输入）
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // 方向键映射表：键盘按键名 → Direction 枚举
      // 同时支持方向键（ArrowUp 等）和 WASD 两套控制方案
      const map: Record<string, Direction> = {
        ArrowUp: 'UP',    w: 'UP',    W: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
      };

      if (map[e.key]) {
        e.preventDefault();              // 阻止方向键滚动页面的默认行为
        changeDirection(map[e.key]);
      }

      // 空格键 / Escape：开始 或 暂停/继续
      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (state.status === 'IDLE') start();
        else togglePause();
      }
    };

    // 在 window 上监听全局键盘事件
    window.addEventListener('keydown', handleKey);

    // 返回清理函数：在下次 effect 执行前（或组件卸载时）移除旧监听器
    // 如果不清理，每次 re-render 都会叠加一个新监听器，导致事件触发多次
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.status, changeDirection, start, togglePause]);

  // ── 返回值 ────────────────────────────────────────────────────────────────
  // 只暴露组件需要的数据和方法，内部实现细节（ref、计时器等）不暴露
  return { gameState: state, config: CONFIG, start, togglePause, reset, changeDirection };
}
