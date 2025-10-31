import { NextResponse } from "next/server";

// Proxy público para listar categorias
const BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : "http://localhost:8000/api";

export async function GET() {
  const res = await fetch(`${BASE}/categories/`, { cache: "no-store" });
  const data = await res.json().catch(() => ([]));
  return NextResponse.json(data, { status: res.status });
}