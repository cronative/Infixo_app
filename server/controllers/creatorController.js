const db = require("../config/db");

// GET /api/creator/profile?creatorId=...
exports.getProfile = async (req, res) => {
  try {
    const creatorId = req.query.creatorId || req.query.id;
    if (!creatorId) {
      return res.status(400).json({ error: "creatorId parameter is required" });
    }

    const [rows] = await db.query(
      `SELECT c.*, s.plan_key, s.plan_name, s.billing_cycle, s.status AS sub_status 
       FROM creators c 
       LEFT JOIN subscriptions s ON c.id = s.creator_id 
       WHERE c.id = ?`,
      [creatorId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Creator not found" });
    }

    const [socials] = await db.query(
      `SELECT platform, account_name, username, follower_count, media_count, audience_count, is_verified, last_synced_at 
       FROM social_accounts WHERE creator_id = ?`,
      [creatorId]
    );

    return res.json({ success: true, creator: rows[0], socials });
  } catch (error) {
    console.error("Get Profile Controller Error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch creator profile" });
  }
};

// PUT /api/creator/profile
exports.updateProfile = async (req, res) => {
  try {
    const { creatorId, displayName, username, photoUrl, category, bio, themeKey, onboardingStep } = req.body;

    if (!creatorId) {
      return res.status(400).json({ error: "creatorId is required" });
    }

    await db.query(
      `UPDATE creators 
       SET display_name = COALESCE(?, display_name),
           username = COALESCE(?, username),
           photo_url = COALESCE(?, photo_url),
           category = COALESCE(?, category),
           bio = COALESCE(?, bio),
           theme_key = COALESCE(?, theme_key),
           onboarding_step = COALESCE(?, onboarding_step)
       WHERE id = ?`,
      [displayName, username, photoUrl, category, bio, themeKey, onboardingStep, creatorId]
    );

    const [updated] = await db.query("SELECT * FROM creators WHERE id = ?", [creatorId]);
    return res.json({ success: true, message: "Profile updated successfully", creator: updated[0] });
  } catch (error) {
    console.error("Update Profile Controller Error:", error);
    return res.status(500).json({ error: error.message || "Failed to update profile" });
  }
};

// POST /api/creator/socials (Upsert Row Entry for Platform)
exports.upsertSocialAccount = async (req, res) => {
  try {
    const { creatorId, platform, accountName, username, followerCount, mediaCount, audienceCount, isVerified } = req.body;

    if (!creatorId || !platform || !username) {
      return res.status(400).json({ error: "creatorId, platform and username are required" });
    }

    await db.query(
      `INSERT INTO social_accounts (
        creator_id, platform, account_name, username, follower_count, media_count, audience_count, is_verified, last_synced_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
        account_name = VALUES(account_name),
        username = VALUES(username),
        follower_count = VALUES(follower_count),
        media_count = VALUES(media_count),
        audience_count = VALUES(audience_count),
        is_verified = VALUES(is_verified),
        last_synced_at = NOW()`,
      [
        creatorId,
        platform.toLowerCase(),
        accountName || username,
        username.replace(/^@/, ""),
        followerCount || 0,
        mediaCount || 0,
        audienceCount || followerCount || 0,
        isVerified ? 1 : 0,
      ]
    );

    const [socials] = await db.query("SELECT * FROM social_accounts WHERE creator_id = ?", [creatorId]);
    return res.json({ success: true, message: `${platform} account saved successfully`, socials });
  } catch (error) {
    console.error("Upsert Social Controller Error:", error);
    return res.status(500).json({ error: error.message || "Failed to save social account" });
  }
};

// GET /api/creators/public/:username (Public Link-in-Bio Endpoint)
exports.getPublicProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const [creators] = await db.query("SELECT * FROM creators WHERE username = ?", [username]);

    if (!creators[0]) {
      return res.status(404).json({ error: "Creator profile not found" });
    }

    const creator = creators[0];

    const [socials] = await db.query(
      "SELECT platform, account_name, username, follower_count, media_count, audience_count, is_verified FROM social_accounts WHERE creator_id = ?",
      [creator.id]
    );

    const [series] = await db.query(
      "SELECT * FROM series WHERE creator_id = ? ORDER BY display_order ASC, created_at DESC",
      [creator.id]
    );

    // Fetch episodes for all series
    for (let s of series) {
      const [episodes] = await db.query(
        "SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number ASC",
        [s.id]
      );
      s.episodes = episodes;
    }

    // Log Analytics View Event
    await db.query(
      "INSERT INTO analytics_events (creator_id, event_type, user_agent, ip_address) VALUES (?, 'profile_view', ?, ?)",
      [creator.id, req.headers["user-agent"] || "", req.ip || ""]
    );

    return res.json({
      success: true,
      creator: {
        id: creator.id,
        displayName: creator.display_name,
        username: creator.username,
        photoUrl: creator.photo_url,
        category: creator.category,
        bio: creator.bio,
        themeKey: creator.theme_key,
        isVerified: Boolean(creator.is_verified),
      },
      socials,
      series,
    });
  } catch (error) {
    console.error("Public Profile Controller Error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch public profile" });
  }
};
