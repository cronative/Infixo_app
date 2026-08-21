"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  FileText,
  Users,
  ShieldCheck,
  Check,
  XCircle,
  Copy,
  CheckCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { CREATOR_EMAIL_TEMPLATES, formatEmailBodyToHtml, EmailTemplate } from "@/data/creatorEmailTemplates";
import { useToast } from "@/contexts/ToastContext";

export default function CreatorEmailSenderPage() {
  const { showToast } = useToast();

  // Template State
  const [selectedTemplateId, setSelectedTemplateId] = useState<"english" | "hinglish" | "custom">("english");
  const [subject, setSubject] = useState(CREATOR_EMAIL_TEMPLATES[0].subject);
  const [bodyText, setBodyText] = useState(CREATOR_EMAIL_TEMPLATES[0].body);

  // Email List Input State
  const [rawEmailsInput, setRawEmailsInput] = useState("");
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);

  // Batch Sending Queue State
  const [isDispatching, setIsDispatching] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dispatchLogs, setDispatchLogs] = useState<
    { email: string; status: "success" | "failed" | "sending"; timestamp: string; error?: string }[]
  >([]);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const isDispatchingRef = useRef(isDispatching);
  isDispatchingRef.current = isDispatching;

  // Parse raw email text whenever input changes
  useEffect(() => {
    if (!rawEmailsInput.trim()) {
      setParsedEmails([]);
      return;
    }

    // Split by commas, spaces, or newlines
    const rawTokens = rawEmailsInput.split(/[\s,\n]+/);
    const validSet = new Set<string>();

    rawTokens.forEach((token) => {
      const cleaned = token.trim().toLowerCase();
      // Basic email regex filter
      if (cleaned && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
        validSet.add(cleaned);
      }
    });

    setParsedEmails(Array.from(validSet));
  }, [rawEmailsInput]);

  // Template Switcher Handler
  const handleSelectTemplate = (templateId: "english" | "hinglish" | "custom") => {
    setSelectedTemplateId(templateId);
    if (templateId === "custom") {
      setSubject("");
      setBodyText("");
    } else {
      const tmpl = CREATOR_EMAIL_TEMPLATES.find((t) => t.id === templateId);
      if (tmpl) {
        setSubject(tmpl.subject);
        setBodyText(tmpl.body);
      }
    }
  };

  // Start Sequential One-by-One Dispatch Loop
  const handleStartDispatch = async () => {
    if (parsedEmails.length === 0) {
      showToast("Please enter at least one valid creator email address", "error");
      return;
    }

    if (!subject.trim()) {
      showToast("Email subject cannot be empty", "error");
      return;
    }

    if (!bodyText.trim()) {
      showToast("Email body message cannot be empty", "error");
      return;
    }

    setIsDispatching(true);
    setIsPaused(false);
    setCurrentIndex(0);

    // Initialize logs
    const initialLogs = parsedEmails.map((email) => ({
      email,
      status: "sending" as const,
      timestamp: new Date().toLocaleTimeString(),
    }));
    setDispatchLogs(initialLogs);

    const formattedHtml = formatEmailBodyToHtml(bodyText);

    // Sequential Loop execution
    for (let i = 0; i < parsedEmails.length; i++) {
      // Check if paused or stopped
      while (isPausedRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!isDispatchingRef.current) break;
      }

      if (!isDispatchingRef.current) {
        showToast("Email dispatch cancelled", "info");
        break;
      }

      const targetEmail = parsedEmails[i];
      setCurrentIndex(i);

      // Update log to sending
      setDispatchLogs((prev) =>
        prev.map((log, idx) => (idx === i ? { ...log, status: "sending", timestamp: new Date().toLocaleTimeString() } : log))
      );

      try {
        const res = await fetch("/api/admin/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients: [targetEmail],
            subject: subject.trim(),
            bodyHtml: formattedHtml,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success && data.sentCount > 0) {
          setDispatchLogs((prev) =>
            prev.map((log, idx) => (idx === i ? { ...log, status: "success", timestamp: new Date().toLocaleTimeString() } : log))
          );
        } else {
          setDispatchLogs((prev) =>
            prev.map((log, idx) =>
              idx === i
                ? {
                    ...log,
                    status: "failed",
                    error: data.error || "SMTP send failed",
                    timestamp: new Date().toLocaleTimeString(),
                  }
                : log
            )
          );
        }
      } catch (err: any) {
        setDispatchLogs((prev) =>
          prev.map((log, idx) =>
            idx === i
              ? {
                  ...log,
                  status: "failed",
                  error: err.message || "Network error",
                  timestamp: new Date().toLocaleTimeString(),
                }
              : log
          )
        );
      }

      // Small delay between sequential emails to avoid SMTP rate-limit throttling
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setIsDispatching(false);
    setIsPaused(false);
    showToast("Email queue dispatch completed! 🎉", "success");
  };

  const handleStopDispatch = () => {
    setIsDispatching(false);
    setIsPaused(false);
    isDispatchingRef.current = false;
  };

  const successCount = dispatchLogs.filter((l) => l.status === "success").length;
  const failedCount = dispatchLogs.filter((l) => l.status === "failed").length;
  const progressPercentage = parsedEmails.length > 0 ? Math.round(((currentIndex + (isDispatching ? 1 : 0)) / parsedEmails.length) * 100) : 0;

  return (
    <div className="min-h-dvh bg-slate-950 text-white selection:bg-purple-900 selection:text-white">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-50 border-b border-purple-900/40 bg-slate-950/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Logo light size="sm" />
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-purple-900/50 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-200">
              <Mail className="h-3.5 w-3.5 text-purple-400" />
              <span>Creator Email Dispatch Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Sender: <strong className="text-white">inflixoapp@gmail.com</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Intro Banner */}
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 px-3.5 py-1 text-xs font-bold text-purple-300">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>One-by-One Sequential Dispatch from inflixoapp@gmail.com</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Creator Email Campaign Sender
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-medium">
            Paste multiple creator email addresses below. Select either the English or Hinglish version, preview the content, and dispatch them one-by-one with real-time status tracking.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Template Selection & Message Editor */}
          <div className="lg:col-span-7 space-y-6">
            {/* Template Selector Cards */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>1. Select Pre-Configured Email Template</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CREATOR_EMAIL_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-gradient-to-br from-purple-950/80 to-slate-900 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/50"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-purple-400">
                          {tmpl.language}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-purple-400 stroke-[3]" />}
                      </div>
                      <h3 className="font-bold text-sm text-white">{tmpl.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tmpl.subject}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject Line Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Email Subject Line</span>
                <span className="text-[11px] text-slate-500 font-normal">{subject.length} characters</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setSelectedTemplateId("custom");
                }}
                placeholder="Enter email subject..."
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Email Body Editor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Email Message Body (Plain Text & Markdown Links supported)</span>
                <span className="text-[11px] text-slate-500 font-normal">{bodyText.length} characters</span>
              </label>
              <textarea
                rows={14}
                value={bodyText}
                onChange={(e) => {
                  setBodyText(e.target.value);
                  setSelectedTemplateId("custom");
                }}
                placeholder="Write your email message..."
                className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-xs sm:text-sm font-mono text-slate-200 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all leading-relaxed placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Right Column: Recipient Email Input & Dispatch Progress */}
          <div className="lg:col-span-5 space-y-6">
            {/* Recipient Emails Area */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>2. Enter Recipient Emails</span>
                </label>

                {parsedEmails.length > 0 && (
                  <span className="rounded-full bg-purple-900/60 border border-purple-500/40 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-300">
                    {parsedEmails.length} {parsedEmails.length === 1 ? "Email" : "Emails"} Ready
                  </span>
                )}
              </div>

              <textarea
                rows={6}
                value={rawEmailsInput}
                onChange={(e) => setRawEmailsInput(e.target.value)}
                placeholder="Paste emails here (separated by comma, space or line break):&#10;creator1@gmail.com&#10;creator2@yahoo.com, creator3@outlook.com"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs font-mono text-slate-200 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
                disabled={isDispatching}
              />

              {parsedEmails.length > 0 && (
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Parsed Valid Emails List ({parsedEmails.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {parsedEmails.map((em, idx) => (
                      <span key={idx} className="bg-purple-950/60 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {em}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Controls */}
              <div className="pt-2">
                {!isDispatching ? (
                  <button
                    type="button"
                    onClick={handleStartDispatch}
                    disabled={parsedEmails.length === 0 || !subject.trim() || !bodyText.trim()}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send {parsedEmails.length} Email{parsedEmails.length === 1 ? "" : "s"} One-by-One</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaused(!isPaused)}
                      className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      <span>{isPaused ? "Resume Queue" : "Pause Queue"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStopDispatch}
                      className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Stop</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Dispatch Progress & Logs Console */}
            {dispatchLogs.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <RotateCcw className={`h-4 w-4 ${isDispatching ? "animate-spin text-purple-400" : ""}`} />
                    <span>Dispatch Progress</span>
                  </h3>

                  <span className="text-xs font-extrabold text-purple-300">
                    {successCount + failedCount} / {parsedEmails.length} Sent
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-rose-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>{progressPercentage}% Complete</span>
                    <span>
                      {successCount} Success • {failedCount} Failed
                    </span>
                  </div>
                </div>

                {/* Live Activity Logs Console */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
                  {dispatchLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 border-b border-slate-900/80 pb-1.5 text-left">
                      <div className="flex items-center gap-2 min-w-0">
                        {log.status === "sending" && <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />}
                        {log.status === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                        {log.status === "failed" && <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />}

                        <span className="truncate font-semibold text-slate-200">{log.email}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[10px]">
                        <span className="text-slate-500">{log.timestamp}</span>
                        {log.status === "success" && <span className="text-emerald-400 font-bold">Sent</span>}
                        {log.status === "failed" && <span className="text-rose-400 font-bold">Failed</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
