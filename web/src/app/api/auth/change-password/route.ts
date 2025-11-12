import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || null;
  if (!token) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch("http://localhost:8000/api/auth/change-password/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Falha ao alterar senha" }));
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json().catch(() => ({ ok: true }));
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ detail: "Erro inesperado" }, { status: 500 });
  }
}