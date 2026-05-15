import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SOUND_URLS } from "../../utils/sounds";

interface LetterPopProps {
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

interface Bubble {
  id: string;
  letter: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
}

export default function LetterPopGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: LetterPopProps) {
  const [targetLetter, setTargetLetter] = useState("");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const maxRounds = 5;
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = [
    "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
    "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  ];

  const generateRound = () => {
    const target = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    setTargetLetter(target);

    // Play sound "Find the letter [target]" via synthesis if possible, but let's just make it pop UI
    if (setFeedback)
      setFeedback({ text: `Pop the letter ${target}!`, color: "#1a1a2e" });

    let newBubbles: Bubble[] = [];
    const numBubbles = 6 + Math.floor(Math.random() * 4);

    // Ensure target is present 1-3 times
    const targetCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numBubbles; i++) {
      let letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      if (i < targetCount) letter = target;

      newBubbles.push({
        id: `bubble-${round}-${i}-${Date.now()}`,
        letter,
        x: 10 + Math.random() * 80, // % width
        y: 110 + Math.random() * 20, // Start below screen
        speed: 0.2 + Math.random() * 0.4,
        size: 60 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Shuffle
    newBubbles.sort(() => Math.random() - 0.5);
    setBubbles(newBubbles);
  };

  useEffect(() => {
    if (round < maxRounds) {
      generateRound();
    } else {
      onComplete(score, Math.floor(score / 5) + 5, []);
    }
  }, [round]);

  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setBubbles((prev) =>
        prev.map((b) => {
          // If bubble reaches top, reset it to bottom
          if (b.y < -20) {
            return {
              ...b,
              y: 110 + Math.random() * 20,
              x: 10 + Math.random() * 80,
            };
          }
          return { ...b, y: b.y - b.speed };
        }),
      );
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const handlePop = (bubble: Bubble) => {
    // Pop effect
    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));

    if (bubble.letter === targetLetter) {
      playAudio(SOUND_URLS.correct);
      if (triggerReward) triggerReward("star", 1);

      const newScore = score + 1;
      setScore(newScore);

      // Check if all targets are popped
      const remainingTargets = bubbles.filter(
        (b) => b.id !== bubble.id && b.letter === targetLetter,
      );
      if (remainingTargets.length === 0) {
        playAudio(SOUND_URLS.awesome);
        setTimeout(() => {
          setRound((r) => r + 1);
        }, 1000);
      }
    } else {
      playAudio(SOUND_URLS.wrong);
      if (setFeedback)
        setFeedback({
          text: `Oops! That was ${bubble.letter}. We are looking for ${targetLetter}.`,
          color: "#d32f2f",
        });

      // Penalize mildly or just ignore
    }
  };

  return (
    <div
      className="w-full h-full min-h-[400px] relative overflow-hidden bg-gradient-to-b from-[#e0f7fa] to-[#b2ebf2] rounded-3xl shadow-inner border-4 border-white"
      ref={containerRef}
    >
      {/* Target Indicator */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border-2 border-white flex items-center gap-3">
          <span className="text-xl font-bold text-gray-700">Find:</span>
          <span className="text-4xl font-black text-blue-600">
            {targetLetter}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {bubbles.map((b) => (
          <motion.div
            key={b.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            onClick={() => handlePop(b)}
            className="absolute rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:brightness-110 active:scale-95 transition-transform"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              background: b.color,
              boxShadow:
                "inset -5px -5px 15px rgba(0,0,0,0.1), inset 5px 5px 15px rgba(255,255,255,0.8)",
            }}
          >
            {/* Bubble reflection */}
            <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white rounded-full opacity-60 transform -rotate-45"></div>

            <span
              className="text-white font-black drop-shadow-md"
              style={{ fontSize: `${b.size * 0.5}px` }}
            >
              {b.letter}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 text-white font-black text-xl drop-shadow-md">
        Round: {Math.min(round + 1, maxRounds)} / {maxRounds}
      </div>
    </div>
  );
}
