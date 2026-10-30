"use client";

import React, { useState, useRef } from "react";
import {
  FileCode,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Copy,
  Check,
  X,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  Database,
  Cpu,
} from "lucide-react";
import { InferredField, SchemaPreset } from "@/lib/types";
import { createSchemaContract, inferSchemaFromFile } from "@/lib/api";
import { toast } from "sonner";

interface SchemaStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyContract: (contract: SchemaPreset) => void;
  initialPreset?: SchemaPreset | null;
}

const TYPE_OPTIONS: Array<"string" | "integer" | "float" | "boolean" | "datetime"> = [
  "string",
  "integer",
  "float",
  "boolean",
  "datetime",
];

const QUICK_PRESETS = [
  { label: "Phone (10 Digits)", regex: "^\\d{10}$", type: "string" as const },
  { label: "Email (RFC 5322)", regex: "^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$", type: "string" as const },
  { label: "ISO Date (YYYY-MM-DD)", regex: "^\\d{4}-\\d{2}-\\d{2}$", type: "datetime" as const },
  { label: "UUID v4", regex: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", type: "string" as const },
  { label: "GSTIN (India)", regex: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", type: "string" as const },
  { label: "Positive (>= 0)", min: 0.0, type: "float" as const },
];

export function SchemaStudioModal({
  isOpen,
  onClose,
  onApplyContract,
  initialPreset,
}: SchemaStudioModalProps) {
  const [contractName, setContractName] = useState<string>(
    initialPreset?.name === "Custom AST" ? "Custom Ingestion AST" : initialPreset?.name || "Custom Ingestion AST"
  );
  const [contractVersion, setContractVersion] = useState<string>(initialPreset?.version || "v1.0");
  const [description, setDescription] = useState<string>(
    initialPreset?.description || "Dynamic AST contract compiled via IngestOS Schema Studio."
  );

  // Convert initial preset columns into InferredField list
  const [fields, setFields] = useState<InferredField[]>(() => {
    if (initialPreset?.rules_json?.columns) {
      return Object.entries(initialPreset.rules_json.columns).map(([col, r]) => ({
        field_name: col,
        data_type: (r.type as any) || "string",
        nullable: !r.required,
        regex: r.regex,
        min: r.min,
        max: r.max,
        description: r.error_message,
      }));
    }
    return [
      { field_name: "record_id", data_type: "integer", nullable: false, min: 1 },
      { field_name: "payload_name", data_type: "string", nullable: false },
      { field_name: "contact_phone", data_type: "string", nullable: false, regex: "^\\d{10}$" },
      { field_name: "amount", data_type: "float", nullable: false, min: 0.0 },
    ];
  });

  const [activeTab, setActiveTab] = useState<"fields" | "ast_json">("fields");
  const [isInferring, setIsInferring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Compile fields into IngestOS AST rules_json
  const compiledRulesJson = {
    columns: fields.reduce((acc, f) => {
      acc[f.field_name] = {
        type: f.data_type,
        required: !f.nullable,
        ...(f.regex ? { regex: f.regex } : {}),
        ...(f.min !== undefined && f.min !== null && !isNaN(f.min) ? { min: f.min } : {}),
        ...(f.max !== undefined && f.max !== null && !isNaN(f.max) ? { max: f.max } : {}),
        error_code: `ERR_${f.field_name.toUpperCase()}_VALIDATION`,
        error_message: f.description || `Field '${f.field_name}' constraint violation.`,
      };
      return acc;
    }, {} as Record<string, any>),
  };

  const handleAddField = () => {
    const newIdx = fields.length + 1;
    setFields((prev) => [
      ...prev,
      {
        field_name: `field_${newIdx}`,
        data_type: "string",
        nullable: true,
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, patch: Partial<InferredField>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  };

  const handleAutoInferFile = async (file: File) => {
    if (!file) return;
    setIsInferring(true);
    try {
      const result = await inferSchemaFromFile(file);
      setContractName(`${file.name.replace(/\.[^/.]+$/, "")} Contract`);
      setFields(result.fields);
      toast.success(`Inferred ${result.fields.length} columns from ${file.name} (${result.row_count} rows).`);
    } catch (err: any) {
      toast.error(err.message || "Failed to infer schema from file.");
    } finally {
      setIsInferring(false);
    }
  };

  const handleApplyToSandbox = () => {
    const customPreset: SchemaPreset = {
      name: contractName.trim() || "Custom AST",
      version: contractVersion.trim() || "v1.0",
      description: description.trim() || "Custom AST schema compiled in IngestOS Schema Studio.",
      rules_json: compiledRulesJson,
    };
    onApplyContract(customPreset);
    toast.success(`Schema contract "${customPreset.name}" locked into RAM sandbox.`);
    onClose();
  };

  const handleRegisterToBackend = async () => {
    setIsSaving(true);
    try {
      const contract = await createSchemaContract(
        contractName.trim() || "Custom Ingestion AST",
        compiledRulesJson,
        contractVersion.trim() || "v1.0"
      );
      toast.success(`Contract saved permanently! ID: ${contract.contract_id.slice(0, 8)}...`);
      handleApplyToSandbox();
    } catch (err: any) {
      toast.error(err.message || "Failed to register contract.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(compiledRulesJson, null, 2));
    setHasCopied(true);
    toast.success("AST Schema JSON copied to clipboard");
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(compiledRulesJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contractName.toLowerCase().replace(/\s+/g, "_")}_schema.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Schema AST downloaded");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="surface-card border border-white/[0.1] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden bg-[#0c1220]/95">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
              <FileCode className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-sm tracking-tight">
                  AST Schema Studio & Auto-Discovery
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                  Polars RAM Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auto-discover data types from CSV/JSON or define custom regex contracts in ephemeral memory.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isInferring}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-all disabled:opacity-50"
              title="Upload sample CSV/JSON to auto-discover types"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isInferring ? "Scanning RAM..." : "Auto-Discover File"}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAutoInferFile(f);
              }}
              accept=".csv,.json,.jsonl,.txt"
              className="hidden"
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contract Meta Inputs Bar */}
        <div className="px-6 py-3 border-b border-white/[0.06] bg-[#090D16]/60 flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Contract:</span>
            <input
              type="text"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="Contract Name"
              className="bg-[#090D16] border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 w-52"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Version:</span>
            <input
              type="text"
              value={contractVersion}
              onChange={(e) => setContractVersion(e.target.value)}
              placeholder="v1.0"
              className="bg-[#090D16] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-20"
            />
          </div>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-slate-500 hidden sm:inline">Description:</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contract description..."
              className="bg-[#090D16] border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full"
            />
          </div>

          {/* View Tab Toggle */}
          <div className="flex rounded-lg bg-[#080D1A] p-0.5 border border-white/[0.08]">
            <button
              onClick={() => setActiveTab("fields")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeTab === "fields"
                  ? "bg-[#151E32] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Fields ({fields.length})
            </button>
            <button
              onClick={() => setActiveTab("ast_json")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeTab === "ast_json"
                  ? "bg-[#151E32] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              AST JSON
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "fields" ? (
            <div className="space-y-4">
              {/* Quick Regex Presets Pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs pb-1">
                <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Pattern Presets:</span>
                </span>
                {QUICK_PRESETS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => {
                      // Apply to last field or add new
                      if (fields.length > 0) {
                        const lastIdx = fields.length - 1;
                        handleUpdateField(lastIdx, {
                          regex: qp.regex,
                          min: qp.min,
                          data_type: qp.type,
                        });
                        toast.success(`Applied ${qp.label} pattern to "${fields[lastIdx].field_name}"`);
                      } else {
                        handleAddField();
                      }
                    }}
                    className="px-2 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 font-mono text-[11px] transition-colors"
                  >
                    + {qp.label}
                  </button>
                ))}
              </div>

              {/* Column Fields Table */}
              <div className="surface-card rounded-xl overflow-hidden border border-white/[0.08]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#090D16]/90 border-b border-white/[0.08] text-slate-400 font-mono text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Field Name</th>
                      <th className="py-2.5 px-4 font-semibold uppercase tracking-wider w-36">Type</th>
                      <th className="py-2.5 px-4 font-semibold uppercase tracking-wider w-28">Nullable</th>
                      <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Regex Validation Rule</th>
                      <th className="py-2.5 px-4 font-semibold uppercase tracking-wider w-28">Constraints</th>
                      <th className="py-2.5 px-2 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-slate-300 font-mono">
                    {fields.map((f, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        {/* Field Name Input */}
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={f.field_name}
                            onChange={(e) => handleUpdateField(idx, { field_name: e.target.value })}
                            className="bg-[#090D16] border border-white/[0.08] rounded px-2 py-1 text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 w-full"
                          />
                          {f.sample_values && f.sample_values.length > 0 && (
                            <div className="text-[10px] text-slate-500 pt-1 truncate">
                              samples: {f.sample_values.slice(0, 3).join(", ")}
                            </div>
                          )}
                        </td>

                        {/* Data Type Select */}
                        <td className="py-2.5 px-4">
                          <select
                            value={f.data_type}
                            onChange={(e) =>
                              handleUpdateField(idx, {
                                data_type: e.target.value as any,
                              })
                            }
                            className="bg-[#090D16] border border-white/[0.08] rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full"
                          >
                            {TYPE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Nullable / Required Toggle */}
                        <td className="py-2.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleUpdateField(idx, { nullable: !f.nullable })}
                            className={`px-2 py-1 rounded text-[10px] font-semibold tracking-wider uppercase transition-colors border ${
                              f.nullable
                                ? "bg-amber-950/30 border-amber-500/30 text-amber-300"
                                : "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                            }`}
                          >
                            {f.nullable ? "Nullable" : "Required"}
                          </button>
                        </td>

                        {/* Regex Pattern Input */}
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={f.regex || ""}
                            onChange={(e) => handleUpdateField(idx, { regex: e.target.value || undefined })}
                            placeholder="e.g. ^\d{10}$ or ^[\w\.-]+@..."
                            className="bg-[#090D16] border border-white/[0.08] rounded px-2 py-1 text-xs text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-full"
                          />
                        </td>

                        {/* Constraints (Min / Max) */}
                        <td className="py-2.5 px-4">
                          {f.data_type === "integer" || f.data_type === "float" ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 text-[10px]">min:</span>
                              <input
                                type="number"
                                value={f.min !== undefined ? f.min : ""}
                                onChange={(e) =>
                                  handleUpdateField(idx, {
                                    min: e.target.value === "" ? undefined : parseFloat(e.target.value),
                                  })
                                }
                                placeholder="0.0"
                                className="bg-[#090D16] border border-white/[0.08] rounded px-1.5 py-1 text-xs text-amber-300 focus:outline-none focus:border-indigo-500 w-16"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[10px]">None</span>
                          )}
                        </td>

                        {/* Remove Action */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveField(idx)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                            title="Delete column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Column Button */}
              <button
                type="button"
                onClick={handleAddField}
                className="w-full py-2.5 border border-dashed border-white/[0.12] hover:border-indigo-500/50 rounded-xl flex items-center justify-center gap-2 text-slate-300 text-xs font-semibold hover:bg-white/[0.02] transition-colors"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Add Column Field</span>
              </button>
            </div>
          ) : (
            /* AST JSON Preview Window */
            <div className="surface-card rounded-xl border border-white/[0.08] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-[#090D16] border-b border-white/[0.06] text-xs font-mono">
                <span className="text-slate-400">Compiled IngestOS AST Rules</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJSON}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors text-xs"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 font-mono text-xs text-indigo-200/90 bg-[#070D18] overflow-x-auto max-h-[500px]">
                {JSON.stringify(compiledRulesJson, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero-Retention: Schema compiled directly in RAM</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRegisterToBackend}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-300 text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save to Backend"}
            </button>
            <button
              type="button"
              onClick={handleApplyToSandbox}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_20px_rgba(99,102,241,0.35)] active:scale-95 border border-indigo-400/30"
            >
              <span>Lock In Contract for Ingestion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
