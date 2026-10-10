import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { isReservedUsername } from "@/lib/constants";

// GET /api/creator/check-username?username=nikunj&email=user@email.com
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username") || "";
    const email = searchParams.get("email") || "";

    const username = rawUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (!username) {
      return apiError("Username is required", 400, { available: false, username: "" });
    }

    if (username.length < 3) {
      return apiError("Username must be at least 3 characters", 400, { available: false, username });
    }

    if (isReservedUsername(username)) {
      return apiSuccess({
        available: false,
        username,
        isReserved: true,
      }, "This one's not available — try another handle 👇");
    }

    // Check if username exists in MySQL DB for another creator
    const [rows]: any = await db.query(
      "SELECT id, email FROM creators WHERE LOWER(username) = ? AND email != ? LIMIT 1",
      [username, email]
    );

    if (rows && rows.length > 0) {
      return apiSuccess({
        available: false,
        username,
        isReserved: false,
      }, `inflixo.com/${username} is already taken`);
    }

    return apiSuccess({
      available: true,
      username,
      isReserved: false,
    }, `inflixo.com/${username} is available! ✨`);
  } catch (err: any) {
    console.error("Check Username API Error:", err);
    return apiError("Could not check username", 500, { available: true, username: "" });
  }
}
