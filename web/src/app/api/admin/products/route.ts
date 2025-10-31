import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : "http://localhost:8000/api";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const res = await fetch(`${BASE}/admin/products/`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  // Validação básica de tipos antes de encaminhar ao backend
  const errors: string[] = [];
  const requiredString = (v: any, label: string) => {
    if (typeof v !== "string" || v.trim() === "") {
      errors.push(`${label} é obrigatório`);
    }
  };
  const numberField = (v: any, label: string, opts: { required?: boolean; integer?: boolean; min?: number } = {}) => {
    const { required = false, integer = false, min } = opts;
    if (v === undefined || v === null || v === "") {
      if (required) errors.push(`${label} é obrigatório`);
      return;
    }
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n)) {
      errors.push(`${label} deve ser um número válido`);
      return;
    }
    if (integer && !Number.isInteger(n)) {
      errors.push(`${label} deve ser um inteiro`);
    }
    if (min !== undefined && n < min) {
      errors.push(`${label} deve ser >= ${min}`);
    }
  };
  requiredString(body.title, "Título");
  if (body.category_id === undefined || body.category_id === null || Number.isNaN(Number(body.category_id))) {
    errors.push("Categoria é obrigatória");
  }
  numberField(body.price, "Preço", { required: true, min: 0 });
  numberField(body.stock_quantity, "Estoque", { integer: true, min: 0 });
  numberField(body.compare_at_price, "Preço comparativo", { min: 0 });
  numberField(body.cost_price, "Custo", { min: 0 });
  numberField(body.weight, "Peso", { min: 0 });
  numberField(body.width, "Largura", { min: 0 });
  numberField(body.height, "Altura", { min: 0 });
  numberField(body.length, "Comprimento", { min: 0 });
  ["track_inventory", "taxable", "free_shipping", "is_active", "is_featured"].forEach((k) => {
    if (body[k] !== undefined && typeof body[k] !== "boolean") {
      errors.push(`${k} deve ser booleano`);
    }
  });
  if (errors.length) {
    return NextResponse.json({ detail: "Erro de validação", errors }, { status: 400 });
  }
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${BASE}/admin/products/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}