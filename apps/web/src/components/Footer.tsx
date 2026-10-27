import Link from "next/link";
import { ShieldCheck, Cpu, HardDrive } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface-lowest/90 backdrop-blur py-2 px-4 select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-brand-primary" />
            <span className="text-slate-500">Engine:</span>
            <span className="text-slate-300">FastAPI + Polars</span>
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Broker:</span>
            <span className="text-slate-300">Redis 7 / Celery</span>
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-500">Compliance:</span>
            <span className="text-slate-300">Zero-Retention RAM (60m TTL)</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-200 transition-colors">
            Architecture & Privacy Spec
          </Link>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Runtime Nominal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
