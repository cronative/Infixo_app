import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/creator/check-username?username=nikunj&email=user@email.com
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username") || "";
    const email = searchParams.get("email") || "";

    const username = rawUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (!username) {
      return NextResponse.json({ available: false, error: "Username is required" }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ available: false, error: "Username must be at least 3 characters" });
    }

    // Check if username exists in MySQL DB for another creator
    const [rows]: any = await db.query(
      "SELECT id, email FROM creators WHERE LOWER(username) = ? AND email != ?",
      [username, email]
    );

    if (rows && rows.length > 0) {
      return NextResponse.json({
        available: false,
        username,
        error: `@${username} is already taken by another creator`,
      });
    }

    return NextResponse.json({
      available: true,
      username,
      message: `@${username} is available! ✨`,
    });
  } catch (err: any) {
    console.error("Check Username API Error:", err);
    return NextResponse.json({ available: true, message: "Could not check username" }, { status: 200 });
  }
}
