import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { SOUND_URLS } from "../../utils/sounds";

interface Props {
  onComplete: (score?: number, stars?: number) => void;
  playAudio: (url: string) => void;
  triggerReward: (type: "star" | "badge", amount?: number, badgeName?: string) => void;
  setFeedback: (feedback: { text: string; color: string }) => void;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface LetterPoolItem {
  id: string;
  letter: string;
  placedInSlot?: string;
}

interface SlotItem {
  id: string;
  expected: string;
  filledBy: string | null;
}

function DraggableLetter({ item, isWrong }: { item: LetterPoolItem, isWrong: boolean, key?: string | number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { letter: item.letter }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 10,
  } : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={`w-16 h-16 md:w-20 md:h-20 flex justify-center items-center rounded-2xl bg-white border-4 border-b-8 shadow-sm cursor-grab active:cursor-grabbing font-black text-4xl md:text-5xl border-blue-400 text-blue-700 hover:scale-105 active:scale-95 touch-none`}
    >
      {item.letter}
    </motion.div>
  );
}

function DroppableSlot({ slot, item }: { slot: SlotItem, item?: LetterPoolItem, key?: string | number }) {
  const { isOver, setNodeRef } = useDroppable({
    id: slot.id,
    data: { expectedLetter: slot.expected }
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative w-16 h-16 md:w-20 md:h-20 flex justify-center items-center rounded-2xl border-4 border-dashed transition-all
        ${item 
           ? 'border-blue-500 bg-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
           : isOver 
             ? 'border-yellow-400 bg-yellow-100 scale-110' 
             : 'border-white/50 bg-black/10'
        }
      `}
    >
      {/* Show tiny hint number maybe? */}
      {!item && <span className="absolute opacity-20 text-lg font-bold"></span>}
      {item && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="font-black text-4xl md:text-5xl text-blue-600 drop-shadow-sm"
        >
          {item.letter}
        </motion.div>
      )}
    </div>
  );
}

export default function LetterOrderGame({ onComplete, playAudio, triggerReward, setFeedback }: Props) {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  
  const [pool, setPool] = useState<LetterPoolItem[]>([]);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  
  const [wrongShake, setWrongShake] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Time is up!
      setGameOver(true);
      setIsActive(false);
      playAudio(SOUND_URLS.wrong);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, playAudio]);

  const generateLevel = (currentLevel: number) => {
    setIsCompleted(false);
    
    // Determine how many letters based on level
    let sequenceLength = 3;
    if (currentLevel === 2) sequenceLength = 4;
    if (currentLevel >= 3) sequenceLength = 5;

    // Pick a random starting point in the alphabet
    const maxStart = ALPHABET.length - sequenceLength;
    const startIndex = Math.floor(Math.random() * (maxStart + 1));
    
    const sequence = ALPHABET.substring(startIndex, startIndex + sequenceLength).split('');
    
    speak(`Put the letters in order!`);
    
    // Create slots
    const newSlots = sequence.map((char, i) => ({
        id: `slot_${i}`,
        expected: char,
        filledBy: null
    }));
    setSlots(newSlots);
    
    // Create pool and shuffle
    let newPool: LetterPoolItem[] = sequence.map((char, i) => ({
        id: `letter_${i}_${char}`,
        letter: char
    }));
    
    newPool = newPool.sort(() => Math.random() - 0.5);
    setPool(newPool);
  };

  useEffect(() => {
    generateLevel(level);
    setIsActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (isCompleted || gameOver) return;
    
    const { active, over } = event;
    if (over) {
       const draggedItem = pool.find(p => p.id === active.id);
       const targetSlotId = over.id as string;
       const targetSlot = slots.find(s => s.id === targetSlotId);
       
       if (draggedItem && targetSlot && !targetSlot.filledBy) {
           if (draggedItem.letter === targetSlot.expected) {
               // Success
               playAudio(SOUND_URLS.pop);
               speak(draggedItem.letter);
               
               setPool(prev => prev.map(p => p.id === active.id ? { ...p, placedInSlot: targetSlotId } : p));
               
               let newSlots: SlotItem[] = [];
               setSlots(prev => {
                   newSlots = prev.map(s => s.id === targetSlotId ? { ...s, filledBy: active.id as string } : s);
                   return newSlots;
               });
               
               // Check if completed
               setTimeout(() => {
                   if (newSlots.every(s => s.filledBy)) {
                       handleSequenceCompleted();
                   }
               }, 100);
           } else {
               playAudio(SOUND_URLS.wrong);
               setWrongShake(active.id as string);
               setTimeout(() => setWrongShake(null), 500);
           }
       }
    }
  };

  const handleSequenceCompleted = () => {
      setIsCompleted(true);
      playAudio(SOUND_URLS.awesome);
      speak(`Great job!`);
      
      setScore(s => s + 10);
      setTimeLeft(t => Math.min(t + 5, 60)); // bonus time
      
      triggerReward('star', 2);
      setStars(s => s + 2);
      
      setFeedback({ text: "Perfect order! ⭐", color: "#3b82f6" });
  };

  const nextSequence = () => {
      if (score > 0 && score % 30 === 0) {
          setLevel(l => Math.min(l + 1, 3));
      } else {
          generateLevel(level);
      }
  };

  const getDifficultyColor = () => {
      if (level === 1) return 'from-[#60A5FA] to-[#3B82F6]';
      if (level === 2) return 'from-[#A78BFA] to-[#8B5CF6]';
      return 'from-[#F472B6] to-[#EC4899]';
  };

  return (
    <div className={`relative w-full h-[600px] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] border-4 border-white/50 flex flex-col bg-gradient-to-br transition-colors duration-1000 ${getDifficultyColor()}`}>
      
      {/* Top UI */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-white/30 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/50">
        <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-xl text-yellow-700 font-bold border-2 border-yellow-300 shadow-sm">
                ⭐ {stars}
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl text-blue-800 font-bold border-2 border-blue-300 shadow-sm">
                Score: {score}
            </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border-2 shadow-sm ${timeLeft <= 10 ? 'bg-red-100 text-red-700 border-red-300 animate-pulse' : 'bg-white/80 text-gray-800 border-gray-300'}`}>
            ⏱️ {timeLeft}s
        </div>
        
        <div>
            <button 
               onClick={() => onComplete(score, stars)}
               className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm border-b-4 border-red-700 active:border-b-0 active:translate-y-1"
            >
               Exit
            </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center pt-20 z-10">
          
          <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-md mb-8">
              Put the letters in order!
          </h2>

          <DndContext onDragEnd={handleDragEnd}>
              {/* Slots */}
              <div className="flex gap-2 md:gap-4 mb-12 bg-black/20 p-4 md:p-6 rounded-[30px] md:rounded-[40px] drop-shadow-lg">
                  {slots.map(slot => {
                      const filledItem = pool.find(p => p.id === slot.filledBy);
                      return <DroppableSlot key={slot.id} slot={slot} item={filledItem} />;
                  })}
              </div>

              {/* Pool of Draggable Letters */}
              <div className="flex flex-wrap gap-4 justify-center max-w-[90%] mx-auto pb-4">
                  {pool.map((item) => {
                      if (item.placedInSlot) return null;
                      return (
                          <DraggableLetter key={item.id} item={item} isWrong={wrongShake === item.id} />
                      )
                  })}
              </div>
          </DndContext>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
         {isCompleted && !gameOver && (
            <motion.div 
               className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
            >
               <motion.div 
                  className="bg-white p-10 rounded-[40px] text-center shadow-2xl max-w-sm w-full"
                  initial={{ scale: 0.5, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.5 }}
               >
                   <div className="text-[80px] leading-none mb-4">🏆</div>
                   <h2 className="text-4xl font-black text-blue-600 mb-2 font-['Baloo_2']">Awesome!</h2>
                   <p className="text-xl text-gray-500 font-bold mb-8">+10 Points & +5s</p>
                   
                   <button 
                      onClick={nextSequence}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white text-2xl font-black py-4 rounded-2xl shadow-lg border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-2"
                   >
                      Next ➡️
                   </button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
         {gameOver && (
            <motion.div 
               className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
            >
               <motion.div 
                  className="bg-white p-10 rounded-[40px] text-center shadow-2xl max-w-sm w-full"
                  initial={{ scale: 0.5, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.5 }}
               >
                   <div className="text-[80px] leading-none mb-4">⏳</div>
                   <h2 className="text-5xl font-black text-red-500 mb-4 font-['Baloo_2']">Time's Up!</h2>
                   <p className="text-xl text-gray-600 font-bold mb-8">You scored <span className="text-blue-500 text-2xl">{score}</span> points!</p>
                   
                   <div className="flex flex-col gap-3">
                       <button 
                          onClick={() => {
                              setScore(0);
                              setStars(0);
                              setTimeLeft(60);
                              setLevel(1);
                              setGameOver(false);
                          }}
                          className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-black py-3 rounded-2xl shadow-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all"
                       >
                          Play Again
                       </button>
                       <button 
                          onClick={() => onComplete(score, stars)}
                          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-xl font-black py-3 rounded-2xl shadow border-b-4 border-gray-400 active:border-b-0 active:translate-y-1 transition-all"
                       >
                          Exit Game
                       </button>
                   </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
