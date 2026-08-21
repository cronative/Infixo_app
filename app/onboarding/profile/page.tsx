"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, User, AtSign, Tag, FileText, Search, Loader2, AlertCircle } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useCreator } from "@/contexts/CreatorContext";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { SubtypeMultiSelect } from "@/components/ui/SubtypeMultiSelect";
import { slugifyUsername } from "@/utils/format";
import { OnboardingService } from "@/services/OnboardingService";
import { ProfileService } from "@/services/ProfileService";
import { authRepository } from "@/repositories/localRepository";
import { useToast } from "@/contexts/ToastContext";
import { scrollToFirstError } from "@/utils/scroll";

const BIO_SUGGESTIONS_MAP: Record<string, string[]> = {
  Gaming: [
    "🎮 Streaming high-rank gameplay, walkthroughs & gaming setup reviews.",
    "👾 Daily gaming clips, esports tactics & live multiplayer streams.",
  ],
  Technology: [
    "💻 Tech reviews, gadget unboxings & software tutorials for devs.",
    "🚀 Exploring AI, mobile tech & building futuristic software products.",
  ],
  Entertainment: [
    "🎬 Creating cinematic vlogs, comedy sketches & storytelling videos.",
    "🍿 Movie reviews, pop culture commentary & daily fun shorts.",
  ],
  Food: [
    "🍳 Authentic street food explorations & easy home-cooked recipes.",
    "🍔 Foodie adventures, restaurant reviews & dessert tutorials.",
  ],
  Travel: [
    "✈️ Traveling the world, backpacker guides & cinematic travel vlogs.",
    "🏔️ Road trips, hidden gems & adventure travel stories.",
  ],
};

const DEFAULT_BIO_SUGGESTIONS = [
  "✨ Creating inspiring video content, series & daily stories.",
  "🎥 Welcome to my official Inflixo creator home! Watch my series below.",
  "🚀 Sharing my journey, original series & exclusive content updates.",
];

export default function ProfileStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, socials, totalAudience, updateProfile, theme } = useCreator();
  const [bioSuggestionIndex, setBioSuggestionIndex] = useState(0);

  const [errors, setErrors] = useState<{
    displayName?: string;
    username?: string;
    category?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; message?: string } | null>(null);

  // Live debounced DB username uniqueness check
  useEffect(() => {
    const username = profile.username.trim();
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    setCheckingUsername(true);
    const email = authRepository.getPendingEmail() || "";
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/creator/check-username?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`);
        const data = await res.json();
        setCheckingUsername(false);
        if (data.available) {
          setUsernameStatus({ available: true, message: `@${username} is available!` });
          setErrors((prev) => ({ ...prev, username: undefined }));
        } else {
          setUsernameStatus({ available: false, message: data.error || `@${username} is already taken` });
          setErrors((prev) => ({ ...prev, username: data.error || `@${username} is already taken in DB` }));
        }
      } catch (err) {
        setCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [profile.username]);

  function handleSuggestBio() {
    const suggestions = (profile.category && BIO_SUGGESTIONS_MAP[profile.category]) || DEFAULT_BIO_SUGGESTIONS;
    const nextText = suggestions[bioSuggestionIndex % suggestions.length];
    updateProfile({ bio: nextText });
    setBioSuggestionIndex((prev) => prev + 1);
    showToast("Bio suggestion applied! ✨");
  }

  async function handleNext() {
    const newErrors: typeof errors = {};
    if (!profile.displayName.trim()) newErrors.displayName = "Display name is required";
    if (!profile.username.trim()) newErrors.username = "Choose a username";
    else if (profile.username.trim().length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!profile.category) newErrors.category = "Select a category";
    
    if (usernameStatus && !usernameStatus.available) {
      newErrors.username = usernameStatus.message || `@${profile.username} is already taken`;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please fix highlighted fields to continue 💡", "error");
      scrollToFirstError(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const email = authRepository.getPendingEmail() || "";
      const checkRes = await fetch(`/api/creator/check-username?username=${encodeURIComponent(profile.username)}&email=${encodeURIComponent(email)}`);
      const checkData = await checkRes.json();

      if (!checkData.available) {
        setErrors((prev) => ({ ...prev, username: checkData.error || `@${profile.username} is already taken` }));
        showToast(checkData.error || "This handle is already taken — pick another one! ✨", "error");
        setSubmitting(false);
        return;
      }

      await ProfileService.saveToDb(profile);
      OnboardingService.setStep("socials");
      showToast("Profile saved! Next: Connect your social handles 🚀");
      router.push("/onboarding/socials");
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      showToast("Couldn't save profile details. Let's try again! 💡", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingLayout
      step="profile"
      preview={<LivePreviewCard profile={profile} socials={socials} totalAudience={totalAudience} themeKey={theme} />}
    >
      <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#803D63]/20 bg-[#803D63]/10 px-3 py-1 text-xs font-bold text-[#803D63]">
        <Sparkles className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
        <span>Step 1 of 6 • Profile Setup</span>
      </div>

      <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl">
        Create your <span className="text-gradient-premium">Inflixo Creator Page</span>
      </h1>
      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
        Set up your public creator profile details below.
      </p>

      <div className="mt-6 space-y-5">
        {/* 1. Compact Profile Photo Upload Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 transition-all">
          <div className="flex items-center gap-4">
            <PhotoUpload
              value={profile.photoDataUrl}
              onChange={(v) => updateProfile({ photoDataUrl: v })}
              size={64}
              label={profile.photoDataUrl ? "Change Profile Photo" : "Upload Profile Photo"}
            />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-900">Upload Profile Photo</p>
              <p className="text-slate-500">Recommended square JPG or PNG</p>
            </div>
          </div>
        </div>

        {/* 2. Display Name */}
        <Input
          label="Display name"
          name="displayName"
          placeholder="e.g. Tony Stark"
          leftIcon={<User className="h-4 w-4 text-slate-400" />}
          value={profile.displayName}
          onChange={(e) => updateProfile({ displayName: e.target.value })}
          error={errors.displayName}
        />

        {/* 3. Username Handle */}
        <div>
          <Input
            label="Unique handle / username"
            name="username"
            placeholder="username"
            prefix="inflixo.com/"
            leftIcon={<AtSign className="h-4 w-4 text-slate-400" />}
            value={profile.username}
            onChange={(e) => updateProfile({ username: slugifyUsername(e.target.value) })}
            error={errors.username}
            rightSlot={
              checkingUsername ? (
                <span className="flex items-center justify-center rounded-full bg-indigo-50 p-1 text-indigo-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              ) : usernameStatus?.available ? (
                <span className="flex items-center justify-center rounded-full bg-emerald-100 p-1 text-emerald-600">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
              ) : usernameStatus && !usernameStatus.available ? (
                <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Taken
                </span>
              ) : null
            }
          />
          {profile.username && usernameStatus?.available && (
            <p className="mt-1 text-xs text-slate-500">
              Your public handle: <span className="font-bold text-[#803D63]">@{profile.username}</span>
            </p>
          )}
        </div>

        {/* 4. Content Category Selection (Multi-select Up to 3 Categories) */}
        <div id="category" data-field="category">
          <CategorySelect
            value={profile.category}
            customValue={profile.customCategory}
            onChange={(cat, customCat) => {
              updateProfile({ category: cat as any, customCategory: customCat, profession: null });
              setErrors((prev) => ({ ...prev, category: undefined }));
            }}
            error={errors.category}
            max={3}
          />
        </div>

        {/* 5. Dynamic Sub-types Selection (Multi-select Up to 5 Subtypes) */}
        {profile.category && (
          <div id="profession" data-field="profession" className="animate-fade-in">
            <SubtypeMultiSelect
              category={profile.category}
              value={profile.profession || null}
              onChange={(prof) => {
                updateProfile({ profession: prof });
              }}
              max={5}
            />
          </div>
        )}

        {/* 6. Short Bio + Compact Suggest Action */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#803D63]" />
              <span>Short Bio</span>
            </label>

            {/* Flat Lightweight Pill Button for ✨ Suggest Bio */}
            <button
              type="button"
              onClick={handleSuggestBio}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#803D63] hover:text-[#6D3254] bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#803D63]" />
              <span>✨ Suggest bio</span>
            </button>
          </div>

          <Textarea
            name="bio"
            placeholder="Your short bio appears here..."
            rows={3}
            maxLength={160}
            value={profile.bio}
            onChange={(e) => updateProfile({ bio: e.target.value })}
          />

          <div className="flex justify-end text-[11px] text-slate-400 font-medium">
            {profile.bio.length} / 160
          </div>
        </div>

        {/* Form Bottom CTA Button Flow (Inline & Non-overlapping) */}
        <div className="pt-4 border-t border-[#E5E7EB] mt-8">
          <Button
            fullWidth
            size="lg"
            loading={submitting}
            onClick={handleNext}
            className="bg-[#803D63] hover:bg-[#6D3254] text-white font-bold h-12 text-sm rounded-xl cursor-pointer shadow-none"
          >
            Save &amp; Next →
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
