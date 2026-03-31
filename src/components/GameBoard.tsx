/**
 * GameBoard.tsx — 游戏画布组件
 *
 * 这是整个游戏的"屏幕"，负责把蛇、食物、网格全部画出来。
 * 它是一个"纯展示"组件：自己不持有任何游戏逻辑，只接收数据并绘制。
 *
 * 核心技术：Canvas API
 * - 浏览器原生的 2D 绘图接口，可以画线、矩形、圆形、渐变等
 * - 比用 <div> 摆位置更灵活，性能也更好，适合高频刷新的游戏场景
 */

import { useEffect, useRef } from 'react';
import type { GameState } from '../types/game';
import type { GameConfig } from '../types/game';

// ── Props 类型定义 ────────────────────────────────────────────────────────────
// Props 是父组件传进来的数据，相当于函数的参数。
// 这里只需要两个：完整的游戏状态 + 配置（格子数、像素大小）
interface Props {
  gameState: GameState;
  config: GameConfig;
}

// ── 组件主体 ──────────────────────────────────────────────────────────────────
// 解构赋值：直接从 Props 对象中拿出 gameState 和 config，避免写 props.gameState
export default function GameBoard({ gameState, config }: Props) {
  // useRef：创建一个"引用"，用来直接访问真实的 DOM 元素（<canvas>）
  // React 通常不建议直接操作 DOM，但 Canvas 绘图必须这样做
  // canvasRef.current 就是那个 <canvas> 元素本身
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 从 gameState 中解构出当前需要的字段
  const { snake, food, status } = gameState;
  // 从 config 中解构出网格列数、行数、每格像素大小
  const { cols, rows, cellSize } = config;

  // 计算画布的总像素宽高（例如 30列 × 20px = 600px）
  const width = cols * cellSize;
  const height = rows * cellSize;

  // useEffect：副作用钩子，用来在"渲染完成后"执行代码
  // 参数一：要执行的函数（这里是绘制整个画面）
  // 参数二：依赖数组——数组中任意一个值发生变化，就重新执行
  //   这里依赖 snake/food/status，意味着每次蛇移动或吃到食物都会重绘
  useEffect(() => {
    // 通过 ref 拿到真实的 <canvas> DOM 元素
    const canvas = canvasRef.current;
    if (!canvas) return; // 防御性检查：如果元素还没挂载就直接退出

    // 获取 2D 绘图上下文（ctx），所有绘图操作都通过它完成
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── 第一步：清空上一帧的内容 ──────────────────────────────────────────
    // 每次重绘前必须先清空，否则新旧内容会叠加在一起
    ctx.clearRect(0, 0, width, height);

    // ── 第二步：绘制网格背景 ───────────────────────────────────────────────
    // 用极淡的白色线条画出格子，让玩家能感知到游戏区域的网格结构
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; // 线条颜色（白色，透明度3%）
    ctx.lineWidth = 0.5;                          // 线条宽度（细线）

    // 画竖线：从 x=0 到 x=cols，每格一条
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();              // 开始一条新路径（每条线都要重新开始）
      ctx.moveTo(x * cellSize, 0);  // 线的起点（顶部）
      ctx.lineTo(x * cellSize, height); // 线的终点（底部）
      ctx.stroke();                 // 实际画出来
    }
    // 画横线：从 y=0 到 y=rows，每格一条
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(width, y * cellSize);
      ctx.stroke();
    }

    // ── 第三步：绘制食物（带发光光晕效果）─────────────────────────────────
    // food.x / food.y 是格子坐标（0~29），需要乘以 cellSize 转成像素坐标
    // 再加 cellSize/2 是为了取格子中心点
    const fx = food.x * cellSize + cellSize / 2; // 食物中心的像素 X 坐标
    const fy = food.y * cellSize + cellSize / 2; // 食物中心的像素 Y 坐标
    const radius = cellSize / 2 - 2;             // 食物圆形的半径（比格子略小）

    // createRadialGradient：创建径向渐变（从中心向外扩散的颜色过渡）
    // 参数：(内圆圆心x, 内圆圆心y, 内圆半径, 外圆圆心x, 外圆圆心y, 外圆半径)
    const foodGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, cellSize);
    foodGlow.addColorStop(0, 'rgba(255, 80, 80, 0.5)'); // 中心：半透明红色
    foodGlow.addColorStop(1, 'rgba(255, 80, 80, 0)');   // 边缘：完全透明
    ctx.fillStyle = foodGlow;
    ctx.beginPath();
    ctx.arc(fx, fy, cellSize, 0, Math.PI * 2); // 画一个大圆作为光晕范围
    ctx.fill();

    // 再画食物本体（实心红色圆形 + 阴影发光）
    ctx.fillStyle = '#ff5050';
    ctx.shadowColor = '#ff5050'; // 阴影颜色（和填充色一样，产生发光感）
    ctx.shadowBlur = 12;          // 阴影模糊程度（越大越发散）
    ctx.beginPath();
    ctx.arc(fx, fy, radius, 0, Math.PI * 2); // 画食物本体圆形
    ctx.fill();
    ctx.shadowBlur = 0; // 重置阴影，避免影响后续绘制

    // ── 第四步：绘制蛇身 ───────────────────────────────────────────────────
    // snake 是一个数组，每个元素是 { x, y } 格子坐标
    // index=0 是蛇头，最后一个是蛇尾
    snake.forEach((segment, index) => {
      // 把格子坐标转成像素坐标（左上角）
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      const padding = 1;                          // 每节身体和格子边缘的间距
      const segRadius = index === 0 ? 6 : 4;      // 蛇头圆角更大，更显眼

      // 颜色渐变：蛇头亮绿色 → 蛇尾深绿色
      // ratio 从 0（头部）到 1（尾部）线性变化
      const ratio = index / (snake.length - 1 || 1); // 避免除以 0（蛇只有1节时）
      const r = Math.round(0   + ratio * 0);    // R 通道：始终为 0
      const g = Math.round(230 - ratio * 80);   // G 通道：230（头）→ 150（尾）
      const b = Math.round(100 - ratio * 60);   // B 通道：100（头）→  40（尾）

      // 蛇头用固定亮绿色，其余节点用渐变色
      ctx.fillStyle = index === 0
        ? '#00ff88'
        : `rgb(${r}, ${g}, ${b})`;

      // 蛇头加发光效果，让它更突出
      if (index === 0) {
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 16;
      }

      // 用圆角矩形绘制每一节蛇身
      // roundRect 参数：(x, y, 宽, 高, 圆角半径)
      const rx = x + padding;
      const ry = y + padding;
      const rw = cellSize - padding * 2; // 宽度减去两侧 padding
      const rh = cellSize - padding * 2; // 高度减去上下 padding
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, segRadius);
      ctx.fill();
      ctx.shadowBlur = 0; // 每节绘制完后重置阴影
    });

    // ── 第五步：暂停遮罩 ───────────────────────────────────────────────────
    // 如果游戏处于暂停状态，在画布上叠加一层半透明黑色 + 文字提示
    if (status === 'PAUSED') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; // 半透明黑色遮罩
      ctx.fillRect(0, 0, width, height);  // 铺满整个画布

      // 在画布中央写上"已暂停"文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textAlign = 'center';     // 水平居中对齐
      ctx.textBaseline = 'middle';  // 垂直居中对齐
      ctx.fillText('已暂停', width / 2, height / 2);
    }

  // 依赖数组：以下任一值变化都会触发重绘
  // snake/food 变化 → 蛇移动或吃食物
  // status 变化 → 暂停/继续
  // 其余是配置值，基本不变，但作为好的实践也加进来
  }, [snake, food, status, cols, rows, cellSize, width, height]);

  // ── JSX 返回值 ────────────────────────────────────────────────────────────
  // 只渲染一个 <canvas> 元素，ref 绑定让我们能在 useEffect 里操作它
  // width/height 是 HTML 属性，设定了画布的实际像素分辨率
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="game-canvas"
    />
  );
}
