import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { SOUND_URLS } from "../utils/sounds";
import FeatureGuide from "../components/FeatureGuide";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

const BADGE_DEFS = [
  { id: "first_game", icon: "🎮", label: "First Game" },
  { id: "star_5", icon: "⭐", label: "5 Stars" },
  { id: "star_20", icon: "🌟", label: "20 Stars" },
  { id: "star_50", icon: "💫", label: "50 Stars" },
  { id: "star_100", icon: "✨", label: "100 Stars" },
  { id: "star_500", icon: "🚀", label: "500 Stars" },
  { id: "games_5", icon: "🕹️", label: "5 Games" },
  { id: "games_10", icon: "👾", label: "10 Games" },
  { id: "games_20", icon: "🎲", label: "20 Games" },
  { id: "games_50", icon: "🏆", label: "50 Games" },
  { id: "games_100", icon: "👑", label: "100 Games" },
  { id: "color_wizard", icon: "🎨", label: "Color Wizard" },
  { id: "shape_master", icon: "🔶", label: "Shape Master" },
  { id: "math_whiz", icon: "🔢", label: "Math Whiz" },
  { id: "animal_expert", icon: "🦒", label: "Animal Expert" },
  { id: "daily_hero", icon: "🦸", label: "Daily Hero" },
  { id: "story_master", icon: "📚", label: "Story Master" },
  { id: "curious_explorer", icon: "🔭", label: "Curious Explorer" },
  { id: "letter_hero", icon: "🔤", label: "Letter Hero" },
  { id: "rhymes_star", icon: "🎵", label: "Rhymes Star" },
  { id: "streak_3", icon: "🔥", label: "3 Day Streak" },
  { id: "streak_7", icon: "🔥", label: "7 Day Streak" },
  { id: "streak_14", icon: "🔥", label: "14 Day Streak" },
  { id: "streak_30", icon: "🔥", label: "30 Day Streak" },
  { id: "early_bird", icon: "🌅", label: "Early Bird" },
  { id: "night_owl", icon: "🦉", label: "Night Owl" },
  { id: "weekend_warrior", icon: "⚔️", label: "Weekend Warrior" },
  { id: "perfect_score", icon: "🎯", label: "Perfect Score" },
  { id: "speed_demon", icon: "⚡", label: "Speed Demon" },
  { id: "puzzle_solver", icon: "🧩", label: "Puzzle Solver" }
];

const SUBJECTS = [
  { id: "shapes", bg: "from-[#4ECAFC] to-[#0288d1]", icon: "🔷", title: "Shapes", label: "Learn Squares & Circles!" },
  { id: "letters", bg: "from-[#FFD93D] to-[#FF8C42]", icon: "🔤", title: "Letters", label: "A B C D..." },
  { id: "colors", bg: "from-[#ff8fa3] to-[#c9184a]", icon: "🎨", title: "Colors", label: "Red, Blue, Green!" },
  { id: "numbers", bg: "from-[#8DE365] to-[#388e3c]", icon: "🔢", title: "Numbers", label: "1 2 3 4..." },
  { id: "animals", bg: "from-[#ce93d8] to-[#7b1fa2]", icon: "🦁", title: "Animals", label: "Lions, Tigers, Bears!" },
  { id: "rhymes", bg: "from-[#80deea] to-[#00838f]", icon: "🎵", title: "Rhymes", label: "Baa Baa Black Sheep..." },
  { id: "stories", bg: "from-[#9fa8da] to-[#3949ab]", icon: "📖", title: "Stories", label: "Once upon a time..." },
];

const AVATAR_OPTIONS = ["👦", "👧", "👶", "🦸", "🧚", "🧜", "🥷", "🧙", "😺", "🐶", "🦊", "🐼", "🦄", "🐧"];

const getPetForLevel = (level: number) => {
  if (level < 3) return { emoji: "🥚", name: "Egg", message: "Learn more to hatch me!", stage: 1 };
  if (level < 6) return { emoji: "🦎", name: "Baby Dino", message: "I'm growing bigger!", stage: 2 };
  if (level < 10) return { emoji: "🦖", name: "T-Rex", message: "Roar! We are smart!", stage: 3 };
  return { emoji: "🐉", name: "Dragon", message: "We are learning masters!", stage: 4 };
};

export default function ChildDashboard() {
  const { childId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false);
  
  // Modals
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showChestModal, setShowChestModal] = useState(false);
  const [chestOpened, setChestOpened] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [showBadgesModal, setShowBadgesModal] = useState(false);

  useEffect(() => {
    const playAudioGreeting = () => {
      if (hasPlayedGreeting) return;
      const audioUrl = "https://drive.google.com/uc?export=download&id=1oAOLqBtMgom7r_g7P4hrRi1PwWBa_ZYA";
      const audio = new Audio(audioUrl);
      audio.play().then(() => setHasPlayedGreeting(true)).catch(() => {});
    };

    playAudioGreeting();
    const handleInteraction = () => {
      if (!hasPlayedGreeting) playAudioGreeting();
    };
    
    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, [hasPlayedGreeting]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !childId) return;
    const fetchChild = async () => {
      try {
        const childRef = doc(db, "users", user.uid, "children", childId);
        let snap;
        try {
          snap = await getDoc(childRef);
        } catch (err) {
          console.error("Error in getDoc for child", err);
          throw err;
        }
        
        if (snap.exists()) {
          const data = snap.data();
          const todayStr = new Date().toISOString().split("T")[0];

          let needsUpdate = false;
          let updateData: any = {};

          if (data.lastLoginDate !== todayStr) {
            needsUpdate = true;
            updateData.lastLoginDate = todayStr;

            if (!data.lastLoginDate) {
              updateData.streak = 1;
            } else {
              const lastDate = new Date(data.lastLoginDate);
              const today = new Date(todayStr);
              const diffTime = Math.abs(today.getTime() - lastDate.getTime());
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 1) {
                updateData.streak = (data.streak || 0) + 1;
              } else if (diffDays > 1) {
                updateData.streak = 1;
              }
            }

            updateData.dailyStars = 0;
            updateData.dailyGames = 0;
            updateData.dailyBadges = 0;
            updateData.quest1Claimed = false;
            updateData.quest2Claimed = false;
            updateData.quest3Claimed = false;
            updateData.questCompleted = false;
            updateData.dailyChestClaimed = false;
          }

          if (needsUpdate) {
            try {
              await updateDoc(childRef, updateData);
            } catch (err) {
              console.error("Error in updateDoc for child with data:", updateData, err);
              throw err;
            }
            setProfile({ ...data, ...updateData });
          } else {
            setProfile(data);
          }
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error fetching child", err);
      }
    };
    fetchChild();
  }, [user, childId, navigate]);

  const updateAvatar = async (emoji: string) => {
    if (!user || !childId || !profile) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "children", childId), { avatar: emoji });
      setProfile({ ...profile, avatar: emoji });
      setShowAvatarModal(false);
      const audio = new Audio(SOUND_URLS.correct);
      audio.play().catch(() => {});
    } catch (err) {
      console.error(err);
    }
  };

  const openChest = async () => {
    if (!user || !childId || !profile || profile.dailyChestClaimed) return;
    
    const amount = Math.floor(Math.random() * 20) + 10; // 10 to 30 stars
    setRewardAmount(amount);
    
    // Play sounds
    const openAudio = new Audio(SOUND_URLS.quest);
    openAudio.play().catch(() => {});
    
    setTimeout(() => {
      const taDaAudio = new Audio(SOUND_URLS.awesome);
      taDaAudio.play().catch(() => {});
      setChestOpened(true);
      fireConfetti();
      
      setTimeout(async () => {
        try {
          const newStars = (profile.stars || 0) + amount;
          await updateDoc(doc(db, "users", user.uid, "children", childId), { 
            dailyChestClaimed: true,
            stars: newStars
          });
          setProfile({ ...profile, dailyChestClaimed: true, stars: newStars });
          setTimeout(() => {
            setShowChestModal(false);
            setChestOpened(false);
          }, 2000);
        } catch (error) {
          console.error(error);
        }
      }, 1500);
    }, 1000);
  };

  const fireConfetti = () => {
    const duration = 1500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / 2000);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, shapes: ['star'] as confetti.Shape[], colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'] }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, shapes: ['star'] as confetti.Shape[], colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'] }));
    }, 250);
  };

  const claimQuest = async (questId: number) => {
    if (!user || !childId || !profile) return;
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    
    const audio = new Audio(SOUND_URLS.quest);
    audio.play().catch(() => {});
    setTimeout(() => {
        const audio2 = new Audio(SOUND_URLS.awesome);
        audio2.play().catch(() => {});
    }, 400);

    fireConfetti();

    const updates: any = {};
    updates[`quest${questId}Claimed`] = true;

    let earnedStars = 0;
    if (questId === 1) earnedStars = 5;
    if (questId === 2) earnedStars = 5;
    if (questId === 3) earnedStars = 10;

    updates.stars = (profile.stars || 0) + earnedStars;

    const willCompleteAll =
      (questId === 1 || profile.quest1Claimed) &&
      (questId === 2 || profile.quest2Claimed) &&
      (questId === 3 || profile.quest3Claimed);

    if (willCompleteAll && !profile.questCompleted) {
      updates.questCompleted = true;
      const newBadges = [...(profile.badges || [])];
      if (!newBadges.includes("daily_hero")) {
        newBadges.push("daily_hero");
        updates.badges = newBadges;
      }
    }

    try {
      await updateDoc(doc(db, "users", user.uid, "children", childId), updates);
      setProfile({ ...profile, ...updates });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !profile) return <div className="min-h-screen bg-[#f0f4ff] pt-[62px]"></div>;

  const todayDateObj = new Date();
  const dayOfYear = Math.floor((todayDateObj.getTime() - new Date(todayDateObj.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const q1Stars = 5 + ((dayOfYear % 3) * 5);
  const q2Games = 2 + (dayOfYear % 3);
  const q3Badges = 1;

  // Level System
  const totalStars = profile.stars || 0;
  const level = Math.floor(totalStars / 50) + 1;
  const currentLevelXP = totalStars % 50;
  const xpRequired = 50;
  const progressPercent = (currentLevelXP / xpRequired) * 100;
  
  const pet = getPetForLevel(level);
  const nextSubjectIndex = (dayOfYear + level) % SUBJECTS.length;
  const nextSubject = SUBJECTS[nextSubjectIndex];

  // Weekly Progress Mock Setup
  const currentDayOfWeek = todayDateObj.getDay() === 0 ? 6 : todayDateObj.getDay() - 1; // 0=Mon, 6=Sun
  const streak = profile.streak || 0;
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
    // Basic logic to show streak checkmarks
    let isPlayed = false;
    if (i === currentDayOfWeek) {
      isPlayed = profile.dailyGames > 0 || profile.stars > 0;
    } else if (i < currentDayOfWeek && (currentDayOfWeek - i) < streak) {
      isPlayed = true;
    }
    const isToday = i === currentDayOfWeek;
    return { label, isPlayed, isToday };
  });

  return (
    <div className="bg-[#f0f4ff] min-h-screen text-[#1a1a2e] pt-[62px] font-['Nunito'] relative pb-20">
      
      {/* Decorative Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute top-20 left-[10%] text-5xl">☁️</motion.div>
        <motion.div animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="absolute top-40 right-[15%] text-6xl">☁️</motion.div>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute bottom-20 left-[5%] text-4xl opacity-40">⭐</motion.div>
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="absolute top-[30%] right-[5%] text-3xl opacity-40">✨</motion.div>
      </div>

      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[200] h-[62px] bg-white border-b-2 border-[#e8e8f4] flex items-center justify-between px-4 md:px-9 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="bg-[#f0f4ff] hover:bg-[#e0e8ff] transition-colors text-[#4a4a6a] px-3 py-1.5 rounded-full text-[13px] font-bold no-underline cursor-pointer">
            ← Back
          </button>
          <span className="text-[20px] font-extrabold font-['Baloo_2'] text-[#1aaee8]">
            🎈 Kid<em className="text-[#FF8C42] not-italic">Learn</em>
          </span>
        </div>
        
        {/* Level & XP header bar */}
        <div className="hidden sm:flex items-center gap-3 bg-[#e1f5fe] px-4 py-1.5 rounded-full border-2 border-[#b3e5fc]">
          <span className="font-bold text-[#0288d1] whitespace-nowrap">Level {level}</span>
          <div className="w-24 h-3 bg-white rounded-full overflow-hidden border border-[#81d4fa]">
            <motion.div 
              className="h-full bg-[#03a9f4]" 
              initial={{ width: 0 }} 
              animate={{ width: `${progressPercent}%` }} 
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        <button 
          onClick={() => setShowAvatarModal(true)}
          className="w-10 h-10 rounded-full bg-[#f9f9fd] border-2 border-[#e8e8f4] flex items-center justify-center text-xl hover:scale-110 shadow-sm transition-transform cursor-pointer"
        >
          {profile.avatar}
        </button>
      </nav>

      <main className="max-w-[1000px] mx-auto p-4 md:p-8 pt-6 relative z-10">
        
        {/* Daily Message */}
        {profile.dailyMessage && (
          <motion.div 
            initial={{ y: -30, opacity: 0, rotate: -5 }}
            animate={{ y: 0, opacity: 1, rotate: -1 }}
            className="relative bg-[#fffedb] rounded-[24px] p-5 pb-6 mb-8 shadow-md hover:shadow-lg transition-shadow mx-auto max-w-[600px] border-2 border-[#f4eeb1] cursor-pointer"
            whileHover={{ scale: 1.02, rotate: 1 }}
          >
            <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#ff7b54] shadow-sm border-[3px] border-[#fff] z-10 flex items-center justify-center text-xs">📌</div>
            <p className="font-['Baloo_2'] text-2xl text-center text-[#5a5a5a] relative z-0 italic mt-2">
              "{profile.dailyMessage}"
            </p>
          </motion.div>
        )}

        {/* Hero Section: Pet & Level & Adventure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Pet Profile Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="lg:col-span-1 bg-white rounded-[32px] p-6 shadow-sm border-[4px] border-[#e1f5fe] flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3">
              <div className="bg-[#FFD93D] text-[#8c7414] font-black rounded-full px-3 py-1 shadow-sm border-2 border-[#facd1c] text-sm animate-pulse">
                Lvl {level}
              </div>
            </div>
            
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="text-8xl mb-4 filter drop-shadow-lg"
            >
              {pet.emoji}
            </motion.div>
            
            <h3 className="font-['Baloo_2'] text-2xl font-black text-[#1a1a2e] mb-1">{pet.name}</h3>
            <p className="text-[#64748b] font-bold text-sm mb-4">"{pet.message}"</p>
            
            <div className="w-full bg-[#f0f4ff] rounded-full h-4 mb-2 relative overflow-hidden shadow-inner border border-[#e2e8f0]">
              <motion.div 
                className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#4ECAFC] to-[#03a9f4] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            <div className="text-xs font-bold text-[#8c7414] text-center w-full">
              {currentLevelXP} / {xpRequired} XP to Level {level + 1}!
            </div>
          </motion.div>

          {/* Next Adventure Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="lg:col-span-2 bg-gradient-to-br from-[#FF9A9E] to-[#FECFEF] rounded-[32px] p-8 shadow-sm border-[4px] border-white relative overflow-hidden flex flex-col justify-center"
          >
            <div className="absolute right-[-20%] bottom-[-20%] text-[200px] opacity-20 transform rotate-12">{nextSubject.icon}</div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              <div>
                <div className="bg-white/40 backdrop-blur-sm text-[#ab1143] font-black px-3 py-1 rounded-full w-max text-sm uppercase tracking-wide mb-3 border border-white/50 shadow-sm">
                  Next Mission
                </div>
                <h2 className="font-['Baloo_2'] text-4xl lg:text-5xl font-black text-white drop-shadow-md mb-2">
                  Master {nextSubject.title}!
                </h2>
                <p className="text-white/90 font-bold text-lg mb-6 max-w-sm">
                  Earn more stars and level up your {pet.name} by playing {nextSubject.title.toLowerCase()}.
                </p>
              </div>
              
              <Link 
                to={`/subject/${childId}/${nextSubject.id}`}
                className="shrink-0 bg-white hover:bg-[#fff9fc] text-[#e02b66] font-black text-xl px-8 py-4 rounded-full shadow-[0_8px_0_#d11a54] hover:shadow-[0_4px_0_#d11a54] hover:translate-y-1 transition-all active:shadow-none active:translate-y-2 uppercase flex items-center gap-3 decoration-transparent"
              >
                <span>Play Now</span>
                <span className="text-2xl">🚀</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Stats, Streak, and Daily Chest Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-[24px] p-5 text-center shadow-sm border-[4px] border-[#fbefd6] hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-2 filter drop-shadow-sm">⭐</div>
            <div className="font-['Baloo_2'] text-4xl font-black text-[#8c7414]">{profile.stars || 0}</div>
            <div className="text-sm font-bold text-[#b5a350] uppercase mt-1">Total Stars</div>
          </div>
          
          <div className="bg-white rounded-[24px] p-5 text-center shadow-sm border-[4px] border-[#e1f5fe] hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-2 filter drop-shadow-sm">🎮</div>
            <div className="font-['Baloo_2'] text-4xl font-black text-[#0288d1]">{profile.gamesPlayed || 0}</div>
            <div className="text-sm font-bold text-[#4fc3f7] uppercase mt-1">Games Won</div>
          </div>

          <div className="bg-white rounded-[24px] p-5 text-center shadow-sm border-[4px] border-[#ffebee] hover:-translate-y-1 transition-transform col-span-2 md:col-span-1 flex flex-col justify-center items-center">
            <div className="text-4xl mb-2 filter drop-shadow-sm animate-pulse">🔥</div>
            <div className="font-['Baloo_2'] text-4xl font-black text-[#d32f2f]">{profile.streak || 0}</div>
            <div className="text-sm font-bold text-[#ef5350] uppercase mt-1">Day Streak</div>
          </div>

          <div 
            onClick={() => { if (!profile.dailyChestClaimed) setShowChestModal(true); }}
            className={`bg-gradient-to-b from-[#FFF3B0] to-[#CA1551] rounded-[24px] p-1 text-center shadow-sm hover:-translate-y-1 transition-transform col-span-2 md:col-span-1 cursor-pointer relative overflow-hidden group ${profile.dailyChestClaimed ? 'opacity-70 grayscale-[30%]' : ''}`}
          >
            <div className="bg-white rounded-[20px] w-full h-full flex flex-col justify-center items-center py-4 relative z-10">
              <motion.div 
                animate={!profile.dailyChestClaimed ? { rotate: [-5, 5, -5] } : {}} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-5xl mb-1 filter drop-shadow-md group-hover:scale-110 transition-transform"
              >
                {profile.dailyChestClaimed ? '📦' : '🎁'}
              </motion.div>
              <div className="font-['Baloo_2'] text-xl font-black text-[#1a1a2e] mt-1">
                {profile.dailyChestClaimed ? 'Opened!' : 'Daily Chest'}
              </div>
              {!profile.dailyChestClaimed && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Journey Track */}
        <div className="bg-white rounded-[32px] p-6 mb-8 shadow-sm border-[4px] border-[#f3e5f5]">
          <h3 className="font-['Baloo_2'] text-2xl font-black text-[#1a1a2e] mb-4 text-center">Weekly Journey 🗺️</h3>
          <div className="flex justify-between items-center max-w-[600px] mx-auto relative px-2">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-[5%] right-[5%] h-2 bg-[#f0f4ff] -translate-y-1/2 rounded-full z-0"></div>
            <motion.div 
              className="absolute top-1/2 left-[5%] h-2 bg-[#FFD93D] -translate-y-1/2 rounded-full z-0"
              initial={{ width: 0 }}
              animate={{ width: `${(Math.max(0, currentDayOfWeek) / 6) * 90}%` }}
              transition={{ duration: 1 }}
            />
            
            {weekDays.map((day, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all border-4 ${day.isPlayed ? 'bg-[#FFD93D] text-[#8c7414] border-[#fbefd6] scale-110' : day.isToday ? 'bg-white border-[#4ECAFC] text-[#4ECAFC]' : 'bg-white border-[#f0f4ff] text-[#cbd5e1]'}`}>
                  {day.isPlayed ? '⭐' : day.label}
                </div>
                {day.isToday && <div className="text-[10px] uppercase font-bold text-[#4ECAFC]">Today</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Layout for Badges & Quests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Daily Quests */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border-[4px] border-[#e8e8f4] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-['Baloo_2'] text-2xl font-black text-[#1a1a2e]">Daily Quests Tab 📜</h2>
            </div>
            
            <div className="flex flex-col gap-4 flex-1 justify-around">
              {[
                { id: 1, title: `Earn ${q1Stars} Stars`, current: profile?.dailyStars || 0, target: q1Stars, claimed: profile?.quest1Claimed, icon: "⚡", bg: "bg-[#FFD93D]", text: "text-[#8c7414]" },
                { id: 2, title: `Play ${q2Games} Games`, current: profile?.dailyGames || 0, target: q2Games, claimed: profile?.quest2Claimed, icon: "🎯", bg: "bg-[#FF8C42]", text: "text-white" },
                { id: 3, title: `Earn 1 Badge`, current: profile?.dailyBadges || 0, target: q3Badges, claimed: profile?.quest3Claimed, icon: "🏆", bg: "bg-[#4ECAFC]", text: "text-white" }
              ].map(quest => (
                <div key={quest.id} className={`bg-[#f9f9fd] rounded-[20px] p-4 flex items-center gap-4 border-2 border-[#e8e8f4] ${quest.claimed ? 'opacity-60' : ''}`}>
                  <div className="w-14 h-14 shrink-0 rounded-[16px] bg-white shadow-sm flex items-center justify-center text-3xl">
                    {quest.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#4a4a6a] mb-1">{quest.title}</div>
                    <div className="h-3 bg-[#e6ebf5] rounded-full overflow-hidden relative">
                      <div className={`absolute top-0 bottom-0 left-0 ${quest.bg} rounded-full`} style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }} />
                    </div>
                  </div>
                  {quest.current >= quest.target && !quest.claimed ? (
                    <button onClick={() => claimQuest(quest.id)} className={`shrink-0 ${quest.bg} ${quest.text} font-black text-xs px-4 py-2 rounded-full shadow-sm hover:scale-105 active:scale-95 uppercase`}>
                      Claim!
                    </button>
                  ) : quest.claimed ? (
                    <div className="shrink-0 font-bold text-[#4CAF50] text-xl">✅</div>
                  ) : (
                    <div className="shrink-0 font-bold text-[#94a3b8] text-sm">{quest.current}/{quest.target}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Badges Preview */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border-[4px] border-[#e8e8f4] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Baloo_2'] text-2xl font-black text-[#1a1a2e]">My Badges 🏅</h2>
              <button 
                onClick={() => setShowBadgesModal(true)}
                className="text-[#4ECAFC] font-bold hover:underline text-sm uppercase tracking-wide"
              >
                View All {(profile.badges?.length || 0)}/{BADGE_DEFS.length}
              </button>
            </div>
            
            <div className="bg-[#f9f9fd] rounded-[24px] p-6 border-2 border-[#e8e8f4] flex-1 flex flex-col justify-center">
              {profile.badges?.length === 0 ? (
                <div className="text-center text-[#94a3b8] font-bold">
                  <div className="text-5xl mb-2 opacity-50">🏆</div>
                  Play games to unlock your first badge!
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {BADGE_DEFS.filter(b => profile.badges?.includes(b.id)).slice(0, 8).map(b => (
                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} key={b.id} className="aspect-square rounded-full bg-white shadow-sm flex items-center justify-center text-3xl border-2 border-[#fbefd6]" title={b.label}>
                      {b.icon}
                    </motion.div>
                  ))}
                  {(profile.badges?.length || 0) > 8 && (
                    <div className="aspect-square rounded-full bg-[#f0f4ff] font-bold text-[#64748b] flex items-center justify-center border-2 border-[#e2e8f0] border-dashed text-sm cursor-pointer" onClick={() => setShowBadgesModal(true)}>
                      +{(profile.badges?.length || 0) - 8}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Categories Section */}
        <h2 className="font-['Baloo_2'] text-3xl md:text-4xl font-black text-center mb-8 relative z-10">
          Explore Subjects 🧩
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          {SUBJECTS.map((sub, i) => (
            <Link
              key={sub.id}
              to={`/subject/${childId}/${sub.id}`}
              className={`relative overflow-hidden group rounded-[32px] p-6 text-white no-underline block hover:-translate-y-2 shadow-sm hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${sub.bg}`}
            >
              <div className="absolute top-[-10%] right-[-10%] text-[100px] opacity-20 transform group-hover:scale-110 transition-transform duration-500 group-hover:rotate-12">
                {sub.icon}
              </div>
              <div className="relative z-10 h-full flex flex-col items-center text-center">
                <span className="text-6xl block mb-4 filter drop-shadow-md transform group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                  {sub.icon}
                </span>
                <h3 className="font-['Baloo_2'] text-3xl font-black mb-1 drop-shadow-sm">
                  {sub.title}
                </h3>
                <p className="font-bold opacity-90 text-sm leading-tight">{sub.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Avatar Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1a1a2e]/60 backdrop-blur-sm" onClick={() => setShowAvatarModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 40 }} className="bg-white rounded-[32px] p-8 max-w-md w-full relative z-10 shadow-2xl border-4 border-[#e8e8f4]">
              <h2 className="font-['Baloo_2'] text-3xl font-black text-center mb-6">Choose your Avatar! ✨</h2>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                {AVATAR_OPTIONS.map(emoji => (
                  <button key={emoji} onClick={() => updateAvatar(emoji)} className={`aspect-square text-4xl rounded-[20px] flex items-center justify-center transition-all ${profile.avatar === emoji ? 'bg-[#FFD93D] shadow-inner scale-95 border-b-0' : 'bg-[#f0f4ff] shadow-[0_4px_0_#dbeafe] hover:-translate-y-1 hover:shadow-[0_6px_0_#dbeafe] active:translate-y-1 active:shadow-none'}`}>
                    {emoji}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAvatarModal(false)} className="mt-8 w-full bg-[#f0f4ff] text-[#64748b] font-bold py-3 rounded-full hover:bg-[#e2e8f0] transition-colors uppercase tracking-wide">
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Treasure Chest Modal */}
      <AnimatePresence>
        {showChestModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1a1a2e]/80 backdrop-blur-sm" onClick={() => !chestOpened && setShowChestModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative z-10 flex flex-col items-center">
              
              {!chestOpened ? (
                <div className="text-center">
                  <h2 className="font-['Baloo_2'] text-4xl text-white font-black mb-8 drop-shadow-lg">Daily Treasure!</h2>
                  <motion.button 
                    animate={{ rotate: [-2, 2, -2], scale: [1, 1.05, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    onClick={openChest}
                    className="text-[150px] filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:scale-110 active:scale-95 transition-transform"
                  >
                    🎁
                  </motion.button>
                  <p className="text-white font-bold text-xl mt-8 bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm">Tap to open!</p>
                </div>
              ) : (
                <motion.div initial={{ scale: 0.5, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border-8 border-[#FFD93D] shadow-[0_0_50px_#FFD93D]">
                  <div className="text-[100px] mb-4">📦</div>
                  <h2 className="font-['Baloo_2'] text-3xl font-black text-[#1a1a2e] mb-2">You found</h2>
                  <div className="text-6xl font-black text-[#FF8C42] mb-2 drop-shadow-sm flex items-center justify-center gap-2">
                    +{rewardAmount} <span className="text-5xl">⭐</span>
                  </div>
                  <p className="text-[#64748b] font-bold">Awesome job! Come back tomorrow for more!</p>
                </motion.div>
              )}
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Badges Modal */}
      <AnimatePresence>
        {showBadgesModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 py-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1a1a2e]/60 backdrop-blur-sm" onClick={() => setShowBadgesModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-4xl relative z-10 shadow-2xl border-4 border-[#e8e8f4] flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="font-['Baloo_2'] text-3xl md:text-4xl font-black text-[#1a1a2e]">Badge Collection 🏆</h2>
                <button onClick={() => setShowBadgesModal(false)} className="w-10 h-10 rounded-full bg-[#f0f4ff] font-bold text-xl flex items-center justify-center hover:bg-[#e2e8f0] transition-colors">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {BADGE_DEFS.map(b => {
                    const isUnlocked = profile.badges?.includes(b.id);
                    return (
                      <div key={b.id} className={`bg-[#f9f9fd] rounded-[24px] p-4 flex flex-col items-center text-center border-2 transition-all ${isUnlocked ? 'border-[#FFD93D] shadow-sm transform hover:-translate-y-1' : 'border-[#e8e8f4] opacity-60 grayscale'}`}>
                        <div className="text-5xl mb-3 filter drop-shadow-sm">{b.icon}</div>
                        <div className="font-bold text-[#1a1a2e] text-sm leading-tight">{b.label}</div>
                        {!isUnlocked && <div className="text-xs font-bold text-[#94a3b8] mt-1 uppercase tracking-wider">Locked</div>}
                        {isUnlocked && <div className="text-xs font-bold text-[#4CAF50] mt-1 uppercase tracking-wider bg-[#E8F5E9] px-2 py-0.5 rounded-full">Unlocked</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FeatureGuide featureId="child_dashboard" title="Welcome to your Gamified Dashboard! 🚀" description="Track your Level, feed your Learning Pet, discover the Daily Treasure Chest, and complete Quests to earn Epic Badges!" position="bottom-right" />
    </div>
  );
}
