import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || null;
  const username = cookieStore.get("auth_username")?.value || null;

  // Tenta obter o nome do usuário a partir do backend, se autenticado
  let name: string | null = null;
  let address: any = null;
  let addresses: any[] = [];
  let defaultDeliveryAddressId: number | null = null;
  if (token) {
    try {
      const res = await fetch("http://localhost:8000/api/auth/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        name = (d?.name && String(d.name)) || null;
        const p = d?.profile || null;
        if (p && typeof p === "object") {
          address = {
            cep: String(p.cep || ""),
            endereco: String(p.endereco || ""),
            numero: String(p.numero || ""),
            complemento: String(p.complemento || ""),
            bairro: String(p.bairro || ""),
            cidade: String(p.cidade || ""),
            estado: String(p.estado || ""),
          };
        }
        const addrs = Array.isArray(d?.addresses) ? d.addresses : [];
        addresses = addrs.map((a: any) => ({
          id: Number(a.id),
          label: String(a.label || ""),
          cep: String(a.cep || ""),
          endereco: String(a.endereco || ""),
          numero: String(a.numero || ""),
          complemento: String(a.complemento || ""),
          bairro: String(a.bairro || ""),
          cidade: String(a.cidade || ""),
          estado: String(a.estado || ""),
          is_default_delivery: !!a.is_default_delivery,
        }));
        defaultDeliveryAddressId = d?.default_delivery_address_id ? Number(d.default_delivery_address_id) : null;
      }
    } catch {}
  }

  return NextResponse.json({ logged_in: !!token, username, name, address, addresses, defaultDeliveryAddressId });
}