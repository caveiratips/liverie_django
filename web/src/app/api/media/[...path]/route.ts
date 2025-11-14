import { NextResponse } from "next/server";

const BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}` : "http://localhost:8000";

export async function GET(_: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const joined = Array.isArray(path) ? path.join("/") : "";
  const url = `${BASE}/media/${joined}`;
  const res = await fetch(url, { cache: "no-store" });
  const buf = await res.arrayBuffer();
  const headers = new Headers(res.headers);
  // Ensure content-type is propagated
  const ct = res.headers.get("content-type") || "application/octet-stream";
  headers.set("content-type", ct);
  return new NextResponse(buf, { status: res.status, headers });
}