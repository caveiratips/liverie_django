import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = "http://localhost:8000/api/addresses/";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || null;
  if (!token) return NextResponse.json([], { status: 200 });
  try {
    const res = await fetch(BASE, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await res.json().catch(() => []);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || null;
  if (!token) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Falha ao salvar endereço" }, { status: 500 });
  }
}