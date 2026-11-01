"use client";

import React from "react";

export interface IngestLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export function IngestLogo({
  size = "md",
  showWordmark = false,
  className = "",
  iconOnly = false,
}: IngestLogoProps) {
  // Sizing configurations
  const config = {
    sm: {
      container: "w-7 h-7 rounded-lg",
      svg: "w-4 h-4",
      text: "text-sm",
      osText: "text-xs",
      gap: "gap-2",
    },
    md: {
      container: "w-9 h-9 rounded-xl",
      svg: "w-5 h-5",
      text: "text-base",
      osText: "text-sm",
      gap: "gap-2.5",
    },
    lg: {
      container: "w-12 h-12 rounded-2xl",
      svg: "w-7 h-7",
      text: "text-2xl",
      osText: "text-xl",
      gap: "gap-3",
    },
  }[size];

  const iconElement = (
    <div
      className={`relative shrink-0 flex items-center justify-center bg-gradient-to-b from-[#151D30] via-[#0D1322] to-[#090D16] border border-indigo-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_0_16px_-2px_rgba(99,102,241,0.3)] transition-all group-hover:border-indigo-400/60 group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_24px_rgba(99,102,241,0.45)] ${config.container}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${config.svg} transition-transform group-hover:scale-105`}
      >
        <defs>
          <linearGradient
            id={`prism-grad-${size}`}
            x1="7.5"
            y1="7.5"
            x2="16.5"
            y2="16.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#818CF8" stopOpacity="0.45" />
            <stop stopColor="#6366F1" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* 1. Upper Incoming Stream Node (Raw Payload Stream) */}
        <circle cx="12" cy="3" r="1.5" fill="#A5B4FC" />
        <path
          d="M12 4.5V7.5"
          stroke="#818CF8"
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* 2. Central Bifurcation Prism / Contract Gate */}
        <path
          d="M12 7.5L16.5 12L12 16.5L7.5 12Z"
          fill={`url(#prism-grad-${size})`}
          stroke="#818CF8"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Internal Optical Refraction Facet */}
        <path
          d="M12 9.5L14.25 12L12 14.5L9.75 12Z"
          fill="#818CF8"
          fillOpacity="0.3"
          stroke="#C7D2FE"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />

        {/* 3. Primary Clean Stream (Emerald #34D399 - 0-Disk Egress) */}
        <path
          d="M12 16.5V19.5"
          stroke="#34D399"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="12" cy="21" r="1.5" fill="#34D399" />

        {/* 4. Secondary Quarantine Branch (Amber #FBBF24 - 60m DLQ) */}
        <path
          d="M15 13.5C17.2 14.4 18.2 16 18.2 18"
          stroke="#FBBF24"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="18.2" cy="19.75" r="1.25" fill="#FBBF24" />
      </svg>
    </div>
  );

  if (iconOnly || !showWordmark) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {iconElement}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${config.gap} ${className}`}>
      {iconElement}
      <div className="flex items-center tracking-tight select-none">
        <span className={`${config.text} font-semibold text-white`}>
          Ingest
        </span>
        <span
          className={`${config.osText} ml-0.5 font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400`}
        >
          OS
        </span>
      </div>
    </div>
  );
}

export default IngestLogo;
