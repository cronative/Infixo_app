"use client";

import { useState, useEffect } from "react";
import {
  Flame,
  Clock,
  Sparkles,
  Copy,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Share2,
  MessageSquare,
  Award,
} from "lucide-react";
import { CreatorProfile } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { storage } from "@/utils/storage";

interface DailyHabitWidgetProps {
  profile: CreatorProfile;
}

interface DailyIdea {
  id: string;
  title: string;
  category: string;
  hook: string;
  format: string;
  estReach: string;
}

const CATEGORY_IDEAS: Record<string, DailyIdea[]> = {
  Technology: [
    {
      id: "tech-1",
      title: "The Unspoken Problem with New Tech",
      category: "Tech Review",
      hook: "Stop buying this tech product until you know this 1 secret...",
      format: "30s Short Reel",
      estReach: "High Virality",
    },
    {
      id: "tech-2",
      title: "3 Hidden Productivity Hacks in 2026",
      category: "Tips & Hacks",
      hook: "If you use a phone or laptop every day, turn ON this setting right now.",
      format: "45s Breakdown",
      estReach: "High Saves",
    },
    {
      id: "tech-3",
      title: "My Top AI Setup Routine",
      category: "Workflow",
      hook: "Here is the exact AI tool setup I use to save 10 hours every single week.",
      format: "60s Guide",
      estReach: "High Shares",
    },
  ],
  Entertainment: [
    {
      id: "ent-1",
      title: "Expectation vs Reality POV",
      category: "Comedy / POV",
      hook: "How people think creators spend their day vs what actually happens...",
      format: "25s Trending Audio",
      estReach: "High Virality",
    },
    {
      id: "ent-2",
      title: "Top 3 Hidden Details You Missed",
      category: "Pop Culture",
      hook: "I bet 99% of people missed this tiny detail in yesterday's viral video...",
      format: "40s Breakdown",
      estReach: "High Retention",
    },
    {
      id: "ent-3",
      title: "Storytime: My Worst Blooper",
      category: "Behind the Scenes",
      hook: "This was supposed to be a 5-second video, but it ended in complete disaster...",
      format: "50s Story",
      estReach: "High Comments",
    },
  ],
  Default: [
    {
      id: "def-1",
      title: "What Nobody Tells You About My Niche",
      category: "Insider Advice",
      hook: "If I had to start all over again today, here is the FIRST thing I would do...",
      format: "30s Reel",
      estReach: "High Virality",
    },
    {
      id: "def-2",
      title: "3 Essential Tools I Use Every Day",
      category: "Recommendations",
      hook: "Here are 3 game-changing things I cannot live without in 2026...",
      format: "45s Listicle",
      estReach: "High Saves",
    },
    {
      id: "def-3",
      title: "Behind The Scenes: How I Create Content",
      category: "Storytime",
      hook: "Everyone asks how I pull this off... so here is the raw, unedited truth.",
      format: "60s Behind The Scenes",
      estReach: "High Engagement",
    },
  ],
};

export function DailyHabitWidget({ profile }: DailyHabitWidgetProps) {
  const { showToast } = useToast();
  const [streakCount, setStreakCount] = useState<number>(1);
  const [ideas, setIdeas] = useState<DailyIdea[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize Daily Streak Tracker
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const streakKey = "inflixo:daily_streak_info";
    const raw = storage.get<{ lastDate: string; streak: number; ideasDate?: string }>(
      streakKey,
      { lastDate: "", streak: 1 }
    );

    if (raw.lastDate === todayStr) {
      setStreakCount(raw.streak || 1);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = 1;
      if (raw.lastDate === yesterdayStr) {
        newStreak = (raw.streak || 0) + 1;
      }

      setStreakCount(newStreak);
      storage.set(streakKey, { lastDate: todayStr, streak: newStreak });
    }

    // Load category ideas
    const cat = profile.category || "Default";
    const catList = CATEGORY_IDEAS[cat] || CATEGORY_IDEAS["Default"];
    setIdeas(catList);
  }, [profile.category]);

  const handleCopyHook = async (idea: DailyIdea) => {
    const textToCopy = `🎬 Reel Concept: ${idea.title}\n🔥 Viral Hook: "${idea.hook}"\n💡 Format: ${idea.format}`;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedId(idea.id);
      showToast("Viral hook copied to clipboard! 📋✨", "success");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleRefreshIdeas = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const cat = profile.category || "Default";
      const catList = CATEGORY_IDEAS[cat] || CATEGORY_IDEAS["Default"];
      // Shuffle list
      const shuffled = [...catList].sort(() => 0.5 - Math.random());
      setIdeas(shuffled);
      setIsRefreshing(false);
      showToast("Fresh 24h AI Content Ideas generated! ✨", "info");
    }, 400);
  };

  return (
    <div className="rounded-2xl border border-[#E8DCE4] bg-gradient-to-br from-white via-[#FAF5F8] to-[#F6EBF1] p-5 sm:p-6 space-y-5 shadow-sm text-left">
      
      {/* Top Banner: Daily Streak & Peak Posting Window */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DCE4]/80">
        
        {/* Streak Counter */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md animate-pulse shrink-0">
            <Flame className="h-6 w-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-slate-900">
                🔥 {streakCount}-Day Creator Streak
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Active
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600">
              Come back tomorrow before 12 AM to keep your streak burning!
            </p>
          </div>
        </div>

        {/* Peak Best Time to Post Badge */}
        <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-rose-200/80 shadow-2xs shrink-0">
          <Clock className="h-4 w-4 text-[#803D63]" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Today's Peak Window
            </p>
            <p className="text-xs font-black text-[#803D63]">
              6:30 PM – 8:45 PM
            </p>
          </div>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#803D63]" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Today's Fresh AI Reel Ideas &amp; Viral Hooks (24h Daily Feed)
          </h3>
        </div>

        <button
          type="button"
          onClick={handleRefreshIdeas}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#803D63] hover:underline cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 3 Fresh Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ideas.map((item, idx) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/90 bg-white p-4 space-y-2.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#803D63]/10 text-[#803D63]">
                  Idea #{idx + 1} • {item.category}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> {item.estReach}
                </span>
              </div>

              <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                {item.title}
              </h4>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-700 italic leading-relaxed">
                "{item.hook}"
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400">
                {item.format}
              </span>
              <button
                type="button"
                onClick={() => handleCopyHook(item)}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#803D63] hover:text-[#6D3254] bg-[#F6EBF1] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {copiedId === item.id ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Hook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Motivation Footer Banner */}
      <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-medium text-slate-500 border-t border-[#E8DCE4]/60">
        <div className="flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-amber-500" />
          <span>Keep your streak active for 7 days to unlock exclusive brand collab badges!</span>
        </div>
        <span className="font-bold text-[#803D63]">
          Updated daily at 12:00 AM
        </span>
      </div>

    </div>
  );
}
