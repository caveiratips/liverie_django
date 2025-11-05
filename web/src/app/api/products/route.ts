import { NextResponse } from "next/server";

// Proxy público para listar produtos disponíveis para venda
const BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : "http://localhost:8000/api";
const DEV_FALLBACK = "http://localhost:8000/api";

export async function GET() {
  let res = await fetch(`${BASE}/products/`, { cache: "no-store" });
  let data: any = await res.json().catch(() => ([]));
  // Se a origem principal falhar ou retornar vazio, tenta fallback local (ambiente dev)
  if (!res.ok || (Array.isArray(data) && data.length === 0)) {
    try {
      const res2 = await fetch(`${DEV_FALLBACK}/products/`, { cache: "no-store" });
      const data2 = await res2.json().catch(() => ([]));
      return NextResponse.json(data2, { status: res2.status });
    } catch {
      // segue com resposta original
    }
  }
  return NextResponse.json(data, { status: res.status });
}