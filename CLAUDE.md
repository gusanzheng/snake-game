# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend
npm run dev       # Start Vite dev server at http://localhost:5173 (with HMR)
npm run build     # Type-check (tsc -b) then bundle to dist/
npm run preview   # Serve the dist/ build locally
npm run lint      # ESLint across all files

# Backend
npm run server    # Start Express API server at http://localhost:3001 (dev)
npm run dev:all   # Start both Express server and Vite concurrently
npm start         # Production: NODE_ENV=production node server/index.js
```

> **Network note:** `npm install` requires a proxy. Run `proxy on` before installing packages, `proxy off` after.

No test runner is configured. Logic-heavy utilities in `src/utils/gameHelpers.ts` are pure functions suited for future Vitest setup.

## Backend Setup

The Express server (`server/index.js`) requires a `.env` file with MongoDB credentials:

```
MONGODB_HOST=
MONGODB_PORT=
MONGODB_USER=
MONGODB_PASS=
MONGODB_DB=
PORT=           # optional, defaults to 3001 (dev) or 3000 (prod)
```

In **dev**, the Vite frontend and Express backend run on separate ports — CORS is enabled on the server. In **production** (`npm start`), Express serves the `dist/` static build and acts as the single server.

## Architecture

All game state lives in one custom hook (`src/hooks/useSnakeGame.ts`) and flows down as props — no external state library is used.

```
useSnakeGame (hook)       useLeaderboard (hook)
  └── App (root, owns data)
        ├── GameBoard    ← Canvas renderer, purely reactive to props
        ├── GameOverlay  ← IDLE / GAME_OVER splash screen
        ├── ScoreBoard   ← score / highScore / level display
        ├── Controls     ← D-pad + action buttons, fires callbacks upward
        └── Leaderboard  ← online top-scores list (fetches /api/leaderboard)
```

**Data flow layers** (each layer only imports from layers below it):
1. `src/types/game.ts` — shared TypeScript types (`Position`, `Direction`, `GameStatus`, `GameState`, `GameConfig`, `LeaderboardEntry`)
2. `src/utils/gameHelpers.ts` — pure functions (no React): collision detection, direction math, speed/level calc
3. `src/hooks/useSnakeGame.ts` — all `useState`/`useRef`/`useEffect`/`useCallback` logic; exposes `{ gameState, config, start, togglePause, reset, changeDirection }`
4. `src/hooks/useLeaderboard.ts` — fetches/submits scores to `/api/leaderboard` (GET on mount, POST on submit); exposes `{ entries, loading, error, fetchLeaderboard, submitScore }`
5. `src/components/` — presentational components
6. `src/App.tsx` — wires everything together

**Key implementation details:**
- Rendering uses the **Canvas API** (not DOM nodes) — `GameBoard` draws every frame inside a `useEffect` that re-runs when `snake`, `food`, or `status` change.
- Direction is stored in `useRef` (not `useState`) to prevent `setInterval` from closing over a stale value.
- A `pendingDirectionRef` buffers mid-tick direction changes to prevent 180° reversals within a single frame.
- High score is persisted to `localStorage` under the key `snakeHighScore`.
- Game grid: 30×30 cells at 20 px each = 600×600 px canvas.
- Speed: starts at 200 ms/tick, decreases by 20 ms per level, minimum 100 ms. Level increments every 50 points.
- Keyboard: Arrow keys / WASD move; Space/Escape start or pause. Key events are suppressed when an `<input>` or `<textarea>` is focused.
- Leaderboard stores top-10 scores in MongoDB (`scores` collection, descending index on `score`). Name is trimmed and capped at 20 chars server-side.
