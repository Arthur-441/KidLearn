import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const GUIDE_STEPS = [
  {
    title: "Welcome to KidLearn! 🎉",
    description: "Your magical adventure starts here. We've built a safe, fun, and engaging educational platform for your kids.",
    icon: "🚀"
  },
  {
    title: "Create Profiles 🧒",
    description: "Start by creating a profile for each child. They will get their own avatar, progress tracking, and personalized tasks!",
    icon: "📝"
  },
  {
    title: "Premium Activation 👑",
    description: "Unlock premium content like advanced games and exclusive worlds using activation codes from our premium plan.",
    icon: "💎"
  },
  {
    title: "Stars & Badges ⭐",
    description: "Kids earn stars by completing learning games. As they progress, they unlock awesome badges to show off their skills!",
    icon: "🏆"
  }
];

export default function WelcomeGuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("kidlearn_welcome_guide");
    if (!hasSeenGuide) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("kidlearn_welcome_guide", "true");
  };

  if (!isOpen) return null;

  const step = GUIDE_STEPS[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#1a1a2e]/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl w-full max-w-[500px] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header Progress */}
          <div className="h-2 bg-[#f0f4ff] w-full flex">
            {GUIDE_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-full flex-1 transition-colors duration-300 ${
                  idx <= currentStep ? "bg-[#1aaee8]" : "bg-transparent"
                }`}
              />
            ))}
          </div>

          <div className="p-8 flex flex-col items-center text-center">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="text-7xl mb-6 bg-[#f9f9fd] w-32 h-32 rounded-full flex items-center justify-center border-4 border-[#e8e8f4]"
            >
              {step.icon}
            </motion.div>

            <motion.h2
              key={`h2-${currentStep}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-black font-['Baloo_2'] text-[#1a1a2e] mb-3"
            >
              {step.title}
            </motion.h2>

            <motion.p
              key={`p-${currentStep}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[#6a6a8c] font-bold text-md leading-relaxed min-h-[80px]"
            >
              {step.description}
            </motion.p>
          </div>

          <div className="bg-[#f9f9fd] p-6 border-t-2 border-[#e8e8f4] flex items-center justify-between">
            <button
              onClick={handleClose}
              className="text-[#9999bb] font-bold text-sm hover:text-[#1a1a2e] transition-colors"
            >
              Skip Guide
            </button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-5 py-3 rounded-xl font-bold bg-white text-[#1a1a2e] border-2 border-[#e8e8f4] hover:bg-[#f0f4ff] transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-xl font-black bg-[#FFD93D] text-[#1a1a2e] hover:scale-105 transition-transform"
              >
                {currentStep === GUIDE_STEPS.length - 1 ? "Start Learning!" : "Next ✨"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
