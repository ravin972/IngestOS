"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Github,
  KeyRound,
  Shield,
} from "lucide-react";
import { loginUser, signupUser } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { user, setSession } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect straight to dashboard sandbox
  useEffect(() => {
    if (user) {
      router.push("/sandbox");
    }
  }, [user, router]);

  // Password entropy metrics
  const hasMinLength = password.length >= 12;
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  const passedCriteriaCount = [hasMinLength, hasSpecial, hasUppercase, hasDigit].filter(Boolean).length;
  const entropyPercentage = (passedCriteriaCount / 4) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === "signup") {
        if (passedCriteriaCount < 4) {
          setErrorMsg("Password does not meet enterprise security criteria (≥12 chars, 1 special, 1 uppercase, 1 digit).");
          setIsLoading(false);
          return;
        }
        await signupUser(email, password);
        setSession(email);
        setSuccessMsg("Account created securely! Redirecting to sandbox...");
        setTimeout(() => {
          window.location.href = "/sandbox";
        }, 400);
      } else {
        const loginRes = await loginUser(email, password);
        setSession(email, loginRes?.access_token);
        setSuccessMsg("Authenticated! Redirecting to sandbox...");
        setTimeout(() => {
          window.location.href = "/sandbox";
        }, 400);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col justify-center items-center px-4 py-16 overflow-hidden">
      {/* Atmospheric Background Grid & Spotlight */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
      <div className="absolute inset-0 hero-spotlight pointer-events-none" />

      {/* Centered Auth Container */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0_20px_rgba(99,102,241,0.25)] group-hover:scale-105 group-hover:border-indigo-400/60 transition-all">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white font-mono">
              IngestOS
            </span>
          </Link>
          <p className="text-xs text-slate-400">
            Enterprise Ingestion Gateway • Enterprise-Grade Security
          </p>
        </div>

        {/* High-Craft Specular Auth Card */}
        <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Segmented Mode Switcher */}
          <div className="flex rounded-xl bg-[#080D1A]/90 p-1 border border-white/[0.08] shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-[#151E32] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_2px_8px_rgba(0,0,0,0.4)] border border-white/[0.1]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-[#151E32] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_2px_8px_rgba(0,0,0,0.4)] border border-white/[0.1]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Social SSO Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() =>
                toast.info(
                  "Enterprise Feature: OAuth & SSO configurations require a standard Enterprise DPA setup."
                )
              }
              className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 rounded-xl bg-[#090D16]/80 hover:bg-[#151E32]/90 border border-white/[0.08] hover:border-white/[0.18] text-slate-200 text-xs font-semibold transition-all shadow-sm active:scale-[0.99]"
            >
              <Github className="h-4 w-4" />
              <span>Continue with GitHub</span>
            </button>
            <button
              type="button"
              onClick={() =>
                toast.info(
                  "Enterprise Feature: OAuth & SSO configurations require a standard Enterprise DPA setup."
                )
              }
              className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 rounded-xl bg-[#090D16]/80 hover:bg-[#151E32]/90 border border-white/[0.08] hover:border-white/[0.18] text-slate-200 text-xs font-semibold transition-all shadow-sm active:scale-[0.99]"
            >
              <KeyRound className="h-4 w-4 text-indigo-400" />
              <span>Continue with Google Workspace (SAML 2.0)</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">OR ENTERPRISE EMAIL</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Work Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#090D16]/90 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 font-mono transition-all"
                />
                <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#090D16]/90 border border-white/[0.08] rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 font-mono transition-all"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 hover:text-slate-300 absolute right-3 top-3 p-0.5 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Entropy Calculator (SignUp only) */}
            {mode === "signup" && (
              <div className="space-y-2 pt-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Password Strength</span>
                  <span
                    className={`font-semibold text-xs ${
                      entropyPercentage === 100
                        ? "text-emerald-400"
                        : entropyPercentage >= 50
                        ? "text-indigo-400"
                        : "text-rose-400"
                    }`}
                  >
                    {entropyPercentage === 100
                      ? "Strong Enterprise Grade"
                      : `${entropyPercentage}% Secure`}
                  </span>
                </div>

                {/* Progress Bar with glowing semantic segments */}
                <div className="h-1.5 w-full bg-[#090D16] rounded-full overflow-hidden border border-white/[0.08]">
                  <div
                    className={`h-full transition-all duration-300 ease-out ${
                      entropyPercentage === 100
                        ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                        : entropyPercentage >= 50
                        ? "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                        : "bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                    }`}
                    style={{ width: `${entropyPercentage}%` }}
                  />
                </div>

                {/* Criteria Checklist */}
                <div className="grid grid-cols-2 gap-2 pt-1.5 text-slate-400 text-[11px]">
                  <div className={`flex items-center space-x-1.5 transition-colors ${hasMinLength ? "text-emerald-400" : "text-slate-500"}`}>
                    <CheckCircle2 className={`h-3.5 w-3.5 ${hasMinLength ? "text-emerald-400" : "text-slate-600"}`} />
                    <span>≥ 12 Characters</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 transition-colors ${hasSpecial ? "text-emerald-400" : "text-slate-500"}`}>
                    <CheckCircle2 className={`h-3.5 w-3.5 ${hasSpecial ? "text-emerald-400" : "text-slate-600"}`} />
                    <span>1 Special Symbol</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 transition-colors ${hasUppercase ? "text-emerald-400" : "text-slate-500"}`}>
                    <CheckCircle2 className={`h-3.5 w-3.5 ${hasUppercase ? "text-emerald-400" : "text-slate-600"}`} />
                    <span>1 Uppercase Letter</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 transition-colors ${hasDigit ? "text-emerald-400" : "text-slate-500"}`}>
                    <CheckCircle2 className={`h-3.5 w-3.5 ${hasDigit ? "text-emerald-400" : "text-slate-600"}`} />
                    <span>1 Numeric Digit</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notification messages */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_20px_rgba(99,102,241,0.35)] active:scale-[0.99] disabled:opacity-50 border border-indigo-400/30"
            >
              <span>{isLoading ? "Processing..." : mode === "signup" ? "Create Account" : "Sign In"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Specular Enterprise Security Footer Badge */}
        <div className="surface-card rounded-xl p-4 flex items-center space-x-3.5 text-xs text-slate-400">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-200">Zero-Retention Security Guarantee</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Zero-knowledge architecture. Processed data stays in memory and is never written to disk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
