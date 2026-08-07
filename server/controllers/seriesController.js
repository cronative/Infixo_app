const db = require("../config/db");

// GET /api/series?creatorId=...
exports.getSeries = async (req, res) => {
  try {
    const creatorId = req.query.creatorId;
    if (!creatorId) {
      return res.status(400).json({ error: "creatorId is required" });
    }

    const [seriesList] = await db.query(
      "SELECT * FROM series WHERE creator_id = ? ORDER BY display_order ASC, created_at DESC",
      [creatorId]
    );

    for (let s of seriesList) {
      const [episodes] = await db.query(
        "SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number ASC",
        [s.id]
      );
      s.episodes = episodes;
    }

    return res.json({ success: true, series: seriesList });
  } catch (error) {
    console.error("Get Series Controller Error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch series" });
  }
};

// POST /api/series
exports.createSeries = async (req, res) => {
  try {
    const { creatorId, title, posterUrl, description, platform, genres, language } = req.body;

    if (!creatorId || !title) {
      return res.status(400).json({ error: "creatorId and title are required" });
    }

    const seriesId = `ser_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const genreStr = Array.isArray(genres) ? genres.slice(0, 5).join(", ") : (genres || "");

    await db.query(
      `INSERT INTO series (id, creator_id, title, poster_url, description, platform, genres, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [seriesId, creatorId, title, posterUrl || "", description || "", platform || "YouTube", genreStr, language || "Hindi"]
    );

    const [created] = await db.query("SELECT * FROM series WHERE id = ?", [seriesId]);
    created[0].episodes = [];

    return res.json({ success: true, message: "Series created successfully", series: created[0] });
  } catch (error) {
    console.error("Create Series Controller Error:", error);
    return res.status(500).json({ error: error.message || "Failed to create series" });
  }
};

// DELETE /api/series/:id
exports.deleteSeries = async (req, res) => {
  try {
    const seriesId = req.params.id;
    await db.query("DELETE FROM series WHERE id = ?", [seriesId]);
    return res.json({ success: true, message: "Series deleted successfully" });
  } catch (error) {
    console.error("Delete Series Controller Error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete series" });
  }
};

// POST /api/series/:seriesId/episodes
exports.addEpisode = async (req, res) => {
  try {
    const seriesId = req.params.seriesId;
    const { episodeNumber, title, externalUrl, platform } = req.body;

    if (!seriesId || !title || !externalUrl) {
      return res.status(400).json({ error: "seriesId, title, and externalUrl are required" });
    }

    const episodeId = `ep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.query(
      `INSERT INTO episodes (id, series_id, episode_number, title, external_url, platform)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [episodeId, seriesId, Number(episodeNumber) || 1, title, externalUrl, platform || "YouTube"]
    );

    const [episodes] = await db.query("SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number ASC", [seriesId]);
    return res.json({ success: true, message: "Episode added successfully", episodes });
  } catch (error) {
    console.error("Add Episode Controller Error:", error);
    return res.status(500).json({ error: error.message || "Failed to add episode" });
  }
};

// DELETE /api/episodes/:id
exports.deleteEpisode = async (req, res) => {
  try {
    const episodeId = req.params.id;
    await db.query("DELETE FROM episodes WHERE id = ?", [episodeId]);
    return res.json({ success: true, message: "Episode deleted successfully" });
  } catch (error) {
    console.error("Delete Episode Controller Error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete episode" });
  }
};
