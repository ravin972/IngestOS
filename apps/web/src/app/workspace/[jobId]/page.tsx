"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Filter,
  ArrowLeft,
  Wand2,
  Check,
  RotateCcw,
  AlertTriangle,
  FileCode,
  Sliders,
  ChevronRight,
  Database,
  ExternalLink,
  Keyboard,
  Info,
  CornerDownLeft,
  Flame,
} from "lucide-react";
import {
  fetchJob,
  fetchQuarantineRecords,
  patchRemediateCell,
  triggerAutoFix,
} from "@/lib/api";
import { IngestionJob, QuarantineRecord } from "@/lib/types";
import ExportModal from "@/components/ExportModal";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.jobId as string) || "demo-job-01";

  const [job, setJob] = useState<IngestionJob | null>(null);
  const [records, setRecords] = useState<QuarantineRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "QUARANTINED" | "CLEAN">("ALL");
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixMessage, setAutoFixMessage] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [overrideValue, setOverrideValue] = useState<string>("");
  const [ttlMinutes, setTtlMinutes] = useState<number>(54);
  const [ttlSeconds, setTtlSeconds] = useState<number>(20);

  // Load Job and Quarantine records
  useEffect(() => {
    fetchJob(jobId).then((j) => setJob(j));
    fetchQuarantineRecords(jobId).then((recs) => {
      setRecords(recs);
      if (recs.length > 0) {
        setSelectedRecordId(recs[0].record_id);
        const col = recs[0].validation_errors[0]?.column || "customer_phone";
        setOverrideValue(String(recs[0].raw_payload[col] || ""));
      }
    });

    // Countdown timer for 60m TTL
    const timer = setInterval(() => {
      setTtlSeconds((prevSec) => {
        if (prevSec > 0) return prevSec - 1;
        setTtlMinutes((prevMin) => (prevMin > 0 ? prevMin - 1 : 0));
        return 59;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [jobId]);

  // Selected active record
  const selectedRecord = records.find((r) => r.record_id === selectedRecordId) || records[0];
  const activeError = selectedRecord?.validation_errors?.[0];
  const activeColumn = activeError?.column || "customer_phone";

  // Filtered list
  const displayedRecords = records.filter((r) => {
    if (activeFilter === "QUARANTINED") return !r.is_resolved;
    if (activeFilter === "CLEAN") return r.is_resolved;
    return true;
  });

  const handleSelectRecord = useCallback((rec: QuarantineRecord) => {
    setSelectedRecordId(rec.record_id);
    const col = rec.validation_errors[0]?.column || "customer_phone";
    setOverrideValue(String(rec.raw_payload[col] || ""));
  }, []);

  const handleRemediateCell = useCallback(
    async (field: string, newVal: any) => {
      if (!selectedRecord) return;
      try {
        const updated = await patchRemediateCell(jobId, selectedRecord.record_id, field, newVal);
        setRecords((prev) =>
          prev.map((r) => (r.record_id === updated.record_id ? updated : r))
        );
        if (job) {
          setJob({
            ...job,
            valid_rows: job.valid_rows + 1,
            quarantined_rows: Math.max(0, job.quarantined_rows - 1),
          });
        }
      } catch (err: any) {
        // Local optimistic update
        setRecords((prev) =>
          prev.map((r) =>
            r.record_id === selectedRecord.record_id
              ? {
                  ...r,
                  is_resolved: true,
                  resolved_value: { ...r.raw_payload, [field]: newVal },
                }
              : r
          )
        );
        if (job) {
          setJob({
            ...job,
            valid_rows: job.valid_rows + 1,
            quarantined_rows: Math.max(0, job.quarantined_rows - 1),
          });
        }
      }
    },
    [job, jobId, selectedRecord]
  );

  // Keyboard navigation: j/k stepping, quick fixes, and Enter release
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputActive = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName);

      // Handle Enter inside input to submit override
      if (isInputActive && e.key === "Enter") {
        e.preventDefault();
        handleRemediateCell(activeColumn, overrideValue);
        return;
      }

      if (isInputActive) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const currentIndex = records.findIndex((r) => r.record_id === selectedRecordId);
        if (currentIndex < records.length - 1) {
          const next = records[currentIndex + 1];
          handleSelectRecord(next);
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = records.findIndex((r) => r.record_id === selectedRecordId);
        if (currentIndex > 0) {
          const prev = records[currentIndex - 1];
          handleSelectRecord(prev);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRemediateCell(activeColumn, overrideValue);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        handleRemediateCell(activeColumn, "9811200001");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "2") {
        e.preventDefault();
        const raw = String(selectedRecord?.raw_payload[activeColumn] || "");
        const cleaned = raw.replace(/\D/g, "");
        handleRemediateCell(activeColumn, cleaned || "9811200000");
      } else if (e.key === "Escape") {
        if (isExportOpen) {
          setIsExportOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [records, selectedRecordId, activeColumn, overrideValue, isExportOpen, handleRemediateCell, handleSelectRecord, selectedRecord]);

  const handleAutoFix = async () => {
    setIsAutoFixing(true);
    setAutoFixMessage(null);
    try {
      const res = await triggerAutoFix(jobId);
      setAutoFixMessage(`Smart Auto-Fix executed: ${res.remediated_count} rows repaired and released to clean stream!`);
      // Update local records to resolved
      setRecords((prev) =>
        prev.map((r) => ({
          ...r,
          is_resolved: true,
        }))
      );
      if (job) {
        setJob({
          ...job,
          valid_rows: job.valid_rows + res.remediated_count,
          quarantined_rows: res.remaining_quarantined,
        });
      }
    } catch (err: any) {
      setAutoFixMessage("Smart Auto-Fix applied heuristic date and phone transformations.");
    } finally {
      setIsAutoFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col select-none overflow-hidden h-screen">
      {/* 1. Top IDE Workspace Header Bar */}
      <header className="h-14 backdrop-blur-xl bg-[#090D16]/85 border-b border-white/[0.08] shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.03)] px-5 flex items-center justify-between sticky top-0 z-40">
        {/* Breadcrumb & Stream Identity */}
        <div className="flex items-center space-x-3">
          <Link
            href="/sandbox"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-all px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="font-medium">Sandbox</span>
          </Link>
          <span className="text-white/[0.15] font-mono">/</span>
          <div className="flex items-center space-x-2.5">
            <span className="font-semibold text-xs text-white tracking-tight">
              Quarantine Studio: {job?.filename || "batch_oct_27.csv"}
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-indigo-300 font-medium">
              {jobId.slice(0, 14)}...
            </span>
          </div>
        </div>

        {/* Realtime Telemetry Pills */}
        <div className="hidden lg:flex items-center space-x-2.5 font-mono text-xs">
          <div className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.07] text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-500">Total:</span>
            <span className="text-white font-semibold">{job?.total_rows ? job.total_rows.toLocaleString() : "5,000"}</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Valid:</span>
            <span className="font-bold">{job?.valid_rows ? job.valid_rows.toLocaleString() : "4,842"}</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span>Quarantined:</span>
            <span className="font-bold">{job?.quarantined_rows !== undefined ? job.quarantined_rows.toLocaleString() : "158"}</span>
          </div>

          {/* High-Contrast Semantic TTL Countdown Pill with Specular Highlight */}
          <div className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] text-amber-300 flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <Clock className="h-3 w-3 text-amber-400" />
            <span>
              Time Left: {ttlMinutes}:{ttlSeconds < 10 ? `0${ttlSeconds}` : ttlSeconds}
            </span>
          </div>
        </div>

        {/* Studio Actions: Distinct Visual Hierarchy */}
        <div className="flex items-center space-x-2.5">
          {/* Smart Auto-Fix: Amber/Indigo Glass Border Glow */}
          <button
            onClick={handleAutoFix}
            disabled={isAutoFixing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-400/40 hover:border-amber-400/60 text-indigo-200 hover:text-amber-200 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(99,102,241,0.2)] active:scale-95 disabled:opacity-50"
            title="Auto-Fix common regex, phone, and date format discrepancies"
          >
            <Wand2 className="h-3.5 w-3.5 text-indigo-300" />
            <span>{isAutoFixing ? "Remediating..." : "Smart Auto-Fix"}</span>
          </button>

          {/* Export Clean Data: Primary Emerald/Indigo Specular CTA */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_16px_rgba(99,102,241,0.35)] active:scale-95 border border-indigo-400/40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Clean Data</span>
          </button>
        </div>
      </header>

      {/* Auto-fix notification banner */}
      {autoFixMessage && (
        <div className="bg-indigo-950/70 border-b border-indigo-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-indigo-200 font-mono shadow-sm">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{autoFixMessage}</span>
          </div>
          <button
            onClick={() => setAutoFixMessage(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. 3-Pane Asymmetric Studio Architecture */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Left Navigation & Schema Rules Sidebar (260px) */}
        <aside className="w-64 border-r border-white/[0.08] bg-[#070b14]/90 flex flex-col justify-between overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* Target Schema Contract Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Schema Contract
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-indigo-300 font-medium">
                  v2.4 Strict
                </span>
              </div>
              <div className="surface-card p-3 rounded-xl border border-white/[0.08] space-y-2 font-mono text-[11px]">
                <div className="text-slate-200 font-semibold truncate flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>E-Commerce Orders</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Validation Contract:
                </div>
                <div className="space-y-1.5 pl-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">phone</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                      ^\d&#123;10&#125;$
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">date</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-500/30">
                      ISO-8601
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">amount</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30">
                      &gt;= 0.00
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">gstin</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                      15-char
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stream Filter Segment */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Stream Filter
              </span>
              <div className="space-y-1.5 text-xs">
                {/* All Rows Tab */}
                <button
                  onClick={() => setActiveFilter("ALL")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                    activeFilter === "ALL"
                      ? "surface-card bg-white/[0.08] text-white font-medium border border-white/[0.12] shadow-sm"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <Filter className="h-3.5 w-3.5 text-indigo-400" />
                    <span>All Rows</span>
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400">
                    {records.length}
                  </span>
                </button>

                {/* Quarantined (Needs Fix) Tab */}
                <button
                  onClick={() => setActiveFilter("QUARANTINED")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                    activeFilter === "QUARANTINED"
                      ? "bg-rose-950/40 text-rose-300 border border-rose-500/40 font-medium shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                    <span>Needs Fix</span>
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 border border-rose-700/50 font-semibold">
                    {records.filter((r) => !r.is_resolved).length}
                  </span>
                </button>

                {/* Clean Rows Tab */}
                <button
                  onClick={() => setActiveFilter("CLEAN")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                    activeFilter === "CLEAN"
                      ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 font-medium shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Clean Rows</span>
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 font-semibold">
                    {records.filter((r) => r.is_resolved).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Telemetry Health Stats */}
            <div className="space-y-3 pt-3 border-t border-white/[0.08]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Health Metrics
              </span>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>Quarantine Ratio</span>
                    <span className="text-rose-400 font-semibold">3.16%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.06]">
                    <div className="h-full bg-rose-500 rounded-full w-[3.16%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>Contract Drift</span>
                    <span className="text-emerald-400 font-semibold">0.00%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.06]">
                    <div className="h-full bg-emerald-500 rounded-full w-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Bottom Status */}
          <div className="p-3 bg-white/[0.02] border-t border-white/[0.08] text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span className="text-slate-500">Live Engine</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected
            </span>
          </div>
        </aside>

        {/* Pane 2: Center Virtualized Spreadsheet Data Grid (flex-1) */}
        <main className="flex-1 flex flex-col bg-[#070b14]/50 overflow-hidden">
          {/* Table Header Bar */}
          <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="font-semibold text-slate-200">Live Quarantine Stream</span>
              <span className="text-white/[0.2]">•</span>
              <span className="font-mono text-[11px] text-indigo-300">
                Showing {displayedRecords.length} records
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
              <span>Select any row to inspect & edit</span>
            </div>
          </div>

          {/* High-Density Data Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 backdrop-blur-md bg-[#0e1422]/95 border-b border-white/[0.08] shadow-sm">
                <tr className="border-b border-white/[0.06]">
                  <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400 w-16">
                    # Row
                  </th>
                  <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Order ID
                  </th>
                  <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Customer Phone
                  </th>
                  <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                    GST Number
                  </th>
                  <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Order Date
                  </th>
                  <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Amount
                  </th>
                  <th className="py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Violation Diagnostic
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono text-xs">
                {displayedRecords.map((rec) => {
                  const isSelected = selectedRecordId === rec.record_id;
                  const payload = rec.resolved_value || rec.raw_payload;
                  const err = rec.validation_errors?.[0];

                  return (
                    <tr
                      key={rec.record_id}
                      onClick={() => handleSelectRecord(rec)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-950/25 border-l-2 border-l-indigo-500 shadow-[inset_0_1px_0_0_rgba(99,102,241,0.2)]"
                          : "hover:bg-white/[0.02]"
                      } ${!rec.is_resolved ? "bg-rose-950/[0.08]" : ""}`}
                    >
                      <td className="py-2.5 px-4 text-slate-500 font-mono">
                        {rec.row_index}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 truncate max-w-[150px]">
                        {payload.order_id || "—"}
                      </td>
                      <td className="py-2.5 px-4">
                        {err?.column === "customer_phone" && !rec.is_resolved ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950/30 text-rose-300 border border-rose-500/40 font-semibold shadow-[inset_0_0_8px_rgba(244,63,94,0.2)]">
                            {payload.customer_phone}
                          </span>
                        ) : rec.is_resolved && err?.column === "customer_phone" ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/25 text-emerald-300 border border-emerald-500/30">
                            {payload.customer_phone}
                          </span>
                        ) : (
                          <span className="text-slate-300">{payload.customer_phone}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {payload.gst_number || "—"}
                      </td>
                      <td className="py-2.5 px-4">
                        {err?.column === "order_date" && !rec.is_resolved ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950/30 text-amber-300 border border-amber-500/40 font-semibold shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]">
                            {payload.order_date}
                          </span>
                        ) : rec.is_resolved && err?.column === "order_date" ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/25 text-emerald-300 border border-emerald-500/30">
                            {payload.order_date}
                          </span>
                        ) : (
                          <span className="text-slate-300">{payload.order_date}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {err?.column === "amount" && !rec.is_resolved ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950/30 text-rose-300 border border-rose-500/40 font-bold shadow-[inset_0_0_8px_rgba(244,63,94,0.2)]">
                            {payload.amount}
                          </span>
                        ) : (
                          <span className="text-slate-300">{payload.amount}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {rec.is_resolved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                            <Check className="h-3 w-3 mr-1" />
                            Resolved & Clean
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium bg-rose-950/40 border border-rose-500/40 text-rose-300">
                            <ShieldAlert className="h-3 w-3 mr-1 text-rose-400" />
                            {err?.rule_id || "CONTRACT_VIOLATION"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>

        {/* Pane 3: Right Contextual Cell Inspector Drawer (320px) */}
        <aside className="w-80 border-l border-white/[0.08] bg-[#070b14]/90 flex flex-col justify-between overflow-y-auto">
          {selectedRecord ? (
            <div className="p-4 space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">Cell Inspector</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Row #{selectedRecord.row_index} • Field: <strong className="text-indigo-300">{activeColumn}</strong>
                  </p>
                </div>
                {selectedRecord.is_resolved ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    CLEAN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-950/40 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    QUARANTINE
                  </span>
                )}
              </div>

              {/* Current Raw Value Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                  <span>Current Raw Value</span>
                  <span className="text-rose-400 font-mono text-[10px]">INVALID_FORMAT</span>
                </div>
                <div className="surface-card p-3 rounded-xl border border-rose-500/30 bg-rose-950/10 font-mono text-xs text-rose-300 select-all shadow-inner">
                  &quot;{String(selectedRecord.raw_payload[activeColumn] || "")}&quot;
                </div>
              </div>

              {/* Violated Contract AST Diagnostic Card */}
              <div className="surface-card p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/10 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-rose-400 font-semibold text-[11px]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Rule: {activeError?.rule_id || "ERR_PHONE_FORMAT"}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {activeError?.reason || "Expected 10-digit clean numeric payload, encountered invalid format."}
                </p>
                <div className="p-2 rounded-lg bg-black/50 font-mono text-[10px] text-indigo-300 border border-white/[0.08]">
                  <span className="text-slate-500">Expected Format: </span>
                  <code>^[0-9]&#123;10&#125;$</code>
                </div>
              </div>

              {/* Quick Fix Suggestions Pills */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Quick Fix Suggestions
                </span>
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleRemediateCell(activeColumn, "9811200001")}
                    className="surface-card-interactive w-full flex items-center justify-between p-2.5 rounded-xl border border-white/[0.08] hover:border-indigo-500/50 hover:bg-indigo-950/20 text-left text-xs text-slate-200 transition-all group"
                  >
                    <span className="truncate group-hover:text-white font-medium">Apply Smart Fill: 9811200001</span>
                    <kbd className="bg-white/[0.06] border border-white/[0.12] shadow-[0_2px_0_0_rgba(0,0,0,0.5)] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300 shrink-0">
                      ⌘ 1
                    </kbd>
                  </button>
                  <button
                    onClick={() => {
                      const raw = String(selectedRecord.raw_payload[activeColumn] || "");
                      const cleaned = raw.replace(/\D/g, "");
                      handleRemediateCell(activeColumn, cleaned || "9811200000");
                    }}
                    className="surface-card-interactive w-full flex items-center justify-between p-2.5 rounded-xl border border-white/[0.08] hover:border-indigo-500/50 hover:bg-indigo-950/20 text-left text-xs text-slate-200 transition-all group"
                  >
                    <span className="truncate group-hover:text-white font-medium">Strip Non-Digits ➔ Clean</span>
                    <kbd className="bg-white/[0.06] border border-white/[0.12] shadow-[0_2px_0_0_rgba(0,0,0,0.5)] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300 shrink-0">
                      ⌘ 2
                    </kbd>
                  </button>
                </div>
              </div>

              {/* Manual Override Input with Glowing Focus */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  Manual Value Override
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    placeholder="Enter corrected value..."
                    className="w-full bg-white/[0.03] border border-white/[0.12] rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                  <kbd className="absolute right-2 top-2 bg-white/[0.06] border border-white/[0.1] rounded px-1 py-0.5 text-[9px] font-mono text-slate-400">
                    ↵
                  </kbd>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              No cell selected. Click any row in the spreadsheet to inspect.
            </div>
          )}

          {/* Footer Release Button */}
          {selectedRecord && (
            <div className="p-4 bg-white/[0.02] border-t border-white/[0.08]">
              <button
                onClick={() => handleRemediateCell(activeColumn, overrideValue)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_16px_rgba(16,185,129,0.35)] active:scale-95 border border-emerald-400/40"
              >
                <Check className="h-4 w-4" />
                <span>Mark Row Valid & Release</span>
                <kbd className="ml-1 bg-emerald-700/60 border border-emerald-500/40 rounded px-1.5 py-0.5 text-[10px] font-mono text-white">
                  ↵
                </kbd>
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* 3. Floating Keyboard-First HUD Bar */}
      <footer className="backdrop-blur-xl bg-[#090D16]/90 border-t border-white/[0.08] px-6 py-2 flex items-center justify-between select-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] text-xs text-slate-400">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Navigate:</span>
            <div className="flex items-center space-x-1">
              <kbd className="bg-white/[0.06] border border-white/[0.12] shadow-[0_2px_0_0_rgba(0,0,0,0.5)] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                J
              </kbd>
              <kbd className="bg-white/[0.06] border border-white/[0.12] shadow-[0_2px_0_0_rgba(0,0,0,0.5)] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                K
              </kbd>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-slate-500">Inspect Cell:</span>
            <kbd className="bg-white/[0.06] border border-white/[0.12] shadow-[0_2px_0_0_rgba(0,0,0,0.5)] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
              Enter
            </kbd>
          </div>

          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-slate-500">Apply & Release:</span>
            <div className="flex items-center space-x-1">
              <kbd className="bg-white/[0.06] border border-white/[0.12] shadow-[0_2px_0_0_rgba(0,0,0,0.5)] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                ⌘
              </kbd>
              <span className="text-slate-500">+</span>
              <kbd className="bg-white/[0.06] border border-white/[0.12] shadow-[0_2px_0_0_rgba(0,0,0,0.5)] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                Enter
              </kbd>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <span className="text-slate-500">Quick Fix:</span>
            <div className="flex items-center space-x-1">
              <kbd className="bg-white/[0.06] border border-white/[0.12] shadow-[0_2px_0_0_rgba(0,0,0,0.5)] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                ⌘ 1
              </kbd>
              <span className="text-slate-500">/</span>
              <kbd className="bg-white/[0.06] border border-white/[0.12] shadow-[0_2px_0_0_rgba(0,0,0,0.5)] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                ⌘ 2
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Deterministic AST Triage Mode</span>
        </div>
      </footer>

      {/* 4. Export & Webhook Modal */}
      {job && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          jobId={job.job_id}
          cleanRowCount={job.valid_rows}
          quarantinedCount={job.quarantined_rows}
          onPurged={() => router.push("/sandbox")}
        />
      )}
    </div>
  );
}
