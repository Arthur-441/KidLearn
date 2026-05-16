import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FeatureGuideProps {
  featureId: string;
  title: string;
  description: string;
  icon?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export default function FeatureGuide({
  featureId,
  title,
  description,
  icon = "💡",
  position = "bottom-right"
}: FeatureGuideProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenFeature = localStorage.getItem(`kidlearn_feature_${featureId}`);
    if (!hasSeenFeature) {
      // Small delay so it pops up after page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [featureId]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`kidlearn_feature_${featureId}`, "true");
  };

  if (!isVisible) return null;

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-20 right-6",
    "top-left": "top-20 left-6",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className={`fixed z-[900] ${positionClasses[position]} w-[320px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border-2 border-[#1aaee8] overflow-hidden`}
      >
        <div className="bg-[#e0f7fc] px-4 py-3 border-b border-[#bdebfa] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <span className="font-['Baloo_2'] font-bold text-[#00749e]">{title}</span>
          </div>
          <button 
            onClick={handleDismiss}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-[#00749e] hover:bg-[#bdebfa] transition-colors font-bold text-xs"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm font-bold text-[#4a4a6a] leading-relaxed">
            {description}
          </p>
          <button
            onClick={handleDismiss}
            className="mt-4 w-full py-2 bg-[#1aaee8] text-white rounded-xl font-bold text-sm tracking-wide hover:bg-[#1594c7] transition-colors"
          >
            Got it! 👍
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
