import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // Valide apenas o mínimo necessário para criar o usuário.
    // Os demais campos (endereço, CPF, etc.) podem ser opcionais nesta etapa
    // e tratados posteriormente quando estendermos o backend.
    const required = ["nome", "email", "senha"];
    for (const k of required) {
      if (!data?.[k]) {
        return NextResponse.json({ detail: `Campo obrigatório: ${k}` }, { status: 400 });
      }
    }

    // Encaminha cadastro para backend Django
    const res = await fetch("http://localhost:8000/api/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(d || { detail: "Falha ao cadastrar" }, { status: res.status || 400 });
    }
    return NextResponse.json(d);
  } catch (e) {
    return NextResponse.json({ detail: "Request inválido" }, { status: 400 });
  }
}