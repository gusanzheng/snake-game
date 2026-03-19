import { useEffect, useRef } from 'react';
import type { GameState } from '../types/game';
import type { GameConfig } from '../types/game';

interface Props {
  gameState: GameState;
  config: GameConfig;
}

export default function GameBoard({ gameState, config }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { snake, food, status } = gameState;
  const { cols, rows, cellSize } = config;
  const width = cols * cellSize;
  const height = rows * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制网格背景
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, height);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(width, y * cellSize);
      ctx.stroke();
    }

    // 绘制食物（带光晕）
    const fx = food.x * cellSize + cellSize / 2;
    const fy = food.y * cellSize + cellSize / 2;
    const radius = cellSize / 2 - 2;

    const foodGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, cellSize);
    foodGlow.addColorStop(0, 'rgba(255, 80, 80, 0.5)');
    foodGlow.addColorStop(1, 'rgba(255, 80, 80, 0)');
    ctx.fillStyle = foodGlow;
    ctx.beginPath();
    ctx.arc(fx, fy, cellSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff5050';
    ctx.shadowColor = '#ff5050';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(fx, fy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 绘制蛇身
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      const padding = 1;
      const segRadius = index === 0 ? 6 : 4; // 蛇头圆角更大

      // 颜色渐变：头部亮绿 → 尾部深绿
      const ratio = index / (snake.length - 1 || 1);
      const r = Math.round(0   + ratio * 0);
      const g = Math.round(230 - ratio * 80);
      const b = Math.round(100 - ratio * 60);
      ctx.fillStyle = index === 0
        ? '#00ff88'
        : `rgb(${r}, ${g}, ${b})`;

      if (index === 0) {
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 16;
      }

      // 圆角矩形
      const rx = x + padding;
      const ry = y + padding;
      const rw = cellSize - padding * 2;
      const rh = cellSize - padding * 2;
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, segRadius);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 暂停遮罩
    if (status === 'PAUSED') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('已暂停', width / 2, height / 2);
    }
  }, [snake, food, status, cols, rows, cellSize, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="game-canvas"
    />
  );
}
