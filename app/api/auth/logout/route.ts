import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  return clearSessionCookie(response, req);
}
