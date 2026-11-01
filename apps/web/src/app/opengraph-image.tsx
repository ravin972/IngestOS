import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "IngestOS — Zero-Retention High-Speed Data Ingestion & Quarantine Engine";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          backgroundColor: "#090D16",
          backgroundImage:
            "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(99, 102, 241, 0.28), transparent 70%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid accent background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            pointerEvents: "none",
          }}
        />

        {/* 1. Top Brand Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            {/* Bifurcation Prism Squircle Mark */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                backgroundColor: "#0D1322",
                border: "1.5px solid rgba(129, 140, 248, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(99, 102, 241, 0.4)",
              }}
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Upper Stream Node */}
                <circle cx="12" cy="3" r="1.5" fill="#A5B4FC" />
                <path
                  d="M12 4.5V7.5"
                  stroke="#818CF8"
                  strokeWidth="1.75"
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
                <path
                  d="M12 9.5L14.25 12L12 14.5L9.75 12Z"
                  fill="#4F46E5"
                  stroke="#C7D2FE"
                  strokeWidth="0.75"
                  strokeLinejoin="round"
                />

                {/* Clean Downward Stream */}
                <path
                  d="M12 16.5V19.5"
                  stroke="#34D399"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="21" r="1.5" fill="#34D399" />

                {/* Quarantine Branch */}
                <path
                  d="M15 13.5C17.2 14.4 18.2 16 18.2 18"
                  stroke="#FBBF24"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <circle cx="18.2" cy="19.75" r="1.25" fill="#FBBF24" />
              </svg>
            </div>

            {/* Wordmark */}
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  color: "#FFFFFF",
                }}
              >
                Ingest
              </span>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  marginLeft: "4px",
                  color: "#818CF8",
                }}
              >
                OS
              </span>
            </div>
          </div>

          {/* Engine Status Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 18px",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#34D399",
              letterSpacing: "-0.01em",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                backgroundColor: "#34D399",
                boxShadow: "0 0 10px #34D399",
              }}
            />
            <span>Production Engine Online</span>
          </div>
        </div>

        {/* 2. Headline & Value Proposition */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "960px",
            marginTop: "16px",
          }}
        >
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.04em",
              color: "#F8FAFC",
              margin: 0,
            }}
          >
            Turn Dirty CSV & JSON Ingestion into Clean PostgreSQL Data in Seconds
          </h1>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 400,
              lineHeight: 1.4,
              color: "#94A3B8",
              margin: 0,
            }}
          >
            High-speed vectorized Polars Rust AST engine with human-in-the-loop
            quarantine triage and strict zero-retention memory compliance.
          </p>
        </div>

        {/* 3. Bottom Pill Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Badge 1: Throughput */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "12px",
                backgroundColor: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.35)",
                fontSize: "16px",
                fontWeight: 600,
                color: "#C7D2FE",
                fontFamily: "monospace",
              }}
            >
              <span style={{ color: "#818CF8" }}>⚡</span>
              <span>1.48M rows/s • Polars Rust AST</span>
            </div>

            {/* Badge 2: Zero Retention */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "12px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                fontSize: "16px",
                fontWeight: 600,
                color: "#A7F3D0",
                fontFamily: "monospace",
              }}
            >
              <span style={{ color: "#34D399" }}>🛡️</span>
              <span>0 Bytes Disk Retention</span>
            </div>

            {/* Badge 3: Quarantine Studio */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "12px",
                backgroundColor: "rgba(251, 191, 36, 0.12)",
                border: "1px solid rgba(251, 191, 36, 0.35)",
                fontSize: "16px",
                fontWeight: 600,
                color: "#FDE68A",
                fontFamily: "monospace",
              }}
            >
              <span style={{ color: "#FBBF24" }}>⏱️</span>
              <span>60-Min Quarantine IDE</span>
            </div>
          </div>

          {/* URL Tag */}
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              fontFamily: "monospace",
              color: "#64748B",
            }}
          >
            ingest-os.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
