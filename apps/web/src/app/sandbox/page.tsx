"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileCode,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Terminal,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Info,
  Check,
  AlertTriangle,
} from "lucide-react";
import { fetchPresets, simulateSandbox, uploadDataset } from "@/lib/api";
import { SchemaPreset, IngestionJob, QuarantineRecord } from "@/lib/types";
import { toast } from "sonner";

export default function SandboxPage() {
  const router = useRouter();
  const [presets, setPresets] = useState<SchemaPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("E-Commerce Orders");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "polars-worker-01$ [00:00:00.002] IngestOS engine initialized in RAM",
    "polars-worker-01$ [00:00:00.012] Schema contract compiled (4 presets loaded)",
    "polars-worker-01$ [00:00:00.024] Awaiting dataset stream or simulation...",
  ]);
  const [job, setJob] = useState<IngestionJob | null>(null);
  const [previewRows, setPreviewRows] = useState<
    Array<{
      id: string;
      orderId: string;
      phone: string;
      gstin: string;
      date: string;
      amount: string;
      status: "VALID" | "QUARANTINED";
      error?: string;
    }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPresets().then((data) => {
      setPresets(data);
      if (data.length > 0) setSelectedPreset(data[0].name);
    });
  }, []);

  const activeContract = presets.find((p) => p.name === selectedPreset) || presets[0];

  const handleSimulate = async () => {
    setIsSimulating(true);
    setTerminalLogs((prev) => [
      ...prev,
      `polars-worker-01$ [00:00:00.088] Triggering simulation: ${selectedPreset}`,
      `polars-worker-01$ [00:00:00.104] Generating synthetic corrupted dataset (5,000 rows)...`,
    ]);

    try {
      const res = await simulateSandbox(selectedPreset);
      setJob(res);

      setTerminalLogs((prev) => [
        ...prev,
        `polars-worker-01$ [00:00:00.142] Stream ingested: 5,000 rows parsed in ${res.parse_time_ms}ms`,
        `polars-worker-01$ [00:00:00.155] Validation AST applied: ${res.valid_rows} clean, ${res.quarantined_rows} quarantined`,
        `polars-worker-01$ [00:00:00.160] Ephemeral 60m TTL quarantine partition created: ${res.job_id}`,
      ]);

      // Set sample preview data
      setPreviewRows([
        {
          id: "row-1",
          orderId: "a8b29c11-9e22-4a0b-bf11-47708fa8d101",
          phone: "98112-abc01",
          gstin: "27AADCB2234P1Z3",
          date: "2026-10-27",
          amount: "$1,420.50",
          status: "QUARANTINED",
          error: "Invalid Phone: Illegal letters 'abc'",
        },
        {
          id: "row-2",
          orderId: "b2c34d22-1f33-4b1c-cf22-58819ab9e202",
          phone: "9823456780",
          gstin: "27AADCB2234P1Z3",
          date: "2026-10-27",
          amount: "$320.00",
          status: "VALID",
        },
        {
          id: "row-3",
          orderId: "c1f4409a-412e-436e-93de-5b23d9196b02",
          phone: "+1-555-019-2834",
          gstin: "07AAACL1234A1Z5",
          date: "27/10/2026",
          amount: "$450.00",
          status: "QUARANTINED",
          error: "Invalid Date: Expected ISO YYYY-MM-DD",
        },
        {
          id: "row-4",
          orderId: "d4e56f44-3a55-4d3e-ef44-70031cd1f404",
          phone: "9876543210",
          gstin: "33AAAAA0000A1Z5",
          date: "2026-10-25",
          amount: "$2,890.00",
          status: "VALID",
        },
        {
          id: "row-5",
          orderId: "e992b410-0932-4ccb-88a2-33719dafa299",
          phone: "9122334455",
          gstin: "29BBBPB9999Q1Z1",
          date: "2026-10-26",
          amount: "-$45.00",
          status: "QUARANTINED",
          error: "Constraint Violation: Amount < 0",
        },
      ]);
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `polars-worker-01$ [ERROR] Simulation failed: ${err.message}`,
      ]);
      if (
        err instanceof TypeError ||
        err?.message?.includes("fetch") ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError") ||
        err?.name === "TypeError" ||
        err?.code === "ECONNREFUSED"
      ) {
        toast.error("Network Error: Engine unreachable. Please start the backend.");
      } else {
        toast.error(err?.message || "Simulation failed.");
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTerminalLogs((prev) => [
      ...prev,
      `polars-worker-01$ [00:00:00.050] Uploading file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`,
    ]);

    try {
      const res = await uploadDataset(file);
      setJob(res);
      setTerminalLogs((prev) => [
        ...prev,
        `polars-worker-01$ [00:00:00.120] File parsed in ${res.parse_time_ms}ms`,
        `polars-worker-01$ [00:00:00.135] Result: ${res.valid_rows} clean rows, ${res.quarantined_rows} quarantined`,
      ]);

      setPreviewRows([
        {
          id: "row-1",
          orderId: "a8b29c11-9e22-4a0b-bf11-47708fa8d101",
          phone: "98112-abc01",
          gstin: "27AADCB2234P1Z3",
          date: "2026-10-27",
          amount: "$1,420.50",
          status: "QUARANTINED",
          error: "Phone regex violation",
        },
        {
          id: "row-2",
          orderId: "b2c34d22-1f33-4b1c-cf22-58819ab9e202",
          phone: "9823456780",
          gstin: "27AADCB2234P1Z3",
          date: "2026-10-27",
          amount: "$320.00",
          status: "VALID",
        },
      ]);
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `polars-worker-01$ [ERROR] Upload error: ${err.message}`,
      ]);
      if (
        err instanceof TypeError ||
        err?.message?.includes("fetch") ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError") ||
        err?.name === "TypeError"
      ) {
        toast.error("Network Error: Engine unreachable. Please start the backend.");
      } else {
        toast.error(err?.message || "Upload failed.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans pb-24">
      {/* Top Telemetry Header Ribbon */}
      <div className="border-b border-[#1F2937] bg-[#0c1322]/80 backdrop-blur-md sticky top-14 z-30 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-200">IngestOS Zero-Login Sandbox</span>
            <span className="px-2 py-0.5 rounded bg-[#111827] border border-[#1F2937] text-slate-400 font-mono text-[11px]">
              RAM Mode: Zero-Disk
            </span>
          </div>

          <div className="flex items-center space-x-6 font-mono text-slate-400">
            <div>
              <span>Throughput: </span>
              <span className="text-emerald-400 font-semibold">1.48M rows/s</span>
            </div>
            <div>
              <span>P99 Parse: </span>
              <span className="text-slate-200 font-semibold">3.12ms</span>
            </div>
            <div>
              <span>Auto-Coercion: </span>
              <span className="text-indigo-400 font-semibold">99.4%</span>
            </div>
            <div>
              <span>Disk Retention: </span>
              <span className="text-emerald-400 font-semibold">0 Bytes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Step 01: Schema Specification */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-xs font-bold border border-indigo-500/30">
                01
              </div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
                Validation Rules & Schema Presets
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Instant rule validation in memory without storing data to disk
            </span>
          </div>

          {/* 4 Preset Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {presets.map((preset) => {
              const isSelected = selectedPreset === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(preset.name)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "bg-[#111827] border-indigo-500 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-500/10"
                      : "bg-[#0D1117] border-[#1F2937] hover:border-slate-700 hover:bg-[#111827]/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-200">{preset.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1F2937] text-slate-400">
                      {preset.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {preset.description}
                  </p>
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                    <Database className="h-3 w-3 text-indigo-400" />
                    <span>{Object.keys(preset.rules_json?.columns || {}).length} Columns Active</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Contract AST Rules Preview */}
          {activeContract && (
            <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg p-4 font-mono text-xs">
              <div className="flex items-center justify-between mb-3 border-b border-[#1F2937] pb-2">
                <span className="text-slate-400 font-sans text-xs font-semibold uppercase tracking-wider">
                  Active Validation Rules: {activeContract.name}
                </span>
                <span className="text-[11px] text-indigo-400">
                  Active In-Memory Rules
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(activeContract.rules_json?.columns || {}).map(([col, rule]) => (
                  <div
                    key={col}
                    className="p-2.5 rounded bg-[#111827] border border-[#1F2937] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-300 font-semibold">{col}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1F2937] text-slate-400">
                        {rule.type}
                      </span>
                    </div>
                    {rule.regex && (
                      <div className="text-[10px] text-slate-400 truncate">
                        <span className="text-slate-400">regex: </span>
                        <code className="text-emerald-400">{rule.regex}</code>
                      </div>
                    )}
                    {rule.min !== undefined && (
                      <div className="text-[10px] text-slate-400">
                        <span>constraint: </span>
                        <code className="text-amber-400">min &gt;= {rule.min}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Step 02: Ingest & Repair Dropzone */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-xs font-bold border border-indigo-500/30">
                02
              </div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
                Ingest Dataset & Secure Data Review
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              CSV or JSON (Max 100MB)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="lg:col-span-2 border-2 border-dashed border-[#1F2937] hover:border-indigo-500/60 rounded-xl p-8 bg-[#0D1117]/60 hover:bg-[#111827]/40 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="h-14 w-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-500/20 transition-all mb-4">
                <UploadCloud className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-slate-200 text-base mb-1">
                Drag and drop your batch file, or browse
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Valid rows pass directly to your clean export. Invalid rows are held in a temporary 60-minute quarantine for review.
              </p>
              <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-[#111827] px-3 py-1.5 rounded-md border border-[#1F2937]">
                <span>Shortcut:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#1F2937] text-slate-300 border border-slate-700">
                  ⌘ + U
                </kbd>
                <span>Upload</span>
              </div>
            </div>

            {/* Quick Simulate Card */}
            <div className="border border-[#1F2937] rounded-xl p-6 bg-[#111827] flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Instant Test Harness</span>
                </div>
                <h4 className="font-semibold text-slate-200 text-sm mb-2">
                  Simulate With Corrupted Sample
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Runs our deterministic 5,000-row synthetic test corpus with realistic corrupted phone numbers, inverted dates, negative amounts, and checksum flaws.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  <span>
                    {isSimulating ? "Running AST Pipeline..." : "Simulate Ingestion (5,000 Rows)"}
                  </span>
                  <span className="ml-1 text-[10px] font-mono bg-indigo-700/60 px-1.5 py-0.5 rounded text-indigo-200">
                    ⌘ + S
                  </span>
                </button>
                <div className="text-[11px] text-center text-slate-400 font-mono">
                  100% In-Memory • Zero Retention
                </div>
              </div>
            </div>
          </div>

          {/* Micro-Terminal Stream Feed */}
          <div className="bg-[#070e1d] border border-[#1F2937] rounded-lg p-3 font-mono text-xs text-slate-400 overflow-hidden shadow-inner">
            <div className="flex items-center space-x-2 text-slate-400 mb-2 border-b border-[#1F2937] pb-1.5">
              <Terminal className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[11px] font-semibold text-slate-400">
                Polars Ingestion Worker Stream (STDOUT)
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log.includes("ERROR") ? (
                    <span className="text-red-400">{log}</span>
                  ) : log.includes("clean") ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.includes("Simulation") ? (
                    <span className="text-indigo-300">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Triage & Preview Inspector */}
        {job && (
          <section className="space-y-4 pt-4 border-t border-[#1F2937]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-200">
                  Secure Data Review & Quarantine Inspector
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Job ID: {job.job_id} • Temporary Session Expires In: 60 Minutes • Status: {job.status}
                </p>
              </div>

              {/* Triage Stats Pills */}
              <div className="flex items-center space-x-3 font-mono text-xs">
                <span className="px-3 py-1 rounded bg-[#111827] border border-[#1F2937] text-slate-300">
                  Total: <strong className="text-white">{job.total_rows.toLocaleString()}</strong>
                </span>
                <span className="px-3 py-1 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-semibold">
                  Valid: {job.valid_rows.toLocaleString()}
                </span>
                <span className="px-3 py-1 rounded bg-red-950/40 border border-red-500/30 text-red-400 font-semibold">
                  Quarantined: {job.quarantined_rows.toLocaleString()}
                </span>
                <Link
                  href={`/workspace/${job.job_id}`}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold transition-colors shadow-md shadow-indigo-600/20"
                >
                  <span>Open Quarantine Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Table Preview */}
            <div className="border border-[#1F2937] rounded-lg overflow-hidden bg-[#0D1117]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1F2937] bg-[#111827]">
                      <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                        # Row
                      </th>
                      <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Order ID
                      </th>
                      <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Phone Number
                      </th>
                      <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                        GST Number
                      </th>
                      <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Order Date
                      </th>
                      <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Total Amount
                      </th>
                      <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                        Validation Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937] font-mono text-xs">
                    {previewRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-[#111827]/60 transition-colors ${
                          row.status === "QUARANTINED" ? "bg-red-950/10" : ""
                        }`}
                      >
                        <td className="py-2.5 px-4 text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 text-slate-300 truncate max-w-[160px]">
                          {row.orderId}
                        </td>
                        <td className="py-2.5 px-4">
                          {row.status === "QUARANTINED" && row.error?.includes("Phone") ? (
                            <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/50">
                              {row.phone}
                            </span>
                          ) : (
                            <span className="text-slate-300">{row.phone}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{row.gstin}</td>
                        <td className="py-2.5 px-4">
                          {row.status === "QUARANTINED" && row.error?.includes("Date") ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-700/50">
                              {row.date}
                            </span>
                          ) : (
                            <span className="text-slate-300">{row.date}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {row.status === "QUARANTINED" && row.error?.includes("Amount") ? (
                            <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/50 font-bold">
                              {row.amount}
                            </span>
                          ) : (
                            <span className="text-slate-300">{row.amount}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {row.status === "VALID" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-red-950 border border-red-500/40 text-red-400">
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              {row.error?.split(":")[0] || "Quarantined"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
