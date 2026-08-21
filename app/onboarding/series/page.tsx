"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, SkipForward, Sparkles, Film, Play, ArrowRight } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { SeriesService } from "@/services/SeriesService";
import { OnboardingService } from "@/services/OnboardingService";
import { EpisodePlatform, Series } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { scrollToFirstError } from "@/utils/scroll";
import { useCreator } from "@/contexts/CreatorContext";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { GenreMultiSelect } from "@/components/ui/GenreMultiSelect";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { YoutubeIcon, InstagramIcon, FacebookIcon } from "@/components/shared/BrandIcons";

type Mode = "choice" | "creating" | "skipped";

export default function SeriesStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>("choice");
  const [submitting, setSubmitting] = useState(false);

  // Series-level fields
  const [title, setTitle] = useState("");
  const [poster, setPoster] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [seriesPlatform, setSeriesPlatform] = useState<EpisodePlatform>("YouTube");

  const [errors, setErrors] = useState<{ title?: string; genre?: string; language?: string }>({});

  function handleSkip() {
    setMode("skipped");
    OnboardingService.setStep("subscription");
    router.push("/onboarding/subscription");
  }

  async function handleSaveAndContinue() {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "Series title is required";
    if (!genre.trim()) newErrors.genre = "Select at least 1 genre for your series";
    if (!language.trim()) newErrors.language = "Select a series language";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please fill in all required fields highlighted below 💡", "error");
      scrollToFirstError(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await SeriesService.create({
        title: title.trim(),
        posterDataUrl: poster,
        description: description.trim(),
        genre,
        language,
      });

      showToast(`Series "${title.trim()}" created successfully! 🚀`);
      OnboardingService.setStep("subscription");
      setTimeout(() => {
        setSubmitting(false);
        router.push("/onboarding/subscription");
      }, 120);
    } catch (err) {
      console.error("Failed to save series:", err);
      showToast("Oops, couldn't save series details. Let's try again! 💡", "error");
      setSubmitting(false);
    }
  }

  const { profile, socials, totalAudience, theme, series } = useCreator();

  // Create active draft series array for live phone preview sync
  const draftSeries: Series[] = title.trim() || poster
    ? [
        {
          id: "draft-1",
          title: title.trim() || "My New Series",
          posterDataUrl: poster,
          description: description.trim() || "Series description preview",
          genre: genre || "Entertainment",
          language: language || "English",
          seasons: [],
          createdAt: new Date().toISOString(),
        },
      ]
    : series || [];

  const preview = (
    <LivePreviewCard
      profile={profile}
      socials={socials}
      totalAudience={totalAudience}
      themeKey={theme}
      series={draftSeries}
    />
  );

  return (
    <OnboardingLayout step="series" preview={preview}>
      <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-[#803D63]">
        <Sparkles className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
        <span>Step 4 of 6 • Series &amp; Episodes</span>
      </div>

      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-inflixo-navy sm:text-4xl">
        Your content, <span className="text-gradient-premium">your show</span>
      </h1>
      <p className="mt-2 text-[15px] text-muted leading-relaxed">
        Organize your social videos into seasons and episodes, OTT-style on your public profile.
      </p>

      {mode === "choice" && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setMode("creating")}
              className="tap-scale group relative flex flex-col items-start gap-4 rounded-3xl border-2 border-[#803D63] bg-indigo-50/20 p-6 text-left shadow-md transition-all hover:-translate-y-1 hover:border-[#803D63] hover:shadow-xl cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-[#803D63] shadow-xs group-hover:scale-105 transition-transform">
                <Film className="h-6 w-6 text-[#803D63]" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-extrabold text-[#803D63] mb-1">
                  RECOMMENDED
                </span>
                <p className="text-lg font-black text-slate-900">Create a Series</p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Set up your series title, genres &amp; poster. You can add episodes anytime from your dashboard.
                </p>
              </div>
            </button>

            <button
              onClick={handleSkip}
              className="tap-scale flex flex-col items-start gap-4 rounded-3xl border-2 border-slate-200 bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-slate-300 cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <SkipForward className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-500 mb-1">
                  OPTIONAL
                </span>
                <p className="text-lg font-black text-slate-900">Skip for Now</p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  You can create and manage series anytime later from your creator dashboard.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {mode === "creating" && (
        <div className="mt-6 space-y-6">
          {/* Card 1: Series Information */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Film className="h-4 w-4 text-[#803D63]" />
                Series Information
              </p>
              <span className="text-[11px] font-bold text-[#803D63] bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Step 4
              </span>
            </div>

            {/* Poster + Title & Platform Selector */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <PhotoUpload value={poster} onChange={setPoster} shape="landscape" label="Upload Series Landscape Poster" />
              <div className="w-full space-y-3" id="title">
                <Input
                  label="Series title"
                  placeholder="e.g. Kashmir Diaries or Tech Unboxed"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                  }}
                  error={errors.title}
                />

                {/* Platform Selector Pills */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-900">
                    Social Platform for Series
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["YouTube", "Instagram", "Facebook"] as EpisodePlatform[]).map((p) => {
                      const isSelected = seriesPlatform === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSeriesPlatform(p)}
                          className={`tap-scale flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#803D63] bg-[#803D63] text-white shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {p === "YouTube" && <YoutubeIcon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-red-500"}`} />}
                          {p === "Instagram" && <InstagramIcon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-pink-500"}`} />}
                          {p === "Facebook" && <FacebookIcon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-blue-600"}`} />}
                          <span>{p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Stack for Genre Chips & Language Select */}
            <div className="space-y-4">
              <div id="genre" data-field="genre">
                <GenreMultiSelect
                  value={genre}
                  onChange={(g) => {
                    setGenre(g);
                    if (errors.genre) setErrors((p) => ({ ...p, genre: undefined }));
                  }}
                  max={5}
                />
                {errors.genre && <p className="mt-1.5 text-xs font-bold text-rose-500">{errors.genre}</p>}
              </div>

              <div id="language" data-field="language">
                <LanguageSelect
                  value={language}
                  onChange={(l) => {
                    setLanguage(l);
                    if (errors.language) setErrors((p) => ({ ...p, language: undefined }));
                  }}
                  error={errors.language}
                />
              </div>
            </div>

            <Textarea
              label="Short description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this series or show about?"
            />
          </div>

          {/* Bottom Early Access Note */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-left flex items-start gap-3 text-xs font-semibold text-indigo-950 shadow-2xs">
            <Sparkles className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
            <div>
              <strong>Note:</strong> Episodes can be added anytime from your <strong>Creator Dashboard</strong>. Early Access allows up to 3 Series &amp; 5 Episodes per Series.
            </div>
          </div>
        </div>
      )}

      {/* Sticky Form Bottom Actions */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md py-3.5 border-t border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-8">
        {mode === "creating" ? (
          <div className="flex items-center gap-3 w-full">
            <Button variant="outline" size="lg" onClick={() => setMode("choice")}>
              Back
            </Button>
            <Button fullWidth size="lg" loading={submitting} onClick={handleSaveAndContinue}>
              Save &amp; Next →
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full">
            <Button variant="outline" size="lg" onClick={() => router.push("/onboarding/themes")}>
              Back
            </Button>
            <Button fullWidth size="lg" onClick={() => setMode("creating")} icon={<ArrowRight className="h-4 w-4" />}>
              Continue to Series Setup →
            </Button>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}

