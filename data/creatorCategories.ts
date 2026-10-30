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
    name: "Vlogging",
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
    name: "Entertainment",
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
    name: "Films & Series",
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
    name: "Podcasts & Talks",
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
    name: "Food",
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
    name: "Travel",
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
    name: "Education",
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
    name: "Technology",
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
    name: "Gaming",
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
    name: "Fashion & Beauty",
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
    name: "Fitness & Wellness",
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
    name: "Business & Finance",
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
    name: "Music & Dance",
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
    name: "Art & Design",
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
    name: "Sports & Automotive",
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
    name: "News & Information",
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
    name: "Culture & Spirituality",
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
    name: "Other",
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
