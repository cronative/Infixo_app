import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (email?.trim().toLowerCase() === "admin@inflixo.com" && password === "Devom@131130") {
      return NextResponse.json({
        success: true,
        admin: {
          email: "admin@inflixo.com",
          name: "Inflixo Super Admin",
          role: "admin",
        },
      });
    }

    return NextResponse.json({ error: "Invalid admin email or password" }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
