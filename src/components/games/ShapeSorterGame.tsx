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

const SHAPES = ["circle", "rectangle", "triangle", "star"];

interface ConveyorItem {
  id: string;
  shapeType: string;
  color: string;
  x: number;
}

export default function ShapeSorterGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: Props) {
  const [items, setItems] = useState<ConveyorItem[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const maxScore = 10;
  const draggedItemRef = useRef<ConveyorItem | null>(null);

  const colors = ["#FF4B4B", "#4ECAFC", "#8DE365", "#FFD93D", "#9B5DE5"];

  useEffect(() => {
    if (score >= maxScore) {
      onComplete(score, 5, []);
    } else if (score === 0) {
      if (setFeedback)
        setFeedback({
          text: "Sort the items into the correct bins!",
          color: "#1a1a2e",
        });
    }
  }, [score, maxScore]);

  useEffect(() => {
    if (score >= maxScore) return;
    const interval = setInterval(() => {
      setItems((prev) => {
        const newItem = {
          id: `item-${Date.now()}-${Math.random()}`,
          shapeType: SHAPES[Math.floor(Math.random() * SHAPES.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
          x: -20,
        };
        return [...prev, newItem];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [score]);

  useEffect(() => {
    let anim: number;
    const update = () => {
      setItems((prev) => {
        return prev
          .filter((p) => p.x < 120)
          .map((p) => ({
            ...p,
            x: draggedItemRef.current?.id === p.id ? p.x : p.x + 0.5, // convey speed
          }));
      });
      anim = requestAnimationFrame(update);
    };
    anim = requestAnimationFrame(update);
    return () => cancelAnimationFrame(anim);
  }, []);

  const handleDrop = (binShape: string, draggedItem: ConveyorItem) => {
    if (draggedItem.shapeType === binShape) {
      playAudio(SOUND_URLS.correct);
      setScore((s) => s + 1);
      if (triggerReward) triggerReward("star", 1);
      setItems((prev) => prev.filter((i) => i.id !== draggedItem.id));
    } else {
      playAudio(SOUND_URLS.wrong);
      if (setFeedback)
        setFeedback({
          text: "Not quite! That item doesn't match the shape of the bin. Look closely at its outline.",
          color: "#d32f2f",
        });
    }
  };

  const renderShape = (type: string, color: string, className = "") => {
    switch (type) {
      case "circle":
        return (
          <div
            className={`rounded-full shadow-lg ${className}`}
            style={{ backgroundColor: color }}
          />
        );
      case "rectangle":
        return (
          <div className={`flex items-center justify-center ${className}`}>
            <div
              className="rounded-sm shadow-lg w-full h-[65%]"
              style={{ backgroundColor: color }}
            />
          </div>
        );
      case "square":
        return (
          <div
            className={`rounded-md shadow-lg ${className}`}
            style={{ backgroundColor: color }}
          />
        );
      case "triangle":
        return (
          <div
            className={`shadow-lg filter drop-shadow-md ${className}`}
            style={{
              backgroundColor: color,
              clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            }}
          />
        );
      case "star":
        return (
          <div
            className={`text-6xl filter drop-shadow-lg leading-none ${className}`}
            style={{ color }}
          >
            ⭐
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] relative overflow-hidden bg-gradient-to-b from-[#FFF0F5] to-[#E6E6FA] rounded-3xl shadow-inner border-4 border-white flex flex-col justify-between touch-none select-none">
      <div className="absolute top-4 right-4 text-2xl font-black text-[#8C2BA8] bg-white px-4 py-2 rounded-full shadow-md z-10">
        Score: {score} / {maxScore}
      </div>

      {/* Conveyor Belt Area */}
      <div className="w-full h-[200px] relative mt-10">
        {/* Belt Base */}
        <div className="absolute top-[80px] w-full h-[40px] bg-gray-800 border-t-8 border-gray-600 border-b-8 shadow-xl flex items-center overflow-hidden">
          {/* moving lines */}
          <div
            className="w-[200%] h-full flex bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] animate-[slideRight_3s_linear_infinite]"
            style={{
              backgroundSize: "30px",
              animation: "slideRight 3s linear infinite",
            }}
          ></div>
        </div>

        {/* Items */}
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              drag
              dragSnapToOrigin
              whileDrag={{ scale: 1.2, zIndex: 50, cursor: "grabbing" }}
              onDragStart={() => {
                draggedItemRef.current = item;
                if (playAudio) playAudio(SOUND_URLS.pop);
              }}
              onDragEnd={(e: MouseEvent | TouchEvent | PointerEvent, info) => {
                draggedItemRef.current = null;

                let clientX = info.point.x;
                let clientY = info.point.y;

                // Try to get viewport-relative ones directly from event to avoid scroll calculation issues
                const evt = e as any;
                if (evt.clientX !== undefined) {
                  clientX = evt.clientX;
                  clientY = evt.clientY;
                } else if (
                  evt.changedTouches &&
                  evt.changedTouches.length > 0
                ) {
                  clientX = evt.changedTouches[0].clientX;
                  clientY = evt.changedTouches[0].clientY;
                } else {
                  clientX = info.point.x - window.scrollX;
                  clientY = info.point.y - window.scrollY;
                }

                const bins = Array.from(
                  document.querySelectorAll("[data-bin-shape]"),
                );
                const droppedBin = bins.find((bin) => {
                  const rect = bin.getBoundingClientRect();
                  // Make hit area very forgiving for kids
                  const expandXY = 60; // increased from 40 for more forgiveness
                  return (
                    clientX >= rect.left - expandXY &&
                    clientX <= rect.right + expandXY &&
                    clientY >= rect.top - expandXY &&
                    clientY <= rect.bottom + expandXY
                  );
                });

                if (droppedBin) {
                  const shape = droppedBin.getAttribute("data-bin-shape")!;
                  handleDrop(shape, item);
                } else {
                  if (playAudio) playAudio(SOUND_URLS.wrong);
                }
              }}
              className="absolute top-[20px] md:top-[35px] cursor-grab active:cursor-grabbing w-[60px] h-[60px] md:w-[80px] md:h-[80px] flex items-center justify-center pointer-events-auto"
              style={{ left: `${item.x}%`, zIndex: 5 }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              {renderShape(item.shapeType, item.color, "w-[70px] h-[70px]")}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bins Area */}
      <div className="w-full flex-1 flex flex-nowrap justify-center items-end pb-4 md:pb-8 gap-2 md:gap-6 px-2 pointer-events-auto">
        {SHAPES.map((shapeType) => (
          <div
            key={shapeType}
            data-bin-shape={shapeType}
            className="flex-1 max-w-[110px] md:max-w-[140px] aspect-square bg-gradient-to-b from-[#FFE0B2] to-[#FFB74D] border-[3px] md:border-4 border-[#F57C00] rounded-b-2xl rounded-t-lg md:rounded-b-3xl md:rounded-t-xl shadow-[0_5px_15px_rgba(0,0,0,0.15),inset_0_-5px_15px_rgba(255,255,255,0.3)] flex flex-col items-center justify-center relative overflow-hidden shrink-0"
          >
            {/* Bin depth effect */}
            <div className="absolute top-0 w-full h-[30%] bg-gradient-to-b from-black/30 to-transparent pointer-events-none rounded-t-lg md:rounded-t-xl border-b-[1px] border-black/10"></div>
            <div className="absolute top-0 w-[85%] h-3 md:h-4 bg-black/40 rounded-[100%] mx-auto blur-[1px] md:blur-[2px] shadow-inner pointer-events-none"></div>

            {/* Shape indicator inside the bin */}
            <div className="mt-4 md:mt-2 w-[40px] h-[40px] md:w-[60px] md:h-[60px] flex items-center justify-center opacity-40 mix-blend-multiply drop-shadow-sm pointer-events-none">
              {renderShape(
                shapeType,
                "#555",
                "w-[25px] h-[25px] md:w-[40px] md:h-[40px]",
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
          @keyframes slideRight {
             from { transform: translateX(0); }
             to { transform: translateX(-50px); }
          }
       `}</style>
    </div>
  );
}
