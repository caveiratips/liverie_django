import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = "http://localhost:8000/api/addresses/";

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || null;
  if (!token) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  const id = params.id;
  const body = await _.json().catch(() => ({}));
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

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || null;
  if (!token) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  const id = params.id;
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