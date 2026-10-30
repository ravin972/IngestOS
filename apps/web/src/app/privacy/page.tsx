"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Clock,
  Server,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col justify-between overflow-hidden">
      {/* Atmospheric Background Grid & Spotlight */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
      <div className="absolute inset-0 hero-spotlight pointer-events-none" />

      <div className="relative z-10 pb-20">
        {/* Top Banner */}
        <div className="border-b border-white/[0.08] bg-[#0c1322]/80 backdrop-blur-md px-6 py-14">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-xs shadow-[0_0_16px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero-Retention Architecture Verified</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans">
              Enterprise Security, Privacy & RAM Retention Policy
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-3xl">
              IngestOS is engineered from first principles to solve the enterprise data pipeline liability problem: we process, sanitize, and stream high-volume datasets without retaining customer records on persistent disk.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 pt-12 space-y-12">
          {/* Architectural Pillars Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="surface-card-interactive rounded-2xl p-6 space-y-3.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-sm">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                1. Zero-Retention RAM Law
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Valid clean records exist strictly in ephemeral RAM streams (Polars memory buffers and Redis Pub/Sub channels). They are never inserted into PostgreSQL, never serialized to persistent SSDs, and vanish immediately upon stream consumption.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                  Persistent Disk Retention: 0 Bytes
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  RAM Stream Only
                </span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="surface-card-interactive rounded-2xl p-6 space-y-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-sm">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                2. 60-Minute DLQ TTL & 0x00 Memory Purge
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Malformed records are isolated into an ephemeral quarantine dead-letter partition strictly to enable human remediation. All quarantined rows enforce a hard 60-minute time-to-live (TTL). Expired rows undergo cryptographic zeroization.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
                  60-Minute Ephemeral TTL
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
                  0x00 Memory Wipe
                </span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="surface-card-interactive rounded-2xl p-6 space-y-3.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-sm">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                3. Cryptographic Signatures & HMAC
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All webhook sinks transmit with an authenticating <code className="text-indigo-300 px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.08]">X-IngestOS-Signature</code> computed using HMAC-SHA256. Webhook consumers verify payload integrity and origin without cleartext authentication tokens.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                  HMAC-SHA256 (RFC 2104)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                  TLS 1.3 Transit
                </span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="surface-card-interactive rounded-2xl p-6 space-y-3.5">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-sm">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                4. Firecracker MicroVM Isolation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every customer pipeline runs inside its own isolated microVM jail with strict memory limits (512MB RAM ceiling) and read-only root filesystems. Multi-tenant cross-contamination is mathematically impossible.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium">
                  Firecracker Jail: 512MB Cgroup V2
                </span>
                <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.1] text-slate-300">
                  Read-Only Root FS
                </span>
              </div>
            </div>
          </section>

          {/* Life-Cycle Data Flow Diagram */}
          <section className="surface-card rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono ml-2">
                  Deterministic Ingestion Data Flow & Storage Boundaries
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 font-medium">
                In-Memory Guaranteed
              </span>
            </div>

            <div className="p-5 rounded-xl bg-[#070D18] border border-white/[0.08] font-mono text-xs text-indigo-200/90 overflow-x-auto shadow-inner">
              <pre className="leading-relaxed">
{`+------------------------+
| Customer Dirty Payload |  (CSV, JSON, Snappy Parquet)
+-----------+------------+
            |
            v  [TLS 1.3 Transit • In-Flight Protection]
+-------------------------------------------------------------+
| Firecracker Isolated Polars Validation Engine (RAM ONLY)   |
| • Schema Contract AST Compilation                           |
| • Type Coercion & Regex AST Verification                    |
+-------------+-------------------------------+---------------+
              |                               |
       [Valid Clean Stream]          [Malformed Violations]
              |                               |
              v                               v
+-----------------------------+ +-----------------------------+
| RAM Export Buffer / Sink    | | Ephemeral DLQ Partition     |
| • PostgreSQL Batch INSERT   | | • 60-Minute Hard TTL Timer  |
| • Signed HMAC-SHA256 Webhook| | • Human Remediation Studio  |
| • 0 Bytes Disk Footprint    | | • 0x00 Byte Zero-Wipe       |
+-----------------------------+ +-----------------------------+`}
              </pre>
            </div>
          </section>

          {/* Regulatory Compliance Mapping */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">
              Global Compliance & Regulatory Standards
            </h3>
            <div className="surface-card rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e1526]/90 border-b border-white/[0.08] backdrop-blur-md">
                  <tr>
                    <th className="py-3.5 px-5 font-sans font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                      Framework / Regulation
                    </th>
                    <th className="py-3.5 px-5 font-sans font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                      Requirement
                    </th>
                    <th className="py-3.5 px-5 font-sans font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                      IngestOS Architectural Guarantee
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-slate-300">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-indigo-300 font-mono">
                      GDPR Article 17
                    </td>
                    <td className="py-3.5 px-5 font-sans text-slate-400">
                      Right to Erasure (&ldquo;Right to be Forgotten&rdquo;)
                    </td>
                    <td className="py-3.5 px-5 text-emerald-400 font-sans">
                      Zero retention: clean data is never written to disk, eliminating erasure lag.
                    </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-indigo-300 font-mono">
                      SOC2 Type II
                    </td>
                    <td className="py-3.5 px-5 font-sans text-slate-400">
                      Confidentiality & Least Privilege Storage
                    </td>
                    <td className="py-3.5 px-5 text-emerald-400 font-sans">
                      Isolated MicroVM containers with automated 60-min memory reclamation.
                    </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-indigo-300 font-mono">
                      India DPDP Act 2023
                    </td>
                    <td className="py-3.5 px-5 font-sans text-slate-400">
                      Purpose Limitation & Data Minimization
                    </td>
                    <td className="py-3.5 px-5 text-emerald-400 font-sans">
                      Processing occurs in transient memory with immediate post-ingest release.
                    </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-indigo-300 font-mono">
                      HIPAA Safe Harbor
                    </td>
                    <td className="py-3.5 px-5 font-sans text-slate-400">
                      Transmission Security & ePHI Storage
                    </td>
                    <td className="py-3.5 px-5 text-emerald-400 font-sans">
                      End-to-end TLS 1.3, AES-256-GCM at rest for ephemeral DLQ, HMAC webhook auth.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Downloadable DPA CTA */}
          <section className="surface-card rounded-2xl p-6 sm:p-8 border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[#111827] to-[#111827] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1.5">
              <div className="font-semibold text-base text-slate-100">
                Enterprise Data Processing Addendum (DPA)
              </div>
              <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                Sign our standard enterprise DPA covering zero-retention warranties, sub-processor disclosures, and SOC2 auditor access.
              </p>
            </div>
            <Link
              href="/auth"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_20px_rgba(99,102,241,0.35)] transition-all shrink-0 active:scale-95 border border-indigo-400/30"
            >
              <span>Request Enterprise DPA</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>

      {/* Global Consistent Footer */}
      <Footer />
    </div>
  );
}
