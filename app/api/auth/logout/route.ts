import { clearSessionCookie } from "@/lib/session";
import { apiSuccess } from "@/lib/apiResponse";

export async function POST(req: Request) {
  const response = apiSuccess({}, "Logged out successfully.");
  return clearSessionCookie(response, req);
}
