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

const EASY_WORDS = [
  { word: "CAT", icon: "🐱" },
  { word: "DOG", icon: "🐶" },
  { word: "SUN", icon: "☀️" },
  { word: "BUS", icon: "🚌" },
  { word: "CAR", icon: "🚗" },
  { word: "FOX", icon: "🦊" },
];

const MEDIUM_WORDS = [
  { word: "BIRD", icon: "🐦" },
  { word: "FROG", icon: "🐸" },
  { word: "DUCK", icon: "🦆" },
  { word: "FISH", icon: "🐟" },
  { word: "BEAR", icon: "🐻" },
  { word: "CRAB", icon: "🦀" },
  { word: "MOON", icon: "🌙" },
];

const HARD_WORDS = [
  { word: "TIGER", icon: "🐯" },
  { word: "ZEBRA", icon: "🦓" },
  { word: "SHARK", icon: "🦈" },
  { word: "SNAKE", icon: "🐍" },
  { word: "TRAIN", icon: "🚂" },
  { word: "MOUSE", icon: "🐭" },
];

const PHONETIC_SOUNDS: Record<string, string> = {
  A: "ah", B: "buh", C: "kuh", D: "duh", E: "eh", F: "ff", G: "guh", H: "huh", 
  I: "ih", J: "juh", K: "kuh", L: "ull", M: "mm", N: "nn", O: "aw", P: "puh", 
  Q: "kwa", R: "err", S: "ss", T: "tuh", U: "uh", V: "vuh", W: "wuh", X: "ks", 
  Y: "yuh", Z: "zz"
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface LetterPoolItem {
  id: string;
  letter: string;
  placedInSlot?: string; // id of the slot it's in
}

interface SlotItem {
  id: string;
  expected: string;
  filledBy: string | null;
}

// Draggable Component
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
      className={`w-16 h-16 md:w-20 md:h-20 flex justify-center items-center rounded-2xl bg-white border-4 border-b-8 shadow-sm cursor-grab active:cursor-grabbing font-black text-4xl md:text-5xl border-emerald-400 text-emerald-700 hover:scale-105 active:scale-95 touch-none`}
    >
      {item.letter}
    </motion.div>
  );
}

// Droppable Component
function DroppableSlot({ slot, item }: { slot: SlotItem, item?: LetterPoolItem, key?: string | number }) {
  const { isOver, setNodeRef } = useDroppable({
    id: slot.id,
    data: { expectedLetter: slot.expected }
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-16 h-16 md:w-20 md:h-20 flex justify-center items-center rounded-2xl border-4 border-dashed transition-all
        ${item 
           ? 'border-emerald-500 bg-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
           : isOver 
             ? 'border-yellow-400 bg-yellow-100 scale-110' 
             : 'border-white/50 bg-black/10'
        }
      `}
    >
      {item && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="font-black text-4xl md:text-5xl text-emerald-600 drop-shadow-sm"
        >
          {item.letter}
        </motion.div>
      )}
    </div>
  );
}

export default function WordBuilderGame({ onComplete, playAudio, triggerReward, setFeedback }: Props) {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  
  const [currentWord, setCurrentWord] = useState<{ word: string, icon: string } | null>(null);
  const [pool, setPool] = useState<LetterPoolItem[]>([]);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  
  const [wrongShake, setWrongShake] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const generateLevel = (currentLevel: number) => {
    setIsCompleted(false);
    
    let wordsToChoose = EASY_WORDS;
    if (currentLevel === 2) wordsToChoose = MEDIUM_WORDS;
    if (currentLevel >= 3) wordsToChoose = HARD_WORDS;
    
    // Pick random word
    const nextWordDef = wordsToChoose[Math.floor(Math.random() * wordsToChoose.length)];
    setCurrentWord(nextWordDef);
    speak(nextWordDef.word);
    
    // Create slots
    const newSlots = nextWordDef.word.split('').map((char, i) => ({
        id: `slot_${i}`,
        expected: char,
        filledBy: null
    }));
    setSlots(newSlots);
    
    // Create pool
    let newPool: LetterPoolItem[] = nextWordDef.word.split('').map((char, i) => ({
        id: `letter_${i}_${char}`,
        letter: char
    }));
    
    // Add extra random letters depending on level
    let extraLetters = 0;
    if (currentLevel === 2) extraLetters = 2;
    if (currentLevel >= 3) extraLetters = 4;
    
    for(let i = 0; i < extraLetters; i++) {
        // exclude letters already in the word to avoid multiple acceptable drops and UI confusion
        // actually if we just add random ones, they might be correct ones but it's fine
        const randLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        newPool.push({
            id: `extra_${i}_${randLetter}`,
            letter: randLetter
        });
    }
    
    // Shuffle pool
    newPool = newPool.sort(() => Math.random() - 0.5);
    setPool(newPool);
  };

  useEffect(() => {
    generateLevel(level);
  }, [level]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (isCompleted) return;
    
    const { active, over } = event;
    if (over) {
       const draggedItem = pool.find(p => p.id === active.id);
       const targetSlotId = over.id as string;
       const targetSlot = slots.find(s => s.id === targetSlotId);
       
       if (draggedItem && targetSlot && !targetSlot.filledBy) {
           if (draggedItem.letter === targetSlot.expected) {
               // Success
               playAudio(SOUND_URLS.pop);
               const pSound = PHONETIC_SOUNDS[draggedItem.letter] || draggedItem.letter;
               speak(pSound); // speak phonetic sound
               
               setPool(prev => prev.map(p => p.id === active.id ? { ...p, placedInSlot: targetSlotId } : p));
               
               let newSlots: SlotItem[] = [];
               setSlots(prev => {
                   newSlots = prev.map(s => s.id === targetSlotId ? { ...s, filledBy: active.id as string } : s);
                   return newSlots;
               });
               
               // Check if completed
               setTimeout(() => {
                   if (newSlots.every(s => s.filledBy)) {
                       handleWordCompleted();
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

  const handleWordCompleted = () => {
      setIsCompleted(true);
      playAudio(SOUND_URLS.awesome);
      if (currentWord) speak(`Great job! It's a ${currentWord.word}`);
      
      setScore(s => s + 1);
      
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      triggerReward('star', 2);
      setStars(s => s + 2);
      
      setFeedback({ text: "Super Spelling! ⭐", color: "#10b981" });
      
      if (newStreak % 3 === 0) {
          triggerReward("badge", 1, `Builder Streak ${newStreak}`);
      }
  };

  const nextWord = () => {
      if (score > 0 && score % 4 === 0) {
          setLevel(l => Math.min(l + 1, 3));
      } else {
          generateLevel(level);
      }
  };

  const replayWord = () => {
      if (currentWord) speak(currentWord.word);
  };

  const getDifficultyColor = () => {
      if (level === 1) return 'from-[#0CDA91] to-[#00A86B]';
      if (level === 2) return 'from-[#FACC15] to-[#EAB308]';
      return 'from-[#F43F5E] to-[#E11D48]';
  };

  return (
    <div className={`relative w-full h-[600px] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] border-4 border-white/50 flex flex-col bg-gradient-to-br transition-colors duration-1000 ${getDifficultyColor()}`}>
      
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-around items-center overflow-hidden">
          <span className="text-[200px] font-black rotate-[-15deg]">Aa</span>
          <span className="text-[150px] font-black rotate-[20deg] translate-y-20">Bb</span>
          <span className="text-[180px] font-black rotate-[-10deg] translate-y-[-40px]">Cc</span>
      </div>

      {/* Top UI */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-white/30 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/50">
        <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-xl text-yellow-700 font-bold border-2 border-yellow-300 shadow-sm">
                ⭐ {stars}
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl text-emerald-800 font-bold border-2 border-emerald-300 shadow-sm">
                Score: {score}
            </div>
        </div>
        
        <div className="flex gap-2">
           <button 
                onClick={() => setLevel(1)} 
                className={`px-3 py-1 rounded-lg font-bold text-sm ${level===1 ? 'bg-emerald-500 text-white shadow-inner' : 'bg-white/50 text-emerald-800'}`}
           >Easy</button>
           <button 
                onClick={() => setLevel(2)} 
                className={`px-3 py-1 rounded-lg font-bold text-sm ${level===2 ? 'bg-yellow-500 text-white shadow-inner' : 'bg-white/50 text-emerald-800'}`}
           >Med</button>
           <button 
                onClick={() => setLevel(3)} 
                className={`px-3 py-1 rounded-lg font-bold text-sm ${level===3 ? 'bg-red-500 text-white shadow-inner' : 'bg-white/50 text-emerald-800'}`}
           >Hard</button>
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
          
          {/* Target Picture */}
          <div className="mb-6 relative">
              <motion.div 
                 className="text-8xl md:text-9xl filter drop-shadow-xl cursor-pointer"
                 animate={isCompleted ? { 
                     scale: [1, 1.2, 1],
                     rotate: [0, -10, 10, -10, 10, 0],
                     transition: { duration: 1 }
                 } : { y: [0, -10, 0] }}
                 transition={{ repeat: isCompleted ? 0 : Infinity, duration: 3, ease: "easeInOut" }}
                 onClick={replayWord}
              >
                  {currentWord?.icon}
              </motion.div>
              
              <button 
                 onClick={replayWord}
                 className="absolute -right-4 -bottom-4 bg-white hover:bg-emerald-50 text-emerald-600 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md border-2 border-emerald-200 transition-colors"
                 title="Hear Word"
              >
                 🔊
              </button>
          </div>

          <DndContext onDragEnd={handleDragEnd}>
              {/* Slots */}
              <div className="flex gap-4 md:gap-6 mb-12 bg-black/20 p-6 md:p-8 rounded-[40px] drop-shadow-lg">
                  {slots.map(slot => {
                      const filledItem = pool.find(p => p.id === slot.filledBy);
                      return <DroppableSlot key={slot.id} slot={slot} item={filledItem} />;
                  })}
              </div>

              {/* Pool of Draggable Letters */}
              <div className="flex flex-wrap gap-4 justify-center max-w-[80%] mx-auto pb-4">
                  {pool.map((item) => {
                      if (item.placedInSlot) return null; // hide if placed
                      return (
                          <DraggableLetter key={item.id} item={item} isWrong={wrongShake === item.id} />
                      )
                  })}
              </div>
          </DndContext>
      </div>

      {/* Success Modal Overlay */}
      <AnimatePresence>
         {isCompleted && (
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
                   <div className="text-[100px] leading-none mb-4">{currentWord?.icon}</div>
                   <h2 className="text-5xl font-black text-emerald-600 mb-6 font-['Baloo_2']">{currentWord?.word}</h2>
                   <p className="text-xl text-gray-500 font-bold mb-8">You spelled it perfectly!</p>
                   
                   <button 
                      onClick={nextWord}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-2xl font-black py-4 rounded-2xl shadow-lg border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-2"
                   >
                      Next Word ➡️
                   </button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
