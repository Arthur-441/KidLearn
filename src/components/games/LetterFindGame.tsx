import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SOUND_URLS } from "../../utils/sounds";

interface Props {
  onComplete: (score?: number, stars?: number) => void;
  playAudio: (url: string) => void;
  triggerReward: (type: "star" | "badge", amount?: number, badgeName?: string) => void;
  setFeedback: (feedback: { text: string; color: string }) => void;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type SceneType = "jungle" | "playground" | "underwater" | "bedroom";

interface HiddenLetter {
  id: string;
  letter: string;
  x: number; // percentage
  y: number; // percentage
  size: number;
  rotation: number;
  color?: string;
  isTarget: boolean;
  opacity?: number;
}

const SCENES: Record<SceneType, { name: string; bg: string; items: string[]; colors: string[] }> = {
  jungle: {
    name: "Jungle",
    bg: "bg-gradient-to-br from-green-400 to-green-800",
    items: ["🌴", "🐒", "🐍", "🌿", "🌺", "🦜"],
    colors: ["#2d6a4f", "#1b4332", "#40916c", "#52b788"],
  },
  playground: {
    name: "Playground",
    bg: "bg-gradient-to-br from-blue-300 to-green-300",
    items: ["⚽", "☀️", "☁️", "🌲", "🚲", "🛝"],
    colors: ["#0077b6", "#0096c7", "#48cae4", "#90e0ef"],
  },
  underwater: {
    name: "Underwater",
    bg: "bg-gradient-to-br from-blue-500 to-blue-900",
    items: ["🐟", "🐙", "🦀", "🌊", "🫧", "🐚"],
    colors: ["#03045e", "#023e8a", "#0077b6", "#0096c7"],
  },
  bedroom: {
    name: "Bedroom",
    bg: "bg-gradient-to-br from-indigo-200 to-purple-400",
    items: ["🛏️", "🧸", "📚", "🪀", "🌙", "🖼️"],
    colors: ["#4a4e69", "#c9ada7", "#9a8c98", "#22223b"],
  },
};

export default function LetterFindGame({ onComplete, playAudio, triggerReward, setFeedback }: Props) {
  const [scene, setScene] = useState<SceneType>("jungle");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [targetLetter, setTargetLetter] = useState("");
  const [letters, setLetters] = useState<HiddenLetter[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [found, setFound] = useState(false);
  const [decorations, setDecorations] = useState<{ id: number; icon: string; x: number; y: number; size: number }[]>([]);
  const [wrongShake, setWrongShake] = useState<string | null>(null);

  const sceneSelectorRef = useRef<HTMLDivElement>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout>();

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const generateDecorations = (currentScene: SceneType) => {
    const decors = [];
    const items = SCENES[currentScene].items;
    for (let i = 0; i < 15; i++) {
      decors.push({
        id: i,
        icon: items[Math.floor(Math.random() * items.length)],
        x: Math.random() * 90,
        y: Math.random() * 90,
        size: Math.random() * 3 + 2, // rem
      });
    }
    setDecorations(decors);
  };

  const generateLevel = (currentLevel: number, currentScene: SceneType) => {
    const target = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    setTargetLetter(target);
    setFound(false);
    setShowHint(false);
    setWrongShake(null);
    clearTimeout(hintTimeoutRef.current);

    generateDecorations(currentScene);

    speak(`Can you find the letter ${target}?`);

    let numDistractions = 3;
    let sizeRange = [4, 6]; // rem
    let opacityRange = [0.8, 1];

    if (currentLevel === 2) {
      numDistractions = 6;
      sizeRange = [2, 4];
      opacityRange = [0.6, 0.9];
    } else if (currentLevel >= 3) {
      numDistractions = 12;
      sizeRange = [1.5, 3];
      opacityRange = [0.4, 0.8];
    }

    const newLetters: HiddenLetter[] = [];
    
    // Add target
    newLetters.push({
      id: "target",
      letter: target,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
      rotation: Math.random() * 60 - 30,
      color: SCENES[currentScene].colors[Math.floor(Math.random() * SCENES[currentScene].colors.length)],
      isTarget: true,
      opacity: opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]),
    });

    // Add distractions
    for (let i = 0; i < numDistractions; i++) {
      let distLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      while (distLetter === target) distLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      
      newLetters.push({
        id: `dist_${i}`,
        letter: distLetter,
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 90,
        size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
        rotation: Math.random() * 360,
        color: SCENES[currentScene].colors[Math.floor(Math.random() * SCENES[currentScene].colors.length)],
        isTarget: false,
        opacity: opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]),
      });
    }

    // Shuffle
    setLetters(newLetters.sort(() => Math.random() - 0.5));

    // Auto hint after 10s
    hintTimeoutRef.current = setTimeout(() => {
        setShowHint(true);
    }, 10000);
  };

  useEffect(() => {
    generateLevel(level, scene);
    return () => clearTimeout(hintTimeoutRef.current);
  }, [level, scene]);

  const handleTap = (letter: HiddenLetter) => {
    if (found) return;

    if (letter.isTarget) {
      setFound(true);
      playAudio(SOUND_URLS.pop);
      clearTimeout(hintTimeoutRef.current);
      
      const praises = ["You found it!", "Amazing!", "Great job!", "Awesome!"];
      const praise = praises[Math.floor(Math.random() * praises.length)];
      
      setFeedback({ text: praise, color: "#4caf50" });
      setTimeout(() => speak(praise), 500);

      const newScore = score + 1;
      setScore(newScore);
      
      triggerReward("star", 1);
      setStars(s => s + 1);

      if (newScore > 0 && newScore % 5 === 0) {
          playAudio(SOUND_URLS.awesome);
          triggerReward("badge", 1, `Seeker Lvl ${level}`);
      }

      setTimeout(() => {
        if (newScore > 0 && newScore % 3 === 0) {
            setLevel(l => Math.min(l + 1, 3)); // Max level 3
        } else {
            generateLevel(level, scene);
        }
      }, 2500);

    } else {
      playAudio(SOUND_URLS.wrong);
      setWrongShake(letter.id);
      setTimeout(() => setWrongShake(null), 500);
    }
  };

  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] border-4 border-white/50 flex flex-col">
      {/* Top UI */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white">
        <div className="flex gap-4">
            <select 
               value={scene} 
               onChange={(e) => setScene(e.target.value as SceneType)}
               className="bg-white/80 border-2 border-indigo-200 text-indigo-900 rounded-xl px-4 py-2 font-bold focus:outline-none"
            >
                {Object.entries(SCENES).map(([key, val]) => (
                    <option key={key} value={key}>{val.name}</option>
                ))}
            </select>
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-xl text-yellow-700 font-bold border-2 border-yellow-300">
                ⭐ {stars}
            </div>
            <div className="flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-xl text-indigo-700 font-bold border-2 border-indigo-300">
                Level {level}
            </div>
        </div>

        <div className="text-2xl font-black text-indigo-900 flex items-center gap-2">
            Find <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-3xl">{targetLetter}</span>
        </div>

        <div className="flex gap-2">
            <button 
               onClick={() => setShowHint(true)}
               className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-sm border-b-4 border-orange-600 active:border-b-0 active:translate-y-1"
            >
               💡 Hint
            </button>
            <button 
               onClick={() => onComplete(score, stars)}
               className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm border-b-4 border-red-700 active:border-b-0 active:translate-y-1"
            >
               Exit
            </button>
        </div>
      </div>

      {/* Game Scene */}
      <div className={`flex-1 relative ${SCENES[scene].bg} transition-colors duration-1000 overflow-hidden`}>
          {/* Background decorations */}
          {decorations.map(dec => (
              <motion.div
                 key={dec.id}
                 className="absolute select-none pointer-events-none filter drop-shadow-md pb-4"
                 style={{ left: `${dec.x}%`, top: `${dec.y}%`, fontSize: `${dec.size}rem` }}
                 animate={{
                     y: [0, -10, 0],
                     rotate: [0, 5, -5, 0]
                 }}
                 transition={{ repeat: Infinity, duration: 4 + Math.random() * 4, ease: "easeInOut" }}
              >
                  {dec.icon}
              </motion.div>
          ))}

          {/* Hidden Letters */}
          <AnimatePresence>
            {letters.map(letter => {
                const isFoundTarget = found && letter.isTarget;
                const isHintedTarget = showHint && letter.isTarget && !found;
                const isWrongSelected = wrongShake === letter.id;

                return (
                    <motion.div
                        key={letter.id}
                        className={`absolute select-none cursor-pointer font-black
                           ${isHintedTarget ? 'z-50' : 'z-10'}
                        `}
                        style={{ 
                            left: `${letter.x}%`, 
                            top: `${letter.y}%`, 
                            color: letter.color,
                            fontSize: `${letter.size}rem`,
                            opacity: isFoundTarget ? 1 : letter.opacity,
                            textShadow: isHintedTarget ? `0 0 20px #fff, 0 0 40px #ffeb3b` : `2px 2px 4px rgba(0,0,0,0.3)`
                        }}
                        initial={{ scale: 0, rotation: letter.rotation }}
                        animate={
                            isFoundTarget ? { 
                                scale: [1, 2, 2.5], 
                                opacity: [1, 1, 0],
                                rotation: [letter.rotation, 0],
                                filter: ["brightness(1)", "brightness(2)"]
                            } : isWrongSelected ? {
                                x: [-10, 10, -10, 10, 0],
                                transition: { duration: 0.4 }
                            } : isHintedTarget ? {
                                scale: [1, 1.2, 1],
                                rotate: [letter.rotation, letter.rotation + 10, letter.rotation - 10, letter.rotation],
                                transition: { repeat: Infinity, duration: 1 }
                            } : { 
                                scale: 1, 
                                rotation: letter.rotation 
                            }
                        }
                        onClick={() => handleTap(letter)}
                    >
                        {letter.letter}
                        {isFoundTarget && (
                           <motion.div 
                              className="absolute inset-0 flex items-center justify-center text-yellow-300 pointer-events-none"
                              initial={{ scale: 0, opacity: 1 }}
                              animate={{ scale: 3, opacity: 0 }}
                              transition={{ duration: 0.5 }}
                           >
                               ✨
                           </motion.div>
                        )}
                    </motion.div>
                )
            })}
          </AnimatePresence>
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
          {found && (
              <motion.div 
                 className="absolute inset-0 pointer-events-none z-40 bg-white/10"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
              />
          )}
      </AnimatePresence>
    </div>
  );
}
