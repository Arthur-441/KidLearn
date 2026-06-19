import React, { useState, useEffect } from "react";
import { motion, useMotionValue, animate } from "motion/react";
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
    targetSvg: <circle cx="100" cy="100" r="90" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 8" />,
    pieces: [
      {
        id: "circle-left",
        initialX: -70,
        initialY: 100,
        svg: <path d="M100,10 A90,90 0 0,0 100,190 Z" fill="#ff595e" />
      },
      {
        id: "circle-right",
        initialX: 70,
        initialY: -100,
        svg: <path d="M100,10 A90,90 0 0,1 100,190 Z" fill="#ff595e" />
      }
    ]
  },
  {
    id: "square",
    name: "Square",
    color: "#1982c4",
    targetSvg: <rect x="10" y="10" width="180" height="180" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 8" />,
    pieces: [
      {
        id: "sq-top",
        initialX: -80,
        initialY: -110,
        svg: <rect x="10" y="10" width="180" height="90" fill="#1982c4" />
      },
      {
        id: "sq-bot",
        initialX: 80,
        initialY: 110,
        svg: <rect x="10" y="100" width="180" height="90" fill="#1982c4" />
      }
    ]
  },
  {
    id: "triangle",
    name: "Triangle",
    color: "#8ac926",
    targetSvg: <polygon points="100,10 190,190 10,190" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 8" />,
    pieces: [
      {
        id: "tri-l",
        initialX: -70,
        initialY: 110,
        svg: <polygon points="100,10 100,190 10,190" fill="#8ac926" />
      },
      {
        id: "tri-r",
        initialX: 70,
        initialY: 110,
        svg: <polygon points="100,10 190,190 100,190" fill="#8ac926" />
      }
    ]
  },
  {
    id: "rocket",
    name: "Rocket",
    color: "#ff595e",
    targetSvg: (
      <g fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 8">
        <polygon points="100,10 60,60 140,60" />
        <rect x="60" y="60" width="80" height="100" />
        <polygon points="60,160 30,190 60,140" />
        <polygon points="140,160 170,190 140,140" />
      </g>
    ),
    pieces: [
      {
        id: "rocket-top",
        initialX: -80,
        initialY: -100,
        svg: <polygon points="100,10 60,60 140,60" fill="#ff595e" />
      },
      {
        id: "rocket-body",
        initialX: 80,
        initialY: -80,
        svg: <rect x="60" y="60" width="80" height="100" fill="#1982c4" />
      },
      {
        id: "rocket-l-fin",
        initialX: -60,
        initialY: 100,
        svg: <polygon points="60,160 30,190 60,140" fill="#ffca3a" />
      },
      {
        id: "rocket-r-fin",
        initialX: 60,
        initialY: 100,
        svg: <polygon points="140,160 170,190 140,140" fill="#ffca3a" />
      }
    ]
  },
  {
    id: "house",
    name: "House",
    color: "#ffca3a",
    targetSvg: (
      <g fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 8">
        <polygon points="100,20 20,90 180,90" />
        <rect x="35" y="90" width="130" height="100" />
        <rect x="80" y="130" width="40" height="60" />
      </g>
    ),
    pieces: [
      {
        id: "house-roof",
        initialX: -80,
        initialY: -100,
        svg: <polygon points="100,20 20,90 180,90" fill="#ffca3a" />
      },
      {
        id: "house-body",
        initialX: 80,
        initialY: -80,
        svg: <rect x="35" y="90" width="130" height="100" fill="#8ac926" />
      },
      {
        id: "house-door",
        initialX: 0,
        initialY: 120,
        svg: <rect x="80" y="130" width="40" height="60" fill="#1982c4" />
      }
    ]
  }
];

const DraggablePiece: React.FC<{
  piece: any;
  onPlaced: () => void;
  playAudio: (url: string) => void;
}> = ({ piece, onPlaced, playAudio }) => {
  const [placed, setPlaced] = useState(false);
  const x = useMotionValue(piece.initialX);
  const y = useMotionValue(piece.initialY);

  useEffect(() => {
    setPlaced(false);
    x.set(piece.initialX);
    y.set(piece.initialY);
  }, [piece.id, piece.initialX, piece.initialY, x, y]);

  const handleDragEnd = () => {
    if (placed) return;
    const cx = x.get();
    const cy = y.get();

    // Snap if close to target center (0,0)
    if (Math.abs(cx) < 50 && Math.abs(cy) < 50) {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
      animate(y, 0, { type: "spring", stiffness: 300, damping: 20 });
      setPlaced(true);
      setTimeout(() => {
        onPlaced();
        playAudio(SOUND_URLS.correct);
      }, 0);
    } else {
      playAudio(SOUND_URLS.wrong);
      animate(x, piece.initialX, { type: "spring", stiffness: 400, damping: 10 });
      animate(y, piece.initialY, { type: "spring", stiffness: 400, damping: 10 });
    }
  };

  return (
    <motion.div
      style={{ x, y, touchAction: "none" }}
      drag={!placed}
      dragMomentum={false}
      onDragStart={() => {
        if (!placed) playAudio(SOUND_URLS.pop);
      }}
      onDragEnd={handleDragEnd}
      className={`absolute top-0 left-0 w-full h-full ${placed ? "z-10" : "z-[100] cursor-grab active:cursor-grabbing"}`}
      whileHover={{ scale: placed ? 1 : 1.05 }}
      whileTap={placed ? {} : { scale: 0.95 }}
      animate={{
        filter: placed
          ? "drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))"
          : "drop-shadow(0px 8px 12px rgba(0,0,0,0.2))",
      }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible pointer-events-none">
        {piece.svg}
      </svg>
    </motion.div>
  );
};

export default function ShapeBuilderGame({
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: Props) {
  const [level, setLevel] = useState(0);
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const currentShape = SHAPES[level];

  useEffect(() => {
    if (!currentShape) {
      onComplete(level * 10, 5, []);
    } else if (setFeedback) {
      setFeedback({
        text: `Build the ${currentShape.name}!`,
        color: "#1a1a2e",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, currentShape?.id]);

  const handlePlaced = (id: string) => {
    const newPlaced = [...placedIds, id];
    setPlacedIds(newPlaced);

    if (newPlaced.length === currentShape.pieces.length) {
      // Shape completed!
      playAudio(SOUND_URLS.awesome);
      triggerReward?.("star", 1);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
      });

      if (setFeedback) {
        setFeedback({
          text: `Hooray! It's a ${currentShape.name}!`,
          color: "#4CAF50",
        });
      }

      setTimeout(() => {
        setLevel((l) => l + 1);
        setPlacedIds([]);
      }, 2500);
    }
  };

  if (!currentShape) return null;

  return (
    <div className="w-full h-full min-h-[500px] relative overflow-hidden bg-[#f8f9fc] rounded-3xl shadow-inner border-8 border-[#e8e8f4] flex flex-col items-center justify-center p-4">
      {/* Target Container - Centers the game area */}
      <div className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px]">
        {/* Silhouette */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            {currentShape.targetSvg}
          </svg>
        </div>

        {/* Pieces overlaying the silhouette */}
        {currentShape.pieces.map((piece) => (
          <DraggablePiece
            key={piece.id}
            piece={piece}
            onPlaced={() => handlePlaced(piece.id)}
            playAudio={playAudio}
          />
        ))}

        {/* Success burst - appears when placed completely */}
        {placedIds.length === currentShape.pieces.length && (
          <motion.div
            className="absolute inset-0 z-0 pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <div className="w-full h-full rounded-full border-8 border-[#FFD93D] shadow-[0_0_40px_#FFD93D] opacity-60"></div>
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none px-4 z-50">
        <p className="text-[#64748b] font-bold text-center bg-white/80 px-5 py-3 rounded-full backdrop-blur-sm border border-white shadow-sm font-['Baloo_2'] text-lg">
          Drag the shapes in their right places
        </p>
      </div>
    </div>
  );
}
