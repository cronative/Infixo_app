import { db } from "@/lib/db";
import { ensureTeamTables } from "@/lib/teamDb";
import { saveBase64ImageToStorage } from "@/lib/imageStorage";
import { requireCreator } from "@/lib/creatorAuth";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { sanitizeUrl } from "@/lib/urlSanitizer";

async function resolveCreatorId(lookupVal: string): Promise<{ id: string; email: string } | null> {
  if (!lookupVal) return null;
  try {
    const [rows]: any = await db.query(
      "SELECT id, email FROM creators WHERE id = ? OR email = ? OR username = ? LIMIT 1",
      [lookupVal, lookupVal, lookupVal]
    );
    if (rows && rows.length > 0) {
      return { id: rows[0].id, email: rows[0].email };
    }
  } catch {}
  return null;
}

function cleanInflixoHandle(raw?: string | null): string | null {
  if (!raw) return null;
  let clean = String(raw).trim();
  clean = clean.replace(/^https?:\/\//i, "");
  clean = clean.replace(/^(www\.)?inflixo\.com\//i, "");
  clean = clean.replace(/^[@/]+/, "");
  clean = clean.split(/[/?#]/)[0].trim();
  return clean ? clean.slice(0, 100) : null;
}

// GET /api/creator/team?creatorId=... or ?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email") || searchParams.get("username");

    if (!lookupVal) {
      return apiSuccess({ team: null, members: [] }, "Team retrieved successfully");
    }

    await ensureTeamTables();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;
    const accessError = await authorizeCreatorRead(req, targetId, Boolean(searchParams.get("username")));
    if (accessError) return accessError;

    const [teamRows]: any = await db.query(
      `SELECT id, creator_id AS creatorId, team_name AS teamName, team_logo_url AS teamLogoUrl, team_description AS teamDescription, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
       FROM creator_teams
       WHERE creator_id = ? LIMIT 1`,
      [targetId]
    );

    if (!teamRows || teamRows.length === 0) {
      return apiSuccess({ team: null, members: [] }, "Team retrieved successfully");
    }

    const team = teamRows[0];

    const [memberRows]: any = await db.query(
      `SELECT id, team_id AS teamId, creator_id AS creatorId, name, role, member_group AS memberGroup, one_liner AS oneLiner, inflixo_username AS inflixoUsername, avatar_url AS avatarUrl, instagram_url AS instagramUrl, youtube_url AS youtubeUrl, facebook_url AS facebookUrl, sort_order AS sortOrder, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
       FROM team_members
       WHERE team_id = ? AND creator_id = ?
       ORDER BY sort_order ASC, created_at ASC`,
      [team.id, targetId]
    );

    const members = (memberRows || []).map((m: any) => ({
      id: m.id,
      teamId: m.teamId,
      creatorId: m.creatorId,
      name: m.name,
      role: m.role,
      group: m.memberGroup === "On camera" ? "On camera" : "Behind the camera",
      oneLiner: m.oneLiner ? String(m.oneLiner) : null,
      inflixoUsername: cleanInflixoHandle(m.inflixoUsername),
      avatarUrl: m.avatarUrl || null,
      instagramUrl: sanitizeUrl(m.instagramUrl, { allowEmpty: true }) || "",
      youtubeUrl: sanitizeUrl(m.youtubeUrl, { allowEmpty: true }) || "",
      facebookUrl: sanitizeUrl(m.facebookUrl, { allowEmpty: true }) || "",
      sortOrder: Number(m.sortOrder || 0),
      isActive: Boolean(m.isActive),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    const fullTeam = {
      id: team.id,
      creatorId: team.creatorId,
      teamName: team.teamName || "The Crew",
      teamLogoUrl: team.teamLogoUrl || null,
      teamDescription: team.teamDescription ? String(team.teamDescription) : null,
      isActive: Boolean(team.isActive),
      members,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };

    return apiSuccess({ team: fullTeam, members }, "Team retrieved successfully");
  } catch (err: any) {
    console.error("GET team error:", err);
    return apiError(err.message || "Failed to fetch team", 500);
  }
}

// POST /api/creator/team (Create or Update Team & Members)
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const body = await req.json();
    const { action, teamName, teamLogoUrl, teamDescription, isActive, member, members } = body;

    await ensureTeamTables();

    const targetId = auth.creator.id;

    // 1. Action: create or update team base info
    if (action === "save_team" || (!action && teamName !== undefined)) {
      const resolvedTeamName = (teamName ? String(teamName).trim() : "") || "The Crew";
      const resolvedTeamDescription =
        typeof teamDescription === "string" && teamDescription.trim()
          ? teamDescription.trim()
          : null;

      const finalTeamLogoUrl =
        (await saveBase64ImageToStorage(teamLogoUrl, "team", "team_logo")) ||
        (teamLogoUrl && !teamLogoUrl.startsWith("data:") ? teamLogoUrl : null);

      const [existingTeamRows]: any = await db.query(
        "SELECT id FROM creator_teams WHERE creator_id = ? LIMIT 1",
        [targetId]
      );
      const teamId = existingTeamRows?.[0]?.id || body.id || `team_${Date.now()}`;

      await db.query(
        `INSERT INTO creator_teams (id, creator_id, team_name, team_logo_url, team_description, is_active)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           team_name = VALUES(team_name),
           team_logo_url = VALUES(team_logo_url),
           team_description = VALUES(team_description),
           is_active = VALUES(is_active),
           updated_at = NOW()`,
        [
          teamId,
          targetId,
          resolvedTeamName,
          finalTeamLogoUrl || null,
          resolvedTeamDescription,
          isActive !== false ? 1 : 0,
        ]
      );

      return apiSuccess({ id: teamId, teamName: resolvedTeamName, teamDescription: resolvedTeamDescription }, "Team details saved");
    }

    // 2. Action: Add or edit single member
    if (action === "save_member" || member) {
      const m = member || body;
      if (!m.name || !m.name.trim() || !m.role || !m.role.trim()) {
        return apiError("Member name and role are required", 400);
      }

      // Ensure team exists first (default name: "The Crew")
      const [existingTeam]: any = await db.query(
        "SELECT id FROM creator_teams WHERE creator_id = ? LIMIT 1",
        [targetId]
      );
      let teamId = existingTeam[0]?.id;
      if (!teamId) {
        teamId = `team_${Date.now()}`;
        await db.query(
          "INSERT INTO creator_teams (id, creator_id, team_name) VALUES (?, ?, ?)",
          [teamId, targetId, "The Crew"]
        );
      }

      let existingMemberRow: any = null;
      if (m.id) {
        const [rows]: any = await db.query(
          "SELECT id, avatar_url, sort_order FROM team_members WHERE id = ? AND creator_id = ? LIMIT 1",
          [m.id, targetId]
        );
        existingMemberRow = rows?.[0] || null;
      }

      const uploadedAvatar = await saveBase64ImageToStorage(m.avatarUrl, "team", "member");
      const finalAvatarUrl =
        uploadedAvatar ||
        (m.avatarUrl && !String(m.avatarUrl).startsWith("data:") ? String(m.avatarUrl) : null) ||
        (m.avatarUrl === undefined && existingMemberRow ? existingMemberRow.avatar_url : null);

      if (!existingMemberRow && !finalAvatarUrl) {
        return apiError("Member photo is required for new members", 400);
      }

      let sortOrder = Number(m.sortOrder ?? existingMemberRow?.sort_order ?? NaN);
      if (Number.isNaN(sortOrder)) {
        const [countRows]: any = await db.query(
          "SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextOrder FROM team_members WHERE creator_id = ?",
          [targetId]
        );
        sortOrder = Number(countRows?.[0]?.nextOrder || 0);
      }

      const resolvedGroup = m.group === "On camera" ? "On camera" : "Behind the camera";
      const resolvedOneLiner =
        typeof m.oneLiner === "string" && m.oneLiner.trim()
          ? m.oneLiner.trim().slice(0, 80)
          : null;
      const resolvedInflixoUsername = cleanInflixoHandle(m.inflixoUsername);

      const memberId = m.id || `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.query(
        `INSERT INTO team_members (id, team_id, creator_id, name, role, member_group, one_liner, inflixo_username, avatar_url, instagram_url, youtube_url, facebook_url, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           role = VALUES(role),
           member_group = VALUES(member_group),
           one_liner = VALUES(one_liner),
           inflixo_username = VALUES(inflixo_username),
           avatar_url = VALUES(avatar_url),
           instagram_url = VALUES(instagram_url),
           youtube_url = VALUES(youtube_url),
           facebook_url = VALUES(facebook_url),
           sort_order = VALUES(sort_order),
           is_active = VALUES(is_active),
           updated_at = NOW()`,
        [
          memberId,
          teamId,
          targetId,
          m.name.trim(),
          m.role.trim(),
          resolvedGroup,
          resolvedOneLiner,
          resolvedInflixoUsername,
          finalAvatarUrl || null,
          sanitizeUrl(m.instagramUrl) || null,
          sanitizeUrl(m.youtubeUrl) || null,
          sanitizeUrl(m.facebookUrl) || null,
          sortOrder,
          m.isActive !== false ? 1 : 0,
        ]
      );

      return apiSuccess({ memberId }, "Team member saved");
    }

    // 3. Action: Reorder members
    if (action === "reorder" && Array.isArray(members)) {
      for (let i = 0; i < members.length; i++) {
        const item = members[i];
        const id = typeof item === "string" ? item : item?.id;
        const order = typeof item?.sortOrder === "number" ? item.sortOrder : i;
        if (id) {
          if (item?.group === "On camera" || item?.group === "Behind the camera") {
            await db.query(
              "UPDATE team_members SET sort_order = ?, member_group = ? WHERE id = ? AND creator_id = ?",
              [order, item.group, id, targetId]
            );
          } else {
            await db.query(
              "UPDATE team_members SET sort_order = ? WHERE id = ? AND creator_id = ?",
              [order, id, targetId]
            );
          }
        }
      }
      return apiSuccess({ members }, "Members reordered");
    }

    // 4. Action: Toggle member
    if (action === "toggle_member") {
      const { memberId, isActive } = body;
      if (memberId) {
        await db.query(
          "UPDATE team_members SET is_active = ?, updated_at = NOW() WHERE id = ? AND creator_id = ?",
          [isActive ? 1 : 0, memberId, targetId]
        );
        return apiSuccess({}, "Member status updated");
      }
    }

    // 5. Action: Delete member via POST
    if (action === "delete_member") {
      const { memberId } = body;
      if (memberId) {
        await db.query("DELETE FROM team_members WHERE id = ? AND creator_id = ?", [memberId, targetId]);
        return apiSuccess({}, "Member removed from team");
      }
    }

    return apiError("Invalid action or payload", 400);
  } catch (err: any) {
    console.error("POST team error:", err);
    return apiError(err.message || "Failed to save team", 500);
  }
}

// DELETE /api/creator/team?memberId=... or ?teamId=...&creatorId=...
export async function DELETE(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const teamId = searchParams.get("teamId");

    await ensureTeamTables();

    const targetId = auth.creator.id;

    if (memberId) {
      await db.query("DELETE FROM team_members WHERE id = ? AND creator_id = ?", [memberId, targetId]);
      return apiSuccess({}, "Member removed from team");
    }

    if (teamId) {
      await db.query("DELETE FROM team_members WHERE team_id = ? AND creator_id = ?", [teamId, targetId]);
      await db.query("DELETE FROM creator_teams WHERE id = ? AND creator_id = ?", [teamId, targetId]);
      return apiSuccess({}, "Team deleted");
    }

    return apiError("memberId or teamId required", 400);
  } catch (err: any) {
    console.error("DELETE team error:", err);
    return apiError(err.message || "Failed to delete team", 500);
  }
}
