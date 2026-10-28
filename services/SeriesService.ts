import { seriesRepository } from "@/repositories/localRepository";
import { Episode, EpisodePlatform, Season, Series } from "@/types";
import { generateId } from "@/utils/format";

export interface SeriesApiResponse {
  series: Series[];
  plan?: string;
  planKey?: string;
  limits?: {
    series: number;
    episodesPerSeries: number;
    maxTotalEpisodes?: number;
  };
  used?: {
    series: number;
    episodes: number;
  };
}

export const SeriesService = {
  getAllLocal(): Series[] {
    return seriesRepository.getAll();
  },

  async fetchFromDb(): Promise<SeriesApiResponse> {
    const res = await fetch("/api/series", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const message =
        errorJson?.message || errorJson?.error?.message || "Failed to load series";
      throw new Error(message);
    }

    const apiResponse = await res.json();
    const payload = apiResponse.data || apiResponse;
    const seriesList: Series[] = Array.isArray(payload.series) ? payload.series : [];

    seriesRepository.saveAll(seriesList);

    return {
      series: seriesList,
      plan: payload.plan || "Starter",
      planKey: payload.planKey || "starter",
      limits: payload.limits || { series: 3, episodesPerSeries: 5 },
      used: payload.used || {
        series: seriesList.length,
        episodes: seriesList.reduce(
          (acc, s) => acc + (s.seasons?.reduce((a, b) => a + (b.episodes?.length || 0), 0) || 0),
          0
        ),
      },
    };
  },

  getAll(): Series[] {
    return seriesRepository.getAll();
  },

  getById(id: string): Series | undefined {
    return seriesRepository.getAll().find((s) => s.id === id);
  },

  async create(input: {
    title: string;
    posterDataUrl?: string | null;
    description?: string;
    genre?: string;
    language?: string;
    platform?: EpisodePlatform;
    episodes?: Array<{ url: string; title?: string }>;
  }): Promise<{ seriesId: string }> {
    const res = await fetch("/api/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title.trim(),
        posterDataUrl: input.posterDataUrl || null,
        description: input.description || "",
        genre: input.genre || "",
        language: input.language || "Hindi",
        platform: input.platform || "YouTube",
        episodes: input.episodes || [],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 0) {
      const msg = data?.message || data?.error?.message || "Couldn't create series. Please try again.";
      throw new Error(msg);
    }

    const seriesId = data.data?.seriesId || data.seriesId;
    return { seriesId };
  },

  async update(
    id: string,
    patch: {
      title?: string;
      description?: string;
      posterDataUrl?: string | null;
      genre?: string;
      language?: string;
      platform?: EpisodePlatform;
      episodes?: Array<{ number: number; url: string; title?: string }>;
    }
  ): Promise<void> {
    const res = await fetch(`/api/series/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 0) {
      const msg = data?.message || data?.error?.message || "Couldn't save. Please try again.";
      throw new Error(msg);
    }
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/series/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 0) {
      const msg = data?.message || data?.error?.message || "Couldn't delete series. Please try again.";
      throw new Error(msg);
    }
  },

  async reorderSeries(ids: string[]): Promise<void> {
    const res = await fetch("/api/series/order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 0) {
      const msg = data?.message || data?.error?.message || "Couldn't reorder series.";
      throw new Error(msg);
    }
  },

  async bulkAddEpisodes(
    seriesId: string,
    episodes: Array<{ url: string; title?: string }>
  ): Promise<Episode[]> {
    const res = await fetch(`/api/series/${encodeURIComponent(seriesId)}/episodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodes }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 0) {
      const msg = data?.message || data?.error?.message || "Couldn't add episodes. Please try again.";
      throw new Error(msg);
    }

    const inserted = data.data?.episodes || data.episodes || [];
    return inserted.map((ep: any) => ({
      id: ep.id,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      externalUrl: ep.externalUrl || ep.url,
      platform: ep.platform || "YouTube",
      thumbnailDataUrl: null,
      description: "",
    }));
  },

  async updateEpisode(
    episodeId: string,
    patch: { title?: string; url?: string; externalUrl?: string }
  ): Promise<void> {
    const res = await fetch(`/api/episodes/${encodeURIComponent(episodeId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: patch.title,
        url: patch.url || patch.externalUrl,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 0) {
      const msg = data?.message || data?.error?.message || "Couldn't save. Please try again.";
      throw new Error(msg);
    }
  },

  async removeEpisode(episodeId: string): Promise<void> {
    const res = await fetch(`/api/episodes/${encodeURIComponent(episodeId)}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 0) {
      const msg = data?.message || data?.error?.message || "Couldn't delete episode.";
      throw new Error(msg);
    }
  },

  async reorderEpisodes(seriesId: string, ids: string[]): Promise<void> {
    const res = await fetch(
      `/api/series/${encodeURIComponent(seriesId)}/episodes/order`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 0) {
      const msg = data?.message || data?.error?.message || "Couldn't reorder episodes.";
      throw new Error(msg);
    }
  },

  totalEpisodeCount(series: Series): number {
    return series.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0;
  },
};
