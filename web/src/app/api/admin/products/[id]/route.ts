import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : "http://localhost:8000/api";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const res = await fetch(`${BASE}/admin/products/${id}/`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${BASE}/admin/products/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${BASE}/admin/products/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 204) return NextResponse.json({ detail: "Deleted" }, { status: 200 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}