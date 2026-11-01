import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#090D16",
          borderRadius: "8px",
          border: "1.5px solid #6366F1",
          boxShadow: "0 0 8px rgba(99, 102, 241, 0.4)",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Upper Stream Node */}
          <circle cx="12" cy="3" r="1.5" fill="#A5B4FC" />
          <path
            d="M12 4.5V7.5"
            stroke="#818CF8"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Central Indigo Prism */}
          <path
            d="M12 7.5L16.5 12L12 16.5L7.5 12Z"
            fill="#312E81"
            stroke="#818CF8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Internal Optical Facet */}
          <path
            d="M12 9.5L14.25 12L12 14.5L9.75 12Z"
            fill="#4F46E5"
            stroke="#C7D2FE"
            strokeWidth="0.75"
            strokeLinejoin="round"
          />

          {/* Clean Downward Stream (Emerald) */}
          <path
            d="M12 16.5V19.5"
            stroke="#34D399"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="21" r="1.5" fill="#34D399" />

          {/* Quarantine Branch (Amber) */}
          <path
            d="M15 13.5C17.2 14.4 18.2 16 18.2 18"
            stroke="#FBBF24"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="18.2" cy="19.75" r="1.25" fill="#FBBF24" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
