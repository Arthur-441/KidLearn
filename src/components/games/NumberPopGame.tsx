import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SOUND_URLS } from "../../utils/sounds";

interface Props {
  onComplete: (score: number, stars: number, issues: string[]) => void;
  playAudio: (url: string) => void;
  triggerReward?: (
    type: "star" | "badge",
    amount?: number,
    badgeName?: string,
  ) => void;
  setFeedback?: (feedback: { text: string; color: string }) => void;
}

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface Bubble {
  id: string;
  number: number;
  dots: number;
  isDots: boolean;
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
}

export default function NumberPopGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: Props) {
  const [targetNumber, setTargetNumber] = useState(1);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const maxRounds = 5;

  const colors = [
    "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
    "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  ];

  const speakInstructions = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "Pop the bubbles that match the target number!",
      );
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (round === 0) {
      speakInstructions();
    }
  }, []);

  const generateRound = () => {
    const target = NUMBERS[Math.floor(Math.random() * 5) + 1]; // Focus on 1-6 for ease
    setTargetNumber(target);

    if (setFeedback)
      setFeedback({
        text: `Pop all the bubbles for number ${target}!`,
        color: "#1a1a2e",
      });

    let newBubbles: Bubble[] = [];
    const numBubbles = 6 + Math.floor(Math.random() * 4);

    const targetCount = 2 + Math.floor(Math.random() * 2); // 2-3 targets
    for (let i = 0; i < numBubbles; i++) {
      let num = NUMBERS[Math.floor(Math.random() * 6)];
      if (i < targetCount) num = target;

      newBubbles.push({
        id: `bubble-${round}-${i}-${Date.now()}`,
        number: num,
        dots: num,
        isDots: Math.random() > 0.5,
        x: 10 + Math.random() * 80,
        y: 110 + Math.random() * 20,
        speed: 0.15 + Math.random() * 0.3,
        size: 70 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

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
    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));

    if (bubble.number === targetNumber) {
      playAudio(SOUND_URLS.correct);
      if (triggerReward) triggerReward("star", 1);

      const newScore = score + 1;
      setScore(newScore);

      const remainingTargets = bubbles.filter(
        (b) => b.id !== bubble.id && b.number === targetNumber,
      );
      if (remainingTargets.length === 0) {
        playAudio(SOUND_URLS.awesome);
        setTimeout(() => {
          setRound((r) => r + 1);
        }, 1000);
      }
    } else {
      playAudio(SOUND_URLS.wrong);
      let hintText = `Oops! That was ${bubble.number}. We need ${targetNumber}!`;
      if (bubble.isDots) {
        hintText = `Oh no! That bubble had ${bubble.number} dots. We need exactly ${targetNumber}!`;
      }
      if (setFeedback) setFeedback({ text: hintText, color: "#d32f2f" });
    }
  };

  return (
    <div className="w-full h-full min-h-[400px] relative overflow-hidden bg-gradient-to-b from-[#e0f7fa] to-[#b2ebf2] rounded-3xl shadow-inner border-4 border-white">
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border-2 border-white flex items-center gap-3">
          <span className="text-xl font-bold text-gray-700">Find:</span>
          <span className="text-4xl font-black text-blue-600">
            {targetNumber}
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
            className="absolute flex items-center justify-center cursor-pointer shadow-sm hover:brightness-110 active:scale-95 transition-transform rounded-full"
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
            <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white rounded-full opacity-60 transform -rotate-45"></div>

            {b.isDots ? (
              <div
                className="flex flex-wrap justify-center items-center p-2 gap-1 pointer-events-none"
                style={{ width: "80%", height: "80%" }}
              >
                {Array.from({ length: b.dots }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 bg-white rounded-full shadow-sm"
                  ></div>
                ))}
              </div>
            ) : (
              <span
                className="text-white font-black drop-shadow-md pointer-events-none"
                style={{ fontSize: `${b.size * 0.5}px` }}
              >
                {b.number}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
