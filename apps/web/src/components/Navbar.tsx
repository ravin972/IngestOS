"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Sparkles, User, Github, LogOut } from "lucide-react";
import { fetchHealth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  stats?: {
    total?: number;
    valid?: number;
    quarantined?: number;
    parseTimeMs?: number;
  };
  filename?: string;
}

export function Navbar({ stats, filename }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isEngineOnline, setIsEngineOnline] = useState<boolean>(true);

  // Initial engine health check wrapped in defensive try/catch
  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const health = await fetchHealth();
        if (isMounted) {
          setIsEngineOnline(health?.status === "healthy");
        }
      } catch (err) {
        console.warn("FastAPI engine unreachable during Navbar initial fetch. Gracefully degrading:", err);
        if (isMounted) {
          setIsEngineOnline(false);
        }
      }
    }

    checkHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Avoid duplicate header on full-screen Quarantine Studio workspace
  if (pathname?.startsWith("/workspace")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 h-14 backdrop-blur-xl bg-[#090D16]/75 border-b border-white/[0.07] shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.03)] flex items-center justify-between px-6 select-none transition-all">
      {/* Brand Identity & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm group-hover:scale-105 group-hover:border-indigo-500/50 transition-all">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">IngestOS</span>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] font-mono text-[10px] text-indigo-300 font-medium">
              v0.1 Sandbox
            </span>
            {!isEngineOnline && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 font-mono text-[10px] text-amber-400 font-medium">
                Offline
              </span>
            )}
          </div>
        </Link>

        {filename && (
          <>
            <div className="h-4 w-[1px] bg-white/[0.08] mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-slate-400">
              <span className="text-slate-500">Stream:</span>
              <span className="text-slate-200 font-medium">{filename}</span>
            </div>
          </>
        )}
      </div>

      {/* Central Telemetry Pills (When Active Run is displayed) */}
      {stats && (
        <div className="hidden xl:flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.07] text-slate-300">
            <span className="text-slate-500">Total:</span>
            <span className="font-semibold text-white">{(stats.total ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Valid:</span>
            <span className="font-bold">{(stats.valid ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span>Quarantined:</span>
            <span className="font-bold">{(stats.quarantined ?? 0).toLocaleString()}</span>
          </div>
          {stats.parseTimeMs !== undefined && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.07] text-slate-400">
              <span className="text-slate-500">Latency:</span>
              <span className="text-slate-200">{stats.parseTimeMs}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation & Action Links */}
      <div className="flex items-center gap-4">
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-400">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-md transition-all hover:text-white hover:bg-white/[0.04] ${
              pathname === "/" ? "text-white bg-white/[0.05]" : ""
            }`}
          >
            Overview
          </Link>
          <Link
            href="/sandbox"
            className={`px-3 py-1.5 rounded-md transition-all hover:text-white hover:bg-white/[0.04] ${
              pathname === "/sandbox" ? "text-white bg-white/[0.05]" : ""
            }`}
          >
            Sandbox
          </Link>
          <Link
            href="/privacy"
            className={`px-3 py-1.5 rounded-md transition-all hover:text-white hover:bg-white/[0.04] ${
              pathname === "/privacy" ? "text-white bg-white/[0.05]" : ""
            }`}
          >
            Privacy & DPA
          </Link>
          <a
            href="https://github.com/ravin972/IngestOS"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all hover:text-white hover:bg-white/[0.04]"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </nav>

        {/* Primary Glowing CTA */}
        <Link
          href="/sandbox"
          className="relative group h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_16px_rgba(99,102,241,0.35)] active:scale-95 border border-indigo-400/40"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
          <span>Launch Sandbox</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-mono hidden sm:inline">{user.email}</span>
            <Link
              href="/sandbox"
              className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-colors group"
              title="Dashboard (Sandbox)"
            >
              <User className="w-4 h-4 text-indigo-400 group-hover:scale-105 transition-transform" />
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-red-500/40 hover:bg-red-950/20 text-slate-300 hover:text-red-300 text-xs transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.2] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Sign In / Create Account"
          >
            <User className="w-4 h-4" />
          </Link>
        )}
      </div>
    </header>
  );
}
