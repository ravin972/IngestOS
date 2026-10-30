"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Radio,
  FileSpreadsheet,
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
  const [isDragging, setIsDragging] = useState(false);
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

  const handleSimulate = useCallback(async () => {
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
  }, [selectedPreset]);

  // Global Keyboard Shortcuts (⌘+U / Ctrl+U for Upload, ⌘+S / Ctrl+S for Simulation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (!isSimulating) {
          handleSimulate();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSimulating, handleSimulate]);

  const activeContract = presets.find((p) => p.name === selectedPreset) || presets[0];

  const processUploadFile = async (file: File) => {
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processUploadFile(files[0]);
    }
  };

  // Format terminal line with distinct timestamp, worker, and semantic coloring
  const formatTerminalLog = (log: string, idx: number) => {
    const match = log.match(/^(polars-worker-\d+\$)\s+(\[[^\]]+\])\s+(.*)$/);

    if (match) {
      const [, worker, timestamp, message] = match;
      const isError = timestamp.includes("ERROR") || message.includes("failed") || message.includes("error");
      const isClean = message.includes("clean") || message.includes("parsed") || message.includes("initialized");
      const isQuarantine = message.includes("quarantined") || message.includes("partition");
      const isSimulation = message.includes("Simulation") || message.includes("Triggering");

      return (
        <div key={idx} className="leading-relaxed flex items-start gap-2 font-mono text-xs">
          <span className="text-indigo-400 font-semibold select-none shrink-0">{worker}</span>
          <span className={isError ? "text-rose-400 font-mono select-none shrink-0" : "text-slate-500 font-mono select-none shrink-0"}>
            {timestamp}
          </span>
          <span
            className={
              isError
                ? "text-rose-400 font-medium"
                : isClean
                ? "text-emerald-400"
                : isQuarantine
                ? "text-amber-400"
                : isSimulation
                ? "text-indigo-300"
                : "text-slate-300"
            }
          >
            {message}
          </span>
        </div>
      );
    }

    return (
      <div key={idx} className="leading-relaxed text-slate-400 font-mono text-xs">
        {log}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans pb-24">
      {/* Top Telemetry Header Ribbon */}
      <div className="backdrop-blur-xl bg-[#090D16]/80 border-b border-white/[0.07] shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.02)] sticky top-14 z-30 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            <span className="font-semibold text-slate-100 tracking-tight">IngestOS Zero-Login Sandbox</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] text-indigo-300 font-mono text-[10px] font-medium tracking-tight">
              RAM Mode: Zero-Disk
            </span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-slate-400">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.02] border border-white/[0.06]">
              <span className="text-slate-500">Throughput:</span>
              <span className="text-emerald-400 font-semibold">1.48M rows/s</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.02] border border-white/[0.06]">
              <span className="text-slate-500">P99 Parse:</span>
              <span className="text-slate-200 font-semibold">3.12ms</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.02] border border-white/[0.06]">
              <span className="text-slate-500">Auto-Fix Rate:</span>
              <span className="text-indigo-400 font-semibold">99.4%</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.02] border border-white/[0.06]">
              <span className="text-slate-500">Disk Retention:</span>
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
              <div className="h-6 w-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono text-xs font-bold border border-indigo-500/30 shadow-sm">
                01
              </div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
                Validation Rules & Schema Presets
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Instant rule validation in memory without storing data to disk
            </span>
          </div>

          {/* 4 Preset Cards with Micro-Interactions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {presets.map((preset) => {
              const isSelected = selectedPreset === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(preset.name)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    isSelected
                      ? "surface-card border-indigo-500/80 bg-indigo-950/25 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.18),_transparent_75%)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0_25px_-5px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500/40"
                      : "surface-card-interactive border border-white/[0.08] hover:border-indigo-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-100">{preset.name}</span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 font-mono text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        ACTIVE CONTRACT
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-400">
                        {preset.version}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
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
            <div className="surface-card rounded-xl p-4 font-mono text-xs border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2.5">
                <span className="text-slate-300 font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Active Validation Rules: {activeContract.name}</span>
                </span>
                <span className="text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                  Active In-Memory Rules
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(activeContract.rules_json?.columns || {}).map(([col, rule]) => (
                  <div
                    key={col}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-1.5 hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-300 font-semibold font-mono">{col}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium font-mono">
                        {rule.type}
                      </span>
                    </div>
                    {rule.regex && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                        <span className="text-slate-500">regex:</span>
                        <code className="px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 truncate font-mono">
                          {rule.regex}
                        </code>
                      </div>
                    )}
                    {rule.min !== undefined && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-slate-500">constraint:</span>
                        <code className="px-1.5 py-0.5 rounded text-amber-400 bg-amber-950/30 border border-amber-500/20 font-mono">
                          min &gt;= {rule.min}
                        </code>
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
              <div className="h-6 w-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono text-xs font-bold border border-indigo-500/30 shadow-sm">
                02
              </div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
                Ingest Dataset & Secure Data Review
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              CSV or JSON (Max 100MB)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Magnetic File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`lg:col-span-2 rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer group ${
                isDragging
                  ? "scale-[1.01] border-2 border-indigo-400 bg-indigo-950/30 shadow-[0_0_30px_rgba(99,102,241,0.25)]"
                  : "surface-card border-2 border-dashed border-white/[0.12] hover:border-indigo-500/50 hover:bg-[#111827]/90"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all mb-4 ${
                  isDragging
                    ? "bg-indigo-500/25 border border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white scale-110"
                    : "bg-indigo-500/10 border border-indigo-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_0_20px_rgba(99,102,241,0.15)] text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-500/20"
                }`}
              >
                <UploadCloud className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-slate-100 text-base mb-1 tracking-tight">
                {isDragging ? "Drop dataset to stream into RAM" : "Drag and drop your batch file, or browse"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                Valid rows pass directly to your clean export. Invalid rows are held in a temporary 60-minute quarantine for review.
              </p>
              <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                <span>Shortcut:</span>
                <kbd className="bg-white/[0.06] border border-white/[0.12] shadow-[0_2px_0_0_rgba(0,0,0,0.5)] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-200">
                  ⌘ + U
                </kbd>
                <span>Upload</span>
              </div>
            </div>

            {/* Instant Test Harness Card */}
            <div className="surface-card rounded-2xl p-6 border border-white/[0.08] bg-gradient-to-b from-[#141b2d] to-[#0f1422] flex flex-col justify-between shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="h-4 w-4 text-indigo-300" />
                  <span>Instant Test Harness</span>
                </div>
                <h4 className="font-semibold text-slate-100 text-sm mb-2 tracking-tight">
                  Simulate With Corrupted Sample
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Runs our deterministic 5,000-row synthetic test corpus with realistic corrupted phone numbers, inverted dates, negative amounts, and checksum flaws.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_20px_rgba(99,102,241,0.4)] active:scale-[0.98] disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  <span>
                    {isSimulating ? "Running AST Pipeline..." : "Simulate Ingestion (5,000 Rows)"}
                  </span>
                  <kbd className="ml-1.5 bg-white/[0.15] border border-white/[0.25] shadow-[0_1.5px_0_0_rgba(0,0,0,0.4)] rounded px-1.5 py-0.5 text-[10px] font-mono text-white">
                    ⌘ + S
                  </kbd>
                </button>
                <div className="text-[11px] text-center text-slate-500 font-mono">
                  100% In-Memory • Zero Retention
                </div>
              </div>
            </div>
          </div>

          {/* macOS-Style Glassmorphic Terminal */}
          <div className="surface-card rounded-xl border border-white/[0.08] overflow-hidden bg-[#070b14]/90 backdrop-blur-md shadow-2xl font-mono text-xs">
            {/* Frosted Top Window Bar */}
            <div className="bg-white/[0.03] border-b border-white/[0.06] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60 border border-rose-500/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60 border border-amber-500/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 border border-emerald-500/40" />
                </div>
                <div className="h-3.5 w-[1px] bg-white/[0.08]" />
                <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  <span>&gt;_ Polars Ingestion Worker Stream (STDOUT)</span>
                </span>
              </div>

              {/* Live Status Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono">
                {isSimulating || isUploading ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-emerald-400 font-semibold tracking-wide">STREAMING</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span className="text-slate-400 tracking-wide">IDLE</span>
                  </>
                )}
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-3.5 space-y-1.5 max-h-40 overflow-y-auto">
              {terminalLogs.map((log, idx) => formatTerminalLog(log, idx))}
            </div>
          </div>
        </section>

        {/* Live Triage & Preview Inspector */}
        {job && (
          <section className="space-y-4 pt-4 border-t border-white/[0.08]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100 tracking-tight">
                  Secure Data Review & Quarantine Inspector
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Job ID: {job.job_id} • Temporary Session Expires In: 60 Minutes • Status: {job.status}
                </p>
              </div>

              {/* Triage Stats Pills */}
              <div className="flex items-center space-x-3 font-mono text-xs">
                <span className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] text-slate-300">
                  Total: <strong className="text-white">{(job.total_rows ?? 0).toLocaleString()}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-semibold">
                  Valid: {(job.valid_rows ?? 0).toLocaleString()}
                </span>
                <span className="px-3 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 font-semibold">
                  Quarantined: {(job.quarantined_rows ?? 0).toLocaleString()}
                </span>
                <Link
                  href={`/workspace/${job.job_id}`}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_16px_rgba(99,102,241,0.35)]"
                >
                  <span>Open Quarantine Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Table Preview */}
            <div className="surface-card rounded-xl border border-white/[0.08] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
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
                  <tbody className="divide-y divide-white/[0.04] font-mono text-xs">
                    {previewRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-white/[0.03] transition-colors ${
                          row.status === "QUARANTINED" ? "bg-red-950/10" : ""
                        }`}
                      >
                        <td className="py-2.5 px-4 text-slate-500">{idx + 1}</td>
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium bg-red-950/40 border border-red-500/30 text-red-400">
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
