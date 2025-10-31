import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body;

  const base = process.env.API_BASE_URL || "http://localhost:8000";
  const res = await fetch(`${base}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    return NextResponse.json(err, { status: 401 });
  }

  const data = await res.json();
  const cookieStore = await cookies();
  // Store access and refresh tokens as HttpOnly cookies
  cookieStore.set("auth_token", data.access, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4, // 4 hours
  });
  cookieStore.set("refresh_token", data.refresh, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Persist username for greeting in UI (read by session endpoint)
  cookieStore.set("auth_username", username, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });

  return NextResponse.json({ ok: true });
}