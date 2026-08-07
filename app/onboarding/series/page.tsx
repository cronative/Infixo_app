"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, SkipForward, Play, Plus, Trash2, Sparkles, HelpCircle } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeriesService } from "@/services/SeriesService";
import { OnboardingService } from "@/services/OnboardingService";
import { Episode, EpisodePlatform } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { scrollToFirstError } from "@/utils/scroll";
import { useCreator } from "@/contexts/CreatorContext";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { GenreMultiSelect } from "@/components/ui/GenreMultiSelect";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { YoutubeIcon, InstagramIcon, FacebookIcon } from "@/components/shared/BrandIcons";

type Mode = "choice" | "creating" | "skipped";

const PLATFORM_ICONS: Record<EpisodePlatform, React.ReactNode> = {
  YouTube: <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />,
  Instagram: <InstagramIcon className="h-3.5 w-3.5 text-pink-500" />,
  Facebook: <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />,
};

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

  // Episodes (draft list before persisting - simplified to Title, Link, Ep #)
  const [episodes, setEpisodes] = useState<Omit<Episode, "id">[]>([]);
  const [epTitle, setEpTitle] = useState("");
  const [epUrl, setEpUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  function validatePlatformUrl(url: string, platform: EpisodePlatform): { valid: boolean; error?: string } {
    const trimmed = url.trim();
    if (!trimmed) return { valid: false, error: `Please enter a ${platform} video link` };

    const lower = trimmed.toLowerCase();
    if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
      return { valid: false, error: `Link must start with https:// (e.g. https://${platform.toLowerCase()}.com/...)` };
    }

    if (platform === "YouTube") {
      if (!lower.includes("youtube.com") && !lower.includes("youtu.be")) {
        return {
          valid: false,
          error: "Selected platform is YouTube. Please enter a valid YouTube video link!",
        };
      }
    } else if (platform === "Instagram") {
      if (!lower.includes("instagram.com") && !lower.includes("instagr.am")) {
        return {
          valid: false,
          error: "Selected platform is Instagram. Please enter a valid Instagram reel/video link!",
        };
      }
    } else if (platform === "Facebook") {
      if (!lower.includes("facebook.com") && !lower.includes("fb.watch") && !lower.includes("fb.com")) {
        return {
          valid: false,
          error: "Selected platform is Facebook. Please enter a valid Facebook video link!",
        };
      }
    }

    return { valid: true };
  }

  function addEpisode() {
    if (!epTitle.trim()) {
      showToast("Please enter an episode title", "error");
      return;
    }

    const check = validatePlatformUrl(epUrl, seriesPlatform);
    if (!check.valid) {
      setUrlError(check.error || "Invalid link");
      showToast(check.error || "Invalid link for selected platform", "error");
      return;
    }

    const autoEpNum = episodes.length + 1;

    setUrlError("");
    setEpisodes((prev) => [
      ...prev,
      {
        episodeNumber: autoEpNum,
        title: epTitle.trim(),
        thumbnailDataUrl: null,
        platform: seriesPlatform,
        externalUrl: epUrl.trim(),
        description: "",
      },
    ]);
    setEpTitle("");
    setEpUrl("");
  }

  function removeEpisode(index: number) {
    setEpisodes((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSkip() {
    setMode("skipped");
    OnboardingService.setStep("subscription");
    router.push("/onboarding/subscription");
  }

  const [errors, setErrors] = useState<{ title?: string; genre?: string; language?: string }>({});

  function handleSaveAndContinue() {
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
      SeriesService.create({
        title: title.trim(),
        posterDataUrl: poster,
        description: description.trim(),
        genre,
        language,
        episodes: episodes,
      });

      showToast(
        episodes.length > 0
          ? `Series "${title.trim()}" with ${episodes.length} episode(s) saved to DB! 🚀`
          : `Series "${title.trim()}" saved to DB! 🚀`
      );
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

  const { profile, socials, totalAudience, theme } = useCreator();

  const preview = (
    <div className="w-full flex flex-col items-center space-y-4">
      <LivePreviewCard profile={profile} socials={socials} totalAudience={totalAudience} themeKey={theme} />
      {title.trim() && (
        <div className="w-[95%] mx-auto rounded-3xl border border-inflixo-border bg-white p-5 shadow-md">
          <div className="flex gap-3">
            {poster && (
              <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-inflixo-navy shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={poster} alt={title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-bold text-inflixo-navy">{title}</p>
              <p className="text-xs text-muted">{genre || "Genre"} · {language || "Language"}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-inflixo-purple-light px-2.5 py-0.5 text-[10px] font-bold text-inflixo-purple">
                  {PLATFORM_ICONS[seriesPlatform]}
                  {seriesPlatform}
                </span>
                <span className="text-xs font-semibold text-inflixo-purple">
                  {episodes.length} episode{episodes.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {episodes.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-inflixo-border pt-3">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Episodes</p>
              {episodes.map((ep, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2 text-xs font-medium text-inflixo-navy">
                  <span className="truncate">
                    Ep {ep.episodeNumber}: {ep.title}
                  </span>
                  <span className="shrink-0 text-muted text-[11px]">{ep.platform}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <OnboardingLayout
      step="series"
      preview={preview}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-xs font-bold text-inflixo-purple uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-inflixo-purple" />
          Step 4 • Show &amp; OTT Series
        </div>
      </div>

      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-inflixo-navy sm:text-4xl">
        Your content, <span className="text-gradient-premium">your show</span>
      </h1>
      <p className="mt-2 text-[15px] text-muted leading-relaxed">
        Organize your videos into seasons and episodes, OTT-style on your public profile.
      </p>

      {mode === "choice" && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setMode("creating")}
              className="tap-scale group relative flex flex-col items-start gap-4 rounded-3xl border-2 border-inflixo-purple/40 bg-white p-6 text-left shadow-md transition-all hover:-translate-y-1 hover:border-inflixo-purple hover:shadow-xl"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition-transform group-hover:scale-110"
                style={{ backgroundImage: "var(--gradient-premium)" }}
              >
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-inflixo-purple-light px-2.5 py-0.5 text-[10px] font-extrabold text-inflixo-purple mb-1">
                  RECOMMENDED
                </span>
                <p className="text-lg font-black text-inflixo-navy">Create a Series</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Group your YouTube, Instagram, or Facebook videos into seasons &amp; episodes.
                </p>
              </div>
            </button>

            <button
              onClick={handleSkip}
              className="tap-scale flex flex-col items-start gap-4 rounded-3xl border-2 border-inflixo-border bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-inflixo-purple/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-muted">
                <SkipForward className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-surface-muted px-2.5 py-0.5 text-[10px] font-extrabold text-muted mb-1">
                  OPTIONAL
                </span>
                <p className="text-lg font-black text-inflixo-navy">Skip for Now</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  You can create and manage series anytime later from your creator dashboard.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {mode === "creating" && (
        <div className="mt-6 space-y-6">
          {/* Card 1: Series Basic Information */}
          <div className="rounded-3xl border border-inflixo-border bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-sm font-extrabold text-inflixo-navy flex items-center gap-2">
                <Layers className="h-4 w-4 text-inflixo-purple" />
                1. Series Information
              </p>
              <span className="text-[11px] font-bold text-inflixo-purple bg-inflixo-purple-light px-2.5 py-0.5 rounded-full">
                Step 4A
              </span>
            </div>

            {/* Poster + Title & Platform Selector */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="shrink-0">
                <PhotoUpload value={poster} onChange={setPoster} shape="rounded" size={88} label="Series poster" />
              </div>
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
                  <label className="mb-1.5 block text-xs font-bold text-inflixo-navy">
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
                          className={`tap-scale flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${isSelected
                              ? "border-inflixo-purple bg-inflixo-purple text-white shadow-xs"
                              : "border-inflixo-border bg-slate-50 text-inflixo-navy hover:bg-slate-100"
                            }`}
                        >
                          {PLATFORM_ICONS[p]}
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

          {/* Card 2: Episode Manager */}
          <div className="rounded-3xl border border-inflixo-border bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-sm font-extrabold text-inflixo-navy flex items-center gap-2">
                <Play className="h-4 w-4 text-inflixo-purple fill-inflixo-purple" />
                2. Add Episodes
              </p>
              <span className="text-xs font-bold text-inflixo-purple bg-inflixo-purple-light px-2.5 py-0.5 rounded-full">
                {episodes.length} Episode{episodes.length !== 1 ? "s" : ""} Added
              </span>
            </div>

            {/* Added Episodes List */}
            {episodes.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {episodes.map((ep, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-inflixo-navy text-xs font-extrabold text-white">
                        E{ep.episodeNumber}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-inflixo-navy">{ep.title}</p>
                        <p className="truncate text-[10px] text-muted">{ep.externalUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {PLATFORM_ICONS[ep.platform]}
                      <button onClick={() => removeEpisode(i)} className="text-muted hover:text-rose-500 transition-colors p-1" aria-label="Remove episode">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Episode Form Box */}
            <div className="space-y-3.5 rounded-2xl border border-inflixo-purple/20 bg-inflixo-purple-light/20 p-4">
              <div className="flex items-center justify-between border-b border-inflixo-purple/20 pb-2">
                <span className="flex items-center gap-2 text-xs font-extrabold text-inflixo-purple uppercase tracking-wider">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-inflixo-purple text-white text-[11px] font-black">
                    {episodes.length + 1}
                  </span>
                  Adding Episode #{episodes.length + 1}
                </span>
                <span className="text-[11px] font-semibold text-muted">
                  Auto-Numbered
                </span>
              </div>

              <Input
                label={`Episode #${episodes.length + 1} Title`}
                placeholder={episodes.length === 0 ? "e.g. Episode 1: Introduction" : `e.g. Episode ${episodes.length + 1}: Title`}
                value={epTitle}
                onChange={(e) => setEpTitle(e.target.value)}
              />

              <div>
                <Input
                  label={`${seriesPlatform} Video Link / URL`}
                  placeholder={
                    seriesPlatform === "YouTube"
                      ? "https://youtube.com/watch?v=..."
                      : seriesPlatform === "Instagram"
                        ? "https://instagram.com/reel/..."
                        : "https://facebook.com/watch/..."
                  }
                  value={epUrl}
                  onChange={(e) => {
                    setEpUrl(e.target.value);
                    if (urlError) setUrlError("");
                  }}
                  error={urlError}
                />

                {/* How-to-Copy Link Guide Box */}
                <div className="mt-2 rounded-xl border border-purple-200/60 bg-white p-3 text-xs text-inflixo-navy">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-inflixo-purple shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed text-muted">
                      <span className="font-bold text-inflixo-purple">How to copy {seriesPlatform} link: </span>
                      {seriesPlatform === "YouTube" && "Open video on YouTube → Click 'Share' → Click 'Copy Link'."}
                      {seriesPlatform === "Instagram" && "Open Reel on Instagram → Tap 3 dots (...) or Share → Tap 'Copy Link'."}
                      {seriesPlatform === "Facebook" && "Open video on Facebook → Tap 'Share' → Tap 'Copy Link'."}
                    </div>
                  </div>
                </div>
              </div>

              <Button variant="secondary" fullWidth icon={<Plus className="h-4 w-4" />} onClick={addEpisode} type="button">
                + Add Episode
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Form Bottom Actions (Exact Match with Profile/Socials/Themes/Subscription) */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md py-4 border-t border-slate-200/80 mt-8">
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
            <Button fullWidth size="lg" variant="secondary" icon={<SkipForward className="h-4 w-4" />} onClick={handleSkip}>
              Skip for Now →
            </Button>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}


