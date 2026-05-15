import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SOUND_URLS } from "../../utils/sounds";

interface LetterNinjaProps {
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

interface FlyingLetter {
  id: string;
  letter: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  sliced: boolean;
}

export default function LetterNinjaGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: LetterNinjaProps) {
  const [targetLetter, setTargetLetter] = useState("");
  const [flyingLetters, setFlyingLetters] = useState<FlyingLetter[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const maxRounds = 5;
  const lettersPerRound = 4; // we spawn waves
  const [wave, setWave] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnWave = () => {
    let newLetters: FlyingLetter[] = [];
    const isTargetWave = Math.random() > 0.3; // 70% chance to include target

    const count = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      let letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      if (i === 0 && isTargetWave) letter = targetLetter;

      newLetters.push({
        id: `ninja-${Date.now()}-${Math.random()}`,
        letter,
        x: 20 + Math.random() * 60, // 20% to 80% width
        y: 110, // below screen
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(2.5 + Math.random() * 1.5), // up velocity
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        sliced: false,
      });
    }

    setFlyingLetters((prev) => [...prev, ...newLetters]);
  };

  useEffect(() => {
    if (round < maxRounds) {
      setTargetLetter(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
      setFlyingLetters([]);
      setWave(0);
    } else if (round > 0) {
      onComplete(score, Math.floor(score / 3) + 5, []);
    }
  }, [round]);

  useEffect(() => {
    if (round >= maxRounds || !targetLetter) return;
    if (setFeedback)
      setFeedback({
        text: `Slice the letter ${targetLetter}!`,
        color: "#1a1a2e",
      });

    const spawnInterval = setInterval(() => {
      setWave((w) => {
        const next = w + 1;
        if (next <= lettersPerRound) spawnWave();
        return next;
      });
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, [round, targetLetter]);

  useEffect(() => {
    let anim: number;
    const gravity = 0.05;

    const update = () => {
      setFlyingLetters((prev) => {
        let next = [...prev];
        let allOut = true;
        for (let item of next) {
          if (!item.sliced) {
            item.x += item.vx;
            item.y += item.vy;
            item.vy += gravity;
            item.rotation += item.vRot;
            if (item.y < 120) allOut = false;
          }
        }
        // If we reached wave limit and all items are > 120 (fallen down)
        // Wait, we don't want to rely on state inside requestAnimationFrame directly without care,
        // but we are just updating existing array.
        return next.filter((item) => item.y < 120 || item.sliced);
      });
      anim = requestAnimationFrame(update);
    };
    anim = requestAnimationFrame(update);

    return () => cancelAnimationFrame(anim);
  }, []);

  // Check end condition for round
  useEffect(() => {
    if (
      wave > lettersPerRound &&
      flyingLetters.every((fl) => fl.y >= 120 || fl.sliced)
    ) {
      // round over
      setTimeout(() => setRound((r) => r + 1), 1000);
    }
  }, [wave, flyingLetters]);

  const handleSlice = (item: FlyingLetter) => {
    if (item.sliced) return;

    if (item.letter === targetLetter) {
      playAudio(SOUND_URLS.correct);
      if (triggerReward) triggerReward("star", 1);
      setScore((s) => s + 1);
    } else {
      playAudio(SOUND_URLS.wrong);
    } // sliced wrong one

    setFlyingLetters((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, sliced: true } : p)),
    );
  };

  return (
    <div
      className="w-full h-full min-h-[500px] relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] bg-[#2b2b2b] rounded-3xl shadow-inner border-4 border-[#1a1a2e] select-none touch-none"
      ref={containerRef}
    >
      {/* Target Indicator */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <div className="bg-[#1a1a2e]/90 backdrop-blur-md px-6 py-3 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.5)] border-2 border-red-500 flex items-center gap-3">
          <span className="text-xl font-bold text-gray-300">Slice:</span>
          <span className="text-4xl font-black text-red-500">
            {targetLetter}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {flyingLetters.map((b) =>
          !b.sliced ? (
            <div
              key={b.id}
              onPointerOver={() => handleSlice(b)}
              onPointerDown={() => handleSlice(b)} // for tap
              className="absolute flex items-center justify-center font-black text-6xl drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] cursor-crosshair text-[#FFD93D]"
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                transform: `translateX(-50%) rotate(${b.rotation}deg)`,
                width: "100px",
                height: "100px",
              }}
            >
              <div className="bg-gradient-to-br from-[#8C2BA8] to-[#5A189A] border-4 border-[#C47BD7] rounded-xl w-full h-full flex items-center justify-center pointer-events-auto">
                {b.letter}
              </div>
            </div>
          ) : (
            <motion.div
              key={b.id}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.5 }}
              className="absolute flex items-center justify-center font-black text-6xl text-white pointer-events-none"
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                transform: `translateX(-50%) rotate(${b.rotation}deg)`,
              }}
            >
              <div className="flex gap-2">
                <div className="bg-red-500 rounded-l-xl w-[45px] h-[100px] flex items-center justify-start overflow-hidden opacity-50 blur-sm"></div>
                <div className="bg-red-500 rounded-r-xl w-[45px] h-[100px] flex items-center justify-end overflow-hidden opacity-50 blur-sm"></div>
              </div>
            </motion.div>
          ),
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-gray-400 font-bold">
        Score: {score}
      </div>
    </div>
  );
}
