import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugifySeriesTitle } from "@/lib/videoUrl";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ seriesId: string }> }
) {
  const { seriesId } = await context.params;
  const cleanId = decodeURIComponent(seriesId || "").trim();

  if (!cleanId) {
    return NextResponse.redirect(new URL("/", req.url), 301);
  }

  try {
    const [rows]: any = await db.query(
      `SELECT s.id, s.title, c.username
       FROM series s
       LEFT JOIN creators c ON c.id = s.creator_id
       WHERE s.id = ?`,
      [cleanId]
    );

    if (rows && rows[0] && rows[0].username) {
      const username = rows[0].username;
      const slug = slugifySeriesTitle(rows[0].title);
      const destination = `/${username}/series/${slug}`;
      return NextResponse.redirect(new URL(destination, req.url), 301);
    }
  } catch (err) {
    console.error("Error redirecting old series URL:", err);
  }

  return NextResponse.redirect(new URL("/", req.url), 301);
}
