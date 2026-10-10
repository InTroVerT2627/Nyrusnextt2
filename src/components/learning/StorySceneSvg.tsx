"use client";

import React from "react";

type StorySceneSvgProps = {
  character: string;
  setting: string;
  visualMood: "focused" | "urgent" | "pensive" | "triumphant";
  sceneObjects: string[];
  className?: string;
};

export default function StorySceneSvg({
  character,
  setting,
  visualMood,
  sceneObjects,
  className = "",
}: StorySceneSvgProps) {
  // Palette color definitions
  const midnight = "#142D4E";
  const cyan = "#06C6E6";
  const ice = "#EAF6FC";
  const border = "#D9E8F3";
  const muted = "#64748B";
  const white = "#FFFFFF";
  const warning = "#D97706";
  const success = "#059669";

  const isUrgent = visualMood === "urgent";
  const isPensive = visualMood === "pensive";
  const isTriumphant = visualMood === "triumphant";

  // Accent highlights based on mood
  const moodAccent = isUrgent ? warning : isTriumphant ? success : cyan;

  return (
    <div className={`story-scene-svg-wrapper ${className}`} role="img" aria-label={`Scene illustration: ${character} in ${setting}`}>
      <svg
        viewBox="0 0 600 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="story-scene-svg"
      >
        {/* Background Gradients & Architecture */}
        <rect width="600" height="360" rx="14" fill={midnight} />
        
        {/* Ambient grid lines (Mission Control architectural feel) */}
        <g opacity="0.15" stroke={cyan} strokeWidth="1">
          <line x1="0" y1="90" x2="600" y2="90" />
          <line x1="0" y1="180" x2="600" y2="180" />
          <line x1="0" y1="270" x2="600" y2="270" />
          <line x1="150" y1="0" x2="150" y2="360" />
          <line x1="300" y1="0" x2="300" y2="360" />
          <line x1="450" y1="0" x2="450" y2="360" />
        </g>

        {/* Ambient Room Lighting / Window View */}
        <rect x="420" y="30" width="140" height="110" rx="6" fill="#1b3a63" stroke={cyan} strokeWidth="1.5" opacity="0.5" />
        {/* Architectural City Skyline outside window */}
        <path d="M435 120 V70 H450 V85 H465 V60 H480 V95 H500 V75 H520 V120 Z" fill={cyan} opacity="0.25" />
        <line x1="490" y1="40" x2="490" y2="140" stroke={ice} strokeWidth="1" opacity="0.2" />
        <line x1="420" y1="85" x2="560" y2="85" stroke={ice} strokeWidth="1" opacity="0.2" />

        {/* Main Work Desk Surface */}
        <path
          d="M60 270 L540 270 L510 320 L90 320 Z"
          fill="#0c1d33"
          stroke={cyan}
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* Monitor 1 (Main Screen) */}
        <rect x="220" y="140" width="160" height="105" rx="5" fill="#081424" stroke={cyan} strokeWidth="2" />
        <rect x="288" y="245" width="24" height="25" fill="#1b3a63" />
        <rect x="270" y="268" width="60" height="4" rx="2" fill={border} />
        {/* Monitor Screen Graphics: Code / Line Charts / Terminal */}
        <rect x="232" y="152" width="136" height="80" rx="3" fill="#0c1e36" />
        {isUrgent ? (
          // Spiky red/amber anomaly chart
          <g>
            <path d="M240 215 L260 210 L280 185 L300 220 L320 225 L345 224" stroke={warning} strokeWidth="2" fill="none" />
            <circle cx="280" cy="185" r="4" fill={warning} />
            <rect x="240" y="160" width="60" height="8" rx="2" fill={warning} opacity="0.8" />
          </g>
        ) : (
          // Calm cyan analytical curves and lines
          <g>
            <path d="M240 215 C260 190, 280 200, 300 175 S330 180, 355 165" stroke={cyan} strokeWidth="2" fill="none" />
            <rect x="240" y="160" width="45" height="6" rx="2" fill={cyan} opacity="0.7" />
            <rect x="240" y="172" width="70" height="4" rx="2" fill={ice} opacity="0.4" />
          </g>
        )}

        {/* Secondary Laptop Screen */}
        <rect x="110" y="195" width="90" height="65" rx="4" fill="#081424" stroke={border} strokeWidth="1.5" />
        <path d="M100 260 L210 260 L200 268 L110 268 Z" fill="#1b3a63" />
        <rect x="118" y="204" width="74" height="48" rx="2" fill="#0f2644" />
        <line x1="124" y1="214" x2="160" y2="214" stroke={cyan} strokeWidth="2" strokeLinecap="round" />
        <line x1="124" y1="224" x2="180" y2="224" stroke={ice} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="124" y1="234" x2="150" y2="234" stroke={ice} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

        {/* Character Illustration (Geometric, Dignified, Palette Tints) */}
        {/* Character Body / Shoulders */}
        <path
          d="M340 340 C340 280, 440 280, 440 340 Z"
          fill="#1b3a63"
          stroke={cyan}
          strokeWidth="1.5"
        />
        {/* Shirt Collar / Badge */}
        <path d="M375 285 L390 305 L405 285 Z" fill={ice} />
        {/* Character Head */}
        <circle cx="390" cy="245" r="28" fill="#e2d4c0" stroke="#c4b096" strokeWidth="1" />
        {/* Character Hair: Distinct styling */}
        {character === "Meera" ? (
          <path d="M362 245 C360 215, 420 215, 418 245 C418 260, 410 265, 415 280 C400 282, 385 275, 380 270 Z" fill="#2d1b0d" />
        ) : character === "Ravi" ? (
          <path d="M362 240 C362 215, 418 215, 418 240 C418 230, 410 220, 390 220 C370 220, 362 230, 362 240 Z" fill="#1c2536" />
        ) : (
          <path d="M362 242 C362 218, 418 218, 418 242 C415 225, 365 225, 362 242 Z" fill="#3b2716" />
        )}
        {/* Thought / Mood Indicator */}
        <circle cx="430" cy="205" r="14" fill="#081424" stroke={moodAccent} strokeWidth="1.5" />
        {isUrgent ? (
          <text x="430" y="210" textAnchor="middle" fill={warning} fontSize="14" fontWeight="800" fontFamily="sans-serif">!</text>
        ) : isPensive ? (
          <text x="430" y="210" textAnchor="middle" fill={cyan} fontSize="13" fontWeight="700" fontFamily="sans-serif">?</text>
        ) : (
          <text x="430" y="210" textAnchor="middle" fill={success} fontSize="13" fontWeight="800" fontFamily="sans-serif">✓</text>
        )}

        {/* Scene Objects on Desk */}
        {sceneObjects.includes("coffee_mug") && (
          <g transform="translate(390, 260)">
            <rect x="0" y="0" width="14" height="18" rx="2" fill={ice} stroke={border} strokeWidth="1" />
            <path d="M14 4 C18 4, 18 12, 14 12" stroke={border} strokeWidth="1.5" fill="none" />
            <path d="M3 -3 C5 -7, 2 -9, 4 -12" stroke={cyan} strokeWidth="1" fill="none" opacity="0.6" />
          </g>
        )}

        {sceneObjects.includes("sticky_notes") && (
          <g transform="translate(195, 262)">
            <rect x="0" y="0" width="18" height="18" rx="2" fill={warning} opacity="0.85" />
            <line x1="3" y1="4" x2="14" y2="4" stroke={midnight} strokeWidth="1" />
            <line x1="3" y1="8" x2="12" y2="8" stroke={midnight} strokeWidth="1" />
          </g>
        )}

        {sceneObjects.includes("tea_glasses") && (
          <g transform="translate(385, 255)">
            <polygon points="0,0 14,0 12,20 2,20" fill="#f59e0b" opacity="0.6" stroke={border} strokeWidth="1" />
            <line x1="0" y1="6" x2="14" y2="6" stroke={border} strokeWidth="1" />
          </g>
        )}

        {/* Setting Badge Overlay */}
        <g transform="translate(24, 24)">
          <rect x="0" y="0" width="220" height="28" rx="6" fill="rgba(8, 20, 36, 0.85)" stroke={cyan} strokeWidth="1" />
          <circle cx="14" cy="14" r="4" fill={moodAccent} />
          <text x="26" y="18" fill={white} fontSize="10.5" fontWeight="700" letterSpacing="0.6px" fontFamily="sans-serif">
            {setting.toUpperCase()}
          </text>
        </g>
      </svg>
    </div>
  );
}
