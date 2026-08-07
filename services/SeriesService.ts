import { seriesRepository, authRepository, profileRepository } from "@/repositories/localRepository";
import { Episode, Season, Series } from "@/types";
import { generateId } from "@/utils/format";

function getTargetEmail(): string {
  const profile = profileRepository.get();
  return (
    authRepository.getPendingEmail() ||
    (profile?.username ? `${profile.username}@inflixo.com` : "creator@inflixo.com")
  );
}

export const SeriesService = {
  getAllLocal(): Series[] {
    return seriesRepository.getAll();
  },

  async fetchFromDb(): Promise<Series[]> {
    const email = getTargetEmail();
    if (!email) return seriesRepository.getAll();

    try {
      const res = await fetch(`/api/series?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.series)) {
        seriesRepository.saveAll(data.series);
        return data.series;
      }
    } catch (e) {
      console.warn("Failed to fetch series from MySQL DB:", e);
    }
    return seriesRepository.getAll();
  },

  getAll(): Series[] {
    const email = getTargetEmail();
    const local = seriesRepository.getAll();

    if (email) {
      fetch(`/api/series?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.series)) {
            seriesRepository.saveAll(data.series);
          }
        })
        .catch((e) => console.warn("Failed to fetch series from MySQL DB:", e));
    }

    return local;
  },

  getById(id: string): Series | undefined {
    return seriesRepository.getAll().find((s) => s.id === id);
  },

  async uploadPoster(posterDataUrl: string): Promise<string | null> {
    if (!posterDataUrl || posterDataUrl.startsWith("/uploads/")) return posterDataUrl;
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posterDataUrl, folder: "posters" }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    } catch (e: any) {
      console.error("Failed to upload series poster image file:", e);
    }
    return posterDataUrl;
  },

  async create(input: {
    title: string;
    posterDataUrl: string | null;
    description: string;
    genre: string;
    language: string;
    episodes?: Omit<Episode, "id">[];
  }): Promise<Series> {
    const email = getTargetEmail();
    const newSeriesId = generateId("series");

    let posterUrl = input.posterDataUrl;
    if (posterUrl && posterUrl.startsWith("data:image/")) {
      posterUrl = await this.uploadPoster(posterUrl);
    }
    const seasonsList: Season[] =
      input.episodes && input.episodes.length > 0
        ? [
            {
              id: generateId("season"),
              title: "Season 1",
              seasonNumber: 1,
              episodes: input.episodes.map((ep) => ({ ...ep, id: generateId("ep") })),
            },
          ]
        : [];

    const newSeries: Series = {
      id: newSeriesId,
      title: input.title,
      posterDataUrl: posterUrl,
      description: input.description,
      genre: input.genre,
      language: input.language,
      seasons: seasonsList,
      createdAt: new Date().toISOString(),
    };

    const all = seriesRepository.getAll();
    seriesRepository.saveAll([...all, newSeries]);

    // Save to Live MySQL Database via API
    console.log("🚀 [SeriesService.create] Creating series with email:", email, "and title:", input.title, "posterUrl:", posterUrl);
    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          seriesId: newSeriesId,
          title: input.title,
          posterDataUrl: posterUrl,
          description: input.description,
          genre: input.genre,
          language: input.language,
          episodes: input.episodes || [],
        }),
      });
      const data = await res.json();
      console.log("✅ [SeriesService.create] Response from /api/series:", data);
    } catch (e: any) {
      console.error("❌ [SeriesService.create] Failed to save Series to MySQL DB:", e);
    }

    return newSeries;
  },

  update(id: string, patch: Partial<Series>): void {
    const all = seriesRepository.getAll();
    seriesRepository.saveAll(all.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  },

  async remove(id: string): Promise<void> {
    const all = seriesRepository.getAll();
    seriesRepository.saveAll(all.filter((s) => s.id !== id));

    // Delete from MySQL API
    try {
      await fetch(`/api/series?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (e: any) {
      console.error("Failed to delete Series from MySQL DB:", e);
    }
  },

  addSeason(seriesId: string, input: { title: string; seasonNumber: number }): Season {
    const newSeason: Season = {
      id: generateId("season"),
      title: input.title,
      seasonNumber: input.seasonNumber,
      episodes: [],
    };
    const all = seriesRepository.getAll();
    seriesRepository.saveAll(
      all.map((s) => (s.id === seriesId ? { ...s, seasons: [...s.seasons, newSeason] } : s))
    );
    return newSeason;
  },

  async addEpisode(
    seriesId: string,
    seasonId: string,
    input: Omit<Episode, "id">
  ): Promise<Episode> {
    const email = getTargetEmail();
    const newEpId = generateId("ep");
    const newEpisode: Episode = { ...input, id: newEpId };
    const all = seriesRepository.getAll();
    
    seriesRepository.saveAll(
      all.map((s) =>
        s.id === seriesId
          ? {
              ...s,
              seasons: s.seasons.map((season) =>
                season.id === seasonId
                  ? { ...season, episodes: [...season.episodes, newEpisode] }
                  : season
              ),
            }
          : s
      )
    );

    // Save episode to MySQL DB (isEpisodeOnly prevents series title overwrite)
    try {
      await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          seriesId,
          isEpisodeOnly: true,
          episodes: [{ ...input, id: newEpId }],
        }),
      });
    } catch (e: any) {
      console.error("Failed to add Episode to MySQL DB:", e);
    }

    return newEpisode;
  },

  async removeEpisode(seriesId: string, seasonId: string, episodeId: string): Promise<void> {
    const all = seriesRepository.getAll();
    seriesRepository.saveAll(
      all.map((s) =>
        s.id === seriesId
          ? {
              ...s,
              seasons: s.seasons.map((season) =>
                season.id === seasonId
                  ? { ...season, episodes: season.episodes.filter((e) => e.id !== episodeId) }
                  : season
              ),
            }
          : s
      )
    );

    // Delete episode from MySQL DB
    try {
      await fetch(`/api/series?episodeId=${encodeURIComponent(episodeId)}`, {
        method: "DELETE",
      });
    } catch (e: any) {
      console.error("Failed to delete Episode from MySQL DB:", e);
    }
  },

  async updateEpisode(
    seriesId: string,
    seasonId: string,
    episodeId: string,
    patch: Partial<Episode>
  ): Promise<void> {
    const all = seriesRepository.getAll();
    seriesRepository.saveAll(
      all.map((s) =>
        s.id === seriesId
          ? {
              ...s,
              seasons: s.seasons.map((season) =>
                season.id === seasonId
                  ? {
                      ...season,
                      episodes: season.episodes.map((e) =>
                        e.id === episodeId ? { ...e, ...patch } : e
                      ),
                    }
                  : season
              ),
            }
          : s
      )
    );

    // Update episode in MySQL DB
    try {
      await fetch("/api/series", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId,
          seriesId,
          episodeNumber: patch.episodeNumber,
          title: patch.title,
          externalUrl: patch.externalUrl,
          platform: patch.platform,
        }),
      });
    } catch (e: any) {
      console.error("Failed to update Episode in MySQL DB:", e);
    }
  },

  totalEpisodeCount(series: Series): number {
    return series.seasons.reduce((acc, s) => acc + s.episodes.length, 0);
  },
};
