import { NextResponse } from "next/server";
import { createAdminToken } from "@/lib/adminAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password } = body;

    // Handle logout action
    if (action === "logout") {
      const response = NextResponse.json({ success: true, message: "Logged out successfully" });
      response.cookies.delete("inflixo_admin_token");
      return response;
    }

    // Rate Limiting Protection (Max 5 attempts per 10 minutes per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`admin_auth_${clientIp}`, 5, 10 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many admin login attempts. Please wait ${rateCheck.retryAfterSec} seconds.` },
        { status: 429 }
      );
    }

    const expectedEmail = (process.env.ADMIN_EMAIL || "admin@inflixo.com").toLowerCase().trim();
    const expectedPassword = process.env.ADMIN_PASSWORD || "Devom@131130";

    const inputEmail = (email || "").trim().toLowerCase();

    if (inputEmail === expectedEmail && password === expectedPassword) {
      const token = createAdminToken(expectedEmail);

      const response = NextResponse.json({
        success: true,
        token,
        admin: {
          email: expectedEmail,
          name: "Inflixo Super Admin",
          role: "admin",
        },
      });

      // Set secure httpOnly cookie
      response.cookies.set("inflixo_admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid admin email or password" }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

