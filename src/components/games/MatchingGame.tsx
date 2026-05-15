import React, { useState, useEffect } from "react";
import { GameQuestion } from "../../utils/gameLogic";
import { SOUND_URLS } from "../../utils/sounds";
import confetti from "canvas-confetti";

interface MatchingGameProps {
  questions: GameQuestion[];
  onComplete: (score: number, stars: number, issues: string[]) => void;
  playAudio: (url: string) => void;
  triggerReward?: (
    type: "star" | "badge",
    amount?: number,
    badgeName?: string,
  ) => void;
  setFeedback?: (feedback: { text: string; color: string }) => void;
}

type CardType = "label" | "visual";

interface Card {
  id: string; // unique per card
  matchId: string; // connects label and visual
  type: CardType;
  content: string; // The text or emoji
  bg: string;
  isFlipped: boolean;
  isMatched: boolean;
  isError?: boolean;
  isJustMatched?: boolean;
}

export default function MatchingGame({
  questions,
  onComplete,
  playAudio,
  triggerReward,
  setFeedback,
}: MatchingGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [matches, setMatches] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    // Generate pairs from the questions (we take up to 4 to make 8 cards)
    const pairsToUse = questions.slice(0, 4);
    let newCards: Card[] = [];

    pairsToUse.forEach((q, i) => {
      // Find the correct option
      const correctOpt = q.options.find((o) => o.id === q.answerId);
      if (correctOpt) {
        const visual = correctOpt.label.split(" ")[0]; // E.g., 🔴
        const label = correctOpt.label.split(" ").slice(1).join(" ") || visual; // E.g., Red

        newCards.push({
          id: `vis-${i}`,
          matchId: q.answerId,
          type: "visual",
          content: visual,
          bg: correctOpt.bg,
          isFlipped: false,
          isMatched: false,
        });

        newCards.push({
          id: `lbl-${i}`,
          matchId: q.answerId,
          type: "label",
          content: label,
          bg: "#4a4a6a", // or some neutral color for back
          isFlipped: false,
          isMatched: false,
        });
      }
    });

    // Shuffle
    newCards = newCards.sort(() => 0.5 - Math.random());
    setCards(newCards);
  }, [questions]);

  useEffect(() => {
    if (flippedIds.length === 2 && !isLocked) {
      setIsLocked(true);
      const card1 = cards.find((c) => c.id === flippedIds[0]);
      const card2 = cards.find((c) => c.id === flippedIds[1]);

      if (
        card1 &&
        card2 &&
        card1.matchId === card2.matchId &&
        card1.type !== card2.type
      ) {
        // Match!
        const newMatches = matches + 1;
        if (newMatches >= 3 && newMatches % 2 === 1) {
          playAudio(SOUND_URLS.awesome);
        } else {
          playAudio(SOUND_URLS.correct);
        }

        if (triggerReward) triggerReward("star", 1);
        if (setFeedback)
          setFeedback({ text: "Got a match! ⭐", color: "#4CAF50" });

        setCards((prev) =>
          prev.map((c) =>
            c.id === card1.id || c.id === card2.id
              ? { ...c, isMatched: true, isJustMatched: true }
              : c,
          ),
        );
        setMatches(newMatches);
        setFlippedIds([]);
        setIsLocked(false);

        setTimeout(() => {
          if (setFeedback) setFeedback({ text: "", color: "" });
          setCards((prev) =>
            prev.map((c) =>
              c.id === card1.id || c.id === card2.id
                ? { ...c, isJustMatched: false }
                : c,
            ),
          );
        }, 800);
      } else {
        // No match
        playAudio(SOUND_URLS.wrong);
        if (setFeedback)
          setFeedback({
            text: "Ah, those two don't match! Put your memory to work and try again.",
            color: "#d32f2f",
          });
        setMistakes((m) => m + 1);

        const labelCard =
          card1?.type === "label"
            ? card1
            : card2?.type === "label"
              ? card2
              : null;
        if (labelCard) {
          setIssues((prev) => {
            if (!prev.includes(labelCard.content))
              return [...prev, labelCard.content];
            return prev;
          });
        }

        setCards((prev) =>
          prev.map((c) =>
            c.id === card1?.id || c.id === card2?.id
              ? { ...c, isError: true }
              : c,
          ),
        );
        setTimeout(() => {
          if (setFeedback) setFeedback({ text: "", color: "" });
          setCards((prev) =>
            prev.map((c) =>
              c.id === card1?.id || c.id === card2?.id
                ? { ...c, isFlipped: false, isError: false }
                : c,
            ),
          );
          setFlippedIds([]);
          setIsLocked(false);
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flippedIds, cards, isLocked]);

  useEffect(() => {
    if (
      cards.length > 0 &&
      matches === 0 &&
      flippedIds.length === 0 &&
      mistakes === 0
    ) {
      if (setFeedback)
        setFeedback({ text: "Find the matching pairs!", color: "#1a1a2e" });
    }
  }, [cards.length, matches, flippedIds.length, mistakes, setFeedback]);

  useEffect(() => {
    if (matches > 0 && matches === cards.length / 2) {
      // Game over
      playAudio(SOUND_URLS.win);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        const finalScore = Math.max(0, 5 - mistakes);
        const stars = Math.max(1, 5 - mistakes);
        onComplete(finalScore, stars, issues);
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, cards.length, mistakes, issues]);

  const handleCardClick = (id: string) => {
    if (isLocked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)),
    );
    setFlippedIds((prev) => [...prev, id]);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-5 md:py-10 text-center">
      <h2 className="font-['Baloo_2'] text-3xl font-black text-[#1a1a2e] mb-2">
        Matching Game! 🧩
      </h2>
      <p className="text-sm font-bold text-[#9999bb] mb-8">
        Tap cards to find the matching pairs!
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-[600px]">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`cursor-pointer w-full aspect-square rounded-2xl relative preserve-3d transition-transform duration-500 ${card.isFlipped || card.isMatched ? "rotate-y-180" : ""} ${card.isError ? "anim-shake" : ""} ${card.isJustMatched ? "anim-pop z-10" : ""}`}
            style={{ perspective: "1000px" }}
          >
            {/* Front of card (visible initially) */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-[#fff] shadow-md border-4 border-[#e8e8f4] flex flex-col items-center justify-center text-4xl`}
            >
              ❓
            </div>

            {/* Back of card (visible when flipped) */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl shadow-md border-4 flex flex-col items-center justify-center text-white p-2 rotate-y-180 transition-all duration-300 ${card.isJustMatched ? "border-[#4CAF50] shadow-[0_0_20px_rgba(76,175,80,0.8)]" : "border-transparent"}`}
              style={{ backgroundColor: card.isError ? "#ef5350" : card.bg }}
            >
              <span
                className={
                  card.type === "visual"
                    ? "text-5xl filter drop-shadow-sm"
                    : "text-2xl font-black"
                }
              >
                {card.content}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes shakeMatch {
          0%, 100% { transform: rotateY(180deg) translateX(0); }
          20%, 60% { transform: rotateY(180deg) translateX(-6px); }
          40%, 80% { transform: rotateY(180deg) translateX(6px); }
        }
        @keyframes popMatch {
          0% { transform: rotateY(180deg) scale(1); }
          50% { transform: rotateY(180deg) scale(1.15); }
          100% { transform: rotateY(180deg) scale(1); }
        }
        .anim-shake { animation: shakeMatch 0.4s ease-in-out; }
        .anim-pop { animation: popMatch 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
}
