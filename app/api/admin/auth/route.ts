import { createAdminToken } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/rateLimit";
import { checkPersistentRateLimit } from "@/lib/persistentRateLimit";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password } = body;

    // Handle logout action
    if (action === "logout") {
      const response = apiSuccess({}, "Logged out successfully");
      response.cookies.delete("inflixo_admin_token");
      return response;
    }

    // Rate Limiting Protection (Max 5 attempts per 10 minutes per IP)
    const clientIp = getClientIp(req);
    const rateCheck = await checkPersistentRateLimit(`admin-auth:${clientIp}`, 5, 10 * 60);
    if (!rateCheck.success) {
      return apiError(
        `Too many admin login attempts. Please wait ${rateCheck.retryAfterSec} seconds.`,
        429
      );
    }

    const expectedEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedEmail || !expectedPassword) {
      return apiError("Admin authentication is not configured", 503);
    }

    const inputEmail = (email || "").trim().toLowerCase();

    if (inputEmail === expectedEmail && password === expectedPassword) {
      const token = createAdminToken(expectedEmail);

      const response = apiSuccess({
        admin: {
          email: expectedEmail,
          name: "Inflixo Super Admin",
          role: "admin",
        },
      }, "Admin authenticated successfully");

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

    return apiError("Invalid admin email or password", 401);
  } catch (err: any) {
    return apiError(err.message || "Admin authentication error", 500);
  }
}
