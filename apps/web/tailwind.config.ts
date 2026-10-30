import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#090D16",
        surface: {
          DEFAULT: "#111827",
          dark: "#0D1117",
          lowest: "#070E1D",
          low: "#141B2B",
          container: "#191F2F",
          high: "#232A3A",
          highest: "#2E3545",
        },
        border: {
          DEFAULT: "#1F2937",
          subtle: "#161F2E",
          active: "#374151",
        },
        brand: {
          primary: "#6366F1",
          hover: "#4F46E5",
          accent: "#8083FF",
        },
        status: {
          valid: "#10B981",
          validBg: "rgba(16, 185, 129, 0.12)",
          quarantine: "#EF4444",
          quarantineBg: "rgba(239, 68, 68, 0.15)",
          warning: "#F59E0B",
          warningBg: "rgba(245, 158, 11, 0.15)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.02em",
        tighter: "-0.015em",
        tight: "-0.01em",
        wider: "0.05em",
        widest: "0.1em",
      },
    },
  },
  plugins: [],
};

export default config;
