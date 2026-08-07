"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, AtSign, Check } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { PlatformCard } from "@/components/socials/PlatformCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreator } from "@/contexts/CreatorContext";
import { OnboardingService } from "@/services/OnboardingService";
import { SocialService } from "@/services/SocialService";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { InstagramFetcher } from "@/components/socials/InstagramFetcher";
import { YoutubeFetcher } from "@/components/socials/YoutubeFetcher";
import { FacebookFetcher } from "@/components/socials/FacebookFetcher";

import { useToast } from "@/contexts/ToastContext";

function extractUsername(url: string): string {
  if (!url) return "";
  const cleaned = url.trim();
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return last.replace(/^@/, "");
  }
  return cleaned.replace(/^@/, "");
}

export default function SocialsStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, socials, totalAudience, updateSocials, theme } = useCreator();
  const [submitting, setSubmitting] = useState(false);

  async function handleNext() {
    setSubmitting(true);
    try {
      SocialService.saveAccounts(socials);
      showToast("Social handles linked! Now let's pick your theme 👑");
    } catch (e) {
      console.warn("Failed to persist socials on Next click:", e);
    }
    OnboardingService.setStep("theme");
    setTimeout(() => {
      setSubmitting(false);
      router.push("/onboarding/themes");
    }, 120);
  }

  const [instaInput, setInstaInput] = useState(() => extractUsername(socials.instagram.url));
  const [ytInput, setYtInput] = useState(() => extractUsername(socials.youtube.url));
  const [fbInput, setFbInput] = useState(() => extractUsername(socials.facebook.url));

  const isInstaConfirmed = Boolean(
    socials.instagram.url && extractUsername(socials.instagram.url).toLowerCase() === instaInput.toLowerCase()
  );
  const isYtConfirmed = Boolean(
    socials.youtube.url && extractUsername(socials.youtube.url).toLowerCase() === ytInput.toLowerCase()
  );
  const isFbConfirmed = Boolean(
    socials.facebook.url && extractUsername(socials.facebook.url).toLowerCase() === fbInput.toLowerCase()
  );

  return (
    <OnboardingLayout
      step="socials"
      preview={<LivePreviewCard profile={profile} socials={socials} totalAudience={totalAudience} themeKey={theme} />}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-inflixo-purple uppercase tracking-wider mb-1">
        <Sparkles className="h-3.5 w-3.5" />
        Step 2 • Social Handles
      </div>

      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-inflixo-navy sm:text-4xl">
        Add your <span className="text-gradient-premium">social handles</span>
      </h1>
      <p className="mt-2 text-[15px] text-muted leading-relaxed">
        Enter your username or handle for each platform to link them on your public Inflixo page.
      </p>

      {/* Social Platforms Username Form */}
      <div className="mt-6 space-y-5">
        <PlatformCard icon={<InstagramIcon className="h-5 w-5 text-white" />} accentClass="bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400" name="Instagram">
          <Input
            label="Instagram Username"
            placeholder="username"
            prefix="instagram.com/"
            leftIcon={<AtSign className="h-4 w-4 text-pink-500" />}
            value={instaInput}
            onChange={(e) => setInstaInput(e.target.value.trim().replace(/^@/, ""))}
          />
          <InstagramFetcher username={instaInput} />
        </PlatformCard>

        <PlatformCard icon={<YoutubeIcon className="h-5 w-5 text-white" />} accentClass="bg-red-500" name="YouTube Channel">
          <Input
            label="YouTube Channel Handle"
            placeholder="channelname"
            prefix="youtube.com/@"
            leftIcon={<AtSign className="h-4 w-4 text-red-500" />}
            value={ytInput}
            onChange={(e) => setYtInput(e.target.value.trim().replace(/^@/, ""))}
          />
          <YoutubeFetcher handle={ytInput} />
        </PlatformCard>

        <PlatformCard icon={<FacebookIcon className="h-5 w-5 text-white" />} accentClass="bg-blue-600" name="Facebook Page">
          <Input
            label="Facebook Page Username"
            placeholder="pagename"
            prefix="facebook.com/"
            leftIcon={<AtSign className="h-4 w-4 text-blue-600" />}
            value={fbInput}
            onChange={(e) => setFbInput(e.target.value.trim().replace(/^@/, ""))}
          />
          <FacebookFetcher username={fbInput} />
        </PlatformCard>

        {/* Step 2 Sticky Form Bottom Navigation (Back + Next) */}
        <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md py-4 border-t border-slate-200/80 mt-8 flex items-center gap-3">
          <Button variant="outline" size="lg" onClick={() => router.push("/onboarding/profile")}>
            Back
          </Button>
          <Button fullWidth size="lg" loading={submitting} onClick={handleNext}>
            Save &amp; Next →
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
