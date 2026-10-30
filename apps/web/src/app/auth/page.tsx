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
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col justify-center items-center px-4 py-16">
      {/* Centered Auth Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white font-mono">
              IngestOS
            </span>
          </Link>
          <p className="text-xs text-slate-400">
            Enterprise Ingestion Gateway • Enterprise-Grade Security
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-2xl space-y-6">
          {/* Segmented Mode Switcher */}
          <div className="flex rounded-lg bg-[#0D1117] p-1 border border-[#1F2937]">
            <button
              onClick={() => {
                setMode("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === "signin"
                  ? "bg-[#1F2937] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === "signup"
                  ? "bg-[#1F2937] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Social SSO Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() =>
                toast.info(
                  "Enterprise Feature: OAuth & SSO configurations require a standard Enterprise DPA setup."
                )
              }
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-[#0D1117] hover:bg-[#191f2f] border border-[#1F2937] text-slate-200 text-xs font-semibold transition-colors"
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
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-[#0D1117] hover:bg-[#191f2f] border border-[#1F2937] text-slate-200 text-xs font-semibold transition-colors"
            >
              <KeyRound className="h-4 w-4 text-indigo-400" />
              <span>Continue with Google Workspace (SAML 2.0)</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
            <div className="flex-1 h-px bg-[#1F2937]" />
            <span>OR ENTERPRISE EMAIL</span>
            <div className="flex-1 h-px bg-[#1F2937]" />
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
                  className="w-full bg-[#0D1117] border border-[#1F2937] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
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
                  className="w-full bg-[#0D1117] border border-[#1F2937] rounded-lg pl-9 pr-9 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 hover:text-slate-300 absolute right-3 top-2.5"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Entropy Calculator (SignUp only) */}
            {mode === "signup" && (
              <div className="space-y-2 pt-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Password Strength</span>
                  <span
                    className={`font-semibold ${
                      entropyPercentage === 100
                        ? "text-emerald-400"
                        : entropyPercentage >= 50
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {entropyPercentage === 100
                      ? "Strong Enterprise Grade"
                      : `${entropyPercentage}% Secure`}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-[#0D1117] rounded-full overflow-hidden border border-[#1F2937]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      entropyPercentage === 100
                        ? "bg-emerald-500"
                        : entropyPercentage >= 50
                        ? "bg-indigo-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${entropyPercentage}%` }}
                  />
                </div>

                {/* Criteria Checklist */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-slate-400">
                  <div className={`flex items-center space-x-1 ${hasMinLength ? "text-emerald-400" : ""}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>≥ 12 Characters</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${hasSpecial ? "text-emerald-400" : ""}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>1 Special Symbol</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${hasUppercase ? "text-emerald-400" : ""}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>1 Uppercase Letter</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${hasDigit ? "text-emerald-400" : ""}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>1 Numeric Digit</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notification messages */}
            {errorMsg && (
              <div className="p-2.5 rounded bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <span>{isLoading ? "Processing..." : mode === "signup" ? "Create Account" : "Sign In"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Enterprise Security Footer */}
        <div className="p-4 rounded-lg bg-[#0D1117] border border-[#1F2937] flex items-center space-x-3 text-xs text-slate-400">
          <Shield className="h-5 w-5 text-indigo-400 shrink-0" />
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-300">Zero-Retention Security Guarantee</div>
            <p className="text-[11px] leading-relaxed">
              Zero-knowledge architecture. Processed data stays in memory and is never written to disk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
