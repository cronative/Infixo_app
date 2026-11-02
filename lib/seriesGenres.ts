/**
 * Canonical Series Genres configuration
 * Single source of truth for genres, groups, slugs, aliases, and normalization.
 */

export interface GenreItem {
  name: string;
  slug: string;
  aliases: string[];
}

export interface GenreGroup {
  name: string;
  slug: string;
  iconName: string;
  genres: GenreItem[];
}

export const GENRE_GROUPS: GenreGroup[] = [
  {
    name: "Vlogs & Life",
    slug: "vlogs-life",
    iconName: "Video",
    genres: [
      { name: "Daily Vlogs", slug: "daily-vlogs", aliases: ["vlog", "vlogs", "daily", "life", "lifestyle", "routine"] },
      { name: "Day in My Life", slug: "day-in-my-life", aliases: ["diml", "day in the life", "daily", "vlog", "life"] },
      { name: "Family Vlogs", slug: "family-vlogs", aliases: ["family", "parivar", "vlog", "parents", "kids"] },
      { name: "Couple Vlogs", slug: "couple-vlogs", aliases: ["couple", "pyaar", "love", "patni", "pati", "vlog"] },
      { name: "Friends Vlogs", slug: "friends-vlogs", aliases: ["friends", "dosti", "yaar", "vlog", "gang"] },
      { name: "College Life", slug: "college-life", aliases: ["college", "campus", "hostel", "study", "university"] },
      { name: "Hostel Life", slug: "hostel-life", aliases: ["hostel", "roommate", "college", "mess"] },
      { name: "Office Life", slug: "office-life", aliases: ["office", "work", "corporate", "job", "cubicle"] },
      { name: "Village Life", slug: "village-life", aliases: ["village", "gaon", "dehat", "rural", "pind"] },
      { name: "City Life", slug: "city-life", aliases: ["city", "shehar", "urban", "metro"] },
      { name: "Wedding Vlogs", slug: "wedding-vlogs", aliases: ["wedding", "shaadi", "shadi", "vivah", "marriage", "vlog"] },
      { name: "Festival Specials", slug: "festival-specials", aliases: ["festival", "tyohar", "utsav", "diwali", "holi", "eid"] },
      { name: "Shopping Vlogs", slug: "shopping-vlogs", aliases: ["shopping", "haul", "market", "bazaar", "sarojini"] },
      { name: "Moving & New Home", slug: "moving-new-home", aliases: ["home", "shifting", "house", "moving", "griha pravesh"] },
      { name: "Behind the Scenes", slug: "behind-the-scenes", aliases: ["behind the scenes", "bts", "making", "bloopers"] },
    ],
  },
  {
    name: "Travel & Adventure",
    slug: "travel-adventure",
    iconName: "Compass",
    genres: [
      { name: "Travel Vlogs", slug: "travel-vlogs", aliases: ["travel", "trip", "safar", "ghumna", "tour", "vlog"] },
      { name: "Road Trips", slug: "road-trips", aliases: ["road trip", "highway", "drive", "car trip", "ride"] },
      { name: "Moto Vlogging", slug: "moto-vlogging", aliases: ["moto", "motovlog", "bike", "biker", "riding", "rider"] },
      { name: "Adventure & Trekking", slug: "adventure-trekking", aliases: ["adventure", "trek", "trekking", "hiking", "mountains", "pahad"] },
      { name: "Camping", slug: "camping", aliases: ["camping", "camp", "tent", "bonfire"] },
      { name: "Budget Travel", slug: "budget-travel", aliases: ["budget travel", "sasta travel", "cheap travel"] },
      { name: "Luxury Travel", slug: "luxury-travel", aliases: ["luxury travel", "first class", "resort", "5 star"] },
      { name: "Pilgrimage Yatra", slug: "pilgrimage-yatra", aliases: ["pilgrimage", "yatra", "tirth", "bhakti", "darshan", "mandir"] },
    ],
  },
  {
    name: "Food",
    slug: "food",
    iconName: "Utensils",
    genres: [
      { name: "Street Food", slug: "street-food", aliases: ["street food", "chaat", "thela", "street eat", "food", "khana"] },
      { name: "Food Vlogs", slug: "food-vlogs", aliases: ["food vlog", "food", "khana", "foodie", "zaika", "vlog"] },
      { name: "Food Challenges", slug: "food-challenges", aliases: ["food challenge", "challenge", "khana", "spicy challenge"] },
      { name: "Eating Challenges", slug: "eating-challenges", aliases: ["eating challenge", "mukbang", "big eater", "khana"] },
      { name: "Recipes & Cooking", slug: "recipes-cooking", aliases: ["recipes", "cooking", "recipe", "khana", "cook", "rasoi", "dish"] },
      { name: "Food Reviews", slug: "food-reviews", aliases: ["food review", "restaurant review", "taste test", "khana", "food"] },
      { name: "Home Cooking", slug: "home-cooking", aliases: ["home cooking", "ghar ka khana", "khana", "homemade"] },
      { name: "Baking & Desserts", slug: "baking-desserts", aliases: ["baking", "dessert", "cake", "pastry", "meetha", "sweet"] },
    ],
  },
  {
    name: "Challenges & Experiments",
    slug: "challenges-experiments",
    iconName: "Zap",
    genres: [
      { name: "Challenges", slug: "challenges", aliases: ["challenge", "task", "mukabla", "dare"] },
      { name: "24-Hour Challenges", slug: "24-hour-challenges", aliases: ["24 hours", "24hr", "overnight", "challenge"] },
      { name: "Pranks", slug: "pranks", aliases: ["prank", "pranks", "mazak", "masti", "troll"] },
      { name: "Experiments", slug: "experiments", aliases: ["experiment", "experiments", "prayash", "science experiment"] },
      { name: "Social Experiments", slug: "social-experiments", aliases: ["social experiment", "public test", "reaction experiment"] },
      { name: "Survival Challenges", slug: "survival-challenges", aliases: ["survival", "survive", "jungle survival", "alone"] },
      { name: "Budget Challenges", slug: "budget-challenges", aliases: ["budget challenge", "100 rs", "500 rs", "cheap challenge"] },
    ],
  },
  {
    name: "Shows & Formats",
    slug: "shows-formats",
    iconName: "Tv",
    genres: [
      { name: "Reality Show", slug: "reality-show", aliases: ["reality show", "reality"] },
      { name: "Game Show & Quiz", slug: "game-show-quiz", aliases: ["game show", "quiz", "trivia", "kbc", "contest"] },
      { name: "Talk Show & Interviews", slug: "talk-show-interviews", aliases: ["talk show", "interview", "baatchit", "conversation"] },
      { name: "Podcast", slug: "podcast", aliases: ["podcast", "podcasting", "vodcast", "episode", "audio"] },
      { name: "Reactions", slug: "reactions", aliases: ["reactions", "reaction", "react", "reacting"] },
      { name: "Storytime", slug: "storytime", aliases: ["storytime", "kahani", "story", "kissa", "kahaniya"] },
      { name: "Q&A", slug: "q-and-a", aliases: ["q&a", "qna", "questions", "answers", "sawal jawab"] },
      { name: "Roast", slug: "roast", aliases: ["roast", "roasting", "funny roast"] },
      { name: "Debate", slug: "debate", aliases: ["debate", "charcha", "discussion", "argument"] },
    ],
  },
  {
    name: "Comedy",
    slug: "comedy",
    iconName: "Laugh",
    genres: [
      { name: "Comedy Sketches", slug: "comedy-sketches", aliases: ["comedy sketches", "comedy", "sketch", "skits", "hasya", "funny", "jokes", "chutkule"] },
      { name: "Family Comedy", slug: "family-comedy", aliases: ["family comedy", "parivar comedy", "mom dad", "funny", "comedy"] },
      { name: "Desi Comedy", slug: "desi-comedy", aliases: ["desi comedy", "desi", "gaon comedy", "dehati", "funny", "comedy"] },
      { name: "Office Comedy", slug: "office-comedy", aliases: ["office comedy", "boss", "cubicle comedy", "work funny", "comedy"] },
      { name: "School & College Comedy", slug: "school-college-comedy", aliases: ["school comedy", "college comedy", "bunk", "classroom", "comedy"] },
      { name: "Parody & Spoof", slug: "parody-spoof", aliases: ["parody", "spoof", "mimicry", "copy", "comedy"] },
      { name: "Stand-up", slug: "stand-up", aliases: ["stand up", "standup", "open mic", "hasya", "comedy"] },
      { name: "Satire", slug: "satire", aliases: ["satire", "vyang", "political satire", "comedy"] },
      { name: "Dark Comedy", slug: "dark-comedy", aliases: ["dark comedy", "dark humor"] },
      { name: "Romantic Comedy", slug: "romantic-comedy", aliases: ["romantic comedy", "romcom", "pyaar", "love", "comedy"] },
      { name: "Horror Comedy", slug: "horror-comedy", aliases: ["horror comedy", "bhoot comedy", "stree", "comedy"] },
      { name: "Comedy Drama", slug: "comedy-drama", aliases: ["comedy drama", "dramedy", "drama comedy", "drama"] },
    ],
  },
  {
    name: "Bollywood-Style Stories",
    slug: "bollywood-style-stories",
    iconName: "Heart",
    genres: [
      { name: "Love Story", slug: "love-story", aliases: ["love story", "love", "pyaar", "ishq", "mohabbat", "aashiqui"] },
      { name: "Romance", slug: "romance", aliases: ["romance", "romantic", "pyaar", "love", "dil"] },
      { name: "College Romance", slug: "college-romance", aliases: ["college romance", "campus love", "crush", "pyaar", "love"] },
      { name: "Triangle Love Story", slug: "triangle-love-story", aliases: ["triangle love", "love triangle", "teesra", "pyaar", "love"] },
      { name: "Heartbreak & Breakup", slug: "heartbreak-breakup", aliases: ["heartbreak", "breakup", "judai", "sad", "dard", "bewafa"] },
      { name: "Family Drama", slug: "family-drama", aliases: ["family drama", "parivar", "rishtey", "ghar", "drama"] },
      { name: "Social Drama", slug: "social-drama", aliases: ["social drama", "samaj", "issue", "drama"] },
      { name: "Masala Entertainer", slug: "masala-entertainer", aliases: ["masala entertainer", "masala", "entertainer", "bollywood"] },
      { name: "Revenge Drama", slug: "revenge-drama", aliases: ["revenge", "badla", "inteqam", "revenge drama", "drama"] },
      { name: "Friendship & Dosti", slug: "friendship-dosti", aliases: ["friendship", "dosti", "yaari", "friends", "dost"] },
      { name: "Coming of Age", slug: "coming-of-age", aliases: ["coming of age", "growing up", "youth", "jawani"] },
      { name: "Inspirational", slug: "inspirational", aliases: ["inspirational", "inspire", "prerna", "motivational"] },
      { name: "Biopic", slug: "biopic", aliases: ["biopic", "biography", "life story", "jeewani"] },
      { name: "Patriotic", slug: "patriotic", aliases: ["patriotic", "deshbhakti", "watan", "india", "desh"] },
      { name: "Period & Historical", slug: "period-historical", aliases: ["period", "historical", "itihaas", "history", "ancient"] },
      { name: "Mythological", slug: "mythological", aliases: ["mythological", "mythology", "pouranik", "katha", "god", "bhagwan"] },
      { name: "Musical", slug: "musical", aliases: ["musical", "sangeet", "gana", "songs", "music drama"] },
      { name: "Tragedy", slug: "tragedy", aliases: ["tragedy", "dukh", "dard", "sad story", "drama"] },
    ],
  },
  {
    name: "Thriller, Action & More",
    slug: "thriller-action-more",
    iconName: "ShieldAlert",
    genres: [
      { name: "Action", slug: "action", aliases: ["action", "fight", "stunts", "maar dhaad"] },
      { name: "Thriller", slug: "thriller", aliases: ["thriller", "suspense thriller", "thrill"] },
      { name: "Psychological Thriller", slug: "psychological-thriller", aliases: ["psychological thriller", "mind game", "dimaag"] },
      { name: "Suspense", slug: "suspense", aliases: ["suspense", "rahasya", "twist"] },
      { name: "Mystery", slug: "mystery", aliases: ["mystery", "rahasya", "puzzle", "unsolved"] },
      { name: "Detective", slug: "detective", aliases: ["detective", "jasoos", "cid", "investigation"] },
      { name: "Crime", slug: "crime", aliases: ["crime", "gangster", "police", "don", "mafia", "jurm"] },
      { name: "Heist", slug: "heist", aliases: ["heist", "chori", "dacoity", "robbery", "loot"] },
      { name: "Spy", slug: "spy", aliases: ["spy", "jasoos", "secret agent", "raw", "agent"] },
      { name: "Courtroom Drama", slug: "courtroom-drama", aliases: ["courtroom", "court", "vakil", "judge", "kanoon", "insaf", "drama"] },
      { name: "Political Drama", slug: "political-drama", aliases: ["political drama", "politics", "rajneeti", "neta", "drama"] },
      { name: "War", slug: "war", aliases: ["war", "jung", "yuddh", "army", "border"] },
      { name: "Horror", slug: "horror", aliases: ["horror", "bhoot", "darr", "darawna", "chudail", "aatma"] },
      { name: "Supernatural", slug: "supernatural", aliases: ["supernatural", "shakti", "paranormal", "chamatkar"] },
      { name: "Sci-Fi", slug: "sci-fi", aliases: ["sci-fi", "scifi", "science fiction", "space", "future", "alien"] },
      { name: "Fantasy", slug: "fantasy", aliases: ["fantasy", "magic", "jadoo", "kaalpnik"] },
    ],
  },
  {
    name: "Web Series & Films",
    slug: "web-series-films",
    iconName: "Film",
    genres: [
      { name: "Web Series", slug: "web-series", aliases: ["web series", "series", "ott", "episodes"] },
      { name: "Mini Series", slug: "mini-series", aliases: ["mini series", "limited series"] },
      { name: "Short Film", slug: "short-film", aliases: ["short film", "chhoti film", "cinema"] },
      { name: "Micro Drama", slug: "micro-drama", aliases: ["micro drama", "reel drama", "short drama", "drama"] },
      { name: "Animation", slug: "animation", aliases: ["animation", "animated", "anime", "cartoon"] },
      { name: "Documentary", slug: "documentary", aliases: ["documentary", "docu", "real story", "facts"] },
      { name: "Slice of Life", slug: "slice-of-life", aliases: ["slice of life", "real life", "simple life"] },
    ],
  },
  {
    name: "Music & Performance",
    slug: "music-performance",
    iconName: "Music",
    genres: [
      { name: "Music Show & Covers", slug: "music-show-covers", aliases: ["music", "gana", "cover song", "singing", "sangeet", "sur"] },
      { name: "Original Music", slug: "original-music", aliases: ["original music", "original song", "indie", "gana", "track"] },
      { name: "Rap & Hip-Hop", slug: "rap-hip-hop", aliases: ["rap", "hip hop", "desi hip hop", "hiphop", "cypher", "gana"] },
      { name: "Devotional Music", slug: "devotional-music", aliases: ["devotional music", "bhajan", "kirtan", "aarti", "bhakti gana", "sufi", "bhakti", "gana"] },
      { name: "Dance", slug: "dance", aliases: ["dance", "nach", "dancing", "choreography"] },
      { name: "Dance Challenges", slug: "dance-challenges", aliases: ["dance challenge", "hookstep", "dance trend", "dance"] },
      { name: "Magic Show", slug: "magic-show", aliases: ["magic show", "magic", "jadoo", "illusion"] },
      { name: "Street Performance", slug: "street-performance", aliases: ["street performance", "busking", "nukkad"] },
    ],
  },
  {
    name: "Learning",
    slug: "learning",
    iconName: "GraduationCap",
    genres: [
      { name: "Education & Explainers", slug: "education-explainers", aliases: ["education", "explainer", "padhai", "seekho", "knowledge"] },
      { name: "Tech & Gadgets", slug: "tech-gadgets", aliases: ["tech", "gadgets", "mobile", "phone", "technology", "laptop"] },
      { name: "Finance & Business", slug: "finance-business", aliases: ["finance", "business", "money", "paisa", "investing", "stock market"] },
      { name: "Science", slug: "science", aliases: ["science", "vigyan", "physics", "universe"] },
      { name: "History & Mythology", slug: "history-mythology", aliases: ["history", "itihaas", "mythology", "puran", "historical facts"] },
      { name: "Career & Exams", slug: "career-exams", aliases: ["career", "exams", "upsc", "jobs", "preparation"] },
      { name: "Motivation", slug: "motivation", aliases: ["motivation", "josh", "inspire", "prerna", "speech"] },
      { name: "Language Learning", slug: "language-learning", aliases: ["language learning", "english", "bhasha", "learn english"] },
      { name: "Self Improvement", slug: "self-improvement", aliases: ["self improvement", "self help", "habits", "growth"] },
    ],
  },
  {
    name: "Lifestyle & Hobbies",
    slug: "lifestyle-hobbies",
    iconName: "Sparkles",
    genres: [
      { name: "Lifestyle", slug: "lifestyle", aliases: ["lifestyle", "daily routine", "life"] },
      { name: "Fitness & Health", slug: "fitness-health", aliases: ["fitness", "health", "gym", "workout", "kasrat", "exercise"] },
      { name: "Yoga", slug: "yoga", aliases: ["yoga", "pranayam", "meditation", "dhyan"] },
      { name: "Beauty & Makeup", slug: "beauty-makeup", aliases: ["beauty", "makeup", "cosmetics", "makeover"] },
      { name: "Fashion & Styling", slug: "fashion-styling", aliases: ["fashion", "styling", "outfits", "kapde", "style"] },
      { name: "Skincare", slug: "skincare", aliases: ["skincare", "skin", "glow", "dermat"] },
      { name: "DIY & Crafts", slug: "diy-crafts", aliases: ["diy", "crafts", "craft", "handmade", "jugaad"] },
      { name: "Home & Decor", slug: "home-decor", aliases: ["home decor", "interior", "house decor"] },
      { name: "Gardening", slug: "gardening", aliases: ["gardening", "plants", "bagwani", "flowers"] },
      { name: "Pets & Animals", slug: "pets-animals", aliases: ["pets", "animals", "dog", "cat", "janwar"] },
      { name: "Parenting & Kids", slug: "parenting-kids", aliases: ["parenting", "kids", "bachhe", "baby"] },
      { name: "Cars & Bikes", slug: "cars-bikes", aliases: ["cars", "bikes", "gaadi", "motorcycle", "automotive"] },
      { name: "Unboxing & Reviews", slug: "unboxing-reviews", aliases: ["unboxing", "reviews", "product review"] },
      { name: "Art & Drawing", slug: "art-drawing", aliases: ["art", "drawing", "painting", "kala", "sketching"] },
      { name: "Photography", slug: "photography", aliases: ["photography", "photo", "camera", "photoshoot"] },
    ],
  },
  {
    name: "Sports & Gaming",
    slug: "sports-gaming",
    iconName: "Gamepad2",
    genres: [
      { name: "Gaming", slug: "gaming", aliases: ["gaming", "gamer", "games", "gameplay", "stream"] },
      { name: "Mobile Gaming", slug: "mobile-gaming", aliases: ["mobile gaming", "bgmi", "free fire", "pubg"] },
      { name: "Esports", slug: "esports", aliases: ["esports", "competitive gaming", "tournament"] },
      { name: "Sports", slug: "sports", aliases: ["sports", "khel", "athletics"] },
      { name: "Cricket", slug: "cricket", aliases: ["cricket", "ipl", "bat ball", "cricketer", "match"] },
      { name: "Football", slug: "football", aliases: ["football", "soccer", "goal"] },
      { name: "Kabaddi", slug: "kabaddi", aliases: ["kabaddi", "panga", "pro kabaddi"] },
    ],
  },
  {
    name: "Culture & Spiritual",
    slug: "culture-spiritual",
    iconName: "Sun",
    genres: [
      { name: "Devotional & Spiritual", slug: "devotional-spiritual", aliases: ["devotional", "spiritual", "bhakti", "puja", "mandir", "god", "adhyatm"] },
      { name: "Culture & Traditions", slug: "culture-traditions", aliases: ["culture", "traditions", "sanskriti", "parampara", "heritage"] },
      { name: "Festivals & Rituals", slug: "festivals-rituals", aliases: ["festivals", "rituals", "rasam", "puja vidhi", "tyohar"] },
      { name: "Astrology", slug: "astrology", aliases: ["astrology", "jyotish", "rashifal", "horoscope", "kundli"] },
    ],
  },
  {
    name: "Real India",
    slug: "real-india",
    iconName: "Landmark",
    genres: [
      { name: "Village Vlogs", slug: "village-vlogs", aliases: ["village vlogs", "gaon", "dehat", "rural", "pind", "kisan"] },
      { name: "Farming & Agriculture", slug: "farming-agriculture", aliases: ["farming", "agriculture", "kheti", "kisan", "fasal"] },
      { name: "Small Business Stories", slug: "small-business-stories", aliases: ["small business", "dukan", "startup", "vyapar", "karobar"] },
      { name: "Social Awareness", slug: "social-awareness", aliases: ["social awareness", "awareness", "samaj", "madad"] },
      { name: "Real Life Stories", slug: "real-life-stories", aliases: ["real life stories", "sacchi kahani", "real story", "kahani", "struggle"] },
    ],
  },
  {
    name: "Other",
    slug: "other-group",
    iconName: "MoreHorizontal",
    genres: [
      { name: "Other", slug: "other", aliases: ["other", "misc", "miscellaneous"] },
    ],
  },
];

// Flat list of all canonical genre names
export const ALL_SERIES_GENRES: string[] = GENRE_GROUPS.flatMap((group) =>
  group.genres.map((g) => g.name)
);

// Map slug -> canonical name
export const SLUG_TO_GENRE: Record<string, string> = {};
// Map lowercase name -> canonical name
export const LOWER_TO_GENRE: Record<string, string> = {};
// Map name -> slug
export const GENRE_TO_SLUG: Record<string, string> = {};

for (const group of GENRE_GROUPS) {
  for (const g of group.genres) {
    SLUG_TO_GENRE[g.slug] = g.name;
    LOWER_TO_GENRE[g.name.toLowerCase()] = g.name;
    GENRE_TO_SLUG[g.name] = g.slug;
  }
}

/**
 * Migration mappings for legacy / renamed genre values
 */
export const MIGRATION_GENRE_MAP: Record<string, string> = {
  vlogs: "Daily Vlogs",
  travel: "Travel Vlogs",
  food: "Food Vlogs",
  "food & cooking": "Recipes & Cooking",
  "comedy & sketches": "Comedy Sketches",
  comedy: "Comedy Sketches",
  fitness: "Fitness & Health",
  adventure: "Adventure & Trekking",
  "sci-fi": "Sci-Fi",
  education: "Education & Explainers",
  "music & dance": "Music Show & Covers",
  entertainment: "Other",
};

/**
 * Canonicalize a raw genre string:
 * 1. Checks legacy migration map
 * 2. Checks exact case-insensitive match against canonical genres
 * 3. Checks slug match
 * Returns canonical name or null if not valid.
 */
export function canonicalizeGenre(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  // 1. Migration alias map
  if (MIGRATION_GENRE_MAP[lower]) {
    return MIGRATION_GENRE_MAP[lower];
  }

  // 2. Canonical name lookup (case-insensitive)
  if (LOWER_TO_GENRE[lower]) {
    return LOWER_TO_GENRE[lower];
  }

  // 3. Slug lookup
  if (SLUG_TO_GENRE[lower]) {
    return SLUG_TO_GENRE[lower];
  }

  return null;
}

export function isValidGenre(name: string): boolean {
  return Boolean(canonicalizeGenre(name));
}

/**
 * Normalizes a list of genres:
 * - Trims and canonicalizes each
 * - Drops invalid / creator-category values
 * - Deduplicates
 * - Caps at max (default 3)
 */
export function normalizeSeriesGenres(
  genresInput?: string | string[] | null,
  max: number = 3
): string {
  if (!genresInput) return "";

  const items = Array.isArray(genresInput)
    ? genresInput
    : String(genresInput)
        .split(/[,•|/]/)
        .map((s) => s.trim().replace(/^Genre:\s*/i, ""))
        .filter(Boolean);

  const seen = new Set<string>();
  const canonicalList: string[] = [];

  for (const item of items) {
    const canonical = canonicalizeGenre(item);
    if (canonical && !seen.has(canonical.toLowerCase())) {
      seen.add(canonical.toLowerCase());
      canonicalList.push(canonical);
      if (canonicalList.length >= max) break;
    }
  }

  return canonicalList.join(", ");
}

