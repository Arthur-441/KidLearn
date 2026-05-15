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

interface FallingObject {
  id: string;
  number: number;
  x: number;
  y: number;
  speed: number;
  type: string;
  isDots: boolean;
  dotsCount: number;
}

export default function NumberCatchGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: Props) {
  const [targetNumber, setTargetNumber] = useState(0);
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [basketX, setBasketX] = useState(50);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const maxRounds = 5;
  const containerRef = useRef<HTMLDivElement>(null);

  const objectTypes = ["🍎", "🍪", "🎈", "⭐", "🫐"];

  const speakInstructions = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "Catch the items that match the target number!",
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
    const target = NUMBERS[Math.floor(Math.random() * 5) + 1]; // 1-6
    setTargetNumber(target);

    if (setFeedback)
      setFeedback({
        text: `Catch the items showing number ${target}!`,
        color: "#1a1a2e",
      });

    let newObjects: FallingObject[] = [];
    const numObjects = 6 + Math.floor(Math.random() * 4);

    const targetCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numObjects; i++) {
      let num = NUMBERS[Math.floor(Math.random() * 6)];
      if (i < targetCount) num = target;

      const type = objectTypes[Math.floor(Math.random() * objectTypes.length)];

      newObjects.push({
        id: `obj-${round}-${i}-${Date.now()}`,
        number: num,
        isDots: Math.random() > 0.5,
        dotsCount: num,
        x: 10 + Math.random() * 80,
        y: -20 - Math.random() * 100, // Stagger falls
        speed: 0.3 + Math.random() * 0.4,
        type,
      });
    }

    setObjects(newObjects);
  };

  useEffect(() => {
    if (round < maxRounds) {
      generateRound();
    } else {
      onComplete(score, Math.floor(score / 5) + 5, []);
    }
  }, [round]);

  const objectsRef = useRef(objects);
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  const targetNumberRef = useRef(targetNumber);
  useEffect(() => {
    targetNumberRef.current = targetNumber;
  }, [targetNumber]);

  const basketXRef = useRef(basketX);
  useEffect(() => {
    basketXRef.current = basketX;
  }, [basketX]);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      // We can use a fixed time step or just use our speed directly, for now we keep the same logic
      lastTime = time;

      const currentObjects = objectsRef.current;
      const currentBasketX = basketXRef.current;
      const currentTarget = targetNumberRef.current;

      let scoreToAdd = 0;
      let roundToAdvance = false;
      let newObjects = currentObjects.map((obj) => {
        if (obj.y > 110) {
          return {
            ...obj,
            y: -20 - Math.random() * 40,
            x: 10 + Math.random() * 80,
          };
        }
        return { ...obj, y: obj.y + obj.speed };
      });

      const remaining: FallingObject[] = [];
      for (const obj of newObjects) {
        if (obj.y > 80 && obj.y < 95 && Math.abs(obj.x - currentBasketX) < 15) {
          if (obj.number === currentTarget) {
            playAudio(SOUND_URLS.correct);
            if (triggerReward) triggerReward("star", 1);
            scoreToAdd++;

            const others = newObjects.filter(
              (p) =>
                p.id !== obj.id &&
                p.number === currentTarget &&
                (p.y <= 80 ||
                  p.y >= 95 ||
                  Math.abs(p.x - currentBasketX) >= 15),
            );
            if (others.length === 0) {
              playAudio(SOUND_URLS.awesome);
              roundToAdvance = true;
            }
          } else {
            playAudio(SOUND_URLS.wrong);
            let hintText = `Oops! That had ${obj.number}. We need ${currentTarget}!`;
            if (obj.isDots) {
              hintText = `Oh no! That had ${obj.number} dots. We are looking for exactly ${currentTarget}!`;
            }
            if (setFeedback) setFeedback({ text: hintText, color: "#d32f2f" });
          }
        } else {
          remaining.push(obj);
        }
      }

      if (scoreToAdd > 0) {
        setScore((s) => s + scoreToAdd);
      }
      if (roundToAdvance) {
        setTimeout(() => {
          setRound((r) => r + 1);
        }, 500);
      }

      setObjects(remaining);
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let clientX = 0;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    let x = ((clientX - rect.left) / rect.width) * 100;
    x = Math.max(10, Math.min(90, x));
    setBasketX(x);
  };

  return (
    <div
      className="w-full h-full min-h-[400px] relative overflow-hidden bg-gradient-to-b from-[#e8f5e9] to-[#c8e6c9] rounded-3xl shadow-inner border-4 border-white cursor-none"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      {/* Target Indicator */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border-2 border-white flex items-center gap-3">
          <span className="text-xl font-bold text-gray-700">Catch:</span>
          <span className="text-4xl font-black text-green-600">
            {targetNumber}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {objects.map((obj) => (
          <motion.div
            key={obj.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute shadow-sm"
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="relative text-5xl">
              {obj.type}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-xl w-full text-center">
                {obj.isDots ? (
                  <div className="flex flex-wrap justify-center items-center px-1 gap-0.5">
                    {Array.from({ length: obj.dotsCount }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 h-1.5 bg-black rounded-full"
                      ></div>
                    ))}
                  </div>
                ) : (
                  obj.number
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Basket */}
      <div
        className="absolute bottom-4 text-6xl pointer-events-none transition-transform duration-75"
        style={{
          left: `${basketX}%`,
          transform: "translateX(-50%)",
        }}
      >
        🧺
      </div>

      <div className="absolute top-4 right-4 text-green-800 font-black text-xl drop-shadow-md">
        Round: {Math.min(round + 1, maxRounds)} / {maxRounds}
      </div>
    </div>
  );
}
