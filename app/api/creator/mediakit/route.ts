import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Ensure MySQL columns exist for Media Kit
async function ensureMediaKitColumns() {
  try { await db.query("ALTER TABLE creators ADD COLUMN whatsapp_number VARCHAR(50) DEFAULT NULL"); } catch {}
  try { await db.query("ALTER TABLE creators ADD COLUMN sponsor_email VARCHAR(255) DEFAULT NULL"); } catch {}
  try { await db.query("ALTER TABLE creators ADD COLUMN min_budget VARCHAR(50) DEFAULT '₹0'"); } catch {}
  try { await db.query("ALTER TABLE creators ADD COLUMN mediakit_bio TEXT DEFAULT NULL"); } catch {}
  try { await db.query("ALTER TABLE creators ADD COLUMN mediakit_packages TEXT DEFAULT NULL"); } catch {}
}

// GET /api/creator/mediakit?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    if (!email && !username) {
      return NextResponse.json({ error: "Email or username query param required" }, { status: 400 });
    }

    await ensureMediaKitColumns();

    let query = `SELECT email, whatsapp_number, sponsor_email, min_budget, mediakit_bio, mediakit_packages FROM creators`;
    const params: any[] = [];
    if (username) {
      query += ` WHERE username = ?`;
      params.push(username);
    } else {
      query += ` WHERE email = ?`;
      params.push(email);
    }

    const [rows]: any = await db.query(query, params);
    const creator = rows[0];

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    let parsedPackages = [];
    if (creator.mediakit_packages) {
      try {
        parsedPackages = typeof creator.mediakit_packages === "string" 
          ? JSON.parse(creator.mediakit_packages) 
          : creator.mediakit_packages;
      } catch {
        parsedPackages = [];
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        whatsappNumber: creator.whatsapp_number || "",
        sponsorEmail: creator.sponsor_email || creator.email || "",
        minBudget: creator.min_budget || "₹0",
        bioHighlight: creator.mediakit_bio || "",
      },
      packages: parsedPackages,
    });
  } catch (err: any) {
    console.error("GET Media Kit Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/creator/mediakit
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, settings, packages } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await ensureMediaKitColumns();

    const packagesJson = JSON.stringify(packages || []);
    const whatsapp = settings?.whatsappNumber || null;
    const sponsorEmail = settings?.sponsorEmail || email;
    const minBudget = settings?.minBudget || "₹0";
    const bioHighlight = settings?.bioHighlight || null;

    await db.query(
      `UPDATE creators 
       SET whatsapp_number = ?,
           sponsor_email = ?,
           min_budget = ?,
           mediakit_bio = ?,
           mediakit_packages = ?
       WHERE email = ?`,
      [whatsapp, sponsorEmail, minBudget, bioHighlight, packagesJson, email]
    );

    return NextResponse.json({
      success: true,
      message: "Media Kit settings & packages saved to MySQL database successfully!",
    });
  } catch (err: any) {
    console.error("POST Media Kit Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
