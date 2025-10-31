import { NextRequest } from "next/server";

const BASE = process.env.API_BASE_URL || "http://localhost:8000";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = `${BASE}/media/${path.join('/')}`;
  const res = await fetch(target, { method: "GET" });
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}