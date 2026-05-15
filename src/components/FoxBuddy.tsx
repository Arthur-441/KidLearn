import React from "react";

interface FoxBuddyProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function FoxBuddy({
  message = "Great job!",
  className = "",
  size = "md",
}: FoxBuddyProps) {
  const sizeClasses = {
    sm: "w-[100px] h-[100px]",
    md: "w-[180px] h-[180px]",
    lg: "w-[240px] h-[240px]",
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <style>{`
        @keyframes foxBlink {
          0%, 96%, 98%, 100% { transform: scaleY(1); }
          97%, 99% { transform: scaleY(0.1); }
        }
        @keyframes foxWiggleEarL {
          0%, 90%, 100% { transform: rotate(0deg); transform-origin: 72px 65px; }
          95% { transform: rotate(-15deg); transform-origin: 72px 65px; }
        }
        @keyframes foxWiggleEarR {
          0%, 90%, 100% { transform: rotate(0deg); transform-origin: 228px 65px; }
          95% { transform: rotate(15deg); transform-origin: 228px 65px; }
        }
        .fox-blink { animation: foxBlink 4s infinite; transform-origin: center; }
        .fox-ear-l { animation: foxWiggleEarL 5s infinite; }
        .fox-ear-r { animation: foxWiggleEarR 5s infinite; animation-delay: 0.2s; }
      `}</style>
      <svg
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-[floatBob_5s_ease-in-out_infinite] drop-shadow-[0_10px_20px_rgba(255,152,0,0.35)]"
      >
        <ellipse cx="150" cy="200" rx="90" ry="70" fill="#FF9800" />
        <circle cx="150" cy="130" r="90" fill="#FFB74D" />
        <g className="fox-ear-l">
          <ellipse cx="72" cy="65" rx="28" ry="38" fill="#FF9800" />
          <ellipse cx="72" cy="65" rx="16" ry="24" fill="#FF6F00" />
        </g>
        <g className="fox-ear-r">
          <ellipse cx="228" cy="65" rx="28" ry="38" fill="#FF9800" />
          <ellipse cx="228" cy="65" rx="16" ry="24" fill="#FF6F00" />
        </g>
        <ellipse cx="150" cy="145" rx="60" ry="50" fill="#FFE0B2" />
        <g className="fox-blink">
          <circle cx="120" cy="118" r="14" fill="#fff" />
          <circle cx="180" cy="118" r="14" fill="#fff" />
          <circle cx="122" cy="120" r="9" fill="#1a1a2e" />
          <circle cx="182" cy="120" r="9" fill="#1a1a2e" />
          <circle cx="125" cy="117" r="3" fill="#fff" />
          <circle cx="185" cy="117" r="3" fill="#fff" />
        </g>
        <ellipse cx="150" cy="140" rx="12" ry="8" fill="#BF360C" />
        <path
          d="M130 155 Q150 172 170 155"
          stroke="#BF360C"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="104" cy="148" rx="14" ry="9" fill="#FF8A65" opacity=".5" />
        <ellipse cx="196" cy="148" rx="14" ry="9" fill="#FF8A65" opacity=".5" />
        <line
          x1="60"
          y1="140"
          x2="110"
          y2="145"
          stroke="#8D6E63"
          strokeWidth="2"
          opacity=".5"
        />
        <line
          x1="55"
          y1="150"
          x2="108"
          y2="150"
          stroke="#8D6E63"
          strokeWidth="2"
          opacity=".5"
        />
        <line
          x1="190"
          y1="145"
          x2="240"
          y2="140"
          stroke="#8D6E63"
          strokeWidth="2"
          opacity=".5"
        />
        <line
          x1="192"
          y1="150"
          x2="245"
          y2="150"
          stroke="#8D6E63"
          strokeWidth="2"
          opacity=".5"
        />
        <polygon points="150,30 120,90 180,90" fill="#9B5DE5" />
        <rect x="110" y="86" width="80" height="12" rx="6" fill="#7b1fa2" />
        <circle cx="150" cy="32" r="8" fill="#FFD93D" />
      </svg>
      {message && (
        <div className="absolute top-[10%] right-[-10px] md:right-[-120px] bg-white border-4 border-[#FFD93D] rounded-t-2xl rounded-bl-sm rounded-br-2xl py-3 px-4 shadow-xl text-[14px] md:text-[16px] font-black text-[#1a1a2e] animate-[popIn_0.5s_ease-out_both] whitespace-normal z-20 max-w-[200px] md:max-w-[250px] break-words">
          {message}
        </div>
      )}
    </div>
  );
}
