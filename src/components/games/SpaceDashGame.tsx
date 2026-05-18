import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SOUND_URLS } from "../../utils/sounds";

interface Props {
  onComplete: (score?: number, stars?: number) => void;
  playAudio: (url: string) => void;
  triggerReward: (type: "star" | "badge", amount?: number, badgeName?: string) => void;
  setFeedback: (feedback: { text: string; color: string }) => void;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface Asteroid {
  id: string;
  letter: string;
  x: number;
  y: number;
  speed: number;
  isTarget: boolean;
  exploded?: boolean;
}

export default function SpaceDashGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: Props) {
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const [level, setLevel] = useState(1);
  const [targetLetter, setTargetLetter] = useState(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  const [asteroids, setAsteroidsState] = useState<Asteroid[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);

  const setAsteroids = (updater: Asteroid[] | ((prev: Asteroid[]) => Asteroid[])) => {
      setAsteroidsState(prev => {
          const next = typeof updater === 'function' ? updater(prev) : updater;
          asteroidsRef.current = next;
          return next;
      });
  };

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastSpawnTime = useRef<number>(0);
  const playIdRef = useRef(0);
  
  // Audio pronunciation
  const speakTarget = (letter: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Find the letter ${letter}!`);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    speakTarget(targetLetter);
  }, [targetLetter]);

  const initGame = () => {
    setScore(0);
    setStars(0);
    setStreak(0);
    setLevel(1);
    setAsteroids([]);
    setGameOver(false);
    setIsPaused(false);
    playIdRef.current++;
    setTargetLetter(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  };

  const spawnAsteroid = () => {
    if (!gameAreaRef.current) return;
    const width = gameAreaRef.current.clientWidth;
    
    // Determine if we should guarantee target
    const currentTargets = asteroidsRef.current.filter(a => a.isTarget && !a.exploded);
    const shouldSpawnTarget = currentTargets.length === 0 && Math.random() > 0.3;
    
    const isTarget = shouldSpawnTarget;
    let letter = isTarget ? targetLetter : LETTERS[Math.floor(Math.random() * LETTERS.length)];
    
    // Prevent accidentally spawning the target letter if it shouldn't be
    if (!isTarget && letter === targetLetter) {
        letter = LETTERS[(LETTERS.indexOf(letter) + 1) % LETTERS.length];
    }
    
    const sizeOffset = 80;
    const x = Math.max(0, Math.min(Math.random() * width - sizeOffset, width - sizeOffset));
    const speed = 1.5 + (level * 0.5) + Math.random() * 0.5;

    setAsteroids([...asteroidsRef.current, {
      id: Math.random().toString(),
      letter,
      x,
      y: -100,
      speed,
      isTarget
    }]);
  };

  useEffect(() => {
    if (isPaused || gameOver) {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        return;
    }

    const updateLoop = (time: number) => {
      if (!lastSpawnTime.current) lastSpawnTime.current = time;
      
      const spawnInterval = Math.max(800, 2000 - (level * 200));
      if (time - lastSpawnTime.current > spawnInterval) {
        spawnAsteroid();
        lastSpawnTime.current = time;
      }

      let missedTarget = false;
      
      const next = asteroidsRef.current.map(a => {
        if (a.exploded) return a;
        return { ...a, y: a.y + a.speed };
      }).filter(a => {
        if (a.exploded) return true;
        
        // Remove if it goes past the bottom
        if (a.y >= (gameAreaRef.current?.clientHeight || 800) - 40) {
           if (a.isTarget) missedTarget = true;
           return false;
        }
        return true;
      });
      
      if (missedTarget) {
          setStreak(0);
          setFeedback({ text: "Oops, missed it!", color: "#e53935" });
      }

      setAsteroids(next);

      requestRef.current = requestAnimationFrame(updateLoop);
    };

    requestRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPaused, gameOver, level, targetLetter, setFeedback]);

  const handleShoot = (asteroidId: string) => {
    if (isPaused || gameOver) return;
    
    const ast = asteroidsRef.current.find(a => a.id === asteroidId);
    if (!ast || ast.exploded) return;

    if (ast.isTarget) {
      playAudio(SOUND_URLS.pop);
      setScore(s => {
          const newScore = s + 1;
          if (newScore > 0 && newScore % 5 === 0) setLevel(l => Math.min(l + 1, 5));
          return newScore;
      });
      
      setStreak(str => {
          const newStreak = str + 1;
          const bonus = newStreak > 0 && newStreak % 3 === 0 ? 1 : 0;
          const totalEarned = 1 + bonus;
          setStars(s => s + totalEarned);
          triggerReward("star", totalEarned);
          
          if (newStreak > 1 && newStreak % 5 === 0) playAudio(SOUND_URLS.awesome);
          else if (bonus) playAudio(SOUND_URLS.combo);
          return newStreak;
      });
      
      setFeedback({ text: "Great job! 🚀", color: "#43a047" });
      
      // Pick next target
      setTimeout(() => {
          setTargetLetter(prevLetter => {
              let nextLet = LETTERS[Math.floor(Math.random() * LETTERS.length)];
              while(nextLet === ast.letter) nextLet = LETTERS[Math.floor(Math.random() * LETTERS.length)];
              return nextLet;
          });
      }, 1000);

      setAsteroids(asteroidsRef.current.map(a => a.id === asteroidId ? { ...a, exploded: true } : a));
    } else {
      playAudio(SOUND_URLS.wrong);
      setStreak(0);
      setFeedback({ text: `Oops! Look for ${targetLetter}`, color: "#e53935" });
    }
  };

  const finishGame = () => {
    setGameOver(true);
    onComplete(score, stars);
  };

  return (
    <div className="relative w-full h-[600px] bg-[#0b0b2a] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] border-4 border-[#1aaee8]">
      {/* Moving Space Background */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
         {Array.from({length: 30}).map((_, i) => (
             <motion.div 
               key={i}
               className="absolute bg-white rounded-full"
               style={{
                   width: Math.random() * 4 + 1 + 'px',
                   height: Math.random() * 4 + 1 + 'px',
                   left: Math.random() * 100 + '%',
                   top: Math.random() * 100 + '%',
               }}
               animate={{ y: ["0%", "1000%"] }}
               transition={{ repeat: Infinity, duration: Math.random() * 10 + 5, ease: "linear" }}
             />
         ))}
      </div>

      {/* Top UI */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/20">
        <div className="flex items-center gap-4 text-white">
           <div className="text-xl font-bold bg-[#1aaee8] px-4 py-2 rounded-xl">Score: {score}</div>
           <div className="text-xl font-bold text-yellow-400">⭐ {stars}</div>
           <div className="text-xl font-bold text-orange-400">🔥 {streak}</div>
        </div>
        
        <div className="text-2xl font-black text-white bg-[#9B5DE5] px-6 py-2 rounded-2xl uppercase tracking-widest border-2 border-white/50 shadow-[0_0_15px_rgba(155,93,229,0.5)]">
            Find {targetLetter}!
        </div>
        
        <div className="flex gap-2">
            <button 
               onClick={() => setIsPaused(!isPaused)} 
               className="w-12 h-12 bg-white/20 hover:bg-white/40 rounded-xl flex items-center justify-center text-white text-xl backdrop-blur transition-colors"
            >
                {isPaused ? "▶️" : "⏸️"}
            </button>
            <button 
               onClick={finishGame} 
               className="w-12 h-12 bg-red-500/80 hover:bg-red-500 rounded-xl flex items-center justify-center text-white text-xl backdrop-blur transition-colors"
            >
                ⏹️
            </button>
        </div>
      </div>

      {/* Game Area */}
      <div 
         ref={gameAreaRef} 
         className="absolute inset-0 z-10 pt-[100px] overflow-hidden"
         onClick={() => {}} // Could capture misclicks
      >
        <AnimatePresence>
            {asteroids.map(ast => (
                <motion.div
                    key={ast.id}
                    className={`absolute flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-95`}
                    style={{
                        x: ast.x,
                        y: ast.y,
                        width: '80px',
                        height: '80px',
                        backgroundColor: ast.isTarget ? '#FF6B35' : '#4ECAFC',
                        boxShadow: `inset -5px -5px 15px rgba(0,0,0,0.3), 0 0 20px ${ast.isTarget ? 'rgba(255,107,53,0.4)' : 'rgba(78,202,252,0.4)'}`
                    }}
                    onClick={() => handleShoot(ast.id)}
                    initial={{ scale: 0 }}
                    animate={{ scale: ast.exploded ? 1.5 : 1, opacity: ast.exploded ? 0 : 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                >
                    {!ast.exploded && (
                         <span className="text-4xl font-black text-white drop-shadow-md">
                            {ast.letter}
                         </span>
                    )}
                    {ast.exploded && (
                         <span className="text-5xl">💥</span>
                    )}
                </motion.div>
            ))}
        </AnimatePresence>

        {/* Player Rocket Launcher */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <motion.div 
               className="text-8xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
               animate={{ y: [0, -10, 0] }}
               transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
               🚀
            </motion.div>
        </div>
      </div>

      {/* Paused Overlay */}
      {isPaused && !gameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
             <div className="bg-white rounded-3xl p-8 text-center max-w-sm">
                <h2 className="text-4xl font-black text-[#1a1a2e] mb-2">Paused ⏸️</h2>
                <p className="text-gray-500 mb-6 font-bold">Take a deep breath!</p>
                <button 
                  onClick={() => setIsPaused(false)}
                  className="w-full bg-[#4ECAFC] hover:bg-[#0288d1] text-white py-4 rounded-xl font-black text-xl transition-colors"
                >
                    Resume Game
                </button>
             </div>
          </div>
      )}
    </div>
  );
}
