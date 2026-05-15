import React, { useState, useEffect } from "react";
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

const PUZZLES = [
  {
    name: "House",
    parts: [
      {
        id: "h1",
        type: "triangle",
        color: "#FF4B4B",
        targetX: 100,
        targetY: 40,
        width: 100,
        height: 100,
        startX: 20,
        startY: 300,
      },
      {
        id: "h2",
        type: "square",
        color: "#4ECAFC",
        targetX: 100,
        targetY: 140,
        width: 100,
        height: 100,
        startX: 180,
        startY: 300,
      },
    ],
  },
  {
    name: "Rocket",
    parts: [
      {
        id: "r1",
        type: "triangle",
        color: "#9B5DE5",
        targetX: 100,
        targetY: 40,
        width: 60,
        height: 60,
        startX: 50,
        startY: 350,
      },
      {
        id: "r2",
        type: "square",
        color: "#FFD93D",
        targetX: 100,
        targetY: 100,
        width: 60,
        height: 100,
        startX: 150,
        startY: 350,
      },
      {
        id: "r3",
        type: "triangle",
        color: "#FF4B4B",
        targetX: 70,
        targetY: 150,
        width: 30,
        height: 50,
        startX: 250,
        startY: 350,
      },
    ],
  },
];

export default function ShapeBuilderGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: Props) {
  const [level, setLevel] = useState(0);
  const [placedParts, setPlacedParts] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const currentPuzzle = PUZZLES[level];

  useEffect(() => {
    if (!currentPuzzle) {
      onComplete(score, 5, []);
    } else {
      if (setFeedback)
        setFeedback({
          text: `Let's build a ${currentPuzzle.name}!`,
          color: "#1a1a2e",
        });
    }
  }, [level, currentPuzzle]);

  const handleDrop = (e: React.DragEvent | null, partId: string) => {
    if (e) e.preventDefault();
    const draggedId = e?.dataTransfer?.getData("text/plain");
    // Since React drag and drop text data might be tricky, we can use a simpler approach:
    // If the user drops over the slot with matching id, it clicks into place.
    // Mobile drop is tricky so we will use simple click-to-place logic for simplicity across devices.
  };

  const handlePartClick = (partId: string) => {
    if (placedParts.includes(partId)) return;
    playAudio(SOUND_URLS.correct);
    setPlacedParts((prev) => {
      const next = [...prev, partId];
      if (next.length === currentPuzzle.parts.length) {
        setScore((s) => s + 1);
        if (triggerReward) triggerReward("star", 1);
        playAudio(SOUND_URLS.awesome);
        setTimeout(() => {
          setPlacedParts([]);
          setLevel((l) => l + 1);
        }, 2000);
      }
      return next;
    });
  };

  if (!currentPuzzle) return null;

  const renderShape = (
    type: string,
    color: string,
    w: number,
    h: number,
    isOutline = false,
  ) => {
    let style: any = { width: w, height: h };
    if (isOutline) {
      style.border = "4px dashed #ccc";
      style.backgroundColor = "transparent";
    } else {
      style.backgroundColor = color;
    }

    if (type === "square") {
      return (
        <div
          style={{
            ...style,
            borderRadius: "8px",
            opacity: isOutline ? 0.5 : 1,
          }}
        />
      );
    }
    if (type === "triangle") {
      if (isOutline) {
        return (
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${w / 2}px solid transparent`,
              borderRight: `${w / 2}px solid transparent`,
              borderBottom: `${h}px dashed #ccc`,
              opacity: 0.5,
            }}
          />
        );
      }
      return (
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${w / 2}px solid transparent`,
            borderRight: `${w / 2}px solid transparent`,
            borderBottom: `${h}px solid ${color}`,
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[500px] relative overflow-hidden bg-gradient-to-br from-[#E0F7FA] to-[#80DEEA] rounded-3xl shadow-inner border-4 border-white">
      <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-white/80 backdrop-blur-md px-8 py-3 rounded-full shadow-lg border-2 border-white">
          <h2 className="text-3xl font-black text-[#006064]">
            Build a {currentPuzzle.name}!
          </h2>
        </div>
      </div>

      {/* Targets Canvas */}
      <div className="absolute top-[80px] left-[50%] transform -translate-x-[50%] w-[300px] h-[250px] flex items-center justify-center relative">
        {currentPuzzle.parts.map((part) => {
          const isPlaced = placedParts.includes(part.id);
          return (
            <div
              key={`target-${part.id}`}
              className="absolute"
              style={{ left: part.targetX, top: part.targetY }}
            >
              {isPlaced
                ? renderShape(part.type, part.color, part.width, part.height)
                : renderShape(
                    part.type,
                    part.color,
                    part.width,
                    part.height,
                    true,
                  )}
            </div>
          );
        })}
      </div>

      {/* Source Parts */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center gap-6 px-4">
        <AnimatePresence>
          {currentPuzzle.parts.map((part) => {
            if (placedParts.includes(part.id)) return null;
            return (
              <motion.div
                key={`source-${part.id}`}
                initial={{ scale: 0, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => handlePartClick(part.id)}
                className="cursor-pointer hover:scale-110 transition-transform active:scale-95 filter drop-shadow-xl"
              >
                {renderShape(
                  part.type,
                  part.color,
                  part.width * 0.8,
                  part.height * 0.8,
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
