"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layers, SkipForward, Sparkles, Film, ArrowRight, Globe } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { SeriesCoverUpload } from "@/components/series/SeriesCoverUpload";
import { SeriesService } from "@/services/SeriesService";
import { OnboardingService } from "@/services/OnboardingService";
import { EpisodePlatform } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { scrollToFirstError } from "@/utils/scroll";
import { GenreMultiSelect } from "@/components/ui/GenreMultiSelect";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { YoutubeIcon, InstagramIcon, FacebookIcon } from "@/components/shared/BrandIcons";

export default function SeriesStepPage() {
  const router = useRouter();

  useEffect(() => {
    OnboardingService.setStep("subscription");
    router.replace("/onboarding/subscription");
  }, [router]);
  const { showToast } = useToast();
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
    OnboardingService.setStep("subscription");
    router.push("/onboarding/subscription");
  }

  async function handleSaveAndContinue() {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "Series title is required";
    if (!genre.trim()) newErrors.genre = "Select at least 1 genre for your series";
    if (!language.trim()) newErrors.language = "Select language";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please fill the required fields to create your series", "error");
      scrollToFirstError(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await SeriesService.create({
        title: title.trim(),
        posterDataUrl: poster,
        description: description.trim(),
        genre: genre || "Entertainment",
        language: language || "English",
      });

      showToast("Series created! Next: Upgrade to Pro or Finish 🚀");
      OnboardingService.setStep("subscription");
      router.push("/onboarding/subscription");
    } catch (err: any) {
      console.error("Failed to create series:", err);
      showToast("Couldn't save series. Try again!", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingLayout step="series">

      <h1 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-[#181716]">
        Your content, your show
      </h1>
      <p className="mt-1 text-xs text-[#54514D] leading-relaxed">
        Organize your social videos into seasons and episodes, OTT-style on your public profile.
      </p>

      {/* CREATE SERIES FORM UI (DEFAULT OPEN) */}
      <div className="mt-4 space-y-3.5 text-left">
        {/* Card 1: Series Information */}
        <div className="rounded-xl border border-[#E7E3DC] bg-white p-3.5 sm:p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#E7E3DC] pb-2">
            <p className="text-xs sm:text-sm font-bold text-[#181716] flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-[#151933]" />
              Series Information
            </p>
          </div>

          {/* Full-Width 16:9 Landscape Series Cover */}
          <SeriesCoverUpload
            value={poster}
            onChange={setPoster}
            maxSizeMB={5}
            label="Series Cover"
          />

          <div className="w-full space-y-2.5" id="title">
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
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#54514D]">
                Social Platform for Series
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(["YouTube", "Instagram", "Facebook", "Other"] as EpisodePlatform[]).map((p) => {
                  const isSelected = seriesPlatform === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSeriesPlatform(p)}
                      className={`tap-scale flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${isSelected
                        ? "border-[#151933] bg-[#151933]/[0.08] text-[#151933] font-bold"
                        : "border-[#E7E3DC] bg-white text-[#54514D] hover:bg-surface-soft"
                        }`}
                    >
                      {p === "YouTube" && <YoutubeIcon className={`h-3.5 w-3.5 ${isSelected ? "text-[#151933]" : "text-red-500"}`} />}
                      {p === "Instagram" && <InstagramIcon className={`h-3.5 w-3.5 ${isSelected ? "text-[#151933]" : "text-pink-500"}`} />}
                      {p === "Facebook" && <FacebookIcon className={`h-3.5 w-3.5 ${isSelected ? "text-[#151933]" : "text-blue-600"}`} />}
                      {p === "Other" && <Globe className={`h-3.5 w-3.5 ${isSelected ? "text-[#151933]" : "text-[#797570]"}`} />}
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Vertical Stack for Genre Chips & Language Select */}
          <div className="space-y-3">
            <div id="genre" data-field="genre">
              <GenreMultiSelect
                value={genre}
                onChange={(g) => {
                  setGenre(g);
                  if (errors.genre) setErrors((p) => ({ ...p, genre: undefined }));
                }}
                max={5}
              />
              {errors.genre && <p className="mt-1 text-xs font-bold text-rose-500">{errors.genre}</p>}
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
            placeholder="Tell your viewers what this series is about..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Informational Box */}
        <div className="rounded-xl border border-[#E7E3DC] bg-white p-3 text-xs text-[#54514D] flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#151933] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Episodes can be added anytime from your <strong className="text-[#181716]">Creator Dashboard</strong>. Free Trial supports up to 3 series and 15 total episode links.
          </p>
        </div>
      </div>

      {/* Step 4 Form Bottom Navigation (Natural flow, Back + Skip + Next) */}
      <div className="pt-3.5 border-t border-[#E7E3DC] mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-10 rounded-xl border-[#E7E3DC] text-[#181716] hover:bg-surface-soft font-semibold text-xs sm:text-sm px-5"
            onClick={() => router.push("/onboarding/themes")}
          >
            Back
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full sm:w-auto h-10 px-3.5 rounded-xl text-xs font-semibold text-[#797570] hover:text-foreground hover:bg-surface-soft transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <SkipForward className="h-3 w-3" />
            <span>Skip for Now</span>
          </button>
        </div>

        <Button
          type="button"
          size="lg"
          loading={submitting}
          onClick={handleSaveAndContinue}
          className="w-full sm:flex-1 sm:max-w-xs h-10 bg-[#151933] hover:bg-brand-hover text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs"
        >
          Save &amp; Next →
        </Button>
      </div>
    </OnboardingLayout>
  );
}
