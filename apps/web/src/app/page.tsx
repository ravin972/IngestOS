"use client";

import { useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import {
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Terminal,
  Database,
  Lock,
  RefreshCw,
  Webhook,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function LandingPage() {
  const [copiedCurl, setCopiedCurl] = useState(false);

  const copyCurl = () => {
    navigator.clipboard.writeText("curl -fsSL get.ingestos.dev | sh");
    setCopiedCurl(true);
    toast.success("Command copied to clipboard!");
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30">
      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section with Grid & Spotlight Atmosphere */}
        <section className="relative w-full overflow-hidden hero-spotlight pt-20 pb-16">
          <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-6 flex flex-col items-center text-center">
            {/* Animated Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono mb-8 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-300 font-sans font-medium">FastAPI + Rust-Engine • Zero Server-Side Retention</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white max-w-4xl leading-[1.12]">
              Turn Dirty CSV & JSON Ingestion into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400">
                Clean PostgreSQL Data
              </span>{" "}
              in Seconds
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
              Instantly clean and validate messy data streams without storing sensitive records on our servers.
              Isolate invalid rows in an interactive 60-minute quarantine studio and export verified transaction streams.
            </p>

            {/* Action CTAs & Glass Terminal Pill */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <Link
                href="/sandbox"
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0_20px_rgba(99,102,241,0.35)] active:scale-95 border border-indigo-400/40"
              >
                <span>Launch Sandbox — Zero Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={copyCurl}
                className="w-full sm:w-auto h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.06] text-slate-300 font-mono text-xs flex items-center justify-between gap-3 transition-all backdrop-blur-md shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>curl -fsSL get.ingestos.dev | sh</span>
                </div>
                {copiedCurl ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                )}
              </button>
            </div>

            {/* Benchmark Telemetry Ribbon with Specular Cards */}
            <div className="mt-14 w-full grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="surface-card p-5 rounded-xl flex flex-col items-center">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-emerald-400">1.48M</span>
                <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
                  Rows / Second
                </span>
              </div>
              <div className="surface-card p-5 rounded-xl flex flex-col items-center">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-indigo-400">3.12ms</span>
                <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
                  P99 Latency
                </span>
              </div>
              <div className="surface-card p-5 rounded-xl flex flex-col items-center">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-indigo-300">99.4%</span>
                <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
                  Auto-Fix Rate
                </span>
              </div>
              <div className="surface-card p-5 rounded-xl flex flex-col items-center">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-amber-400">0 Bytes</span>
                <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
                  Disk Retention
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Split-Screen Diff Terminal Section */}
        <section className="w-full max-w-6xl mx-auto px-6 py-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Deterministic Stream Partitioning
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Broken rows are safely held in an in-memory quarantine workspace. Clean rows flow straight to your database.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-2xl bg-[#090D16] border border-white/[0.08] p-3 sm:p-5 shadow-2xl">
            {/* Left Terminal: Raw Dirty CSV Ingestion */}
            <div className="rounded-xl bg-[#0D1117] border border-white/[0.08] overflow-hidden flex flex-col font-mono text-xs">
              <div className="px-4 py-2.5 bg-[#090D16] border-b border-white/[0.08] flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-slate-300 font-semibold ml-2">Input: raw_incoming_batch.csv</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] border border-rose-500/30">
                  3 Violations Found
                </span>
              </div>

              <div className="p-4 space-y-2 text-slate-300 leading-relaxed overflow-x-auto">
                <div className="text-slate-500"># order_id,phone,order_date,amount</div>
                <div>1001,9811200001,2026-10-27,250.00</div>
                <div className="bg-rose-950/40 border border-rose-800/60 rounded px-2 py-1 text-rose-300 flex items-center justify-between">
                  <span>1002,98112-abc01,2026-10-27,410.50</span>
                  <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-400">
                    ERR_PHONE_FORMAT
                  </span>
                </div>
                <div className="bg-amber-950/40 border border-amber-800/60 rounded px-2 py-1 text-amber-300 flex items-center justify-between">
                  <span>1003,9811200003,27/10/2026,1200.00</span>
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-400">
                    ERR_DATE_ISO
                  </span>
                </div>
                <div className="bg-rose-950/40 border border-rose-800/60 rounded px-2 py-1 text-rose-300 flex items-center justify-between">
                  <span>1004,9811200004,2026-10-26,-500.00</span>
                  <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-400">
                    ERR_AMOUNT_NON_NEGATIVE
                  </span>
                </div>
                <div>1005,9811200005,2026-10-25,95.00</div>
              </div>
            </div>

            {/* Right Terminal: Clean PostgreSQL Stream */}
            <div className="rounded-xl bg-[#0D1117] border border-white/[0.08] overflow-hidden flex flex-col font-mono text-xs">
              <div className="px-4 py-2.5 bg-[#090D16] border-b border-white/[0.08] flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300 font-semibold">Output: Verified SQL Transaction Stream</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/30">
                  Zero DLQ Leakage
                </span>
              </div>

              <div className="p-4 space-y-1.5 text-emerald-300/90 leading-relaxed overflow-x-auto">
                <div className="text-indigo-400 font-semibold">BEGIN;</div>
                <div className="text-slate-400">-- Filtered clean + auto-remediated rows</div>
                <div>INSERT INTO orders (id, phone, order_date, amount)</div>
                <div className="pl-4 text-slate-200">
                  VALUES (1001, &apos;9811200001&apos;, &apos;2026-10-27&apos;, 250.00);
                </div>
                <div className="pl-4 text-emerald-400">
                  VALUES (1002, &apos;9811200001&apos;, &apos;2026-10-27&apos;, 410.50); <span className="text-[10px] text-slate-500">{"/* Auto-remediated */"}</span>
                </div>
                <div className="pl-4 text-emerald-400">
                  VALUES (1003, &apos;9811200003&apos;, &apos;2026-10-27&apos;, 1200.00); <span className="text-[10px] text-slate-500">{"/* Coerced ISO */"}</span>
                </div>
                <div className="pl-4 text-slate-200">
                  VALUES (1005, &apos;9811200005&apos;, &apos;2026-10-25&apos;, 95.00);
                </div>
                <div className="text-indigo-400 font-semibold mt-2">COMMIT;</div>
                <div className="text-[10px] text-slate-500 pt-2 border-t border-white/[0.08] mt-3">
                  Row 1004 preserved in 60-min Quarantine DLQ for human remediation.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 1: Asymmetric Bento Grid Architecture */}
        <section className="w-full max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Engineered for Zero Data Loss & Absolute Privacy
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Every row is validated against strict schema contracts in RAM before touching downstream databases or webhooks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bento Card 1: Span 2 Columns — Instant Data Routing & Cleaning */}
            <div className="md:col-span-2 surface-card-interactive p-7 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    Stream Partitioning
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">Instant Data Routing & Cleaning</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-xl">
                  Valid records pass straight into your clean PostgreSQL stream. Malformed rows are isolated into an interactive, 60-minute quarantine partition for human or automated remediation.
                </p>
              </div>

              {/* Embedded Live Visual Stream Track */}
              <div className="mt-6 p-4 rounded-xl bg-[#090D16]/90 border border-white/[0.06] font-mono text-xs space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-white/[0.06]">
                  <span>Incoming Batch: <code>orders_stream.csv</code> (5,000 rows)</span>
                  <span className="text-emerald-400 font-semibold">Processed in 1.2ms</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-300 font-semibold">Clean PostgreSQL Stream</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px]">4,842 rows</span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-300 font-semibold">60-Min Quarantine DLQ</span>
                    </div>
                    <span className="text-amber-400 font-mono text-[11px]">158 rows</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Span 1 Column — Zero-Retention RAM Law */}
            <div className="surface-card-interactive p-7 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                    Security Invariant
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">Zero-Retention RAM Law</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Clean customer data is processed in-memory and never written to server disks, eliminating GDPR erasure lag.
                </p>
              </div>

              {/* Memory Gauge Badge */}
              <div className="mt-6 p-4 rounded-xl bg-[#090D16]/90 border border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">Disk Footprint</span>
                  <span className="text-emerald-400 font-semibold">0.00 Bytes</span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[0%]" />
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 pt-1">
                  <span>RAM Session Auto-Wipe</span>
                  <span className="text-slate-300">0x00 Wiped</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Span 1 Column — Smart Data Auto-Fix */}
            <div className="surface-card-interactive p-7 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                    Heuristics
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">Smart Data Auto-Fix</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Automatically remediates invalid phone characters, coerces international dates to ISO-8601, and trims whitespace.
                </p>
              </div>

              {/* Before / After Transformation Preview */}
              <div className="mt-6 p-3.5 rounded-xl bg-[#090D16]/90 border border-white/[0.06] font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Raw: <code className="text-red-400">+91 98765-43210</code></span>
                  <span className="px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-500/30 text-[10px]">
                    ERR_PHONE
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-400 text-[11px] pt-1 border-t border-white/[0.06]">
                  <span>Fixed: <code className="text-emerald-300">9876543210</code></span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                    AUTO-FIXED
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Card 4: Span 2 Columns — Cryptographic Webhook & Batch Sinks */}
            <div className="md:col-span-2 surface-card-interactive p-7 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Webhook className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    Egress Sinks
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">Cryptographic Webhook & Batch Sinks</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-xl">
                  Dispatch verified clean streams directly to your REST sinks signed with HMAC-SHA256 headers, or export as atomic transactional PostgreSQL batches.
                </p>
              </div>

              {/* Code / Signature Badge Preview */}
              <div className="mt-6 p-4 rounded-xl bg-[#090D16]/90 border border-white/[0.06] font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1.5 border-b border-white/[0.06]">
                  <span className="text-slate-300 font-semibold">POST /v1/ingest-sink</span>
                  <span className="text-emerald-400">200 OK</span>
                </div>
                <div className="text-[11px] text-indigo-300 truncate">
                  X-IngestOS-Signature: sha256=whsec_7f9a2b8c4d1e0f3...
                </div>
                <div className="text-[10px] text-slate-500">
                  Transaction: <code className="text-slate-300">BEGIN; INSERT INTO orders VALUES (...); COMMIT;</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Tiers Section */}
        <section className="w-full max-w-4xl mx-auto px-6 pb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white tracking-tight">Predictable Developer Pricing</h2>
            <p className="text-xs text-slate-400 mt-1">Open-source core with enterprise compliance options</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Community Free */}
            <div className="surface-card p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-white">Community Tier</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                    Open Source
                  </span>
                </div>
                <div className="mt-4 font-mono text-3xl font-extrabold text-white">
                  $0 <span className="text-xs text-slate-500 font-normal">/ forever</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Ideal for standalone developers and zero-login ad-hoc pipeline testing.
                </p>

                <ul className="mt-6 space-y-2 text-xs text-slate-300 font-mono">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Up to 50,000 rows per batch</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>In-Memory Schema Rule Validator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Interactive Quarantine Studio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Clean CSV & PostgreSQL SQL Exporter</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/sandbox"
                className="mt-8 w-full h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-medium flex items-center justify-center transition-colors"
              >
                Start Ingesting Free
              </Link>
            </div>

            {/* Pro Platform */}
            <div className="surface-card p-6 rounded-2xl border-indigo-500/50 relative flex flex-col justify-between shadow-xl shadow-indigo-500/10">
              <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-mono uppercase font-bold tracking-wider shadow-sm">
                Enterprise Ready
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-white">Pro Platform</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    Production
                  </span>
                </div>
                <div className="mt-4 font-mono text-3xl font-extrabold text-white">
                  $29 <span className="text-xs text-slate-500 font-normal">/ month</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  High-throughput team workflows with authenticated webhooks and SLA.
                </p>

                <ul className="mt-6 space-y-2 text-xs text-slate-300 font-mono">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Unlimited rows / batch streaming</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>HMAC-SHA256 Webhook Dispatcher</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Automated Zero-Retention Purges</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Enterprise Team Authentication</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/auth"
                className="mt-8 w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center transition-all shadow-md active:scale-95"
              >
                Access Pro Platform
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
