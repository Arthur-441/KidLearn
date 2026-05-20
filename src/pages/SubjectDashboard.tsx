import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { SOUND_URLS } from "../utils/sounds";
import { LETTER_CARDS, NUMBER_CARDS, COLOR_CARDS } from "../components/cardsData";

const SUBJECT_MODES: Record<string, any[]> = {
  shapes: [
    { mode: "lesson_0", title: "Lesson 1: Circle", icon: "🔴", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Learn about circles", premium: false },
    { mode: "lesson_1", title: "Lesson 2: Square", icon: "🟦", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Learn about squares", premium: false },
    { mode: "lesson_2", title: "Lesson 3: Triangle", icon: "🔺", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Learn about triangles", premium: false },
    { mode: "lesson_3", title: "Lesson 4: Star", icon: "⭐", bg: "from-[#8DE365] to-[#388e3c]", label: "Learn about stars", premium: false },
    { mode: "lesson_4", title: "Lesson 5: Rectangle", icon: "▭", bg: "from-[#8DE365] to-[#388e3c]", label: "Learn about rectangles", premium: true },
    { mode: "interactive", title: "Shape Properties", icon: "✨", bg: "from-[#ff8fa3] to-[#c9184a]", label: "Interactive shape fun", premium: false },
    { mode: "quiz", title: "Shape Quiz", icon: "❓", bg: "from-[#4ECAFC] to-[#0288d1]", label: "Guess the shape!", premium: false },
    { mode: "match", title: "Shape Match", icon: "🧩", bg: "from-[#ff8fa3] to-[#c9184a]", label: "Find the matching pairs", premium: true },
    { mode: "shape_builder", title: "Shape Builder", icon: "🧱", bg: "from-[#0CDA91] to-[#00A86B]", label: "Build shapes from parts", premium: false },
    { mode: "shape_sorter", title: "Shape Sorter", icon: "📥", bg: "from-[#FFB03A] to-[#FF7B00]", label: "Sort items by shape", premium: false },
    { mode: "shape_tracer", title: "Shape Tracer", icon: "✍️", bg: "from-[#60CDD4] to-[#0A8894]", label: "Trace the shapes", premium: true },
  ],
  letters: [
    { mode: "lesson_0", title: "Lesson 1: A to E", icon: "📚", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Learn letters A-E", premium: false },
    { mode: "lesson_1", title: "Lesson 2: F to J", icon: "📚", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Learn letters F-J", premium: false },
    { mode: "lesson_2", title: "Lesson 3: K to O", icon: "📚", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Learn letters K-O", premium: false },
    { mode: "lesson_3", title: "Lesson 4: P to T", icon: "📚", bg: "from-[#8DE365] to-[#388e3c]", label: "Learn letters P-T", premium: false },
    { mode: "lesson_4", title: "Lesson 5: U to Z", icon: "📚", bg: "from-[#8DE365] to-[#388e3c]", label: "Learn letters U-Z", premium: true },
    { mode: "letter_pop", title: "Bubble Pop", icon: "🫧", bg: "from-[#4ECAFC] to-[#016FB9]", label: "Pop the correct letter bubbles", premium: false },
    { mode: "letter_catch", title: "Catch It!", icon: "🧺", bg: "from-[#8DE365] to-[#388e3c]", label: "Catch falling letters", premium: false },
    { mode: "letter_ninja", title: "Letter Ninja", icon: "🥷", bg: "from-[#ff8fa3] to-[#c9184a]", label: "Slice the target letter", premium: false },
    { mode: "letter_match", title: "Memory Match", icon: "🧩", bg: "from-[#FFB03A] to-[#FF7B00]", label: "Match uppercase & lowercase", premium: false },
    { mode: "letter_space", title: "Space Dash", icon: "🚀", bg: "from-[#9fa8da] to-[#3949ab]", label: "Blast letter asteroids", premium: true },
    { mode: "letter_find", title: "Hide & Seek", icon: "🕵️", bg: "from-[#9B5DE5] to-[#5A189A]", label: "Find hidden letters", premium: true },
    { mode: "letter_build", title: "Word Builder", icon: "🧱", bg: "from-[#0CDA91] to-[#00A86B]", label: "Build 3-letter words", premium: true },
    { mode: "letter_racer", title: "ABC Racer", icon: "🏎️", bg: "from-[#F15BB5] to-[#D90368]", label: "Race to the right letter", premium: true },
    { mode: "letter_piano", title: "Musical ABCs", icon: "🎹", bg: "from-[#4ECAFC] to-[#016FB9]", label: "Play the letter sounds", premium: true },
    { mode: "letter_tracing", title: "Trace Letter", icon: "✍️", bg: "from-[#FFD93D] to-[#FCA311]", label: "Learn to write A-Z", premium: true },
    { mode: "letter_fishing", title: "ABC Fishing", icon: "🎣", bg: "from-[#C47BD7] to-[#8C2BA8]", label: "Fish for letters", premium: true },
    { mode: "letter_order", title: "ABC Order", icon: "🔤", bg: "from-[#60A5FA] to-[#3B82F6]", label: "Put letters in correct order", premium: false },
    { mode: "interactive", title: "Play with Letters", icon: "✨", bg: "from-[#ec407a] to-[#c2185b]", label: "Interactive alphabet fun", premium: false },
  ],
  colors: [
    { mode: "lesson_0", title: "Lesson 1: Primary Colors", icon: "🔴", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Red, blue, yellow", premium: false },
    { mode: "lesson_1", title: "Lesson 2: Secondary Colors", icon: "🟢", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Green, orange, purple", premium: false },
    { mode: "lesson_2", title: "Lesson 3: Light & Dark", icon: "🌗", bg: "from-[#8DE365] to-[#388e3c]", label: "Shades of colors", premium: true },
    { mode: "interactive", title: "Color Explorer", icon: "✨", bg: "from-[#ec407a] to-[#c2185b]", label: "Explore the magic of colors", premium: false },
    { mode: "quiz", title: "Color Quiz", icon: "❓", bg: "from-[#ff8fa3] to-[#c9184a]", label: "Guess the color!", premium: false },
    { mode: "match", title: "Color Match", icon: "🧩", bg: "from-[#8DE365] to-[#388e3c]", label: "Find matching colors", premium: true },
    { mode: "color_catcher", title: "Color Catch", icon: "🎈", bg: "from-[#FFD93D] to-[#F57C00]", label: "Catch colored balloons", premium: false },
    { mode: "color_mixer", title: "Color Mixer", icon: "🧪", bg: "from-[#0CDA91] to-[#00A86B]", label: "Mix colors together!", premium: true },
  ],
  numbers: [
    { mode: "lesson_0", title: "Lesson 1: Numbers 1-3", icon: "1️⃣", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Learn 1, 2, and 3", premium: false },
    { mode: "lesson_1", title: "Lesson 2: Numbers 4-6", icon: "4️⃣", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Learn 4, 5, and 6", premium: false },
    { mode: "lesson_2", title: "Lesson 3: Numbers 7-10", icon: "7️⃣", bg: "from-[#8DE365] to-[#388e3c]", label: "Learn 7 to 10", premium: false },
    { mode: "quiz", title: "Number Quiz", icon: "❓", bg: "from-[#8DE365] to-[#388e3c]", label: "Guess the number!", premium: false },
    { mode: "match", title: "Number Match", icon: "🧩", bg: "from-[#4ECAFC] to-[#0288d1]", label: "Match the numbers", premium: true },
    { mode: "number_pop", title: "Math Pop", icon: "🫧", bg: "from-[#ff8fa3] to-[#c9184a]", label: "Pop bubbles that match!", premium: false },
    { mode: "number_catch", title: "Catch the Number", icon: "🧺", bg: "from-[#FFD93D] to-[#F57C00]", label: "Catch what you need!", premium: false },
    { mode: "interactive", title: "Number Explorer", icon: "✨", bg: "from-[#ec407a] to-[#c2185b]", label: "Interactive math fun", premium: true },
  ],
  animals: [
    { mode: "lesson_0", title: "Lesson 1: Pets", icon: "🐶", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Learn about pets", premium: false },
    { mode: "lesson_1", title: "Lesson 2: Farm Animals", icon: "🐄", bg: "from-[#ce93d8] to-[#7b1fa2]", label: "Learn farm animals", premium: false },
    { mode: "lesson_2", title: "Lesson 3: Wild Animals", icon: "🦁", bg: "from-[#8DE365] to-[#388e3c]", label: "Learn wild animals", premium: true },
    { mode: "quiz", title: "Animal Quiz", icon: "❓", bg: "from-[#ff8fa3] to-[#c9184a]", label: "Guess the animal!", premium: false },
    { mode: "match", title: "Animal Match", icon: "🧩", bg: "from-[#4ECAFC] to-[#0288d1]", label: "Match the animals", premium: true },
    { mode: "interactive", title: "Animal Safari", icon: "✨", bg: "from-[#ec407a] to-[#c2185b]", label: "Interactive animal fun", premium: false },
  ],
  rhymes: [
    { mode: "lesson_0", title: "Wise Old Owl", icon: "🦉", bg: "from-[#80deea] to-[#00838f]", label: "Listen to the rhyme", premium: false },
    { mode: "lesson_1", title: "Baa Baa Black Sheep", icon: "🐑", bg: "from-[#80deea] to-[#00838f]", label: "Classic sing-along", premium: false },
    { mode: "lesson_2", title: "Cobbler Mend My Shoe", icon: "👞", bg: "from-[#ff8fa3] to-[#c9184a]", label: "Fun rhymes", premium: true },
    { mode: "lesson_3", title: "Eensy Weensy Spider", icon: "🕷️", bg: "from-[#ff8fa3] to-[#c9184a]", label: "Crawling spider song", premium: true },
  ],
  stories: [
    { mode: "lesson_0", title: "The Hungry Caterpillar", icon: "🐛", bg: "from-[#9fa8da] to-[#3949ab]", label: "Listen to a story", premium: false },
    { mode: "lesson_1", title: "The Boy Who Cried Wolf", icon: "🐺", bg: "from-[#9fa8da] to-[#3949ab]", label: "Important lessons", premium: false },
    { mode: "lesson_2", title: "The Golden Goose", icon: "🪿", bg: "from-[#f48fb1] to-[#c2185b]", label: "A fairy tale story", premium: true },
    { mode: "interactive", title: "Play a Story", icon: "✨", bg: "from-[#f48fb1] to-[#c2185b]", label: "Interactive story game!", premium: true },
  ],
};

const SUBJECT_INFO: Record<string, { title: string; emotion: string }> = {
  shapes: { title: "Shapes", emotion: "🔷" },
  letters: { title: "Letters", emotion: "🔤" },
  colors: { title: "Colors", emotion: "🎨" },
  numbers: { title: "Numbers", emotion: "🔢" },
  animals: { title: "Animals", emotion: "🦁" },
  rhymes: { title: "Rhymes", emotion: "🎵" },
  stories: { title: "Stories", emotion: "📖" },
};

const SHAPE_CARDS = [
  {
    id: "circle",
    name: "Circle",
    icon: "🔵",
    color: "#0288d1",
    desc: "I'm round like a wheel! I go round and round with no corners.",
  },
  {
    id: "square",
    name: "Square",
    icon: "🟦",
    color: "#ff8fa3",
    desc: "I have four equal sides! Just like a box or a window.",
  },
  {
    id: "triangle",
    name: "Triangle",
    icon: "🔺",
    color: "#388e3c",
    desc: "I have three sides and three points! Like a slice of pizza.",
  },
  {
    id: "star",
    name: "Star",
    icon: "⭐",
    color: "#FFB03A",
    desc: "I shine bright in the night sky with my five little points!",
  },
];

export default function SubjectDashboard() {
  const { childId, subject } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [isViewingLessons, setIsViewingLessons] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !childId) return;
    const fetchPremium = async () => {
      const childRef = doc(db, "users", user.uid, "children", childId);
      const childSnap = await getDoc(childRef);
      if (childSnap.exists()) {
        const data = childSnap.data();
        if (data.isPremium) {
          if (data.premiumExpireAt && data.premiumExpireAt.toDate() < new Date()) {
            setIsPremium(false);
          } else {
            setIsPremium(true);
          }
        } else {
          setIsPremium(false);
        }
      }
    };
    fetchPremium();
  }, [user, childId]);

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch((e) => console.log("Audio play failed:", e));
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.15;
      utterance.lang = "en-US";
      const voices = window.speechSynthesis.getVoices();
      const preferredNames = [
        "Google US English",
        "Google UK English Female",
        "Samantha",
        "Victoria",
        "Karen",
        "Tessa",
        "Microsoft Zira Desktop",
        "Microsoft Zira",
      ];
      let femaleVoice = voices.find((voice) =>
        preferredNames.includes(voice.name),
      );
      if (!femaleVoice) {
        femaleVoice = voices.find(
          (voice) =>
            voice.name.toLowerCase().includes("female") ||
            voice.name.toLowerCase().includes("woman") ||
            voice.name.toLowerCase().includes("samantha") ||
            voice.name.toLowerCase().includes("girl"),
        );
      }
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading || !subject || !SUBJECT_MODES[subject])
    return <div className="min-h-screen bg-[#f0f4ff] pt-[62px]"></div>;

  const modes = SUBJECT_MODES[subject];
  const info = SUBJECT_INFO[subject];

  return (
    <div className="bg-[#f0f4ff] min-h-screen text-[#1a1a2e] pt-[62px] font-['Nunito']">
      <nav className="fixed top-0 left-0 right-0 z-[200] h-[62px] bg-white border-b-2 border-[#e8e8f4] flex items-center justify-between px-4 md:px-9 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-[#f0f4ff] text-[#4a4a6a] px-3 py-1.5 rounded-full text-[13px] font-bold no-underline cursor-pointer"
          >
            ← Back
          </button>
          <span className="text-[20px] font-extrabold font-['Baloo_2'] text-[#1aaee8]">
            {info.emotion} {info.title} Room
          </span>
        </div>
      </nav>

      <main className="max-w-[900px] mx-auto p-4 md:p-9 pt-8 overflow-x-hidden">
        {subject === "shapes" && (
          <div className="mb-12 animate-[fadeUp_0.5s_ease-out]">
            <h2 className="font-['Baloo_2'] text-2xl md:text-3xl font-black text-center mb-6 text-[#1a1a2e]">
              Meet the Shapes! ✨
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {SHAPE_CARDS.map((shape) => (
                <div
                  key={shape.id}
                  onMouseEnter={() => playAudio(SOUND_URLS.pop)}
                  onClick={() => speakText(shape.desc)}
                  className="relative group w-[140px] md:w-[180px] h-[160px] md:h-[180px] rounded-3xl overflow-hidden shadow-lg border-[3px] md:border-4 bg-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                  style={{ borderColor: shape.color }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 group-hover:opacity-0 group-active:opacity-0">
                    <span className="text-6xl mb-2 filter drop-shadow-md">
                      {shape.icon}
                    </span>
                    <span className="font-['Baloo_2'] font-black text-xl text-[#1a1a2e]">
                      {shape.name}
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: shape.color }}
                  >
                    <span className="text-white font-bold leading-tight text-sm md:text-base">
                      {shape.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subject === "letters" && (
          <div className="mb-12 animate-[fadeUp_0.5s_ease-out]">
            <h2 className="font-['Baloo_2'] text-2xl md:text-3xl font-black text-center mb-6 text-[#1a1a2e]">
              Alphabet Explorer! 🔤
            </h2>
            <div className="flex flex-wrap gap-4 justify-center max-h-[600px] overflow-y-auto px-4 py-8 custom-scrollbar">
              {LETTER_CARDS.map((letter) => (
                <div
                  key={letter.id}
                  onMouseEnter={() => playAudio(SOUND_URLS.pop)}
                  onClick={() => speakText(letter.desc)}
                  className="relative group w-[120px] md:w-[150px] h-[140px] md:h-[170px] rounded-3xl overflow-hidden shadow-lg border-[3px] md:border-4 bg-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                  style={{ borderColor: letter.color }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 group-hover:opacity-0 group-active:opacity-0">
                    <span className="text-5xl md:text-6xl font-black text-[#1a1a2e] flex items-baseline gap-1" style={{ color: letter.color }}>
                      {letter.upper}<span className="text-3xl md:text-4xl">{letter.lower}</span>
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: letter.color }}
                  >
                    <span className="text-5xl md:text-6xl mb-2 filter drop-shadow-md">
                      {letter.icon}
                    </span>
                    <span className="text-white font-bold leading-tight text-lg md:text-xl font-['Baloo_2']">
                      {letter.word}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subject === "numbers" && (
          <div className="mb-12 animate-[fadeUp_0.5s_ease-out]">
            <h2 className="font-['Baloo_2'] text-2xl md:text-3xl font-black text-center mb-6 text-[#1a1a2e]">
              Number Magic! ✨
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {NUMBER_CARDS.map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={() => playAudio(SOUND_URLS.pop)}
                  onClick={() => speakText(item.desc)}
                  className="relative group w-[120px] md:w-[150px] h-[140px] md:h-[170px] rounded-3xl overflow-hidden shadow-lg border-[3px] md:border-4 bg-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                  style={{ borderColor: item.color }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 group-hover:opacity-0 group-active:opacity-0">
                    <span className="text-6xl font-black text-[#1a1a2e]" style={{ color: item.color }}>
                      {item.num}
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="text-3xl md:text-4xl mb-2 filter drop-shadow-md flex flex-wrap justify-center max-w-full truncate overflow-hidden">
                      {item.icon}
                    </span>
                    <span className="text-white font-bold leading-tight text-sm md:text-base font-['Baloo_2']">
                      {item.word}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subject === "colors" && (
          <div className="mb-12 animate-[fadeUp_0.5s_ease-out]">
            <h2 className="font-['Baloo_2'] text-2xl md:text-3xl font-black text-center mb-6 text-[#1a1a2e]">
              Color Splash! 🎨
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {COLOR_CARDS.map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={() => playAudio(SOUND_URLS.pop)}
                  onClick={() => speakText(item.desc)}
                  className="relative group w-[120px] md:w-[150px] h-[140px] md:h-[170px] rounded-3xl overflow-hidden shadow-lg border-[3px] md:border-4 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                  style={{ borderColor: item.color, backgroundColor: item.color }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 group-hover:opacity-0 group-active:opacity-0 bg-white">
                    <div className="w-16 h-16 rounded-full mb-2 border-4 border-black/10 shadow-inner" style={{ backgroundColor: item.color }} />
                    <span className="font-['Baloo_2'] font-black text-xl text-[#1a1a2e]">
                      {item.colorName}
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="text-5xl md:text-6xl mb-2 filter drop-shadow-md">
                      {item.icon}
                    </span>
                    <span className="text-white font-bold leading-tight text-sm md:text-base font-['Baloo_2']">
                      {item.word}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="font-['Baloo_2'] text-3xl md:text-4xl font-black text-center mb-8">
          {isViewingLessons ? "Listen & Learn! 🎧" : "Choose a game! 🎮"}
        </h2>

        {isViewingLessons ? (
          <div className="animate-[fadeUp_0.4s_ease-out]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {modes
                .filter((m) => m.mode.startsWith("lesson_"))
                .map((modeInfo, i) => {
                  const locked = modeInfo.premium && !isPremium;
                  return (
                    <div key={modeInfo.mode} className="relative h-full w-full">
                      {locked && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 rounded-[32px] flex flex-col items-center justify-center p-6 text-center transform transition-all duration-300">
                          <span className="text-5xl mb-2">👑</span>
                          <h3 className="font-['Baloo_2'] text-2xl font-black text-[#1a1a2e] mb-1">
                            Premium Mode
                          </h3>
                          <p className="text-sm font-bold text-[#4a4a6a]">
                            Ask your parents to unlock this feature!
                          </p>
                        </div>
                      )}
                      <Link
                        to={
                          locked
                            ? "#"
                            : `/game/${childId}/${subject}/${modeInfo.mode}`
                        }
                        className={`relative block h-full overflow-hidden group rounded-[32px] p-8 text-white no-underline transform transition-all duration-300 ${!locked && "hover:-translate-y-2 hover:shadow-[0_16px_32px_rgba(0,0,0,0.15)]"} bg-gradient-to-br ${modeInfo.bg}`}
                        style={{ animation: `fadeUp 0.5s ease-out ${i * 0.1}s both` }}
                      >
                        <div className="absolute top-[-20%] right-[-10%] text-[140px] opacity-20 transform group-hover:scale-110 transition-transform duration-500 group-hover:rotate-12">
                          {modeInfo.icon}
                        </div>
                        <div className="relative z-10">
                          <span className="text-6xl block mb-4 filter drop-shadow-md">
                            {modeInfo.icon}
                          </span>
                          <h3 className="font-['Baloo_2'] text-4xl font-black mb-1">
                            {modeInfo.title}
                          </h3>
                          <p className="font-bold opacity-90 text-lg">
                            {modeInfo.label}
                          </p>
                        </div>
                      </Link>
                    </div>
                  );
                })}
            </div>
            <div className="mt-8 bg-white rounded-[32px] border-2 border-[#e8e8f4] py-12 px-6 text-center shadow-sm">
                <span className="text-5xl mb-4 block">📚</span>
                <h3 className="font-['Baloo_2'] text-2xl md:text-3xl font-black text-[#1a1a2e]">More lessons are being added for you to learn!</h3>
                <p className="text-[#4a4a6a] font-bold mt-2 text-lg">Check back soon for new adventures.</p>
            </div>
            <button
               onClick={() => setIsViewingLessons(false)}
               className="mx-auto block mt-8 font-bold text-[#4a4a6a] hover:text-[#1aaee8] transition-colors bg-white px-6 py-3 rounded-full shadow-sm border border-[#e8e8f4]"
            >
               ← Back to Games
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-[fadeUp_0.4s_ease-out]">
            {modes.some(m => m.mode.startsWith("lesson_")) && (
              <div className="relative h-full w-full">
                <button
                  onClick={() => setIsViewingLessons(true)}
                  className={`w-full text-left relative block h-full overflow-hidden group rounded-[32px] p-8 text-white no-underline transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_32px_rgba(0,0,0,0.15)] bg-gradient-to-br from-[#ce93d8] to-[#7b1fa2]`}
                >
                  <div className="absolute top-[-20%] right-[-10%] text-[140px] opacity-20 transform group-hover:scale-110 transition-transform duration-500 group-hover:rotate-12">
                    📚
                  </div>
                  <div className="relative z-10">
                    <span className="text-6xl block mb-4 filter drop-shadow-md">
                      🎧
                    </span>
                    <h3 className="font-['Baloo_2'] text-4xl font-black mb-1">
                      Listen & Learn
                    </h3>
                    <p className="font-bold opacity-90 text-lg">
                      Explore detailed interactive lessons!
                    </p>
                  </div>
                </button>
              </div>
            )}
            {modes
              .filter((m) => !m.mode.startsWith("lesson_"))
              .map((modeInfo, i) => {
                const locked = modeInfo.premium && !isPremium;
                return (
                  <div key={modeInfo.mode} className="relative h-full w-full">
                    {locked && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 rounded-[32px] flex flex-col items-center justify-center p-6 text-center transform transition-all duration-300">
                        <span className="text-5xl mb-2">👑</span>
                        <h3 className="font-['Baloo_2'] text-2xl font-black text-[#1a1a2e] mb-1">
                          Premium Mode
                        </h3>
                        <p className="text-sm font-bold text-[#4a4a6a]">
                          Ask your parents to unlock this feature!
                        </p>
                      </div>
                    )}
                    <Link
                      to={
                        locked
                          ? "#"
                          : `/game/${childId}/${subject}/${modeInfo.mode}`
                      }
                      className={`relative block h-full overflow-hidden group rounded-[32px] p-8 text-white no-underline transform transition-all duration-300 ${!locked && "hover:-translate-y-2 hover:shadow-[0_16px_32px_rgba(0,0,0,0.15)]"} bg-gradient-to-br ${modeInfo.bg}`}
                      style={{ animation: `fadeUp 0.5s ease-out ${(i + 1) * 0.1}s both` }}
                    >
                      <div className="absolute top-[-20%] right-[-10%] text-[140px] opacity-20 transform group-hover:scale-110 transition-transform duration-500 group-hover:rotate-12">
                        {modeInfo.icon}
                      </div>
                      <div className="relative z-10">
                        <span className="text-6xl block mb-4 filter drop-shadow-md">
                          {modeInfo.icon}
                        </span>
                        <h3 className="font-['Baloo_2'] text-4xl font-black mb-1">
                          {modeInfo.title}
                        </h3>
                        <p className="font-bold opacity-90 text-lg">
                          {modeInfo.label}
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })}
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
