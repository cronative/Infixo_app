import { encode } from "uqr";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { calculateTotalFanbase, formatFans, getCreatorEra } from "@/lib/creatorEra";

function getAppBaseUrl(): string {
  const raw =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://inflixo.com";
  return raw.replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// Pure Server-Side A4 2-Page PDF Builder (Zero external binary dependencies)
// Uses PDF 1.4 standard fonts (Helvetica, Times-Roman/Italic/Bold) + vector
// graphics + uqr vector QR codes.
// ---------------------------------------------------------------------------

const PAGE_W = 595.28; // A4 width in points
const PAGE_H = 841.89; // A4 height in points

function sanitizePdfText(input: string): string {
  if (!input) return "";
  return String(input)
    .replace(/₹/g, "Rs. ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function escapePdfString(str: string): string {
  return sanitizePdfText(str)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(text: string, maxCharsPerLine: number, maxLines = 4): string[] {
  const clean = sanitizePdfText(text);
  if (!clean) return [];
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word.length > maxCharsPerLine ? word.slice(0, maxCharsPerLine) : word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines.slice(0, maxLines);
}

class PdfPageCanvas {
  private ops: string[] = [];

  // Convert top-down Y coordinate to PDF bottom-up Y coordinate
  private pdfY(topY: number, height = 0): number {
    return Number((PAGE_H - topY - height).toFixed(2));
  }

  setFillRgb(r: number, g: number, b: number) {
    this.ops.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
  }

  setStrokeRgb(r: number, g: number, b: number) {
    this.ops.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`);
  }

  setLineWidth(w: number) {
    this.ops.push(`${w.toFixed(2)} w`);
  }

  fillRect(x: number, topY: number, w: number, h: number) {
    const y = this.pdfY(topY, h);
    this.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  strokeRect(x: number, topY: number, w: number, h: number) {
    const y = this.pdfY(topY, h);
    this.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  fillAndStrokeRect(x: number, topY: number, w: number, h: number) {
    const y = this.pdfY(topY, h);
    this.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`);
  }

  drawLine(x1: number, topY1: number, x2: number, topY2: number) {
    const y1 = this.pdfY(topY1, 0);
    const y2 = this.pdfY(topY2, 0);
    this.ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  // Font keys:
  // F1 = Helvetica, F2 = Helvetica-Bold, F3 = Times-Roman, F4 = Times-Italic, F5 = Times-Bold, F6 = Times-BoldItalic
  drawText(
    text: string,
    x: number,
    topY: number,
    fontKey: "F1" | "F2" | "F3" | "F4" | "F5" | "F6",
    fontSize: number
  ) {
    const escaped = escapePdfString(text);
    if (!escaped) return;
    const y = this.pdfY(topY, fontSize * 0.8);
    this.ops.push(`BT /${fontKey} ${fontSize.toFixed(1)} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj ET`);
  }

  drawQrCode(url: string, x: number, topY: number, size: number) {
    try {
      const qr = encode(url || "https://inflixo.com", { ecc: "M", border: 1 });
      const n = qr.size;
      if (!n || n <= 0) return;
      const cell = size / n;

      // White background box
      this.setFillRgb(255, 255, 255);
      this.setStrokeRgb(231, 224, 214);
      this.setLineWidth(0.6);
      this.fillAndStrokeRect(x - 3, topY - 3, size + 6, size + 6);

      // Dark modules
      this.setFillRgb(28, 25, 23);
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (qr.data[r][c]) {
            const rx = x + c * cell;
            const ry = topY + r * cell;
            this.fillRect(rx, ry, cell + 0.15, cell + 0.15);
          }
        }
      }
    } catch {
      // Ignore QR error
    }
  }

  toStream(): string {
    return this.ops.join("\n");
  }
}

function buildTwoPagePdfBuffer(page1Stream: string, page2Stream: string): Buffer {
  // Object IDs:
  // 1: Catalog
  // 2: Pages
  // 3: Page 1
  // 4: Page 1 Contents
  // 5: Page 2
  // 6: Page 2 Contents
  // 7: Font F1 (Helvetica)
  // 8: Font F2 (Helvetica-Bold)
  // 9: Font F3 (Times-Roman)
  // 10: Font F4 (Times-Italic)
  // 11: Font F5 (Times-Bold)
  // 12: Font F6 (Times-BoldItalic)

  const objects: Record<number, string> = {
    1: `<< /Type /Catalog /Pages 2 0 R >>`,
    2: `<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>`,
    3: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 7 0 R /F2 8 0 R /F3 9 0 R /F4 10 0 R /F5 11 0 R /F6 12 0 R >> >> /Contents 4 0 R >>`,
    4: `<< /Length ${Buffer.byteLength(page1Stream, "utf8")} >>\nstream\n${page1Stream}\nendstream`,
    5: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 7 0 R /F2 8 0 R /F3 9 0 R /F4 10 0 R /F5 11 0 R /F6 12 0 R >> >> /Contents 6 0 R >>`,
    6: `<< /Length ${Buffer.byteLength(page2Stream, "utf8")} >>\nstream\n${page2Stream}\nendstream`,
    7: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`,
    8: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`,
    9: `<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>`,
    10: `<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>`,
    11: `<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>`,
    12: `<< /Type /Font /Subtype /Type1 /BaseFont /Times-BoldItalic /Encoding /WinAnsiEncoding >>`,
  };

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  const maxObj = 12;
  for (let i = 1; i <= maxObj; i++) {
    offsets[i] = Buffer.byteLength(pdf, "utf8");
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${maxObj + 1}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let i = 1; i <= maxObj; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function parseJsonStringArray(val: any, maxLen?: number): string[] {
  try {
    const parsed = typeof val === "string" ? JSON.parse(val) : Array.isArray(val) ? val : [];
    const clean = Array.isArray(parsed)
      ? parsed.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    return typeof maxLen === "number" ? clean.slice(0, maxLen) : clean;
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let usernameParam = (searchParams.get("username") || "").trim().replace(/^@/, "");
    let creatorIdParam = (searchParams.get("creatorId") || "").trim();

    if (!usernameParam && !creatorIdParam) {
      const session = getSessionFromRequest(req);
      if (session?.creatorId) creatorIdParam = session.creatorId;
      else if (session?.email) usernameParam = session.email;
    }

    if (!usernameParam && !creatorIdParam) {
      return new Response("Missing username or creatorId", { status: 400 });
    }

    // 1. Load creator row
    const [creatorRows]: any = await db.query(
      `SELECT id, username, display_name, email, bio, category, profession, city, state, country, peak_fanbase
       FROM creators
       WHERE LOWER(username) = LOWER(?) OR id = ?
       LIMIT 1`,
      [usernameParam || creatorIdParam, creatorIdParam || usernameParam]
    );

    const creator = creatorRows?.[0];
    if (!creator) {
      return new Response("Creator not found", { status: 404 });
    }

    const creatorId = creator.id;
    const cleanUsername = (creator.username || usernameParam || "creator").replace(/^@/, "");
    const displayName = creator.display_name || cleanUsername;
    const baseUrl = getAppBaseUrl();
    const mediaKitUrl = `${baseUrl}/${cleanUsername}/mediakit`;

    // 2. Load primary social accounts
    const [socialRows]: any = await db.query(
      `SELECT platform, username, follower_count, is_primary, is_hidden
       FROM social_accounts
       WHERE creator_id = ?
       ORDER BY is_primary DESC, id ASC`,
      [creatorId]
    );

    let igFollowers = 0;
    let ytSubscribers = 0;
    let fbFollowers = 0;
    const platformReachParts: string[] = [];

    for (const row of socialRows || []) {
      if (row.is_hidden) continue;
      const plat = (row.platform || "").toLowerCase();
      const isPrimary = Boolean(row.is_primary);
      const count = Number(row.follower_count) || 0;
      const handle = (row.username || "").replace(/^@/, "");
      if (plat === "instagram" && isPrimary) {
        igFollowers = count;
        if (handle || count > 0) {
          platformReachParts.push(`Instagram @${handle}${count > 0 ? ` (${formatFans(count)})` : ""}`);
        }
      } else if (plat === "youtube" && isPrimary) {
        ytSubscribers = count;
        if (handle || count > 0) {
          platformReachParts.push(`YouTube @${handle}${count > 0 ? ` (${formatFans(count)})` : ""}`);
        }
      } else if (plat === "facebook" && isPrimary) {
        fbFollowers = count;
        if (handle || count > 0) {
          platformReachParts.push(`Facebook @${handle}${count > 0 ? ` (${formatFans(count)})` : ""}`);
        }
      }
    }

    const totalFans =
      calculateTotalFanbase({
        instagram: { followers: igFollowers },
        youtube: { subscribers: ytSubscribers },
        facebook: { followers: fbFollowers },
      }) || 0;
    const creatorEra = getCreatorEra(totalFans > 0 ? totalFans : null);

    // 3. Load mediakit_settings & mediakit_gigs
    let settingsRow: any = {};
    try {
      const [sRows]: any = await db.query(
        `SELECT * FROM mediakit_settings WHERE creator_id = ? OR email = ? ORDER BY (creator_id = ?) DESC LIMIT 1`,
        [creatorId, creator.email || "", creatorId]
      );
      settingsRow = sRows?.[0] || {};
    } catch {}

    let gigsRows: any[] = [];
    try {
      const [gRows]: any = await db.query(
        `SELECT * FROM mediakit_gigs WHERE (creator_id = ? OR email = ?) AND is_active = 1 ORDER BY created_at ASC`,
        [creatorId, creator.email || ""]
      );
      gigsRows = gRows || [];
    } catch {}

    // 4. Load Top 3 Series
    let seriesRows: any[] = [];
    try {
      const [serRows]: any = await db.query(
        `SELECT s.id, s.title, s.genre, s.language, s.platform,
                (SELECT COUNT(*) FROM episodes e WHERE e.series_id = s.id) AS episode_count
         FROM series s
         WHERE s.creator_id = ?
         ORDER BY s.sort_order ASC, s.created_at DESC
         LIMIT 3`,
        [creatorId]
      );
      seriesRows = serRows || [];
    } catch {}

    // 5. Load Visible Approved Reviews
    let reviewRows: any[] = [];
    try {
      const [rRows]: any = await db.query(
        `SELECT client_name, project_title, rating, comment
         FROM creator_reviews
         WHERE creator_id = ? AND status = 'approved' AND COALESCE(is_visible, 1) = 1
         ORDER BY created_at DESC
         LIMIT 3`,
        [creatorId]
      );
      reviewRows = rRows || [];
    } catch {}

    // 6. Load Team Members
    let teamMembers: any[] = [];
    try {
      const [tRows]: any = await db.query(
        `SELECT tm.name, tm.role, tm.member_group
         FROM team_members tm
         LEFT JOIN creator_teams ct ON ct.creator_id = tm.creator_id
         WHERE tm.creator_id = ? AND COALESCE(ct.is_active, 1) = 1 AND tm.is_active = 1
         ORDER BY tm.sort_order ASC, tm.created_at ASC
         LIMIT 6`,
        [creatorId]
      );
      teamMembers = tRows || [];
    } catch {}

    const intro = (settingsRow.intro || settingsRow.bio_highlight || creator.bio || "").trim();
    const nowMaking = (settingsRow.now_making || "").trim();
    const audienceDesc = (settingsRow.audience_desc || "").trim();
    const availability = settingsRow.availability === "busy" ? "busy" : "open";
    const replyTime = (settingsRow.reply_time || "Within 24h").trim();
    const fitTags = parseJsonStringArray(settingsRow.fit_tags, 3);
    const nofitTags = parseJsonStringArray(settingsRow.nofit_tags, 3);
    const promises = parseJsonStringArray(settingsRow.promises, 4);
    const signatureName = (settingsRow.signature_name || displayName).trim();
    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // =========================================================================
    // PAGE 1: "Who I am"
    // =========================================================================
    const p1 = new PdfPageCanvas();
    // Warm cream background
    p1.setFillRgb(250, 247, 242);
    p1.fillRect(0, 0, PAGE_W, PAGE_H);

    // Top editorial header bar
    p1.setFillRgb(122, 34, 83);
    p1.fillRect(0, 0, PAGE_W, 6);

    p1.setFillRgb(122, 34, 83);
    p1.drawText("INFLIXO MEDIA KIT", 40, 26, "F2", 9);
    p1.setFillRgb(120, 113, 108);
    p1.drawText("01 / WHO I AM", PAGE_W - 115, 26, "F2", 9);

    p1.setStrokeRgb(231, 224, 214);
    p1.setLineWidth(0.75);
    p1.drawLine(40, 44, PAGE_W - 40, 44);

    // Creator Identity Block
    let y1 = 62;
    p1.setFillRgb(28, 25, 23);
    p1.drawText(displayName, 40, y1, "F5", 24);

    // Availability pill on right
    const availLabel =
      availability === "busy"
        ? `Heads-down creating - Replies ${replyTime}`
        : `Open for collaborations - Replies ${replyTime}`;
    p1.setFillRgb(availability === "busy" ? 254 : 236, availability === "busy" ? 243 : 253, availability === "busy" ? 199 : 245);
    p1.setStrokeRgb(availability === "busy" ? 252 : 167, availability === "busy" ? 211 : 243, availability === "busy" ? 77 : 208);
    p1.fillAndStrokeRect(PAGE_W - 250, y1 - 2, 210, 22);
    p1.setFillRgb(availability === "busy" ? 146 : 6, availability === "busy" ? 64 : 95, availability === "busy" ? 14 : 70);
    p1.drawText(availLabel.slice(0, 42), PAGE_W - 242, y1 + 4, "F2", 8.5);

    y1 += 28;
    const sublineParts = [
      `@${cleanUsername}`,
      creator.profession || creator.category,
      [creator.city, creator.state, creator.country].filter(Boolean).join(", "),
    ].filter(Boolean);
    p1.setFillRgb(120, 113, 108);
    p1.drawText(sublineParts.join("  |  "), 40, y1, "F1", 10);

    y1 += 24;

    // 1. HELLO SECTION
    if (intro || nowMaking) {
      p1.setFillRgb(255, 255, 255);
      p1.setStrokeRgb(231, 224, 214);
      const introLines = wrapText(intro, 78, 4);
      const boxH = 38 + introLines.length * 16 + (nowMaking ? 26 : 0);
      p1.fillAndStrokeRect(40, y1, PAGE_W - 80, boxH);

      p1.setFillRgb(122, 34, 83);
      p1.drawText("A QUICK HELLO", 54, y1 + 12, "F2", 8.5);

      let iy = y1 + 28;
      p1.setFillRgb(28, 25, 23);
      for (const line of introLines) {
        p1.drawText(`"${line}"`, 54, iy, "F4", 11.5);
        iy += 16;
      }

      if (nowMaking) {
        p1.setFillRgb(122, 34, 83);
        p1.drawText(`Now making: `, 54, iy + 4, "F2", 9.5);
        p1.setFillRgb(68, 64, 60);
        p1.drawText(nowMaking, 118, iy + 4, "F1", 9.5);
      }

      y1 += boxH + 18;
    }

    // 2. AUDIENCE SECTION
    if (totalFans > 0 || audienceDesc || platformReachParts.length > 0) {
      p1.setFillRgb(255, 255, 255);
      p1.setStrokeRgb(231, 224, 214);
      const audLines = wrapText(audienceDesc, 82, 3);
      const boxH = 66 + audLines.length * 14 + (platformReachParts.length > 0 ? 18 : 0);
      p1.fillAndStrokeRect(40, y1, PAGE_W - 80, boxH);

      p1.setFillRgb(122, 34, 83);
      p1.drawText("THE PEOPLE WHO TUNE IN", 54, y1 + 12, "F2", 8.5);

      p1.setFillRgb(28, 25, 23);
      const fansHeadline =
        totalFans > 0
          ? `${formatFans(totalFans)} people chose to follow along`
          : "A community built on genuine trust";
      p1.drawText(fansHeadline, 54, y1 + 28, "F5", 16);

      if (creatorEra) {
        p1.setFillRgb(120, 113, 108);
        p1.drawText(`${creatorEra.badge}  -  earned, not bought`, 54, y1 + 47, "F4", 10);
      }

      let ay = y1 + 64;
      p1.setFillRgb(68, 64, 60);
      for (const line of audLines) {
        p1.drawText(line, 54, ay, "F1", 9.5);
        ay += 14;
      }

      if (platformReachParts.length > 0) {
        p1.setFillRgb(122, 34, 83);
        p1.drawText(platformReachParts.join("   |   "), 54, ay + 2, "F2", 9);
      }

      y1 += boxH + 18;
    }

    // 3. TOP 3 SERIES WITH QR CODES
    if (seriesRows.length > 0) {
      p1.setFillRgb(122, 34, 83);
      p1.drawText("ORIGINAL SERIES (SCAN QR TO WATCH)", 40, y1, "F2", 9);
      y1 += 16;

      for (const s of seriesRows.slice(0, 3)) {
        const cardH = 66;
        p1.setFillRgb(255, 255, 255);
        p1.setStrokeRgb(231, 224, 214);
        p1.fillAndStrokeRect(40, y1, PAGE_W - 80, cardH);

        p1.setFillRgb(28, 25, 23);
        p1.drawText(String(s.title || "Untitled Series").slice(0, 52), 54, y1 + 14, "F5", 13);

        const metaParts = [
          s.platform || "Video Series",
          s.genre,
          s.language,
          `${Number(s.episode_count) || 0} episodes`,
        ].filter(Boolean);
        p1.setFillRgb(120, 113, 108);
        p1.drawText(metaParts.join("  -  "), 54, y1 + 33, "F1", 9.5);

        const seriesUrl = `${baseUrl}/${cleanUsername}/series/${s.id}`;
        p1.setFillRgb(122, 34, 83);
        p1.drawText(seriesUrl.replace(/^https?:\/\//, ""), 54, y1 + 48, "F1", 8.5);

        p1.drawQrCode(seriesUrl, PAGE_W - 98, y1 + 9, 48);

        y1 += cardH + 10;
      }
      y1 += 8;
    }

    // 4. FIT / NOT-FIT CHIPS
    if ((fitTags.length > 0 || nofitTags.length > 0) && y1 < PAGE_H - 120) {
      p1.setFillRgb(255, 255, 255);
      p1.setStrokeRgb(231, 224, 214);
      const fitBoxH = 68;
      p1.fillAndStrokeRect(40, y1, PAGE_W - 80, fitBoxH);

      p1.setFillRgb(122, 34, 83);
      p1.drawText("BRAND FIT & HONEST BOUNDARIES", 54, y1 + 12, "F2", 8.5);

      if (fitTags.length > 0) {
        p1.setFillRgb(6, 95, 70);
        p1.drawText(`Great fit for:  ${fitTags.join("   |   ")}`, 54, y1 + 30, "F2", 9.5);
      }
      if (nofitTags.length > 0) {
        p1.setFillRgb(153, 27, 27);
        p1.drawText(`Not the right fit:  ${nofitTags.join("   |   ")}`, 54, y1 + 47, "F1", 9.5);
      }
    }

    // Page 1 Footer
    p1.setStrokeRgb(231, 224, 214);
    p1.drawLine(40, PAGE_H - 42, PAGE_W - 40, PAGE_H - 42);
    p1.setFillRgb(120, 113, 108);
    p1.drawText(`Numbers as of ${dateStr}`, 40, PAGE_H - 28, "F4", 9);
    p1.drawText(mediaKitUrl.replace(/^https?:\/\//, ""), PAGE_W - 210, PAGE_H - 28, "F1", 9);

    // =========================================================================
    // PAGE 2: "Working together"
    // =========================================================================
    const p2 = new PdfPageCanvas();
    p2.setFillRgb(250, 247, 242);
    p2.fillRect(0, 0, PAGE_W, PAGE_H);

    p2.setFillRgb(122, 34, 83);
    p2.fillRect(0, 0, PAGE_W, 6);

    p2.setFillRgb(122, 34, 83);
    p2.drawText(`WORKING TOGETHER  -  @${cleanUsername}`, 40, 26, "F2", 9);
    p2.setFillRgb(120, 113, 108);
    p2.drawText("02 / WORKING TOGETHER", PAGE_W - 150, 26, "F2", 9);

    p2.setStrokeRgb(231, 224, 214);
    p2.setLineWidth(0.75);
    p2.drawLine(40, 44, PAGE_W - 40, 44);

    let y2 = 58;

    // 5. PACKAGES SECTION
    if (gigsRows.length > 0) {
      p2.setFillRgb(122, 34, 83);
      p2.drawText("COLLABORATION PACKAGES  (Final scope shaped together)", 40, y2, "F2", 9);
      y2 += 15;

      for (const pkg of gigsRows.slice(0, 3)) {
        let deliverables: string[] = [];
        try {
          deliverables =
            typeof pkg.deliverables === "string" ? JSON.parse(pkg.deliverables) : pkg.deliverables || [];
        } catch {}
        const storyPitch = (pkg.story_pitch || "").trim();
        const delivText = deliverables.slice(0, 4).join("  |  ");
        const cardH = storyPitch ? 78 : 62;

        p2.setFillRgb(255, 255, 255);
        p2.setStrokeRgb(231, 224, 214);
        p2.fillAndStrokeRect(40, y2, PAGE_W - 80, cardH);

        p2.setFillRgb(28, 25, 23);
        p2.drawText(String(pkg.title || "Collab Package").slice(0, 46), 54, y2 + 12, "F5", 12.5);

        const priceStr = sanitizePdfText(pkg.price || "Contact for pricing");
        p2.setFillRgb(122, 34, 83);
        p2.drawText(priceStr, PAGE_W - 155, y2 + 12, "F2", 11);

        const subMeta = [
          pkg.category,
          pkg.platform,
          pkg.turnaround_days ? `${pkg.turnaround_days} days turnaround` : null,
          pkg.package_name || pkg.badge,
        ]
          .filter(Boolean)
          .join("  -  ");
        p2.setFillRgb(120, 113, 108);
        p2.drawText(subMeta.slice(0, 80), 54, y2 + 27, "F1", 8.5);

        let py = y2 + 42;
        if (storyPitch) {
          p2.setFillRgb(68, 64, 60);
          p2.drawText(`The story I'd tell for you: "${storyPitch.slice(0, 75)}"`, 54, py, "F4", 9.5);
          py += 15;
        }

        if (delivText) {
          p2.setFillRgb(28, 25, 23);
          p2.drawText(`What your brand gets: ${delivText.slice(0, 78)}`, 54, py, "F1", 9);
        }

        y2 += cardH + 9;
      }
      y2 += 6;
    }

    // 6. PROMISE SECTION
    if (promises.length > 0 && y2 < PAGE_H - 220) {
      const boxH = 26 + promises.length * 14;
      p2.setFillRgb(255, 255, 255);
      p2.setStrokeRgb(231, 224, 214);
      p2.fillAndStrokeRect(40, y2, PAGE_W - 80, boxH);

      p2.setFillRgb(122, 34, 83);
      p2.drawText("MY PROMISE TO EVERY BRAND PARTNER", 54, y2 + 11, "F2", 8.5);

      let pry = y2 + 25;
      p2.setFillRgb(28, 25, 23);
      for (const pr of promises) {
        p2.drawText(`[x]  ${pr}`, 54, pry, "F1", 9.5);
        pry += 14;
      }
      y2 += boxH + 12;
    }

    // 7. REVIEWS SECTION
    if (reviewRows.length > 0 && y2 < PAGE_H - 190) {
      p2.setFillRgb(122, 34, 83);
      p2.drawText("WHAT PARTNERS SAY  (Reviewed via Inflixo invite)", 40, y2, "F2", 8.5);
      y2 += 14;

      for (const rev of reviewRows.slice(0, 2)) {
        const cardH = 48;
        p2.setFillRgb(255, 255, 255);
        p2.setStrokeRgb(231, 224, 214);
        p2.fillAndStrokeRect(40, y2, PAGE_W - 80, cardH);

        const quote = String(rev.comment || "").trim().slice(0, 88);
        p2.setFillRgb(28, 25, 23);
        p2.drawText(`"${quote}"`, 54, y2 + 12, "F4", 9.5);

        const attr = [
          rev.client_name,
          rev.project_title,
          `${Number(rev.rating) || 5}.0 / 5.0  -  Reviewed via Inflixo invite`,
        ]
          .filter(Boolean)
          .join("  |  ");
        p2.setFillRgb(120, 113, 108);
        p2.drawText(attr.slice(0, 85), 54, y2 + 29, "F2", 8.5);

        y2 += cardH + 8;
      }
      y2 += 4;
    }

    // 8. TEAM SECTION
    if (teamMembers.length > 0 && y2 < PAGE_H - 165) {
      const teamLine = teamMembers
        .map((m: any) => `${m.name}${m.role ? ` (${m.role})` : ""}`)
        .join("   |   ");
      p2.setFillRgb(255, 255, 255);
      p2.setStrokeRgb(231, 224, 214);
      p2.fillAndStrokeRect(40, y2, PAGE_W - 80, 38);

      p2.setFillRgb(122, 34, 83);
      p2.drawText("THE PEOPLE BEHIND THE CAMERA", 54, y2 + 10, "F2", 8);
      p2.setFillRgb(28, 25, 23);
      p2.drawText(teamLine.slice(0, 85), 54, y2 + 23, "F1", 9);
      y2 += 48;
    }

    // 9. CLOSING LETTER + SCRIPT SIGNATURE + PROFILE QR CODE
    const closingTop = Math.max(y2, PAGE_H - 155);
    const closingH = PAGE_H - closingTop - 52;
    p2.setFillRgb(255, 255, 255);
    p2.setStrokeRgb(122, 34, 83);
    p2.setLineWidth(1);
    p2.fillAndStrokeRect(40, closingTop, PAGE_W - 80, closingH);

    p2.setFillRgb(122, 34, 83);
    p2.drawText("LET'S MAKE SOMETHING WORTH WATCHING", 54, closingTop + 13, "F2", 8.5);

    p2.setFillRgb(68, 64, 60);
    p2.drawText(
      "Thank you for reading through. If our audiences and values align, I would love to shape a story together.",
      54,
      closingTop + 29,
      "F4",
      9.5
    );

    // Script / Cursive-style italic signature
    p2.setFillRgb(28, 25, 23);
    p2.drawText(`Warmly,  ${signatureName}`, 54, closingTop + 48, "F6", 15);

    const contactParts = [
      settingsRow.sponsor_email || creator.email ? `Email: ${settingsRow.sponsor_email || creator.email}` : null,
      settingsRow.whatsapp_number ? `WhatsApp: ${settingsRow.whatsapp_number}` : null,
      `Web: inflixo.com/${cleanUsername}/mediakit`,
    ].filter(Boolean);
    p2.setFillRgb(120, 113, 108);
    p2.drawText(contactParts.join("   |   ").slice(0, 75), 54, closingTop + 69, "F1", 8.5);

    p2.drawQrCode(mediaKitUrl, PAGE_W - 110, closingTop + 12, 58);

    // Page 2 Footer
    p2.setStrokeRgb(231, 224, 214);
    p2.setLineWidth(0.75);
    p2.drawLine(40, PAGE_H - 42, PAGE_W - 40, PAGE_H - 42);
    p2.setFillRgb(120, 113, 108);
    p2.drawText(`Numbers as of ${dateStr}`, 40, PAGE_H - 28, "F4", 9);
    p2.drawText(mediaKitUrl.replace(/^https?:\/\//, ""), PAGE_W - 210, PAGE_H - 28, "F1", 9);

    const pdfBuffer = buildTwoPagePdfBuffer(p1.toStream(), p2.toStream());

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cleanUsername}-mediakit.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("MediaKit PDF Generation Error:", err);
    return new Response(`Failed to generate Media Kit PDF: ${err?.message || "Unknown error"}`, {
      status: 500,
    });
  }
}
