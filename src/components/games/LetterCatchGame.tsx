import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SOUND_URLS } from "../../utils/sounds";

interface LetterCatchProps {
  onComplete: (score: number, stars: number, issues: string[]) => void;
  playAudio: (url: string) => void;
  triggerReward?: (
    type: "star" | "badge",
    amount?: number,
    badgeName?: string,
  ) => void;
  setFeedback?: (feedback: { text: string; color: string }) => void;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface FallingLetter {
  id: string;
  letter: string;
  x: number;
  y: number;
  speed: number;
}

export default function LetterCatchGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: LetterCatchProps) {
  const [targetLetter, setTargetLetter] = useState("");
  const [fallingLetters, setFallingLetters] = useState<FallingLetter[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const maxRounds = 5;
  const targetPerRound = 3;

  const [caughtCount, setCaughtCount] = useState(0);
  const [basketX, setBasketX] = useState(50);
  const basketXRef = useRef(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnLetter = () => {
    // 50% chance to spawn target letter, 50% chance random
    const isTarget = Math.random() > 0.5;
    let letter = targetLetter;
    if (!isTarget) {
      letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    }

    const newItem = {
      id: `fall-${Date.now()}-${Math.random()}`,
      letter,
      x: 10 + Math.random() * 80,
      y: -10,
      speed: 0.3 + Math.random() * 0.4,
    };
    
    fallingLettersRef.current = [...fallingLettersRef.current, newItem];

    setFallingLetters(fallingLettersRef.current);
  };

  useEffect(() => {
    basketXRef.current = basketX;
  }, [basketX]);

  useEffect(() => {
    if (round < maxRounds) {
      setTargetLetter(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
      setCaughtCount(0);
      fallingLettersRef.current = [];
      setFallingLetters([]);
    } else if (round > 0) {
      onComplete(score, Math.floor(score / 3) + 5, []);
    }
  }, [round]);

  const fallingLettersRef = useRef(fallingLetters);

  useEffect(() => {
    if (round >= maxRounds || !targetLetter) return;

    if (setFeedback)
      setFeedback({
        text: `Catch the letter ${targetLetter}!`,
        color: "#1a1a2e",
      });

    const spawnInterval = setInterval(spawnLetter, 1500);

    let animationFrame: number;
    let lastTime = performance.now();
    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      const currentLetters = fallingLettersRef.current;
      const currentBasketX = basketXRef.current;
      const kept: FallingLetter[] = [];
      const newCaught: string[] = [];

      for (let i = 0; i < currentLetters.length; i++) {
        const item = { ...currentLetters[i] };
        item.y += item.speed;

        if (
          item.y > 80 &&
          item.y < 90 &&
          Math.abs(item.x - currentBasketX) < 15
        ) {
          // Caught!
          newCaught.push(item.letter);
        } else if (item.y < 110) {
          kept.push(item);
        }
      }

      if (newCaught.length > 0) {
        // Direct call outside setState
        newCaught.forEach(handleCatch);
      }

      fallingLettersRef.current = kept;
      setFallingLetters(kept);
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    return () => {
      clearInterval(spawnInterval);
      cancelAnimationFrame(animationFrame);
    };
  }, [round, targetLetter]); // Remove basketX, rely on ref

  const caughtCountRef = useRef(caughtCount);
  useEffect(() => {
    caughtCountRef.current = caughtCount;
  }, [caughtCount]);

  const handleCatch = (caughtLetter: string) => {
    if (caughtLetter === targetLetter) {
      playAudio(SOUND_URLS.correct);
      if (triggerReward) triggerReward("star", 1);
      setScore((s) => s + 1);

      const nextCount = caughtCountRef.current + 1;
      setCaughtCount(nextCount);
      if (nextCount >= targetPerRound) {
        playAudio(SOUND_URLS.awesome);
        setTimeout(() => setRound((r) => r + 1), 500);
      }
    } else {
      playAudio(SOUND_URLS.wrong);
      if (setFeedback) {
        setFeedback({
          text: `Oops! That was ${caughtLetter}. We need ${targetLetter}!`,
          color: "#d32f2f",
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setBasketX(Math.max(10, Math.min(90, x)));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    setBasketX(Math.max(10, Math.min(90, x)));
  };

  return (
    <div
      className="w-full h-full min-h-[500px] relative overflow-hidden bg-gradient-to-b from-[#FFF9C4] to-[#FFF59D] rounded-3xl shadow-inner border-4 border-white cursor-none select-none"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* Target Indicator */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border-2 border-white flex items-center gap-3">
          <span className="text-xl font-bold text-gray-700">Catch:</span>
          <span className="text-4xl font-black text-green-600">
            {targetLetter}
          </span>
          <span className="text-sm font-bold text-gray-500 ml-2">
            ({caughtCount}/{targetPerRound})
          </span>
        </div>
      </div>

      <AnimatePresence>
        {fallingLetters.map((b) => (
          <div
            key={b.id}
            className="absolute flex items-center justify-center font-black text-4xl pointer-events-none drop-shadow-md text-blue-600"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="bg-white border-2 border-blue-200 rounded-xl w-14 h-14 flex items-center justify-center">
              {b.letter}
            </div>
          </div>
        ))}
      </AnimatePresence>

      {/* Basket */}
      <div
        className="absolute bottom-4 h-16 pointer-events-none"
        style={{
          left: `${basketX}%`,
          transform: "translateX(-50%)",
          width: "100px",
        }}
      >
        <div className="w-full h-full bg-[#8D6E63] rounded-b-3xl rounded-t-sm shadow-lg border-x-4 border-b-4 border-[#5D4037] relative flex items-start justify-center overflow-hidden">
          <div className="w-full h-2 bg-[#795548] opacity-50 absolute top-0"></div>
        </div>
      </div>
    </div>
  );
}
