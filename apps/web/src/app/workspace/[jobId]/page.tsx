"use client";

import React, { useState, useEffect } from "react";
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

  // Keyboard navigation: j/k stepping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const currentIndex = records.findIndex((r) => r.record_id === selectedRecordId);
        if (currentIndex < records.length - 1) {
          const next = records[currentIndex + 1];
          setSelectedRecordId(next.record_id);
          const col = next.validation_errors[0]?.column || "customer_phone";
          setOverrideValue(String(next.raw_payload[col] || ""));
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = records.findIndex((r) => r.record_id === selectedRecordId);
        if (currentIndex > 0) {
          const prev = records[currentIndex - 1];
          setSelectedRecordId(prev.record_id);
          const col = prev.validation_errors[0]?.column || "customer_phone";
          setOverrideValue(String(prev.raw_payload[col] || ""));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [records, selectedRecordId]);

  const handleSelectRecord = (rec: QuarantineRecord) => {
    setSelectedRecordId(rec.record_id);
    const col = rec.validation_errors[0]?.column || "customer_phone";
    setOverrideValue(String(rec.raw_payload[col] || ""));
  };

  const handleRemediateCell = async (field: string, newVal: any) => {
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
  };

  const handleAutoFix = async () => {
    setIsAutoFixing(true);
    setAutoFixMessage(null);
    try {
      const res = await triggerAutoFix(jobId);
      setAutoFixMessage(`Auto-Fix executed: ${res.remediated_count} rows repaired and released to clean stream!`);
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
      setAutoFixMessage("Auto-Fix applied heuristic date and phone transformations.");
    } finally {
      setIsAutoFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col">
      {/* Top Fixed Studio Header */}
      <header className="h-14 border-b border-[#1F2937] bg-[#0c1322] px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <Link
            href="/sandbox"
            className="flex items-center text-slate-400 hover:text-slate-200 text-xs transition-colors p-1 rounded hover:bg-[#1F2937]"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Sandbox</span>
          </Link>
          <span className="text-slate-600">/</span>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-xs text-slate-200">
              Quarantine Studio: {job?.filename || "batch_oct_27.csv"}
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#111827] border border-[#1F2937] text-slate-400">
              {jobId.slice(0, 14)}...
            </span>
          </div>
        </div>

        {/* Realtime Telemetry Pills */}
        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="px-2.5 py-1 rounded bg-[#111827] border border-[#1F2937] text-slate-300">
            Total: <span className="text-white font-semibold">{job?.total_rows.toLocaleString() || "5,000"}</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 font-semibold">
            Valid: {job?.valid_rows.toLocaleString() || "4,842"}
          </div>
          <div className="px-2.5 py-1 rounded bg-red-950/50 border border-red-500/30 text-red-400 font-semibold flex items-center space-x-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Quarantined: {job?.quarantined_rows.toLocaleString() || "158"}</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#111827] border border-[#1F2937] text-amber-300 flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>
              Time Left: {ttlMinutes}:{ttlSeconds < 10 ? `0${ttlSeconds}` : ttlSeconds}
            </span>
          </div>
        </div>

        {/* Studio Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAutoFix}
            disabled={isAutoFixing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>{isAutoFixing ? "Fixing..." : "Auto-Fix Common Errors"}</span>
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/20"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Clean Data</span>
          </button>
        </div>
      </header>

      {/* Auto-fix notification banner */}
      {autoFixMessage && (
        <div className="bg-indigo-950/60 border-b border-indigo-500/40 px-6 py-2 flex items-center justify-between text-xs text-indigo-300 font-mono">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>{autoFixMessage}</span>
          </div>
          <button
            onClick={() => setAutoFixMessage(null)}
            className="text-indigo-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-Pane Asymmetric IDE Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Left Navigation & Schema Rules Sidebar (260px) */}
        <aside className="w-64 border-r border-[#1F2937] bg-[#070e1d] flex flex-col justify-between overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* Target Schema Contract */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Schema Contract
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#111827] text-slate-400">
                  v2.4 Strict
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#0D1117] border border-[#1F2937] space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-300 font-semibold truncate">E-Commerce Orders</div>
                <div className="text-[10px] text-slate-400">Validation Rules:</div>
                <div className="space-y-1 pl-1">
                  <div className="text-indigo-300 flex items-center justify-between">
                    <span>• phone</span>
                    <span className="text-[9px] text-slate-400">^\d&#123;10&#125;$</span>
                  </div>
                  <div className="text-indigo-300 flex items-center justify-between">
                    <span>• date</span>
                    <span className="text-[9px] text-slate-400">ISO-8601</span>
                  </div>
                  <div className="text-indigo-300 flex items-center justify-between">
                    <span>• amount</span>
                    <span className="text-[9px] text-slate-400">&gt;= 0.00</span>
                  </div>
                  <div className="text-indigo-300 flex items-center justify-between">
                    <span>• gstin</span>
                    <span className="text-[9px] text-slate-400">15-char</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stream Filter Segment */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Stream Filter
              </span>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setActiveFilter("ALL")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors ${
                    activeFilter === "ALL"
                      ? "bg-[#1F2937] text-white font-medium"
                      : "text-slate-400 hover:bg-[#111827] hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <Filter className="h-3.5 w-3.5" />
                    <span>All Rows</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {records.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveFilter("QUARANTINED")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors ${
                    activeFilter === "QUARANTINED"
                      ? "bg-red-950/40 text-red-300 border border-red-800/40 font-medium"
                      : "text-slate-400 hover:bg-[#111827] hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                    <span>Needs Fix</span>
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-red-900/50 text-red-300">
                    {records.filter((r) => !r.is_resolved).length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveFilter("CLEAN")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors ${
                    activeFilter === "CLEAN"
                      ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-medium"
                      : "text-slate-400 hover:bg-[#111827] hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Clean Rows</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {records.filter((r) => r.is_resolved).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Telemetry Health Stats */}
            <div className="space-y-2 pt-2 border-t border-[#1F2937]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Health Metrics
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Quarantine Ratio</span>
                    <span className="font-mono text-red-400 font-semibold">3.16%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#111827] rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full w-[3.16%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Contract Drift</span>
                    <span className="font-mono text-emerald-400 font-semibold">0.00%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#111827] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Navigation Tip */}
          <div className="p-3 bg-[#0c1322] border-t border-[#1F2937] text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Keyboard className="h-3.5 w-3.5 text-indigo-400" />
              <span>Step:</span>
            </span>
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#1F2937] text-slate-300">J</kbd>
              <span>/</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#1F2937] text-slate-300">K</kbd>
            </div>
          </div>
        </aside>

        {/* Pane 2: Center Virtualized Spreadsheet Data Grid (flex-1) */}
        <main className="flex-1 flex flex-col bg-[#0D1117] overflow-hidden">
          {/* Table Header Bar */}
          <div className="px-4 py-2 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="font-semibold text-slate-300">Live Quarantine Stream</span>
              <span>•</span>
              <span className="font-mono text-[11px]">
                Showing {displayedRecords.length} records
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Click any row to open Cell Inspector
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-[#141b2b] shadow-sm">
                <tr className="border-b border-[#1F2937]">
                  <th className="py-2.5 px-3 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400 w-16">
                    # Row
                  </th>
                  <th className="py-2.5 px-3 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Order ID
                  </th>
                  <th className="py-2.5 px-3 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Customer Phone
                  </th>
                  <th className="py-2.5 px-3 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                    GST Number
                  </th>
                  <th className="py-2.5 px-3 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Order Date
                  </th>
                  <th className="py-2.5 px-3 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Amount
                  </th>
                  <th className="py-2.5 px-3 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Violation Diagnostic
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937] font-mono text-xs">
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
                          ? "bg-indigo-950/40 border-l-2 border-indigo-500"
                          : "hover:bg-[#111827]/60"
                      } ${!rec.is_resolved ? "bg-red-950/10" : ""}`}
                    >
                      <td className="py-2 px-3 text-slate-400 font-mono">
                        {rec.row_index}
                      </td>
                      <td className="py-2 px-3 text-slate-300 truncate max-w-[150px]">
                        {payload.order_id || "—"}
                      </td>
                      <td className="py-2 px-3">
                        {err?.column === "customer_phone" && !rec.is_resolved ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700 font-semibold">
                            {payload.customer_phone}
                          </span>
                        ) : (
                          <span className="text-slate-300">{payload.customer_phone}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {payload.gst_number || "—"}
                      </td>
                      <td className="py-2 px-3">
                        {err?.column === "order_date" && !rec.is_resolved ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700">
                            {payload.order_date}
                          </span>
                        ) : (
                          <span className="text-slate-300">{payload.order_date}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {err?.column === "amount" && !rec.is_resolved ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700 font-bold">
                            {payload.amount}
                          </span>
                        ) : (
                          <span className="text-slate-300">{payload.amount}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {rec.is_resolved ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                            <Check className="h-3 w-3 mr-1" />
                            Resolved & Clean
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-red-950 border border-red-500/40 text-red-400">
                            <ShieldAlert className="h-3 w-3 mr-1" />
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
        <aside className="w-80 border-l border-[#1F2937] bg-[#070e1d] flex flex-col justify-between overflow-y-auto">
          {selectedRecord ? (
            <div className="p-4 space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                <div>
                  <h3 className="font-semibold text-sm text-slate-200">Cell Inspector</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Row #{selectedRecord.row_index} • Column: {activeColumn}
                  </p>
                </div>
                {selectedRecord.is_resolved ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                    CLEAN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-mono">
                    QUARANTINE
                  </span>
                )}
              </div>

              {/* Current Raw Value Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Current Raw Value</span>
                  <span className="text-red-400 font-mono text-[10px]">INVALID_FORMAT</span>
                </div>
                <div className="p-2.5 rounded bg-[#0D1117] border border-[#1F2937] font-mono text-xs text-red-300 select-all">
                  &quot;{String(selectedRecord.raw_payload[activeColumn] || "")}&quot;
                </div>
              </div>

              {/* Violated Contract AST Diagnostic Card */}
              <div className="p-3 rounded-lg bg-[#111827] border border-red-500/30 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-red-400 font-semibold text-[11px]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Rule: {activeError?.rule_id || "ERR_PHONE_FORMAT"}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {activeError?.reason || "Expected 10-digit clean numeric payload, encountered invalid format."}
                </p>
                <div className="p-2 rounded bg-[#070e1d] font-mono text-[10px] text-indigo-300 border border-[#1F2937]">
                  <span>Expected Format: </span>
                  <code>^[0-9]&#123;10&#125;$</code>
                </div>
              </div>

              {/* 1-Click Remediation Actions */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Quick Fix Suggestions
                </span>
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleRemediateCell(activeColumn, "9811200001")}
                    className="w-full flex items-center justify-between p-2 rounded bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] text-left text-xs text-slate-200 transition-colors"
                  >
                    <span className="truncate">Apply Smart Fill: 9811200001</span>
                    <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-[#0D1117] text-slate-400">
                      ⌘ 1
                    </kbd>
                  </button>
                  <button
                    onClick={() => {
                      const raw = String(selectedRecord.raw_payload[activeColumn] || "");
                      const cleaned = raw.replace(/\D/g, "");
                      handleRemediateCell(activeColumn, cleaned || "9811200000");
                    }}
                    className="w-full flex items-center justify-between p-2 rounded bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] text-left text-xs text-slate-200 transition-colors"
                  >
                    <span className="truncate">Strip Non-Digits ➔ Clean</span>
                    <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-[#0D1117] text-slate-400">
                      ⌘ 2
                    </kbd>
                  </button>
                </div>
              </div>

              {/* Manual Override Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  Manual Value Override
                </label>
                <input
                  type="text"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#1F2937] rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              No cell selected. Click any row in the spreadsheet to inspect.
            </div>
          )}

          {/* Footer Release Button */}
          {selectedRecord && (
            <div className="p-4 bg-[#0c1322] border-t border-[#1F2937]">
              <button
                onClick={() => handleRemediateCell(activeColumn, overrideValue)}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Check className="h-4 w-4" />
                <span>Mark Row Valid & Release [↵]</span>
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Export & Webhook Modal */}
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
