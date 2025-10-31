import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : "http://localhost:8000/api";

// Upload de imagem de produto (multipart)
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const res = await fetch(`${BASE}/admin/product-images/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Não setar Content-Type manualmente para manter o boundary correto
    },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}