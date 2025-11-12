import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  try {
    cookieStore.set("auth_token", "", { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 0 });
    cookieStore.set("refresh_token", "", { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 0 });
    cookieStore.set("auth_username", "", { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 0 });
  } catch {}
  return NextResponse.json({ ok: true });
}