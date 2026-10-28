"use client";

import { useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import {
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Terminal,
  Database,
  Lock,
  RefreshCw,
  Layers,
  Webhook,
  Flame,
} from "lucide-react";

export default function LandingPage() {
  const [copiedCurl, setCopiedCurl] = useState(false);

  const copyCurl = () => {
    navigator.clipboard.writeText("curl -fsSL get.ingestos.dev | sh");
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between selection:bg-brand-primary/30">
      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-6xl mx-auto px-4 pt-16 pb-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
            <span>FastAPI + Rust-backed Polars AST Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl leading-tight">
            Turn Dirty CSV & JSON Ingestion into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-indigo-400 to-emerald-400">
              Clean PostgreSQL Data
            </span>{" "}
            in Seconds
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            Deterministic AST validation with zero server-side disk retention. Isolate malformed rows
            into an interactive 60-minute ephemeral quarantine DLQ and export verified transaction streams.
          </p>

          {/* Action CTAs & Curl Snippet */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link
              href="/sandbox"
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-brand-primary hover:bg-brand-hover text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 active:scale-95"
            >
              <span>Launch Sandbox — Zero Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={copyCurl}
              className="w-full sm:w-auto h-11 px-4 rounded-xl bg-surface border border-border hover:border-slate-600 text-slate-300 font-mono text-xs flex items-center justify-between gap-3 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-primary" />
                <span>curl -fsSL get.ingestos.dev | sh</span>
              </div>
              {copiedCurl ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              )}
            </button>
          </div>

          {/* Benchmark Telemetry Bar */}
          <div className="mt-12 w-full grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-emerald-400">1.48M</span>
              <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
                Rows / Second
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-brand-primary">3.12ms</span>
              <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
                P99 Latency
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-indigo-300">99.4%</span>
              <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
                Auto-Coercion
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-amber-400">0 Bytes</span>
              <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
                Disk Retention
              </span>
            </div>
          </div>
        </section>

        {/* Live Split-Screen Diff Terminal Section */}
        <section className="w-full max-w-6xl mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Deterministic AST Stream Partitioning
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Broken rows are trapped in ephemeral RAM quarantine. Clean rows flow straight to your database.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-2xl bg-surface-lowest border border-border p-3 sm:p-5 shadow-2xl">
            {/* Left Terminal: Raw Dirty CSV Ingestion */}
            <div className="rounded-xl bg-surface border border-border overflow-hidden flex flex-col font-mono text-xs">
              <div className="px-4 py-2.5 bg-surface-dark border-b border-border flex items-center justify-between text-slate-400">
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
            <div className="rounded-xl bg-surface border border-border overflow-hidden flex flex-col font-mono text-xs">
              <div className="px-4 py-2.5 bg-surface-dark border-b border-border flex items-center justify-between text-slate-400">
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
                <div className="text-[10px] text-slate-500 pt-2 border-t border-border mt-3">
                  Row 1004 preserved in 60-min Quarantine DLQ for human remediation.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Architectural Highlights Grid */}
        <section className="w-full max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-border hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/30 text-brand-primary flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Zero-Retention RAM Law</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Valid records stream strictly through ephemeral Polars memory buffers directly to your egress sink.
                Clean customer data is never written to server-side disks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Heuristic Auto-Fix Engine</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Automatically resolves common delimiter typos, strips phone formatting to 10 digits, and coerces
                dates to ISO-8601 without altering financial truth.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                <Webhook className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">HMAC Signed Webhooks</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Provision egress webhooks with cryptographically signed headers (<code className="font-mono text-slate-300">X-IngestOS-Signature</code>)
                and 60-minute automated DLQ TTL purges.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Tiers Section */}
        <section className="w-full max-w-4xl mx-auto px-4 pb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Predictable Developer Pricing</h2>
            <p className="text-xs text-slate-400 mt-1">Open-source core with enterprise compliance options</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Community Free */}
            <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white">Community Tier</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-high text-slate-300">
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
                    <span>Polars AST Regex & Type Validator</span>
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
                className="mt-8 w-full h-10 rounded-xl bg-surface-high hover:bg-surface-highest border border-border text-white text-xs font-medium flex items-center justify-center transition-colors"
              >
                Start Ingesting Free
              </Link>
            </div>

            {/* Pro Platform */}
            <div className="p-6 rounded-2xl bg-surface border-2 border-brand-primary relative flex flex-col justify-between shadow-xl shadow-brand-primary/10">
              <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-brand-primary text-white text-[10px] font-mono uppercase font-bold tracking-wider">
                Enterprise Ready
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white">Pro Platform</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-brand-primary/20 text-brand-primary border border-brand-primary/40">
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
                    <span>Automated Zero-Retention TTL Purges</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Argon2id + SSO Team Authentication</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/auth"
                className="mt-8 w-full h-10 rounded-xl bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold flex items-center justify-center transition-all shadow-md active:scale-95"
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
