import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureTeamTables } from "@/lib/teamDb";
import { saveBase64Image } from "@/lib/imageStorage";

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

// GET /api/creator/team?creatorId=... or ?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email") || searchParams.get("username");

    if (!lookupVal) {
      return NextResponse.json({ success: true, team: null });
    }

    await ensureTeamTables();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    const [teamRows]: any = await db.query(
      `SELECT id, creator_id AS creatorId, team_name AS teamName, team_logo_url AS teamLogoUrl, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
       FROM creator_teams
       WHERE creator_id = ? LIMIT 1`,
      [targetId]
    );

    if (!teamRows || teamRows.length === 0) {
      return NextResponse.json({ success: true, team: null });
    }

    const team = teamRows[0];

    const [memberRows]: any = await db.query(
      `SELECT id, team_id AS teamId, creator_id AS creatorId, name, role, avatar_url AS avatarUrl, instagram_url AS instagramUrl, youtube_url AS youtubeUrl, facebook_url AS facebookUrl, sort_order AS sortOrder, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
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
      avatarUrl: m.avatarUrl || null,
      instagramUrl: m.instagramUrl || "",
      youtubeUrl: m.youtubeUrl || "",
      facebookUrl: m.facebookUrl || "",
      sortOrder: Number(m.sortOrder || 0),
      isActive: Boolean(m.isActive),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        creatorId: team.creatorId,
        teamName: team.teamName,
        teamLogoUrl: team.teamLogoUrl || null,
        isActive: Boolean(team.isActive),
        members,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("GET team error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/creator/team (Create or Update Team & Members)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, creatorId: passedCreatorId, action, teamName, teamLogoUrl, isActive, member, members } = body;

    const lookupVal = passedCreatorId || email;
    if (!lookupVal) {
      return NextResponse.json({ error: "Creator identifier required" }, { status: 400 });
    }

    await ensureTeamTables();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    // 1. Action: create or update team base info
    if (action === "save_team" || (!action && teamName !== undefined)) {
      if (!teamName || !teamName.trim()) {
        return NextResponse.json({ error: "Team name is required" }, { status: 400 });
      }

      const finalTeamLogoUrl = saveBase64Image(teamLogoUrl, "team", "team_logo") || (teamLogoUrl && !teamLogoUrl.startsWith("data:") ? teamLogoUrl : null);
      const teamId = body.id || `team_${Date.now()}`;
      await db.query(
        `INSERT INTO creator_teams (id, creator_id, team_name, team_logo_url, is_active)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           team_name = VALUES(team_name),
           team_logo_url = VALUES(team_logo_url),
           is_active = VALUES(is_active),
           updated_at = NOW()`,
        [teamId, targetId, teamName.trim(), finalTeamLogoUrl || null, isActive !== false ? 1 : 0]
      );

      return NextResponse.json({ success: true, message: "Team details saved" });
    }

    // 2. Action: Add or edit single member
    if (action === "save_member" || member) {
      const m = member || body;
      if (!m.name || !m.name.trim() || !m.role || !m.role.trim()) {
        return NextResponse.json({ error: "Member name and role are required" }, { status: 400 });
      }

      const finalAvatarUrl = saveBase64Image(m.avatarUrl, "team", "member") || (m.avatarUrl && !m.avatarUrl.startsWith("data:") ? m.avatarUrl : null);

      // Ensure team exists first
      const [existingTeam]: any = await db.query("SELECT id FROM creator_teams WHERE creator_id = ? LIMIT 1", [targetId]);
      let teamId = existingTeam[0]?.id;
      if (!teamId) {
        teamId = `team_${Date.now()}`;
        await db.query(
          "INSERT INTO creator_teams (id, creator_id, team_name) VALUES (?, ?, ?)",
          [teamId, targetId, `${creator?.email?.split("@")[0] || "Creator"}'s Team`]
        );
      }

      const memberId = m.id || `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.query(
        `INSERT INTO team_members (id, team_id, creator_id, name, role, avatar_url, instagram_url, youtube_url, facebook_url, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           role = VALUES(role),
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
          finalAvatarUrl || null,
          (m.instagramUrl || "").trim() || null,
          (m.youtubeUrl || "").trim() || null,
          (m.facebookUrl || "").trim() || null,
          Number(m.sortOrder || 0),
          m.isActive !== false ? 1 : 0,
        ]
      );

      return NextResponse.json({ success: true, memberId, message: "Team member saved" });
    }

    // 3. Action: Reorder members
    if (action === "reorder" && Array.isArray(members)) {
      for (let i = 0; i < members.length; i++) {
        const item = members[i];
        if (item.id) {
          await db.query(
            "UPDATE team_members SET sort_order = ? WHERE id = ? AND creator_id = ?",
            [i, item.id, targetId]
          );
        }
      }
      return NextResponse.json({ success: true, message: "Members reordered" });
    }

    return NextResponse.json({ error: "Invalid action or payload" }, { status: 400 });
  } catch (err: any) {
    console.error("POST team error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/creator/team?memberId=... or ?teamId=...&creatorId=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const teamId = searchParams.get("teamId");
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email");

    if (!lookupVal) {
      return NextResponse.json({ error: "Creator identifier required" }, { status: 400 });
    }

    await ensureTeamTables();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    if (memberId) {
      await db.query("DELETE FROM team_members WHERE id = ? AND creator_id = ?", [memberId, targetId]);
      return NextResponse.json({ success: true, message: "Member removed from team" });
    }

    if (teamId) {
      await db.query("DELETE FROM team_members WHERE team_id = ? AND creator_id = ?", [teamId, targetId]);
      await db.query("DELETE FROM creator_teams WHERE id = ? AND creator_id = ?", [teamId, targetId]);
      return NextResponse.json({ success: true, message: "Team deleted" });
    }

    return NextResponse.json({ error: "memberId or teamId required" }, { status: 400 });
  } catch (err: any) {
    console.error("DELETE team error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
