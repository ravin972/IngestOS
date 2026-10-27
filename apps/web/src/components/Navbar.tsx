"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Sparkles, Terminal, User, Github } from "lucide-react";

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

  return (
    <header className="sticky top-0 z-50 h-14 bg-surface-low border-b border-border flex items-center justify-between px-4 select-none backdrop-blur-md">
      {/* Brand Identity & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-white">IngestOS</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-high border border-border/80 font-mono text-[10px] text-brand-primary font-medium">
              v0.1 Sandbox
            </span>
          </div>
        </Link>

        {filename && (
          <>
            <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-border text-slate-300">
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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-border text-slate-400">
              <span className="text-slate-500">Latency:</span>
              <span className="text-slate-200">{stats.parseTimeMs}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation & Action Links */}
      <div className="flex items-center gap-3">
        <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400">
          <Link
            href="/"
            className={`transition-colors hover:text-white ${pathname === "/" ? "text-white" : ""}`}
          >
            Overview
          </Link>
          <Link
            href="/sandbox"
            className={`transition-colors hover:text-white ${pathname === "/sandbox" ? "text-white" : ""}`}
          >
            Sandbox
          </Link>
          <Link
            href="/privacy"
            className={`transition-colors hover:text-white ${pathname === "/privacy" ? "text-white" : ""}`}
          >
            Zero-Retention DPA
          </Link>
          <a
            href="https://github.com/ravin972/IngestOS"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </nav>

        <Link
          href="/sandbox"
          className="h-8 px-3 rounded-lg bg-brand-primary hover:bg-brand-hover text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Sandbox</span>
        </Link>

        <Link
          href="/auth"
          className="w-8 h-8 rounded-lg bg-surface border border-border hover:border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          title="Account / Auth"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
