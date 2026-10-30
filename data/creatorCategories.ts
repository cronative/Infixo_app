/**
 * Master List of Approved Creator Categories for Inflixo Onboarding.
 *
 * Rules:
 * - Identity, profession, or role-based naming (e.g. Vlogger, Actor, Chef, Tech Reviewer).
 * - Avoid generic category names (NO "Food Creator", "Tech Creator", etc.).
 * - Deduplicate by unique category identity across multiple groups.
 */

export interface CategoryGroup {
  id: string;
  name: string;
  items: string[];
}

export const POPULAR_CATEGORIES: string[] = [
  "Vlogger",
  "Podcaster",
  "Comedian",
  "Storyteller",
  "Actor",
  "Filmmaker",
  "Gamer",
  "Singer",
  "Dancer",
  "Educator",
  "Chef",
  "Traveler",
  "Photographer",
  "Tech Reviewer",
  "Fashion Blogger",
];

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "vlogging",
    name: "Group 1 — Vlogging",
    items: [
      "Vlogger",
      "Travel Vlogger",
      "Food Vlogger",
      "Lifestyle Vlogger",
      "Family Vlogger",
      "Daily Vlogger",
      "Motovlogger",
      "Village Vlogger",
    ],
  },
  {
    id: "entertainment",
    name: "Group 2 — Entertainment",
    items: [
      "Comedian",
      "Entertainer",
      "Storyteller",
      "Actor",
      "Mimicry Artist",
      "Prankster",
      "Roaster",
      "Reaction YouTuber",
      "Stand-up Comedian",
    ],
  },
  {
    id: "films-series",
    name: "Group 3 — Films & Series",
    items: [
      "Filmmaker",
      "Director",
      "Screenwriter",
      "Short Filmmaker",
      "Web Series Producer",
      "Animator",
      "Documentary Filmmaker",
    ],
  },
  {
    id: "podcasts-talks",
    name: "Group 4 — Podcasts & Talks",
    items: [
      "Podcaster",
      "Interviewer",
      "Talk Show Host",
      "Host",
      "Public Speaker",
      "Motivational Speaker",
      "Commentator",
    ],
  },
  {
    id: "food",
    name: "Group 5 — Food",
    items: [
      "Chef",
      "Cook",
      "Food Blogger",
      "Food Reviewer",
      "Food Vlogger",
      "Baker",
      "Recipe Developer",
    ],
  },
  {
    id: "travel",
    name: "Group 6 — Travel",
    items: [
      "Traveler",
      "Travel Blogger",
      "Travel Vlogger",
      "Explorer",
      "Adventurer",
      "Travel Guide",
    ],
  },
  {
    id: "education",
    name: "Group 7 — Education",
    items: [
      "Educator",
      "Teacher",
      "Tutor",
      "Trainer",
      "Science Communicator",
      "Historian",
      "Researcher",
    ],
  },
  {
    id: "technology",
    name: "Group 8 — Technology",
    items: [
      "Tech Reviewer",
      "Gadget Reviewer",
      "Programmer",
      "Developer",
      "Tech YouTuber",
      "AI Educator",
    ],
  },
  {
    id: "gaming",
    name: "Group 9 — Gaming",
    items: [
      "Gamer",
      "Streamer",
      "Esports Player",
      "Gaming YouTuber",
      "Game Reviewer",
    ],
  },
  {
    id: "fashion-beauty",
    name: "Group 10 — Fashion & Beauty",
    items: [
      "Fashion Blogger",
      "Fashion Influencer",
      "Stylist",
      "Makeup Artist",
      "Beauty Blogger",
      "Hairstylist",
      "Model",
    ],
  },
  {
    id: "fitness-wellness",
    name: "Group 11 — Fitness & Wellness",
    items: [
      "Fitness Trainer",
      "Gym Trainer",
      "Yoga Instructor",
      "Nutritionist",
      "Wellness Coach",
      "Fitness Influencer",
    ],
  },
  {
    id: "business-finance",
    name: "Group 12 — Business & Finance",
    items: [
      "Entrepreneur",
      "Business Coach",
      "Financial Educator",
      "Investor",
      "Marketing Expert",
      "Business Influencer",
    ],
  },
  {
    id: "music-dance",
    name: "Group 13 — Music & Dance",
    items: [
      "Singer",
      "Musician",
      "Rapper",
      "Music Producer",
      "DJ",
      "Dancer",
      "Choreographer",
      "Beatboxer",
    ],
  },
  {
    id: "art-design",
    name: "Group 14 — Art & Design",
    items: [
      "Artist",
      "Painter",
      "Illustrator",
      "Graphic Designer",
      "Digital Artist",
      "Photographer",
      "Videographer",
      "Video Editor",
      "VFX Artist",
    ],
  },
  {
    id: "sports-automotive",
    name: "Group 15 — Sports & Automotive",
    items: [
      "Athlete",
      "Cricketer",
      "Footballer",
      "Sports Analyst",
      "Sports Commentator",
      "Biker",
      "Motovlogger",
      "Auto Reviewer",
    ],
  },
  {
    id: "news-information",
    name: "Group 16 — News & Information",
    items: [
      "Journalist",
      "Reporter",
      "News Anchor",
      "News Analyst",
      "Reviewer",
      "Critic",
      "Fact Checker",
    ],
  },
  {
    id: "culture-spirituality",
    name: "Group 17 — Culture & Spirituality",
    items: [
      "Spiritual Speaker",
      "Devotional Singer",
      "Astrologer",
      "Religious Storyteller",
      "Cultural Performer",
    ],
  },
  {
    id: "other",
    name: "Group 18 — Other",
    items: [
      "Influencer",
      "Digital Influencer",
      "Content Producer",
      "Other",
    ],
  },
];

/** Deduplicated list of all unique category names across all groups */
export const ALL_UNIQUE_CATEGORIES: string[] = Array.from(
  new Set(CATEGORY_GROUPS.flatMap((group) => group.items))
);

export const TOTAL_CATEGORIES_COUNT: number = ALL_UNIQUE_CATEGORIES.length;
