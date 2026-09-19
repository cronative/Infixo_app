/**
 * AI Creator Bio Generator
 * Generates tailored, punchy, high-converting creator bios under 160 characters
 * based on the creator's name, category/niche, and selected tone.
 */

interface BioGenerationParams {
  name: string;
  categories: string[];
  customCategory?: string;
  attemptIndex?: number; // 0, 1, or 2 (for max 3 uses)
}

interface BioSuggestion {
  id: string;
  tone: "Engaging" | "Personal" | "Professional";
  toneEmoji: string;
  text: string;
}

// Niche-specific keywords, hooks, and emojis
const NICHE_PROFILES: Record<
  string,
  {
    nouns: string[];
    verbs: string[];
    emojis: string[];
    hooks: string[];
  }
> = {
  Technology: {
    nouns: ["tech & gadgets", "future tech", "honest reviews", "gear breakdowns"],
    verbs: ["Exploring", "Reviewing", "Simplifying", "Unboxing"],
    emojis: ["🚀", "💻", "⚡", "📱"],
    hooks: ["upgrading your digital life", "building smarter tomorrow", "tech made simple"],
  },
  Gaming: {
    nouns: ["gameplay", "clutch moments", "gaming stream", "walkthroughs"],
    verbs: ["Streaming", "Dominating", "Leveling up", "Playing"],
    emojis: ["🎮", "👾", "🔥", "🕹️"],
    hooks: ["daily esports & clutch highlights", "squad up for epic sessions", "gaming redefined"],
  },
  Travel: {
    nouns: ["hidden gems", "wanderlust journeys", "backpacking", "world adventures"],
    verbs: ["Chasing", "Documenting", "Exploring", "Uncovering"],
    emojis: ["✈️", "🌍", "🗺️", "🏔️"],
    hooks: ["sunsets & breathtaking destinations", "inspiring your next trip", "collecting memories"],
  },
  Food: {
    nouns: ["flavorful recipes", "street food gems", "culinary experiments", "bites"],
    verbs: ["Cooking", "Tasting", "Serving", "Crafting"],
    emojis: ["🍕", "🍳", "✨", "🍔"],
    hooks: ["easy recipes & tasty food hunts", "for the love of good food", "delicious meals in minutes"],
  },
  Fitness: {
    nouns: ["daily workouts", "sustainable fitness", "nutrition tips", "discipline"],
    verbs: ["Crushing", "Building", "Training", "Inspiring"],
    emojis: ["💪", "🔥", "🏋️", "🥗"],
    hooks: ["crushing fitness goals daily", "mindset, muscle & health", "transforming habits for good"],
  },
  Finance: {
    nouns: ["smart investing", "wealth building", "personal finance", "crypto & stocks"],
    verbs: ["Simplifying", "Decoding", "Demystifying", "Mastering"],
    emojis: ["📈", "💰", "💡", "📊"],
    hooks: ["growing wealth with clear tips", "financial freedom step-by-step", "money made simple"],
  },
  Comedy: {
    nouns: ["relatable laughs", "daily skits", "pure comedy", "funny reels"],
    verbs: ["Serving", "Creating", "Delivering", "Sharing"],
    emojis: ["😂", "🎭", "✨", "🍿"],
    hooks: ["daily laughs & relatable moments", "comedy to brighten your feed", "laughing through life"],
  },
  "Fashion & Glamour": {
    nouns: ["curated looks", "aesthetic fits", "styling inspo", "wardrobe essentials"],
    verbs: ["Curating", "Styling", "Elevating", "Showcasing"],
    emojis: ["✨", "👗", "👠", "🪄"],
    hooks: ["elevating everyday style", "outfit inspo & wardrobe staples", "chic fashion aesthetics"],
  },
  Beauty: {
    nouns: ["skincare rituals", "makeup glow-ups", "beauty secrets", "glam looks"],
    verbs: ["Sharing", "Creating", "Testing", "Perfecting"],
    emojis: ["💄", "✨", "🌸", "🪞"],
    hooks: ["effortless glow & honest beauty reviews", "skincare routines that work", "radiant looks"],
  },
  "Business & Entrepreneurship": {
    nouns: ["startup playbooks", "business insights", "creator growth", "scale tactics"],
    verbs: ["Building", "Scaling", "Sharing", "Decoding"],
    emojis: ["💼", "🚀", "📊", "🏆"],
    hooks: ["lessons from building startups", "actionable tips for founders", "scaling modern businesses"],
  },
  Education: {
    nouns: ["knowledge bites", "exam prep tips", "career guidance", "deep dives"],
    verbs: ["Teaching", "Explaining", "Empowering", "Breaking down"],
    emojis: ["📚", "💡", "🧠", "🎯"],
    hooks: ["learning made simple & engaging", "mastering skills one video at a time", "unlocking potential"],
  },
  Photography: {
    nouns: ["visual stories", "camera perspectives", "cinematic frames", "photo tips"],
    verbs: ["Capturing", "Framing", "Crafting", "Preserving"],
    emojis: ["📸", "🎞️", "✨", "🌆"],
    hooks: ["telling stories through the lens", "cinematic moments & photography tips", "world in high-res"],
  },
  "Music & Singing": {
    nouns: ["acoustic vibes", "original tracks", "covers", "melodic beats"],
    verbs: ["Singing", "Composing", "Creating", "Performing"],
    emojis: ["🎤", "🎵", "🎸", "🎧"],
    hooks: ["music for the soul", "independent tracks & soulful covers", "rhythm, lyrics & emotion"],
  },
  Automobile: {
    nouns: ["car reviews", "exhaust notes", "bike road tests", "auto news"],
    verbs: ["Testing", "Reviewing", "Driving", "Exploring"],
    emojis: ["🚗", "🏎️", "🏍️", "💨"],
    hooks: ["horsepower, road trips & honest drives", "wheels, engines & auto thrills", "for true gearheads"],
  },
  Lifestyle: {
    nouns: ["daily moments", "intentional living", "cozy routines", "lifestyle tips"],
    verbs: ["Documenting", "Sharing", "Living", "Curating"],
    emojis: ["☕", "🌿", "✨", "🏡"],
    hooks: ["embracing life's simple joys", "cozy vibes, routines & balance", "lifestyle & good energy"],
  },
  Vlogging: {
    nouns: ["daily vlogs", "unfiltered journeys", "life adventures", "behind-the-scenes"],
    verbs: ["Capturing", "Sharing", "Living", "Documenting"],
    emojis: ["🎥", "🎬", "✨", "🍿"],
    hooks: ["unfiltered life & daily adventures", "bringing you along for the ride", "real stories every day"],
  },
};

// Fallback profile for general creators
const DEFAULT_NICHE = {
  nouns: ["creative content", "storytelling series", "daily inspiration", "original videos"],
  verbs: ["Creating", "Documenting", "Sharing", "Curating"],
  emojis: ["✨", "🚀", "💡", "🎯"],
  hooks: ["bringing fresh perspective daily", "entertaining & inspiring stories", "join the community"],
};

function cleanName(rawName: string): { fullName: string; firstName: string } {
  const trimmed = rawName.trim();
  if (!trimmed) return { fullName: "Creator", firstName: "Creator" };
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0];
  return { fullName: trimmed, firstName };
}

function resolveNiche(categories: string[], customCategory?: string) {
  if (customCategory && customCategory.trim()) {
    return {
      name: customCategory.trim(),
      profile: DEFAULT_NICHE,
    };
  }

  for (const cat of categories) {
    for (const [key, profile] of Object.entries(NICHE_PROFILES)) {
      if (
        cat.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(cat.toLowerCase())
      ) {
        return { name: key, profile };
      }
    }
  }

  const primary = categories[0] || "Creative Content";
  return { name: primary, profile: DEFAULT_NICHE };
}

function truncateTo160(str: string): string {
  if (str.length <= 160) return str;
  return str.slice(0, 157).trim() + "...";
}

/**
 * Generates 3 unique bio suggestions for the given attempt (0, 1, or 2)
 */
export function generateAiBios({
  name,
  categories,
  customCategory,
  attemptIndex = 0,
}: BioGenerationParams): BioSuggestion[] {
  const { firstName, fullName } = cleanName(name);
  const { name: nicheName, profile } = resolveNiche(categories, customCategory);

  const emoji1 = profile.emojis[attemptIndex % profile.emojis.length] || "✨";
  const emoji2 = profile.emojis[(attemptIndex + 1) % profile.emojis.length] || "🚀";
  const emoji3 = profile.emojis[(attemptIndex + 2) % profile.emojis.length] || "💡";

  // Batch 0: Fresh & Direct
  const batch0: BioSuggestion[] = [
    {
      id: `ai-bio-${attemptIndex}-1`,
      tone: "Engaging",
      toneEmoji: "⚡",
      text: truncateTo160(
        `${profile.verbs[0]} the best of ${nicheName.toLowerCase()} & ${profile.hooks[0]}. Welcome to my corner! ${emoji1}`
      ),
    },
    {
      id: `ai-bio-${attemptIndex}-2`,
      tone: "Personal",
      toneEmoji: "👋",
      text: truncateTo160(
        `Hi, I'm ${firstName}! Creating binge-worthy ${nicheName.toLowerCase()} series & tips. Follow along for the ride ${emoji2}`
      ),
    },
    {
      id: `ai-bio-${attemptIndex}-3`,
      tone: "Professional",
      toneEmoji: "💼",
      text: truncateTo160(
        `${fullName} · ${nicheName} Creator. Helping you with ${profile.nouns[0]}. Open for collabs & brand partnerships ${emoji3}`
      ),
    },
  ];

  // Batch 1: High Energy & Storyteller
  const batch1: BioSuggestion[] = [
    {
      id: `ai-bio-${attemptIndex}-1`,
      tone: "Engaging",
      toneEmoji: "🔥",
      text: truncateTo160(
        `Your daily destination for ${nicheName.toLowerCase()} breakdowns & ${profile.hooks[1]}. Check out my series below 👇 ${emoji1}`
      ),
    },
    {
      id: `ai-bio-${attemptIndex}-2`,
      tone: "Personal",
      toneEmoji: "✨",
      text: truncateTo160(
        `Just ${firstName} doing what I love: ${profile.verbs[1].toLowerCase()} ${profile.nouns[1]} & sharing good energy! ${emoji2}`
      ),
    },
    {
      id: `ai-bio-${attemptIndex}-3`,
      tone: "Professional",
      toneEmoji: "🎯",
      text: truncateTo160(
        `Official link-in-bio of ${fullName}. Empowering creators & fans with ${nicheName.toLowerCase()} insights. Inquire above ${emoji3}`
      ),
    },
  ];

  // Batch 2: Value & Community Driven
  const batch2: BioSuggestion[] = [
    {
      id: `ai-bio-${attemptIndex}-1`,
      tone: "Engaging",
      toneEmoji: "🚀",
      text: truncateTo160(
        `Simplifying ${nicheName.toLowerCase()} for everyone. Binge all my episodes & guides in one place! ${emoji1}`
      ),
    },
    {
      id: `ai-bio-${attemptIndex}-2`,
      tone: "Personal",
      toneEmoji: "🌟",
      text: truncateTo160(
        `Hey, it's ${firstName}! Documenting my ${nicheName.toLowerCase()} journey & connecting with awesome minds. Say hi! ${emoji2}`
      ),
    },
    {
      id: `ai-bio-${attemptIndex}-3`,
      tone: "Professional",
      toneEmoji: "💼",
      text: truncateTo160(
        `${nicheName} Creator & Educator. Creating impactful digital series. Let's work together: check my media kit ${emoji3}`
      ),
    },
  ];

  const batches = [batch0, batch1, batch2];
  return batches[attemptIndex % batches.length];
}
