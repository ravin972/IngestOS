"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Lock,
  Clock,
  Server,
  FileCheck,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Database,
  Cpu,
  Terminal,
} from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans pb-24">
      {/* Top Banner */}
      <div className="border-b border-[#1F2937] bg-[#0c1322] px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero-Retention Architecture Verified</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans">
            Enterprise Security, Privacy & RAM Retention Policy
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            IngestOS is engineered from first principles to solve the data pipeline liability problem: we process, sanitize, and stream high-volume datasets without retaining customer records on persistent disk.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-12 space-y-12">
        {/* Architectural Pillars Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-xl bg-[#111827] border border-[#1F2937] space-y-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              1. Zero-Retention RAM Law
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Valid clean records exist strictly in ephemeral RAM streams (Polars memory buffers and Redis Pub/Sub channels). They are never inserted into PostgreSQL, never serialized to persistent SSDs, and vanish immediately upon stream consumption.
            </p>
            <div className="pt-2 font-mono text-[11px] text-emerald-400">
              Persistent Disk Retention: 0 Bytes
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-xl bg-[#111827] border border-[#1F2937] space-y-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              2. 60-Minute DLQ TTL & 0x00 Memory Purge
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Malformed records are isolated into an ephemeral quarantine dead-letter partition strictly to enable human remediation. All quarantined rows enforce a hard 60-minute time-to-live (TTL). Expired rows undergo memory zeroization.
            </p>
            <div className="pt-2 font-mono text-[11px] text-red-400">
              Automated Hard Wipe: 3,600s TTL
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-xl bg-[#111827] border border-[#1F2937] space-y-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              3. Cryptographic Signatures & HMAC
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All webhook sinks transmit with an authenticating <code className="text-indigo-300">X-IngestOS-Signature</code> computed using HMAC-SHA256. Webhook consumers verify payload integrity and origin without passing cleartext authentication headers.
            </p>
            <div className="pt-2 font-mono text-[11px] text-indigo-400">
              Algorithm: HMAC-SHA256 (RFC 2104)
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-xl bg-[#111827] border border-[#1F2937] space-y-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              4. Firecracker MicroVM Isolation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every customer pipeline runs inside its own isolated microVM jail with strict memory limits (512MB RAM ceiling) and read-only root filesystems. Multi-tenant cross-contamination is mathematically impossible.
            </p>
            <div className="pt-2 font-mono text-[11px] text-cyan-400">
              Sandbox Jail: 512MB Cgroup V2
            </div>
          </div>
        </section>

        {/* Life-Cycle Data Flow Diagram */}
        <section className="p-6 rounded-xl bg-[#0D1117] border border-[#1F2937] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Deterministic Ingestion Data Flow & Storage Boundaries
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono">
              In-Memory Guaranteed
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[#070e1d] border border-[#1F2937] font-mono text-xs text-slate-300 overflow-x-auto">
            <pre className="leading-relaxed">
{`+------------------------+
| Customer Dirty Payload |  (CSV, JSON, Snappy Parquet)
+-----------+------------+
            |
            v  [TLS 1.3 Transit]
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
          <div className="border border-[#1F2937] rounded-xl overflow-hidden bg-[#111827]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141b2b] border-b border-[#1F2937]">
                <tr>
                  <th className="py-3 px-4 font-sans font-semibold text-slate-400 uppercase tracking-wider">
                    Framework / Regulation
                  </th>
                  <th className="py-3 px-4 font-sans font-semibold text-slate-400 uppercase tracking-wider">
                    Requirement
                  </th>
                  <th className="py-3 px-4 font-sans font-semibold text-slate-400 uppercase tracking-wider">
                    IngestOS Architectural Guarantee
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937] text-slate-300 font-mono">
                <tr>
                  <td className="py-3 px-4 font-semibold text-indigo-300">
                    GDPR Article 17
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-400">
                    Right to Erasure ("Right to be Forgotten")
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-sans">
                    Zero retention: clean data is never written to disk, eliminating erasure lag.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-indigo-300">
                    SOC2 Type II
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-400">
                    Confidentiality & Least Privilege Storage
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-sans">
                    Isolated MicroVM containers with automated 60-min memory reclamation.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-indigo-300">
                    India DPDP Act 2023
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-400">
                    Purpose Limitation & Data Minimization
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-sans">
                    Processing occurs in transient memory with immediate post-ingest release.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-indigo-300">
                    HIPAA Safe Harbor
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-400">
                    Transmission Security & ePHI Storage
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-sans">
                    End-to-end TLS 1.3, AES-256-GCM at rest for ephemeral DLQ, HMAC webhook auth.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Downloadable DPA CTA */}
        <section className="p-6 rounded-xl bg-gradient-to-r from-indigo-950/30 to-[#111827] border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="font-semibold text-base text-slate-100">
              Enterprise Data Processing Addendum (DPA)
            </div>
            <p className="text-xs text-slate-400 max-w-lg">
              Sign our standard enterprise DPA covering zero-retention warranties, sub-processor disclosures, and SOC2 auditor access.
            </p>
          </div>
          <Link
            href="/auth"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20 shrink-0"
          >
            <span>Request Enterprise DPA</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
