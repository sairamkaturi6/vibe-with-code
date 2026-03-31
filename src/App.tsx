/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

// --- Types & Constants ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 120;

const TRACKS = [
  { id: 1, title: 'Neon Drive (AI Gen)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Cyber City (AI Gen)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Digital Horizon (AI Gen)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

// --- Helper Functions ---
const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // Ensure food doesn't spawn on the snake
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  const toggleMute = () => setIsMuted(!isMuted);

  const handleTrackEnded = () => {
    nextTrack();
  };

  // --- Snake Game Logic ---
  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameRunning(true);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isGameRunning) return;
    
    // Prevent default scrolling for arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    setDirection(prev => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          return prev !== 'DOWN' ? 'UP' : prev;
        case 'ArrowDown':
        case 's':
        case 'S':
          return prev !== 'UP' ? 'DOWN' : prev;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          return prev !== 'RIGHT' ? 'LEFT' : prev;
        case 'ArrowRight':
        case 'd':
        case 'D':
          return prev !== 'LEFT' ? 'RIGHT' : prev;
        default:
          return prev;
      }
    });
  }, [isGameRunning]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { ...head };

        switch (direction) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        // Check collision with walls
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        // Check collision with self
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check collision with food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
          // Don't pop the tail, so it grows
        } else {
          newSnake.pop(); // Remove tail
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [isGameRunning, gameOver, direction, food]);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col items-center justify-between overflow-hidden selection:bg-pink-500/30">
      {/* Background Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            <Volume2 size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
            SYNTH<span className="text-white">SNAKE</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400 uppercase tracking-widest">Score</span>
            <span className="text-3xl font-mono font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              {score.toString().padStart(4, '0')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - Game Area */}
      <main className="flex-1 flex items-center justify-center w-full p-4 z-10">
        <div className="relative group">
          {/* Game Board Border Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          
          <div 
            className="relative bg-gray-900/80 backdrop-blur-sm rounded-xl border border-white/10 p-4 shadow-2xl"
            style={{
              width: `${GRID_SIZE * 20 + 32}px`,
              height: `${GRID_SIZE * 20 + 32}px`,
            }}
          >
            {/* Grid Background */}
            <div 
              className="w-full h-full relative bg-black/50 rounded-lg overflow-hidden border border-white/5"
              style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              {/* Snake */}
              {snake.map((segment, index) => {
                const isHead = index === 0;
                return (
                  <div
                    key={`${segment.x}-${segment.y}-${index}`}
                    className="absolute rounded-sm"
                    style={{
                      left: `${segment.x * 20}px`,
                      top: `${segment.y * 20}px`,
                      width: '20px',
                      height: '20px',
                      backgroundColor: isHead ? '#22d3ee' : '#0891b2',
                      boxShadow: isHead ? '0 0 10px #22d3ee, 0 0 20px #22d3ee' : '0 0 5px #0891b2',
                      zIndex: isHead ? 10 : 1,
                      transform: 'scale(0.9)',
                    }}
                  />
                );
              })}

              {/* Food */}
              <div
                className="absolute rounded-full"
                style={{
                  left: `${food.x * 20}px`,
                  top: `${food.y * 20}px`,
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#ec4899',
                  boxShadow: '0 0 10px #ec4899, 0 0 20px #ec4899',
                  transform: 'scale(0.8)',
                  animation: 'pulse 1.5s infinite',
                }}
              />
            </div>

            {/* Overlays */}
            {!isGameRunning && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl z-20">
                <h2 className="text-7xl font-bold text-white mb-6 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] glitch-text">READY?</h2>
                <button 
                  onClick={startGame}
                  className="px-8 py-3 bg-transparent border-2 border-cyan-400 text-cyan-400 font-bold rounded-full hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all duration-300 uppercase tracking-widest cursor-pointer"
                >
                  Start Game
                </button>
                <p className="mt-6 text-gray-300 text-2xl flex items-center gap-2 glitch-text tracking-wider">
                  Use <kbd className="bg-white/10 px-2 py-1 rounded text-white font-sans text-sm tracking-normal">W</kbd><kbd className="bg-white/10 px-2 py-1 rounded text-white font-sans text-sm tracking-normal">A</kbd><kbd className="bg-white/10 px-2 py-1 rounded text-white font-sans text-sm tracking-normal">S</kbd><kbd className="bg-white/10 px-2 py-1 rounded text-white font-sans text-sm tracking-normal">D</kbd> or Arrows to move
                </p>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-xl z-20">
                <h2 className="text-7xl font-bold text-pink-500 mb-2 tracking-widest drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] glitch-text">GAME OVER</h2>
                <p className="text-gray-300 mb-8 font-mono text-xl">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>
                <button 
                  onClick={startGame}
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] transition-all duration-300 uppercase tracking-widest transform hover:scale-105 cursor-pointer"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer - Music Player */}
      <footer className="w-full p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl z-10">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Track Info */}
          <div className="flex items-center gap-4 w-full md:w-1/3">
            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-800 border border-white/10 flex-shrink-0">
              <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-50 ${isPlaying ? 'animate-pulse' : ''}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white/20 backdrop-blur-sm" />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                {TRACKS[currentTrackIndex].title}
              </span>
              <span className="text-xs text-cyan-400/80 truncate">AI Generated Audio</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-3 w-full md:w-1/3">
            <div className="flex items-center gap-6">
              <button 
                onClick={prevTrack}
                className="text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all cursor-pointer"
              >
                <SkipBack size={24} />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all transform hover:scale-105 cursor-pointer"
              >
                {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
              </button>
              
              <button 
                onClick={nextTrack}
                className="text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all cursor-pointer"
              >
                <SkipForward size={24} />
              </button>
            </div>
          </div>

          {/* Volume / Extra */}
          <div className="flex items-center justify-end w-full md:w-1/3 gap-4">
            <button 
              onClick={toggleMute}
              className="text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            {/* Fake progress bar */}
            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 w-2/3" />
            </div>
          </div>

        </div>
      </footer>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={TRACKS[currentTrackIndex].url}
        onEnded={handleTrackEnded}
        loop={false}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(0.8); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes glitch {
          0% { text-shadow: 2px 0 0 rgba(255,0,0,0.75), -2px -1px 0 rgba(0,255,0,0.75), -1px 2px 0 rgba(0,0,255,0.75); transform: translate(0); }
          14% { text-shadow: 2px 0 0 rgba(255,0,0,0.75), -2px -1px 0 rgba(0,255,0,0.75), -1px 2px 0 rgba(0,0,255,0.75); transform: translate(0); }
          15% { text-shadow: -2px -1px 0 rgba(255,0,0,0.75), 1px 1px 0 rgba(0,255,0,0.75), -2px -2px 0 rgba(0,0,255,0.75); transform: translate(-1px, 1px); }
          49% { text-shadow: -2px -1px 0 rgba(255,0,0,0.75), 1px 1px 0 rgba(0,255,0,0.75), -2px -2px 0 rgba(0,0,255,0.75); transform: translate(-1px, 1px); }
          50% { text-shadow: 1px 2px 0 rgba(255,0,0,0.75), 2px 0 0 rgba(0,255,0,0.75), 0 -2px 0 rgba(0,0,255,0.75); transform: translate(1px, -1px); }
          99% { text-shadow: 1px 2px 0 rgba(255,0,0,0.75), 2px 0 0 rgba(0,255,0,0.75), 0 -2px 0 rgba(0,0,255,0.75); transform: translate(1px, -1px); }
          100% { text-shadow: -1px 0 0 rgba(255,0,0,0.75), -1px -1px 0 rgba(0,255,0,0.75), -1px -2px 0 rgba(0,0,255,0.75); transform: translate(0); }
        }
        .glitch-text {
          animation: glitch 1.5s linear infinite;
          font-family: 'VT323', monospace;
        }
      `}} />
    </div>
  );
}
