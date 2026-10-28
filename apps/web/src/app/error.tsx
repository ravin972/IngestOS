"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Sparkles, Terminal, ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log catastrophic error for telemetry
    console.error("Catastrophic application error caught by Root Error Boundary:", error);
  }, [error]);

  const isNetworkOrBackend =
    error?.name === "TypeError" ||
    error?.message?.toLowerCase().includes("fetch") ||
    error?.message?.toLowerCase().includes("network") ||
    error?.message?.toLowerCase().includes("econnrefused") ||
    error?.message?.toLowerCase().includes("unreachable");

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col justify-center items-center px-4 py-16 selection:bg-indigo-500/30">
      <div className="w-full max-w-xl space-y-6">
        {/* Error Card */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 shadow-2xl space-y-6">
          {/* Header & Icon */}
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0 shadow-lg shadow-red-950/50">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-semibold">
                Critical Runtime Boundary Intercept
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                {isNetworkOrBackend ? "FastAPI Core Engine Unreachable" : "Unexpected Client Runtime Fault"}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isNetworkOrBackend
                  ? "The IngestOS frontend was unable to establish a connection to the high-throughput engine on port 8000."
                  : "A component threw an unhandled render exception. The application state has been preserved."}
              </p>
            </div>
          </div>

          {/* Diagnostic Terminal Box */}
          <div className="p-4 rounded-lg bg-[#070e1d] border border-[#1F2937] font-mono text-xs space-y-2 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between text-slate-500 border-b border-[#1F2937] pb-2 text-[11px]">
              <div className="flex items-center space-x-2">
                <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                <span>Error Diagnostics</span>
              </div>
              {error.digest && <span>Digest: {error.digest}</span>}
            </div>
            <div className="text-red-400 break-words leading-relaxed">
              {error.message || "An unknown network or execution fault occurred."}
            </div>
          </div>

          {/* Troubleshooting Checklist */}
          {isNetworkOrBackend && (
            <div className="p-3.5 rounded-lg bg-[#0D1117] border border-[#1F2937] space-y-2 text-xs">
              <span className="font-semibold text-slate-300 font-sans text-[11px] uppercase tracking-wider">
                Recommended Troubleshooting
              </span>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>Backend API: <code>python -m uvicorn main:app --reload --port 8000</code></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Docker Containers: <code>docker compose up -d</code></span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Reconnecting</span>
            </button>
            <Link
              href="/sandbox"
              className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[#0D1117] hover:bg-[#191f2f] border border-[#1F2937] text-slate-200 font-semibold text-xs transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Open Sandbox</span>
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[#0D1117] hover:bg-[#191f2f] border border-[#1F2937] text-slate-200 font-semibold text-xs transition-colors"
            >
              <Home className="h-3.5 w-3.5 text-slate-400" />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Security / DPA Footer Pill */}
        <div className="text-center font-mono text-[11px] text-slate-500">
          IngestOS • Zero-Retention RAM Architecture • Deterministic Fail-Safe
        </div>
      </div>
    </div>
  );
}
