import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SOUND_URLS } from "../../utils/sounds";

interface Props {
  onComplete: (score: number, stars: number) => void;
  playAudio: (url: string) => void;
  triggerReward?: (
    type: "star" | "badge",
    amount?: number,
    badgeName?: string,
  ) => void;
  setFeedback?: (feedback: { text: string; color: string } | null) => void;
}

const COLORS = [
  { id: "red", hex: "#EF5350", name: "Red" },
  { id: "blue", hex: "#42A5F5", name: "Blue" },
  { id: "green", hex: "#66BB6A", name: "Green" },
  { id: "yellow", hex: "#FFEE58", name: "Yellow" },
];

interface Balloon {
  id: number;
  colorId: string;
  x: number;
}

export default function ColorCatcherGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: Props) {
  const [targetColor, setTargetColor] = useState(COLORS[0]);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const nextId = useRef(0);

  // Character instructions
  useEffect(() => {
    if (setFeedback) {
      setFeedback({
        text: `Catch all the ${targetColor.name} balloons!`,
        color: targetColor.hex,
      });
    }
  }, [targetColor, setFeedback]);

  // Spawn balloons
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(
      () => {
        setBalloons((prev) => {
          // limit on screen
          if (prev.length > 8) return prev;

          // random color (bias towards target color to ensure playability)
          const isTarget = Math.random() < 0.4;
          const color = isTarget
            ? targetColor
            : COLORS[Math.floor(Math.random() * COLORS.length)];

          return [
            ...prev,
            {
              id: nextId.current++,
              colorId: color.id,
              x: 10 + Math.random() * 80, // 10% to 90%
            },
          ];
        });
      },
      1200 - level * 100,
    );

    return () => clearInterval(interval);
  }, [isPlaying, targetColor, level]);

  const handlePop = (balloon: Balloon) => {
    // remove balloon
    setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));

    if (balloon.colorId === targetColor.id) {
      playAudio(SOUND_URLS.pop);
      setScore((s) => s + 1);
      if (triggerReward) triggerReward("star", 1);

      if (score + 1 >= (level + 1) * 5) {
        // level up
        if (level < 3) {
          setLevel((l) => l + 1);
          setTargetColor(COLORS[(level + 1) % COLORS.length]);
          setBalloons([]);
        } else {
          setIsPlaying(false);
          setTimeout(() => onComplete(score + 1, 5), 1000);
        }
      }
    } else {
      playAudio(SOUND_URLS.wrong);
      const wrongColor = COLORS.find((c) => c.id === balloon.colorId);
      if (setFeedback)
        setFeedback({
          text: `Oh no! That balloon was ${wrongColor?.name || "wrong"}. Keep your eyes peeled for ${targetColor.name} balloons!`,
          color: "#d32f2f",
        });
    }
  };

  return (
    <div className="w-full h-[60vh] flex flex-col pt-8 relative overflow-hidden bg-gradient-to-b from-sky-300 to-sky-100 rounded-3xl touch-none">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 bg-white/70 backdrop-blur rounded-2xl p-4 shadow-sm">
        <div className="flex gap-2 items-center">
          <span className="font-bold text-[#1a1a2e] text-lg">Target:</span>
          <div
            className="px-4 py-2 rounded-xl font-bold text-white uppercase tracking-wider"
            style={{ backgroundColor: targetColor.hex }}
          >
            {targetColor.name}
          </div>
        </div>
        <div className="font-black text-2xl text-[#1a1a2e]">Score: {score}</div>
      </div>

      <AnimatePresence>
        {balloons.map((balloon) => {
          const colorObj = COLORS.find((c) => c.id === balloon.colorId)!;
          return (
            <motion.div
              key={balloon.id}
              initial={{ y: "100vh", opacity: 0, scale: 0.5 }}
              animate={{ y: "-20vh", opacity: 1, scale: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 4 - level * 0.5, ease: "linear" }}
              onAnimationComplete={() => {
                setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));
              }}
              onClick={() => handlePop(balloon)}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePop(balloon);
              }}
              className="absolute w-20 h-24 md:w-24 md:h-28 cursor-pointer group"
              style={{ left: `${balloon.x}%`, zIndex: balloon.id }}
            >
              {/* Balloon Graphic */}
              <div
                className="w-full h-full rounded-[50%_50%_50%_50%/40%_40%_60%_60%] relative shadow-[inset_-5px_-5px_15px_rgba(0,0,0,0.1),0_10px_15px_rgba(0,0,0,0.1)] group-active:scale-95 transition-transform"
                style={{ backgroundColor: colorObj.hex }}
              >
                <div className="absolute top-2 left-3 w-4 h-6 bg-white/40 rounded-full rotate-45 blur-[1px]"></div>
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-3 rounded-b-md"
                  style={{ backgroundColor: colorObj.hex }}
                ></div>
              </div>
              {/* String */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-white/60 origin-top rotate-[-5deg]"></div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
