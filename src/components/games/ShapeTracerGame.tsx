import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { SOUND_URLS } from "../../utils/sounds";
import confetti from "canvas-confetti";

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
    id: "circle",
    name: "Circle",
    color: "#ff595e",
    pathData: "M 100 20 A 80 80 0 1 1 99.9 20",
    length: 502 // Approx length of a circle with r=80 (2 * pi * 80)
  },
  {
    id: "square",
    name: "Square",
    color: "#1982c4",
    pathData: "M 30 30 L 170 30 L 170 170 L 30 170 Z",
    length: 560
  },
  {
    id: "triangle",
    name: "Triangle",
    color: "#8ac926",
    pathData: "M 100 20 L 180 170 L 20 170 Z",
    length: 470
  },
  {
    id: "star",
    name: "Star",
    color: "#ffca3a",
    pathData: "M 100 10 L 122 75 L 190 75 L 135 115 L 155 180 L 100 140 L 45 180 L 65 115 L 10 75 L 78 75 Z",
    length: 545
  }
];

export default function ShapeTracerGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: Props) {
  const [level, setLevel] = useState(0);
  const [tracedPoints, setTracedPoints] = useState<{ x: number; y: number }[]>([]);
  const [isTracing, setIsTracing] = useState(false);
  const [traceProgress, setTraceProgress] = useState(0); // 0 to 1
  const svgRef = useRef<SVGSVGElement>(null);
  
  const currentShape = SHAPES[level];

  // Character instructions
  useEffect(() => {
    if (!currentShape) {
      onComplete(level * 10, 5, []);
      return;
    }
    
    if (setFeedback) {
      setFeedback({
        text: `Trace this specific shape: the ${currentShape.name}!`,
        color: "#1a1a2e",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, currentShape?.id]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsTracing(true);
    addPoint(e);
    playAudio(SOUND_URLS.pop);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isTracing) return;
    addPoint(e);
  };

  const addPoint = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    
    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;
    
    setTracedPoints(prev => [...prev, { x, y }]);
    
    // Very simplified progress calculation based on points drawn
    // In a real app, you'd calculate distance along the path
    const approxDist = (tracedPoints.length * 5) / currentShape.length;
    const progress = Math.min(1, approxDist);
    setTraceProgress(progress);
    
    if (progress >= 1 && isTracing) {
      handleCompleteShape();
    }
  };

  const handlePointerUp = () => {
    setIsTracing(false);
    
    // If not completed, reset
    if (traceProgress < 0.95) {
      setTracedPoints([]);
      setTraceProgress(0);
      playAudio(SOUND_URLS.wrong);
    }
  };

  const handleCompleteShape = () => {
    setIsTracing(false);
    setTraceProgress(1); // Force completion visually
    playAudio(SOUND_URLS.awesome);
    if (triggerReward) triggerReward("star", 1);
    
    if (setFeedback) {
      setFeedback({
        text: `Beautiful ${currentShape.name}! ⭐`,
        color: "#4CAF50",
      });
    }

    confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.6 }
    });
    
    setTimeout(() => {
      setLevel(l => l + 1);
      setTracedPoints([]);
      setTraceProgress(0);
    }, 2000);
  };

  if (!currentShape) return null;

  return (
    <div className="w-full h-full min-h-[500px] relative overflow-hidden bg-white rounded-3xl shadow-inner border-8 border-[#e8e8f4] flex flex-col items-center p-4">
      
      <div className="flex-1 w-full flex items-center justify-center relative touch-none">
        
        <svg 
          ref={svgRef}
          viewBox="0 0 200 200" 
          className="w-full max-w-[300px] md:max-w-[400px] h-auto touch-none cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Base shape path (dotted guide lines for tracing) */}
          <path
            d={currentShape.pathData}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 8"
          />
          
          {/* The traced line */}
          {tracedPoints.length > 0 && (
            <polyline
              points={tracedPoints.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={currentShape.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Star at start to guide them */}
          {tracedPoints.length === 0 && (
            <circle cx="100" cy="20" r="6" fill="#FFD93D" className="animate-ping" />
          )}
        </svg>

        {traceProgress >= 1 && (
          <motion.div 
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-[350px] h-[350px] rounded-full bg-[#FFD93D]/20 blur-xl"></div>
          </motion.div>
        )}
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none px-4 z-50">
        <p className="text-[#64748b] font-bold text-center bg-white/80 px-5 py-3 rounded-full backdrop-blur-sm border border-white shadow-sm font-['Baloo_2'] text-lg shadow-md">
          Trace this specific shape
        </p>
      </div>

      {/* Progress bar */}
      <div className="absolute top-4 left-4 right-4 bg-gray-100 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-100 ease-linear"
          style={{ width: `${traceProgress * 100}%` }}
        />
      </div>
    </div>
  );
}
