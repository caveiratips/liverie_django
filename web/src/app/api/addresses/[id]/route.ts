import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

const BASE = "http://localhost:8000/api/addresses/";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || null;
  if (!token) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${BASE}${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Falha ao atualizar endereço" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || null;
  if (!token) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  try {
    const res = await fetch(`${BASE}${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return NextResponse.json(d, { status: res.status });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ detail: "Falha ao remover endereço" }, { status: 500 });
  }
}