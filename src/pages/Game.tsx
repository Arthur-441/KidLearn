import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  saveGameResult,
  getQuestions,
  getLessons,
  GameQuestion,
  LessonContent,
} from "../utils/gameLogic";
import { useAuth } from "../components/AuthProvider";
import { SOUND_URLS } from "../utils/sounds";
import confetti from "canvas-confetti";
import MatchingGame from "../components/games/MatchingGame";
import FoxBuddy from "../components/FoxBuddy";
import LetterCatchGame from "../components/games/LetterCatchGame";
import LetterPopGame from "../components/games/LetterPopGame";
import LetterNinjaGame from "../components/games/LetterNinjaGame";
import LetterFindGame from "../components/games/LetterFindGame";
import WordBuilderGame from "../components/games/WordBuilderGame";
import LetterOrderGame from "../components/games/LetterOrderGame";
import SpaceDashGame from "../components/games/SpaceDashGame";
import ShapeBuilderGame from "../components/games/ShapeBuilderGame";
import ShapeSorterGame from "../components/games/ShapeSorterGame";
import ShapeTracerGame from "../components/games/ShapeTracerGame";
import ColorCatcherGame from "../components/games/ColorCatcherGame";
import ColorMixerGame from "../components/games/ColorMixerGame";
import NumberPopGame from "../components/games/NumberPopGame";
import NumberCatchGame from "../components/games/NumberCatchGame";
import { motion, AnimatePresence } from "motion/react";

const WIN_MSGS = [
  "Great job! 🎉",
  "Awesome! 🌟",
  "You rock! 🚀",
  "Perfect! ✨",
  "Brilliant! 💪",
];
const WIN_EMOJ = ["🎉", "🌟", "🚀", "✨", "💫", "🏆"];

export default function Game() {
  const { childId, subject, mode } = useParams<{
    childId: string;
    subject: string;
    mode: string;
  }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<(GameQuestion | LessonContent)[]>(
    [],
  );
  const [originalCount, setOriginalCount] = useState(5);
  const [attempts, setAttempts] = useState(0);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionData, setCorrectionData] = useState<{
    correctText: string;
  } | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", color: "" });

  const [showResult, setShowResult] = useState(false);
  const [resultCorrect, setResultCorrect] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [issues, setIssues] = useState<string[]>([]); // Track incorrect answer text
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [interactionSolved, setInteractionSolved] = useState(false);
  const [readingFinished, setReadingFinished] = useState(false);
  const [gameStartTime] = useState<number>(Date.now());
  const [transitioningStory, setTransitioningStory] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [rewards, setRewards] = useState<
    {
      id: number;
      type: "star" | "badge";
      amount?: number;
      badgeName?: string;
    }[]
  >([]);

  const isCustomGame =
    (mode?.startsWith("letter_") && mode !== "letter_match") ||
    mode?.startsWith("shape_") ||
    mode?.startsWith("color_") ||
    mode?.startsWith("number_");

  const triggerReward = (
    type: "star" | "badge",
    amount?: number,
    badgeName?: string,
  ) => {
    const id = Date.now() + Math.random();
    setRewards((prev) => [...prev, { id, type, amount, badgeName }]);

    // Play confetti
    confetti({
      particleCount: type === "badge" ? 100 : 40,
      spread: type === "badge" ? 80 : 50,
      origin: { y: 0.8 },
      colors: ["#FFD93D", "#4ECAFC", "#ff8fa3", "#8DE365", "#9B5DE5"],
      zIndex: 100,
    });

    // Add vibration if supported and badge earned
    if ("vibrate" in navigator) {
      if (type === "badge") {
        navigator.vibrate([200, 100, 200, 100, 500]);
      } else {
        navigator.vibrate(100);
      }
    }

    setTimeout(() => {
      setRewards((prev) => prev.filter((r) => r.id !== id));
    }, 2000); // Remove after animation completes
  };

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Add vibration based on the sound type
    if ("vibrate" in navigator) {
      if (url === SOUND_URLS.correct) {
        navigator.vibrate([50]);
      } else if (url === SOUND_URLS.wrong) {
        navigator.vibrate([100, 50, 100]);
      } else if (url === SOUND_URLS.win || url === SOUND_URLS.quest) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } else if (url === SOUND_URLS.awesome || url === SOUND_URLS.combo) {
        navigator.vibrate([80, 50, 80]);
      }
    }
  };

  const totalRounds = originalCount;

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (subject) {
      if (mode === "lesson" || subject === "rhymes" || mode === "interactive") {
        const lessons = getLessons(subject);
        const sliced = lessons.slice(0, Math.min(5, lessons.length));
        setQuestions(sliced);
        setOriginalCount(sliced.length > 0 ? sliced.length : 5);
      } else {
        const qs = getQuestions(subject);
        const sliced = qs.slice(0, Math.min(5, qs.length));
        setQuestions(sliced);
        setOriginalCount(sliced.length > 0 ? sliced.length : 5);
      }
    }
  }, [subject, mode]);

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      if (subject === "rhymes") {
        utterance.rate = 0.65; // Slower for rhymes
        utterance.pitch = 1.3; // Higher, more sing-song pitch
      } else if (mode === "lesson") {
        utterance.rate = 0.75; // Slightly slower for learning
        utterance.pitch = 1.25; // Warm, friendly, higher pitch for natural emotional connection
      } else {
        utterance.rate = 0.85; // Normal pace
        utterance.pitch = 1.15; // Slightly higher pitch for friendly tone
      }

      utterance.lang = "en-US"; // Help select better natural voice engines

      // Try to find a friendly female voice
      const voices = window.speechSynthesis.getVoices();
      const preferredNames = [
        "Google UK English Female",
        "Google US English",
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
            voice.name.toLowerCase().includes("samantha"),
        );
      }

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      setReadingFinished(false);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setReadingFinished(true);

        // Play audio clip if it exists
        if (currentItem) {
          let audioToPlay: string | undefined;
          if (currentItem.type === "lesson") {
            audioToPlay = !currentSceneIndex
              ? (currentItem as LessonContent).audioUrl
              : undefined;
          } else if (
            currentItem.type !== "lesson" &&
            mode !== "match" &&
            mode !== "letter_match" &&
            !isCustomGame
          ) {
            audioToPlay = (currentItem as GameQuestion).audioUrl;
          }

          if (audioToPlay) {
            playAudio(audioToPlay);
          }
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const currentItem = questions[round];

  useEffect(() => {
    if (currentItem) {
      if (currentItem.type === "lesson") {
        const lesson = currentItem as LessonContent;
        if (lesson.scenes && lesson.scenes.length > 0) {
          speakText(lesson.scenes[currentSceneIndex].text);
        } else {
          speakText(lesson.text);
        }
      } else if (
        currentItem.type !== "lesson" &&
        mode !== "match" &&
        mode !== "letter_match" &&
        !isCustomGame
      ) {
        const question = currentItem as GameQuestion;
        speakText(question.text);
      }
    }
  }, [currentItem, currentSceneIndex, mode]);

  useEffect(() => {
    if (
      (isCustomGame || mode === "match" || mode === "letter_match") &&
      feedback.text &&
      feedback.color === "#1a1a2e"
    ) {
      speakText(feedback.text);
    }
  }, [feedback.text, feedback.color, isCustomGame, mode]);

  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (subject === "stories" && currentItem && currentItem.type === "lesson") {
      const lesson = currentItem as LessonContent;
      const currentScene = lesson.scenes?.[currentSceneIndex];
      const hasInteraction =
        mode === "interactive" && currentScene?.interaction;
      const canAdvance =
        readingFinished && (!hasInteraction || interactionSolved);

      if (canAdvance && !advanceTimerRef.current) {
        setReadingFinished(false);
        const isEndOfStory =
          !lesson.scenes || currentSceneIndex >= lesson.scenes.length - 1;

        if (isEndOfStory) {
          setTransitioningStory(true);
          playAudio(SOUND_URLS.chime);
          advanceTimerRef.current = setTimeout(() => {
            setTransitioningStory(false);
            advanceTimerRef.current = null;
            nextLesson();
          }, 5000);
        } else {
          advanceTimerRef.current = setTimeout(() => {
            advanceTimerRef.current = null;
            nextLesson();
          }, 2000);
        }
      }
    }
  }, [
    subject,
    currentItem,
    mode,
    currentSceneIndex,
    readingFinished,
    interactionSolved,
  ]);

  const handlePick = (answerId: string) => {
    if (
      locked ||
      showResult ||
      gameOver ||
      showCorrection ||
      !currentItem ||
      currentItem.type === "lesson"
    )
      return;
    const currentQ = currentItem as GameQuestion;
    setLocked(true);

    if (answerId === currentQ.answerId) {
      // Correct
      playAudio(SOUND_URLS.correct);

      const isRepeat = (currentQ as any).isRepeat;

      let nextScore = score;
      let nextStars = starsEarned;

      if (!isRepeat) {
        const newStreak = streak + 1;
        nextScore = score + 1;
        const bonus = newStreak % 3 === 0 ? 1 : 0;
        const earned = 1 + bonus;
        nextStars = starsEarned + earned;

        setStreak(newStreak);
        setScore(nextScore);
        setStarsEarned(nextStars);

        // Play combo or awesome sound instead
        if (newStreak > 0 && newStreak % 5 === 0) {
          playAudio(SOUND_URLS.awesome);
        } else if (newStreak > 0 && newStreak % 3 === 0) {
          playAudio(SOUND_URLS.combo);
        }

        triggerReward("star", earned);

        setFeedback({
          text: WIN_MSGS[Math.floor(Math.random() * WIN_MSGS.length)],
          color: "#43a047",
        });
      } else {
        setFeedback({
          text: "Correct! Good job trying again.",
          color: "#43a047",
        });
      }

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= questions.length) {
          endGame(nextScore, nextStars);
        } else {
          setResultCorrect(true);
          setShowResult(true);
        }
      }, 900);
    } else {
      // Wrong
      playAudio(SOUND_URLS.wrong);

      if (attempts === 0) {
        setAttempts(1);
        setStreak(0);
        setIssues((prev) => {
          if (!prev.includes(currentQ.text)) return [...prev, currentQ.text];
          return prev;
        }); // Record issue
        const hintText =
          currentQ.hint ||
          "Oops! That wasn't quite right. Let's try once more!";
        setFeedback({ text: hintText, color: "#e53935" });

        setTimeout(() => {
          setLocked(false);
          setFeedback({ text: "", color: "" });
        }, 1500);
      } else {
        // Second fail
        setStreak(0);
        const correctOpt = currentQ.options.find(
          (o) => o.id === currentQ.answerId,
        );
        setCorrectionData({
          correctText: correctOpt?.label || "Unknown",
        });
        setShowCorrection(true);

        // Queue this question to the end of questions array
        setQuestions((prev) => {
          // GameQuestion doesn't have a top-level id, so we just set isRepeat
          const repeatedQ = {
            ...currentQ,
            isRepeat: true,
          } as unknown as GameQuestion;
          return [...prev, repeatedQ];
        });
      }
    }
  };

  const nextLesson = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (
      currentItem &&
      currentItem.type === "lesson" &&
      currentItem.scenes &&
      currentSceneIndex < currentItem.scenes.length - 1
    ) {
      setCurrentSceneIndex((prev) => prev + 1);
      setInteractionSolved(false);
    } else {
      const nextRound = round + 1;
      if (nextRound >= questions.length) {
        endGame(totalRounds, 5); // Give full score/stars for lessons
      } else {
        setRound(nextRound);
        setCurrentSceneIndex(0);
        setInteractionSolved(false);
      }
    }
  };

  const handleInteractionClick = (optIndex: number) => {
    if (
      !currentItem ||
      currentItem.type !== "lesson" ||
      !(currentItem as LessonContent).scenes
    )
      return;
    const scene = (currentItem as LessonContent).scenes![currentSceneIndex];
    if (scene.interaction && optIndex === scene.interaction.answerIndex) {
      playAudio(SOUND_URLS.correct);
      setInteractionSolved(true);
      setScore((s) => s + 1);

      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.7 },
      });
    } else {
      playAudio(SOUND_URLS.wrong);
    }
  };

  const nextRound = () => {
    setRound(round + 1);
    setLocked(false);
    setAttempts(0);
    setFeedback({ text: "", color: "" });
    setShowResult(false);
  };

  const handleContinueFromCorrection = () => {
    setShowCorrection(false);
    setCorrectionData(null);
    nextRound();
  };

  const endGame = async (finalScore = score, finalStars = starsEarned) => {
    setGameOver(true);
    playAudio(SOUND_URLS.win);
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });

    let badgeId: string | null = null;
    if (finalStars >= 5) badgeId = "star_5";
    if (finalStars >= 20) badgeId = "star_20";
    if (finalScore >= 1 && !badgeId) badgeId = "first_game";

    if (badgeId) {
      setTimeout(() => playAudio(SOUND_URLS.quest), 1000);
      const badgeNames: Record<string, string> = {
        star_5: "5 Stars Badge",
        star_20: "20 Stars Badge",
        first_game: "First Game Badge",
      };
      setTimeout(
        () =>
          triggerReward(
            "badge",
            0,
            badgeNames[badgeId as string] || "New Badge",
          ),
        500,
      );
    }

    if (user && childId && subject) {
      try {
        await saveGameResult(
          user.uid,
          childId,
          subject,
          finalScore,
          totalRounds,
          finalStars,
          issues,
          Math.max(1, Math.round((Date.now() - gameStartTime) / 1000)),
          badgeId,
        );
      } catch (e) {
        console.error(e);
      }
    }
  };

  const [foxIdleMessage, setFoxIdleMessage] = useState("");
  const [foxPopupVisible, setFoxPopupVisible] = useState(false);

  useEffect(() => {
    setFoxPopupVisible(true);
    const timer = setTimeout(() => {
      setFoxPopupVisible(false);
    }, 6000); // give 6 seconds for Fox instructions
    return () => clearTimeout(timer);
  }, [feedback.text, currentItem, round, gameOver, currentSceneIndex]);

  useEffect(() => {
    const ENCOURAGING_MSGS = [
      "You're doing great!",
      "I believe in you!",
      "Keep going!",
      "I'm cheering for you! 🦊",
      "So smart!",
      "You're a star! ⭐",
    ];

    const interval = setInterval(() => {
      if (
        !feedback.text &&
        !showResult &&
        !gameOver &&
        !showCorrection &&
        round < totalRounds
      ) {
        setFoxIdleMessage(
          ENCOURAGING_MSGS[Math.floor(Math.random() * ENCOURAGING_MSGS.length)],
        );
        setTimeout(() => setFoxIdleMessage(""), 4000);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [feedback.text, showResult, gameOver, showCorrection, round, totalRounds]);

  // Prevent rendering if not ready
  if (!currentItem && !gameOver && !isCustomGame)
    return <div className="min-h-screen bg-[#f0f4ff] pt-[62px]"></div>;

  const getTargetMessage = () => {
    if (gameOver) return "You did amazing!";
    if (feedback.text) return feedback.text;
    if (showResult) return resultCorrect ? "Correct! 🎉" : "Keep Trying! 💪";
    if (foxIdleMessage) return foxIdleMessage;
    if (currentItem) {
      if (currentItem.type === "lesson") {
        const lesson = currentItem as LessonContent;
        if (lesson.scenes && lesson.scenes.length > 0)
          return "Listen closely! 🎧";
        return "Listen closely! 🎧";
      }
      if (
        currentItem.type !== "lesson" &&
        !isCustomGame &&
        mode !== "match" &&
        mode !== "letter_match"
      ) {
        return (currentItem as GameQuestion).text;
      }
    }
    return "Let's play!";
  };

  const getBackgroundClass = () => {
    if (subject === "stories" && currentItem) {
      const colors = [
        "from-[#e0c3fc] via-[#f8e1ff] to-[#fffbe6]", // whimsical purple
        "from-[#c2e9fb] via-[#e1f5fe] to-[#fffbe6]", // airy blue
        "from-[#ffd194] via-[#ffebd2] to-[#fffbe6]", // warm sunset
        "from-[#bcfbc4] via-[#e5fce7] to-[#fffbe6]", // nature green
        "from-[#ffb6b9] via-[#ffe3e4] to-[#fffbe6]", // soft pink
      ];
      return `bg-gradient-to-br ${colors[(round + currentSceneIndex) % colors.length]}`;
    }
    return "bg-gradient-to-br from-[#a8e6ff] via-[#d4f9ff] to-[#fffbe6]";
  };

  return (
    <div
      className={`min-h-screen ${getBackgroundClass()} flex flex-col pt-[62px] font-['Nunito'] transition-colors duration-1000`}
    >
      <nav className="fixed top-0 left-0 right-0 z-[100] h-[62px] bg-white/95 backdrop-blur-md border-b-2 border-[#e8e8f4] flex items-center justify-between px-4 md:px-9 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[22px]">🎈</span>
          <span className="font-['Baloo_2'] text-xl font-extrabold text-[#1aaee8]">
            Kid<em className="text-[#FF8C42] not-italic">Learn</em>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div
            id="badge-section"
            className="flex items-center gap-1.5 opacity-50 bg-[#fff5cc] px-3 py-1 rounded-full border border-[#ffe066]"
          >
            <span className="text-xl">🏆</span>
            <span className="text-xs font-bold text-[#b38f00] uppercase tracking-wider">
              Badges
            </span>
          </div>
          <Link
            to={`/subject/${childId}/${subject}`}
            className="bg-transparent border-2 border-[#e8e8f4] text-[#4a4a6a] px-4 py-1.5 rounded-full text-sm font-bold no-underline inline-flex items-center gap-1.5 transition-colors hover:border-[#1aaee8] hover:text-[#1aaee8]"
          >
            ← Back
          </Link>
        </div>
      </nav>

      <AnimatePresence>
        {rewards.map((reward) => {
          const isStar = reward.type === "star";
          return (
            <motion.div
              key={reward.id}
              initial={{
                top: "50%",
                left: "50%",
                scale: 0,
                opacity: 0,
                x: "-50%",
                y: "-50%",
                rotate: -20,
              }}
              animate={{
                top: ["50%", "30%", isStar ? "20%" : "3%"],
                left: ["50%", "50%", isStar ? "50%" : "80%"],
                scale: [0, 1.5, 0.5],
                opacity: [0, 1, 0],
                rotate: [-20, 10, 0],
              }}
              transition={{
                duration: 1.8,
                times: [0, 0.5, 1],
                ease: "easeInOut",
              }}
              className="fixed z-[1000] flex items-center justify-center font-black drop-shadow-xl pointer-events-none"
            >
              {isStar ? (
                <div className="text-8xl flex items-center gap-2 filter drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">
                  ⭐{" "}
                  <span className="text-5xl text-white drop-shadow-md">
                    +{reward.amount}
                  </span>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 border-4 border-yellow-200 rounded-2xl p-6 text-white text-3xl text-center shadow-[0_0_30px_rgba(255,215,0,0.6)]">
                  🏆
                  <br />
                  {reward.badgeName}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <audio ref={audioRef} preload="auto" className="hidden" />

      <AnimatePresence>
        {showCorrection && correctionData && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed bottom-0 left-0 right-0 bg-[#ffdfe0] text-[#d32f2f] p-4 md:p-6 flex items-center justify-between z-[600] border-t-2 border-[#ffcdd2]"
          >
            <div className="flex items-center gap-4 max-w-2xl mx-auto w-full">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white shrink-0 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-3xl md:text-4xl text-[#d32f2f] font-black">
                  ✖
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl md:text-2xl text-[#b71c1c] mb-1">
                  Correct solution:
                </h3>
                <p className="text-lg md:text-xl font-medium">
                  {correctionData.correctText}
                </p>
              </div>
              <button
                onClick={handleContinueFromCorrection}
                className="bg-[#ff4b4b] hover:bg-[#e53935] text-white px-6 md:px-10 py-3 md:py-4 rounded-2xl font-bold text-lg md:text-xl md:uppercase transition-transform active:scale-95 shadow-md shrink-0"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showResult && !gameOver && (
        <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#1a1a2e]/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 md:p-12 text-center shadow-2xl max-w-[360px] w-11/12 animate-[popIn_0.5s_ease-out_both]">
            <span className="text-6xl block mb-2">
              {WIN_EMOJ[Math.floor(Math.random() * WIN_EMOJ.length)]}
            </span>
            <h2 className="font-['Baloo_2'] text-3xl font-black text-[#1a1a2e] mb-2">
              {resultCorrect ? "Correct! 🎉" : "Keep Trying!"}
            </h2>
            <p className="text-[#4a4a6a] mb-6">
              Score: {score} correct · Stars: {starsEarned} ⭐
            </p>
            <button
              onClick={nextRound}
              className="w-full bg-gradient-to-br from-[#4ECAFC] to-[#9B5DE5] text-white rounded-full py-3.5 font-extrabold text-lg shadow-md hover:-translate-y-0.5 transition-transform"
            >
              Round {round + 2} →
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#1a1a2e]/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 md:p-12 text-center shadow-2xl max-w-[360px] w-11/12 animate-[popIn_0.5s_ease-out_both] relative overflow-hidden">
            {mode === "lesson" ? (
              <>
                <span className="text-6xl block mb-2">🌟</span>
                <h2 className="font-['Baloo_2'] text-3xl font-black text-[#1a1a2e] mb-2">
                  Good job!
                </h2>
                <p className="text-[#4a4a6a] mb-6 font-bold">
                  You finished the lesson! Come back for the next session to
                  learn more.
                </p>
              </>
            ) : (
              <>
                <span className="text-6xl block mb-2">
                  {score / totalRounds >= 0.8 ? "🏆" : "🌟"}
                </span>
                <h2 className="font-['Baloo_2'] text-3xl font-black text-[#1a1a2e] mb-2">
                  {score / totalRounds >= 0.8 ? "Amazing!" : "Good job!"}
                </h2>
                <p className="text-[#4a4a6a] mb-6">
                  You got {score}/{totalRounds} correct and earned {starsEarned}{" "}
                  ⭐ stars!
                </p>
              </>
            )}
            <button
              onClick={() => navigate(`/subject/${childId}/${subject}`)}
              className="w-full bg-gradient-to-br from-[#FF8C42] to-[#9B5DE5] text-white rounded-full py-3.5 font-extrabold text-lg shadow-md hover:-translate-y-0.5 transition-transform"
            >
              🏠 Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Buddy Fox Avatar */}
      <AnimatePresence>
        {!showCorrection && foxPopupVisible && (
          <motion.div
            initial={{ x: -100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -100, opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 left-4 z-[600] md:bottom-8 md:left-8 pointer-events-none drop-shadow-xl"
          >
            <FoxBuddy size="md" message={getTargetMessage()} />
          </motion.div>
        )}
      </AnimatePresence>

      {!gameOver &&
        (mode === "match" || mode === "letter_match") &&
        questions.length > 0 && (
          <MatchingGame
            questions={questions as GameQuestion[]}
            onComplete={endGame}
            playAudio={playAudio}
            triggerReward={triggerReward}
            setFeedback={setFeedback}
          />
        )}

      {!gameOver && isCustomGame && (
        <div className="flex-1 w-full h-[calc(100vh-62px)] max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center animate-[fadeUp_0.5s_ease-out]">
          {mode === "letter_pop" && (
            <LetterPopGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "letter_catch" && (
            <LetterCatchGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "letter_ninja" && (
            <LetterNinjaGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "letter_space" && (
            <SpaceDashGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "letter_find" && (
            <LetterFindGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "letter_build" && (
            <WordBuilderGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "letter_order" && (
            <LetterOrderGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "shape_builder" && (
            <ShapeBuilderGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "shape_sorter" && (
            <ShapeSorterGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "shape_tracer" && (
            <ShapeTracerGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "color_catcher" && (
            <ColorCatcherGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "color_mixer" && (
            <ColorMixerGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "number_pop" && (
            <NumberPopGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {mode === "number_catch" && (
            <NumberCatchGame
              onComplete={endGame}
              playAudio={playAudio}
              triggerReward={triggerReward}
              setFeedback={setFeedback}
            />
          )}
          {![
            "letter_pop",
            "letter_catch",
            "letter_ninja",
            "letter_space",
            "letter_find",
            "letter_build",
            "letter_order",
            "shape_builder",
            "shape_sorter",
            "shape_tracer",
            "color_catcher",
            "color_mixer",
            "number_pop",
            "number_catch",
          ].includes(mode || "") && (
            <div className="bg-white p-10 rounded-3xl text-center shadow-xl w-full max-w-[400px]">
              <h2 className="font-['Baloo_2'] text-3xl font-black mb-4 text-[#1a1a2e]">
                Coming Soon!
              </h2>
              <p className="text-gray-500 mb-8 font-medium">
                We are building this extraordinary game right now. Check back later!
              </p>
              <button
                onClick={() => navigate(`/subject/${childId}/${subject}`)}
                className="bg-gradient-to-br from-[#4ECAFC] to-[#0288d1] text-white font-bold py-3.5 px-8 rounded-full shadow-md w-full"
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      )}

      {!gameOver &&
        currentItem &&
        currentItem.type !== "lesson" &&
        !isCustomGame &&
        mode !== "match" &&
        mode !== "letter_match" && (
          <div className="flex-1 flex flex-col items-center justify-start p-5 md:py-10">
            <div className="w-full max-w-[600px] flex items-center justify-between bg-white/85 rounded-2xl py-3 px-5 mb-5 shadow-sm backdrop-blur-sm">
              <div className="text-center">
                <div className="font-['Baloo_2'] text-2xl font-black text-[#1a1a2e] leading-none">
                  {score}
                </div>
                <div className="text-[11px] font-bold text-[#9999bb] mt-0.5">
                  Score
                </div>
              </div>
              <div className="text-center">
                <div className="font-['Baloo_2'] text-2xl font-black text-[#1a1a2e] leading-none">
                  {Math.min(round + 1, totalRounds)} / {totalRounds}
                </div>
                <div className="text-[11px] font-bold text-[#9999bb] mt-0.5">
                  Round
                </div>
              </div>
              <div className="text-center">
                <div className="font-['Baloo_2'] text-2xl font-black text-[#1a1a2e] leading-none">
                  ⭐ {starsEarned}
                </div>
                <div className="text-[11px] font-bold text-[#9999bb] mt-0.5">
                  Stars
                </div>
              </div>
              <div className="text-center">
                <div className="font-['Baloo_2'] text-2xl font-black text-[#1a1a2e] leading-none">
                  🔥 {streak}
                </div>
                <div className="text-[11px] font-bold text-[#9999bb] mt-0.5">
                  Streak
                </div>
              </div>
            </div>

            <div className="w-full max-w-[600px] mb-5">
              <div className="h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#4ECAFC] to-[#9B5DE5] rounded-full transition-all duration-300"
                  style={{ width: `${(round / totalRounds) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/95 rounded-[32px] p-8 md:p-12 w-full max-w-[600px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-sm text-center animate-[fadeUp_0.5s_ease-out]">
              <h2 className="font-['Baloo_2'] text-2xl md:text-3xl font-black text-[#1a1a2e] mb-2">
                {(currentItem as GameQuestion).text}
              </h2>
              <p className="text-sm font-bold text-[#9999bb] mb-8">
                Tap the right answer below!
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 justify-center">
                {(currentItem as GameQuestion).options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handlePick(opt.id)}
                    className="rounded-[24px] border-4 border-transparent p-4 flex flex-col items-center justify-center gap-2 font-extrabold text-white text-lg transition-transform hover:-translate-y-1 hover:shadow-lg active:scale-95 shadow-md min-h-[120px]"
                    style={{ backgroundColor: opt.bg }}
                  >
                    <span className="text-4xl filter drop-shadow-sm">
                      {opt.label.split(" ")[0]}
                    </span>
                    <span>{opt.label.split(" ").slice(1).join(" ")}</span>
                  </button>
                ))}
              </div>

              <p
                className="mt-8 text-xl font-black min-h-[32px] transition-colors"
                style={{ color: feedback.color }}
              >
                {feedback.text}
              </p>
            </div>
          </div>
        )}

      {!gameOver && currentItem && currentItem.type === "lesson" && (
        <div className="flex-1 flex flex-col items-center justify-center p-5 md:py-10">
          <div className="w-full max-w-[600px] mb-5">
            <div className="h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#7b1fa2] to-[#ce93d8] rounded-full transition-all duration-300"
                style={{ width: `${(round / totalRounds) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white/95 rounded-[32px] p-8 md:p-12 w-full max-w-[600px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-sm text-center animate-[fadeUp_0.5s_ease-out]">
            {(currentItem as LessonContent).scenes &&
            (currentItem as LessonContent).scenes!.length > 0 ? (
              <div
                key={currentSceneIndex}
                className="animate-[popIn_0.5s_ease-out]"
              >
                <span className="text-8xl block mb-6 filter drop-shadow-md animate-[float_4s_ease-in-out_infinite]">
                  {
                    (currentItem as LessonContent).scenes![currentSceneIndex]
                      .emoji
                  }
                </span>
                <h2 className="font-['Baloo_2'] text-3xl md:text-4xl font-black text-[#1a1a2e] mb-6">
                  {(currentItem as LessonContent).title}
                </h2>
                <p className="text-xl md:text-2xl font-bold text-[#4a4a6a] mb-10 leading-relaxed whitespace-pre-line">
                  {
                    (currentItem as LessonContent).scenes![currentSceneIndex]
                      .text
                  }
                </p>
                {mode === "interactive" &&
                  (currentItem as LessonContent).scenes![currentSceneIndex]
                    .interaction && (
                    <div className="mb-10 bg-blue-50/50 p-6 rounded-3xl border-2 border-blue-100">
                      <p className="text-lg font-bold text-[#0288d1] mb-4">
                        {
                          (currentItem as LessonContent).scenes![
                            currentSceneIndex
                          ].interaction!.prompt
                        }
                      </p>
                      <div className="flex flex-wrap gap-4 justify-center">
                        {(currentItem as LessonContent).scenes![
                          currentSceneIndex
                        ].interaction!.options.map((opt, i) => (
                          <button
                            key={i}
                            disabled={interactionSolved}
                            onClick={() => handleInteractionClick(i)}
                            className={`text-6xl p-4 bg-white rounded-2xl shadow-sm border-4 transition-transform hover:-translate-y-1 active:scale-95 ${interactionSolved && i === (currentItem as LessonContent).scenes![currentSceneIndex].interaction!.answerIndex ? "border-green-400 bg-green-50 scale-110" : "border-transparent hover:border-blue-200"} ${interactionSolved && i !== (currentItem as LessonContent).scenes![currentSceneIndex].interaction!.answerIndex ? "opacity-50 grayscale" : ""}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="animate-[popIn_0.5s_ease-out]">
                <span className="text-8xl block mb-6 filter drop-shadow-md">
                  {(currentItem as LessonContent).emoji}
                </span>
                <h2 className="font-['Baloo_2'] text-3xl md:text-4xl font-black text-[#1a1a2e] mb-6">
                  {(currentItem as LessonContent).title}
                </h2>
                <p className="text-xl md:text-2xl font-bold text-[#4a4a6a] mb-10 leading-relaxed whitespace-pre-line">
                  {(currentItem as LessonContent).text}
                </p>
              </div>
            )}

            <div
              className={`flex gap-4 justify-center transition-opacity duration-300 ${transitioningStory ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <button
                onClick={() => {
                  setReadingFinished(false);
                  const lesson = currentItem as LessonContent;
                  if (lesson.scenes && lesson.scenes.length > 0) {
                    speakText(lesson.scenes[currentSceneIndex].text);
                  } else {
                    speakText(lesson.text);
                    if (lesson.audioUrl) {
                      playAudio(lesson.audioUrl);
                    }
                  }
                }}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-md transition-transform hover:scale-105 active:scale-95 ${isSpeaking ? "bg-[#ffeb3b] text-[#263238] animate-pulse" : "bg-white border-2 border-[#e8e8f4] text-[#4a4a6a]"}`}
              >
                {isSpeaking ? "🔊" : "▶️"}
              </button>
              <button
                onClick={nextLesson}
                disabled={
                  mode === "interactive" &&
                  !!(currentItem as LessonContent).scenes?.[currentSceneIndex]
                    ?.interaction &&
                  !interactionSolved
                }
                className={`rounded-full px-8 font-extrabold text-lg shadow-md hover:-translate-y-0.5 transition-transform ${mode === "interactive" && !!(currentItem as LessonContent).scenes?.[currentSceneIndex]?.interaction && !interactionSolved ? "bg-gray-300 text-gray-500 cursor-not-allowed transform-none shadow-none" : "bg-gradient-to-br from-[#7b1fa2] to-[#ce93d8] text-white"}`}
              >
                {(currentItem as LessonContent).scenes &&
                currentSceneIndex <
                  (currentItem as LessonContent).scenes!.length - 1
                  ? "Next Scene →"
                  : `Next ${round === totalRounds - 1 ? "Finish!" : "→"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
