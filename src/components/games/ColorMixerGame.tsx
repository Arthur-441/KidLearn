import React, { useState, useEffect } from "react";
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

const BASE_COLORS = [
  { id: "red", hex: "#EF5350", name: "Red" },
  { id: "blue", hex: "#42A5F5", name: "Blue" },
  { id: "yellow", hex: "#FFEE58", name: "Yellow" },
];

const MIXTURES = [
  {
    colors: ["red", "yellow"],
    resultId: "orange",
    resultHex: "#FFA726",
    name: "Orange",
  },
  {
    colors: ["blue", "yellow"],
    resultId: "green",
    resultHex: "#66BB6A",
    name: "Green",
  },
  {
    colors: ["red", "blue"],
    resultId: "purple",
    resultHex: "#AB47BC",
    name: "Purple",
  },
];

export default function ColorMixerGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: Props) {
  const [level, setLevel] = useState(0);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentMix = MIXTURES[level];

  useEffect(() => {
    if (setFeedback && currentMix) {
      setFeedback({
        text: `Can you make ${currentMix.name}? Mix two colors!`,
        color: currentMix.resultHex,
      });
    }
  }, [level, currentMix, setFeedback]);

  const handleColorClick = (colorId: string) => {
    if (showResult || selectedColors.length >= 2) return;

    playAudio(SOUND_URLS.pop);
    const newSelected = [...selectedColors, colorId];
    setSelectedColors(newSelected);

    if (newSelected.length === 2) {
      // check mix
      const isCorrect = currentMix.colors.every((c) => newSelected.includes(c));

      setShowResult(true);

      if (isCorrect) {
        playAudio(SOUND_URLS.correct);
        setScore((s) => s + 1);
        if (triggerReward) triggerReward("star", 1);
        if (setFeedback)
          setFeedback({
            text: `Wow! You made ${currentMix.name}!`,
            color: currentMix.resultHex,
          });

        setTimeout(() => {
          if (level < MIXTURES.length - 1) {
            setLevel((l) => l + 1);
            setSelectedColors([]);
            setShowResult(false);
          } else {
            onComplete(score + 1, 5);
          }
        }, 3000);
      } else {
        playAudio(SOUND_URLS.wrong);
        const wrongMix = MIXTURES.find(
          (m) =>
            m.colors.includes(newSelected[0]) &&
            m.colors.includes(newSelected[1]),
        );
        if (setFeedback)
          setFeedback({
            text: `Not quite! Mixing those gives you ${wrongMix?.name || "a different color"}. We need ${currentMix.name}!`,
            color: "#d32f2f",
          });

        setTimeout(() => {
          setSelectedColors([]);
          setShowResult(false);
        }, 2000);
      }
    }
  };

  if (!currentMix) return null;

  return (
    <div className="w-full flex-1 flex flex-col pt-4 items-center relative gap-8">
      {/* Target Color */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-4 text-center border-dashed"
        style={{ borderColor: currentMix.resultHex }}
      >
        <h3 className="font-['Baloo_2'] text-2xl font-black mb-4 text-[#1a1a2e]">
          We need
        </h3>
        <div
          className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto shadow-inner mb-4 animate-[pulse_2s_infinite]"
          style={{ backgroundColor: currentMix.resultHex }}
        ></div>
        <div
          className="font-bold text-xl uppercase tracking-wider"
          style={{ color: currentMix.resultHex }}
        >
          {currentMix.name}
        </div>
      </motion.div>

      {/* Mixing Pot */}
      <div className="w-full max-w-[400px] h-40 bg-zinc-200 rounded-[100px] border-8 border-zinc-300 relative shadow-inner overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] mix-blend-multiply"></div>
        <div className="flex gap-4 z-10 w-full justify-center">
          <AnimatePresence>
            {selectedColors.map((colorId, i) => {
              const col = BASE_COLORS.find((c) => c.id === colorId)!;
              return (
                <motion.div
                  key={`${colorId}-${i}`}
                  initial={{ y: -100, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.2),inset_0_-5px_15px_rgba(0,0,0,0.3)] border-2 border-white/50"
                  style={{ backgroundColor: col.hex }}
                ></motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {/* Mixed Result overlay */}
        {showResult &&
          selectedColors.length === 2 &&
          currentMix.colors.every((c) => selectedColors.includes(c)) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 m-4 rounded-[100px] shadow-inner z-20"
              style={{ backgroundColor: currentMix.resultHex }}
            ></motion.div>
          )}
      </div>

      {/* Base Colors to select */}
      <div className="flex gap-4 md:gap-8 justify-center w-full">
        {BASE_COLORS.map((color) => (
          <button
            key={color.id}
            onClick={() => handleColorClick(color.id)}
            disabled={
              showResult ||
              selectedColors.length >= 2 ||
              selectedColors.includes(color.id)
            }
            className={`w-20 h-20 md:w-28 md:h-28 rounded-3xl shadow-[0_10px_20px_rgba(0,0,0,0.15),inset_0_-10px_20px_rgba(0,0,0,0.2)] border-4 border-white transition-all transform hover:-translate-y-2 active:scale-95 disabled:hover:translate-y-0 disabled:opacity-50 disabled:grayscale-[50%]`}
            style={{ backgroundColor: color.hex }}
          >
            {/* Splatter highlight */}
            <div className="w-[50%] h-[30%] bg-white/30 rounded-full mx-auto mt-2 blur-[2px]"></div>
          </button>
        ))}
      </div>
    </div>
  );
}
