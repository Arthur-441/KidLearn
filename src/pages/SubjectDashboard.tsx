import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { SOUND_URLS } from "../utils/sounds";

const SUBJECT_MODES: Record<string, any[]> = {
  shapes: [
    {
      mode: "interactive",
      title: "Interactive Lessons",
      icon: "✨",
      bg: "from-[#ce93d8] to-[#7b1fa2]",
      label: "Explore shape properties",
      premium: false,
    },
    {
      mode: "quiz",
      title: "Shape Quiz",
      icon: "❓",
      bg: "from-[#4ECAFC] to-[#0288d1]",
      label: "Guess the shape!",
      premium: false,
    },
    {
      mode: "match",
      title: "Shape Match",
      icon: "🧩",
      bg: "from-[#ff8fa3] to-[#c9184a]",
      label: "Find the matching pairs",
      premium: true,
    },
    {
      mode: "shape_builder",
      title: "Shape Builder",
      icon: "🧱",
      bg: "from-[#0CDA91] to-[#00A86B]",
      label: "Build shapes from parts",
      premium: false,
    },
    {
      mode: "shape_sorter",
      title: "Shape Sorter",
      icon: "📥",
      bg: "from-[#FFB03A] to-[#FF7B00]",
      label: "Sort items by shape",
      premium: false,
    },
    {
      mode: "shape_tracer",
      title: "Shape Tracer",
      icon: "✍️",
      bg: "from-[#60CDD4] to-[#0A8894]",
      label: "Trace the shapes",
      premium: true,
    },
  ],
  letters: [
    {
      mode: "lesson",
      title: "Listen & Learn",
      icon: "🎧",
      bg: "from-[#ce93d8] to-[#7b1fa2]",
      label: "Learn letters",
      premium: false,
    },
    {
      mode: "letter_pop",
      title: "Bubble Pop",
      icon: "🫧",
      bg: "from-[#4ECAFC] to-[#0288d1]",
      label: "Pop the correct letter bubbles",
      premium: false,
    },
    {
      mode: "letter_catch",
      title: "Catch It!",
      icon: "🧺",
      bg: "from-[#8DE365] to-[#388e3c]",
      label: "Catch falling letters",
      premium: false,
    },
    {
      mode: "letter_ninja",
      title: "Letter Ninja",
      icon: "🥷",
      bg: "from-[#ff8fa3] to-[#c9184a]",
      label: "Slice the target letter",
      premium: false,
    },
    {
      mode: "letter_match",
      title: "Memory Match",
      icon: "🧩",
      bg: "from-[#FFB03A] to-[#FF7B00]",
      label: "Match uppercase & lowercase",
      premium: false,
    },
    {
      mode: "letter_space",
      title: "Space Dash",
      icon: "🚀",
      bg: "from-[#60CDD4] to-[#0A8894]",
      label: "Blast letter asteroids",
      premium: true,
    },
    {
      mode: "letter_find",
      title: "Hide & Seek",
      icon: "🕵️",
      bg: "from-[#9B5DE5] to-[#5A189A]",
      label: "Find hidden letters",
      premium: true,
    },
    {
      mode: "letter_build",
      title: "Word Builder",
      icon: "🧱",
      bg: "from-[#0CDA91] to-[#00A86B]",
      label: "Build 3-letter words",
      premium: true,
    },
    {
      mode: "letter_racer",
      title: "ABC Racer",
      icon: "🏎️",
      bg: "from-[#F15BB5] to-[#D90368]",
      label: "Race to the right letter",
      premium: true,
    },
    {
      mode: "letter_piano",
      title: "Musical ABCs",
      icon: "🎹",
      bg: "from-[#4ECAFC] to-[#016FB9]",
      label: "Play the letter sounds",
      premium: true,
    },
    {
      mode: "letter_tracing",
      title: "Trace Letter",
      icon: "✍️",
      bg: "from-[#FFD93D] to-[#FCA311]",
      label: "Learn to write A-Z",
      premium: true,
    },
    {
      mode: "letter_fishing",
      title: "ABC Fishing",
      icon: "🎣",
      bg: "from-[#C47BD7] to-[#8C2BA8]",
      label: "Fish for letters",
      premium: true,
    },
  ],
  colors: [
    {
      mode: "interactive",
      title: "Interactive Lessons",
      icon: "✨",
      bg: "from-[#ce93d8] to-[#7b1fa2]",
      label: "Explore the magic of colors",
      premium: false,
    },
    {
      mode: "quiz",
      title: "Color Quiz",
      icon: "❓",
      bg: "from-[#ff8fa3] to-[#c9184a]",
      label: "Guess the color!",
      premium: false,
    },
    {
      mode: "match",
      title: "Color Match",
      icon: "🧩",
      bg: "from-[#8DE365] to-[#388e3c]",
      label: "Find matching colors",
      premium: true,
    },
    {
      mode: "color_catcher",
      title: "Color Catcher",
      icon: "🎈",
      bg: "from-[#FFD93D] to-[#F57C00]",
      label: "Catch the colored balloons!",
      premium: true,
    },
    {
      mode: "color_mixer",
      title: "Color Mixer",
      icon: "🧪",
      bg: "from-[#0CDA91] to-[#00A86B]",
      label: "Mix colors together!",
      premium: true,
    },
  ],
  numbers: [
    {
      mode: "lesson",
      title: "Listen & Learn",
      icon: "🎧",
      bg: "from-[#ce93d8] to-[#7b1fa2]",
      label: "Learn numbers",
      premium: false,
    },
    {
      mode: "quiz",
      title: "Number Quiz",
      icon: "❓",
      bg: "from-[#8DE365] to-[#388e3c]",
      label: "Guess the number!",
      premium: false,
    },
    {
      mode: "match",
      title: "Number Match",
      icon: "🧩",
      bg: "from-[#4ECAFC] to-[#0288d1]",
      label: "Match the numbers",
      premium: true,
    },
    {
      mode: "number_pop",
      title: "Math Pop",
      icon: "🫧",
      bg: "from-[#ff8fa3] to-[#c9184a]",
      label: "Pop bubbles that match!",
      premium: false,
    },
    {
      mode: "number_catch",
      title: "Catch the Number",
      icon: "🧺",
      bg: "from-[#FFD93D] to-[#F57C00]",
      label: "Catch exactly what you need!",
      premium: false,
    },
  ],
  animals: [
    {
      mode: "lesson",
      title: "Listen & Learn",
      icon: "🎧",
      bg: "from-[#ce93d8] to-[#7b1fa2]",
      label: "Learn about animals",
      premium: false,
    },
    {
      mode: "quiz",
      title: "Animal Quiz",
      icon: "❓",
      bg: "from-[#ff8fa3] to-[#c9184a]",
      label: "Guess the animal!",
      premium: false,
    },
  ],
  rhymes: [
    {
      mode: "lesson",
      title: "Listen & Learn",
      icon: "🎧",
      bg: "from-[#80deea] to-[#00838f]",
      label: "Listen to rhymes",
      premium: true,
    },
  ],
  stories: [
    {
      mode: "lesson",
      title: "Story Time",
      icon: "🎧",
      bg: "from-[#9fa8da] to-[#3949ab]",
      label: "Listen to a story",
      premium: true,
    },
    {
      mode: "interactive",
      title: "Play a Story",
      icon: "✨",
      bg: "from-[#f48fb1] to-[#c2185b]",
      label: "Interactive story game!",
      premium: true,
    },
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
          setIsPremium(true);
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
        "Google UK English Female",
        "Google US English",
        "Samantha",
        "Victoria",
        "Karen",
      ];
      let femaleVoice = voices.find((voice) =>
        preferredNames.includes(voice.name),
      );
      if (!femaleVoice) {
        femaleVoice = voices.find(
          (voice) =>
            voice.name.toLowerCase().includes("female") ||
            voice.name.toLowerCase().includes("woman"),
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
          <Link
            to={`/child/${childId}`}
            className="bg-[#f0f4ff] text-[#4a4a6a] px-3 py-1.5 rounded-full text-[13px] font-bold no-underline"
          >
            ← Back
          </Link>
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
                    className="absolute inset-0 flex items-center justify-center p-5 text-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
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

        <h2 className="font-['Baloo_2'] text-3xl md:text-4xl font-black text-center mb-8">
          Choose a game! 🎮
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {modes.map((modeInfo, i) => {
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
