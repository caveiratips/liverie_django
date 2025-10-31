import { NextResponse, NextRequest } from "next/server";

// Proxy público para detalhe de produto por slug
const BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : "http://localhost:8000/api";

export async function GET(_: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const res = await fetch(`${BASE}/products/${slug}/`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}