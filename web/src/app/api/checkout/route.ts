import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
    }
    const data = await req.json().catch(() => ({}));
    // Simula criação de pedido sem persistência
    const orderId = Math.floor(100000 + Math.random() * 900000);
    return NextResponse.json({ ok: true, order_id: orderId, received: data });
  } catch (e) {
    return NextResponse.json({ detail: "Request inválido" }, { status: 400 });
  }
}