
import React, { useState, useEffect, useCallback } from 'react';

// Nokia 3310 Palette
// Screen: #99b998
// Pixels: #1f291f
const GRID_SIZE = 20;
const SPEED = 120;

type Point = { x: number, y: number };

export const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [dir, setDir] = useState<Point>({ x: 0, y: -1 }); // Moving Up
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('snake_highscore') || '0'));
  const [isPaused, setIsPaused] = useState(false);

  const generateFood = useCallback((): Point => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDir({ x: 0, y: -1 });
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    const newHead = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Walls (Death)
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      setGameOver(true);
      return;
    }

    // Self Collision
    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      setGameOver(true);
      return;
    }

    const newSnake = [newHead, ...snake];

    // Eat Food
    if (newHead.x === food.x && newHead.y === food.y) {
      setScore(s => {
        const newScore = s + 1;
        if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snake_highscore', newScore.toString());
        }
        return newScore;
      });
      setFood(generateFood());
    } else {
      newSnake.pop(); // Remove tail
    }

    setSnake(newSnake);
  }, [snake, dir, food, gameOver, isPaused, generateFood, highScore]);

  useEffect(() => {
    const interval = setInterval(moveSnake, SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (dir.y === 0) setDir({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (dir.y === 0) setDir({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (dir.x === 0) setDir({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (dir.x === 0) setDir({ x: 1, y: 0 }); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dir]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-100 dark:bg-slate-900 animate-fade-in p-8 overflow-y-auto">
      <div className="bg-[#333] p-8 rounded-[40px] shadow-2xl border-4 border-[#555] relative max-w-xs w-full">
        {/* Screen Container */}
        <div className="bg-[#88a887] p-2 rounded-md mb-6 shadow-inner border-2 border-[#666]">
            {/* The Actual LCD */}
            <div 
                className="w-full aspect-square bg-[#99b998] relative grid cursor-none"
                style={{ 
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
                }}
            >
                {/* Grid Rendering */}
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                    const x = i % GRID_SIZE;
                    const y = Math.floor(i / GRID_SIZE);
                    const isSnake = snake.some(s => s.x === x && s.y === y);
                    const isFood = food.x === x && food.y === y;
                    
                    // Simple checkered effect for pixel grid
                    return (
                        <div 
                            key={i} 
                            className={`${isSnake ? 'bg-[#1f291f]' : isFood ? 'bg-[#1f291f] rounded-full scale-90' : 'transparent'} border-[0.5px] border-[#8ea88e]`}
                        />
                    );
                })}

                {/* Overlay UI */}
                {(gameOver || isPaused) && (
                    <div className="absolute inset-0 bg-[#99b998]/90 flex flex-col items-center justify-center text-[#1f291f] font-mono font-bold z-10">
                        {gameOver ? (
                            <>
                                <div className="text-xl mb-1">GAME OVER</div>
                                <div className="text-sm mb-4">SCORE: {score}</div>
                                <button onClick={resetGame} className="border-2 border-[#1f291f] px-3 py-1 hover:bg-[#1f291f] hover:text-[#99b998] transition-colors text-sm">RETRY</button>
                            </>
                        ) : (
                            <div className="text-xl animate-pulse">PAUSED</div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Brand */}
        <div className="text-center mb-6">
             <div className="text-gray-400 font-bold tracking-widest text-lg font-serif">NOKIA</div>
        </div>

        {/* Buttons / Keypad Mock */}
        <div className="grid grid-cols-3 gap-2 px-2">
             <div className="col-span-1 flex items-center justify-center"><div className="h-1.5 w-10 bg-blue-400/80 rounded-full"></div></div>
             <button onClick={() => setDir({x:0, y:-1})} className="h-12 w-full bg-slate-200 rounded-lg flex items-center justify-center shadow-[0_4px_0_rgb(156,163,175)] active:shadow-none active:translate-y-1 active:bg-slate-300 transition-all border border-slate-300">
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
             </button>
             <div className="col-span-1 flex items-center justify-center"><div className="h-1.5 w-10 bg-blue-400/80 rounded-full"></div></div>

             <button onClick={() => setDir({x:-1, y:0})} className="h-12 w-full bg-slate-200 rounded-lg flex items-center justify-center shadow-[0_4px_0_rgb(156,163,175)] active:shadow-none active:translate-y-1 active:bg-slate-300 transition-all border border-slate-300">
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
             </button>
             <button onClick={() => isPaused || gameOver ? resetGame() : setIsPaused(!isPaused)} className="h-12 w-full bg-slate-300 rounded-lg flex items-center justify-center shadow-[0_4px_0_rgb(156,163,175)] active:shadow-none active:translate-y-1 active:bg-slate-400 transition-all border border-slate-400 font-bold text-xs text-slate-800">
                MENU
             </button>
             <button onClick={() => setDir({x:1, y:0})} className="h-12 w-full bg-slate-200 rounded-lg flex items-center justify-center shadow-[0_4px_0_rgb(156,163,175)] active:shadow-none active:translate-y-1 active:bg-slate-300 transition-all border border-slate-300">
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
             </button>

             <div className="col-span-1"></div>
             <button onClick={() => setDir({x:0, y:1})} className="h-12 w-full bg-slate-200 rounded-lg flex items-center justify-center shadow-[0_4px_0_rgb(156,163,175)] active:shadow-none active:translate-y-1 active:bg-slate-300 transition-all border border-slate-300">
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
             </button>
             <div className="col-span-1"></div>
        </div>
      </div>
      <div className="mt-8 text-slate-500 font-mono text-sm text-center">
         <p>SCORE: <span className="text-slate-800 dark:text-white font-bold">{score}</span></p>
         <p className="text-xs opacity-70">HIGH SCORE: {highScore}</p>
         <p className="text-[10px] mt-2 text-slate-400">Controls: Arrow Keys or On-Screen Buttons</p>
      </div>
    </div>
  );
};
