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

const SHAPES = [
  {
    name: "Triangle",
    points: [
      { x: 50, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ],
    color: "#FF4B4B",
  },
  {
    name: "Square",
    points: [
      { x: 20, y: 20 },
      { x: 80, y: 20 },
      { x: 80, y: 80 },
      { x: 20, y: 80 },
    ],
    color: "#4ECAFC",
  },
];

export default function ShapeTracerGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: Props) {
  const [level, setLevel] = useState(0);
  const [currentPoint, setCurrentPoint] = useState(0);
  const [tracedPoints, setTracedPoints] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentShape = SHAPES[level];

  useEffect(() => {
    if (!currentShape) {
      onComplete(level, 5, []);
    } else {
      if (setFeedback)
        setFeedback({
          text: `Trace the ${currentShape.name}!`,
          color: "#1a1a2e",
        });
    }
  }, [level, currentShape]);

  // Handle drawing lines between traced points
  const handlePointClick = (index: number) => {
    if (index === currentPoint) {
      playAudio(SOUND_URLS.correct);
      setTracedPoints((prev) => [...prev, index]);

      if (index === currentShape.points.length - 1) {
        // finished shape! Note: typical tracer might require closing the loop, lets just do visiting all points
        playAudio(SOUND_URLS.awesome);
        if (triggerReward) triggerReward("star", 1);

        // Move to next shape
        setTimeout(() => {
          setLevel((l) => l + 1);
          setCurrentPoint(0);
          setTracedPoints([]);
        }, 1500);
      } else {
        setCurrentPoint((c) => c + 1);
      }
    }
  };

  if (!currentShape) return null;

  return (
    <div
      className="w-full h-full min-h-[500px] relative overflow-hidden bg-white rounded-3xl shadow-inner border-8 border-gray-200"
      ref={containerRef}
    >
      <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-[#1a1a2e] px-8 py-3 rounded-full shadow-lg">
          <h2 className="text-3xl font-black text-white">
            Trace the {currentShape.name}!
          </h2>
        </div>
      </div>

      <div className="absolute top-[80px] bottom-[20px] left-[20px] right-[20px] relative">
        {/* Draw lines */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {currentShape.points.map((p, i) => {
            if (i === 0) return null;
            const prev = currentShape.points[i - 1];
            const isTraced = tracedPoints.includes(i);
            return (
              <line
                key={`line-${i}`}
                x1={`${prev.x}%`}
                y1={`${prev.y}%`}
                x2={`${p.x}%`}
                y2={`${p.y}%`}
                stroke={isTraced ? currentShape.color : "#e5e7eb"}
                strokeWidth="20"
                strokeLinecap="round"
              />
            );
          })}
          {/* Closing line if all points traced */}
          {tracedPoints.length === currentShape.points.length && (
            <line
              x1={`${currentShape.points[currentShape.points.length - 1].x}%`}
              y1={`${currentShape.points[currentShape.points.length - 1].y}%`}
              x2={`${currentShape.points[0].x}%`}
              y2={`${currentShape.points[0].y}%`}
              stroke={currentShape.color}
              strokeWidth="20"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Points */}
        {currentShape.points.map((p, i) => {
          const isActive = i === currentPoint;
          const isTraced = tracedPoints.includes(i);
          return (
            <div
              key={`point-${i}`}
              onClick={() => handlePointClick(i)}
              className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center font-bold text-xl cursor-pointer transition-all duration-300 ${isActive ? "bg-[#FFD93D] scale-125 shadow-[0_0_20px_#FFD93D]" : isTraced ? "bg-gray-800 text-white scale-100" : "bg-gray-300 text-gray-500 scale-100"}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}
