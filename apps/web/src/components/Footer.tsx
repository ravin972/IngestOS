import React from "react";
import Link from "next/link";
import { ShieldCheck, Cpu, HardDrive, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.07] bg-[#090D16] py-4 px-6 select-none relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
        {/* Left Telemetry Cluster */}
        <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
          <Link href="/" className="flex items-center gap-2 text-slate-300 font-sans font-semibold tracking-tight hover:text-white transition-colors">
            <div className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-3 h-3" />
            </div>
            <span>IngestOS</span>
          </Link>
          <span className="text-white/[0.1] hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-500">Engine:</span>
            <span className="text-slate-300">FastAPI + Polars</span>
          </span>
          <span className="text-white/[0.1] hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Broker:</span>
            <span className="text-slate-300">Redis 7 Broker</span>
          </span>
          <span className="text-white/[0.1] hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-500">Compliance:</span>
            <span className="text-slate-300">RAM Only (60m TTL)</span>
          </span>
        </div>

        {/* Right Navigation & Status Indicator */}
        <div className="flex items-center gap-6 flex-wrap justify-center md:justify-end">
          <nav className="flex items-center gap-4 text-xs font-sans text-slate-400">
            <Link href="/" className="hover:text-white hover:underline decoration-white/20 underline-offset-4 transition-colors">
              Overview
            </Link>
            <Link href="/sandbox" className="hover:text-white hover:underline decoration-white/20 underline-offset-4 transition-colors">
              Sandbox
            </Link>
            <Link href="/privacy" className="hover:text-white hover:underline decoration-white/20 underline-offset-4 transition-colors">
              Privacy & DPA
            </Link>
            <a
              href="https://github.com/ravin972/IngestOS"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white hover:underline decoration-white/20 underline-offset-4 transition-colors"
            >
              GitHub
            </a>
          </nav>

          {/* Clean Pulsing Status Dot */}
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
