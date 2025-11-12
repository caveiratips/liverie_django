import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.API_BASE_URL || "http://localhost:8000";

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || null;
  if (!token) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${BASE}/api/auth/me/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Falha ao atualizar perfil" }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || null;
  if (!token) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  try {
    const res = await fetch(`${BASE}/api/auth/me/`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Falha ao obter perfil" }, { status: 500 });
  }
}