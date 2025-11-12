"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Session = {
  logged_in: boolean;
  username: string | null;
  name: string | null;
  profile?: {
    telefone?: string;
    cpf?: string;
    data_nascimento?: string | null; // ISO
  } | null;
  address: {
    cep: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  } | null;
  addresses: Array<{
    id: number;
    label: string;
    cep: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    is_default_delivery?: boolean;
  }>;
};

type OrderItemDTO = { id: number; title: string; image_url?: string; unit_price: number; quantity: number };
type OrderDTO = {
  id: number;
  order_number: string;
  status: "pending" | "paid" | "separation" | "shipped" | "delivered";
  total: number;
  payment_method?: string;
  shipping_method?: string;
  created_at: string;
  items: OrderItemDTO[];
};

function currencyBRL(n: any): string {
  const num = Number(n || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Section = "dados" | "enderecos" | "autenticacao" | "pedidos" | "sair";

export default function PerfilPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [section, setSection] = useState<Section>("dados");

  const [addresses, setAddresses] = useState<Session["addresses"]>([]);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Novo endereço
  const [newAddrOpen, setNewAddrOpen] = useState(false);
  const [addr, setAddr] = useState({
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    label: "Entrega",
  });
  const [addrError, setAddrError] = useState<string | null>(null);
  const [addrSaving, setAddrSaving] = useState(false);
  // Feedback de CEP (novo)
  const [cepNewError, setCepNewError] = useState<string | null>(null);
  const [cepNewLoading, setCepNewLoading] = useState(false);
  // Edição de dados pessoais
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personName, setPersonName] = useState("");
  const [personEmail, setPersonEmail] = useState("");
  const [personCPF, setPersonCPF] = useState("");
  const [personPhone, setPersonPhone] = useState("");
  const [personDob, setPersonDob] = useState("");
  const [personalError, setPersonalError] = useState<string | null>(null);
  // Edição de endereço existente
  const [editAddrId, setEditAddrId] = useState<number | null>(null);
  const [editAddrForm, setEditAddrForm] = useState({
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    label: "",
  });
  // Feedback de CEP (edição)
  const [cepEditError, setCepEditError] = useState<string | null>(null);
  const [cepEditLoading, setCepEditLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/session", { cache: "no-store" });
        const d: Session = await r.json();
        setSession(d);
        setAddresses(d?.addresses || []);
        // Inicializa formulário pessoal
        setPersonName(d?.name || "");
        setPersonEmail(d?.username || "");
        setPersonCPF(formatCPF(d?.profile?.cpf || ""));
        setPersonPhone(formatPhone(d?.profile?.telefone || ""));
        setPersonDob(d?.profile?.data_nascimento ? formatISODateToBR(d.profile.data_nascimento) : "");
      } catch {}
      setLoadingSession(false);
    })();
  }, []);

  useEffect(() => {
    if (!session?.logged_in) return;
    setLoadingOrders(true);
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [session?.logged_in]);

  const isLogged = !!session?.logged_in;
  const greeting = useMemo(() => {
    const n = session?.name?.trim();
    if (n) return n.split(" ")[0];
    const u = session?.username?.trim();
    return u || "";
  }, [session]);

  function formatCPF(raw?: string): string {
    const s = String(raw || "").replace(/\D/g, "").slice(0, 11);
    const p1 = s.slice(0, 3);
    const p2 = s.slice(3, 6);
    const p3 = s.slice(6, 9);
    const p4 = s.slice(9, 11);
    let out = p1;
    if (p2) out += `.${p2}`;
    if (p3) out += `.${p3}`;
    if (p4) out += `-${p4}`;
    return out || "—";
  }

  // Validação de CPF (cálculo dos dígitos verificadores)
  function isValidCPF(raw: string): boolean {
    const cpf = onlyDigits(raw);
    if (!cpf || cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let d1 = (sum * 10) % 11;
    if (d1 === 10) d1 = 0;
    if (d1 !== parseInt(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    let d2 = (sum * 10) % 11;
    if (d2 === 10) d2 = 0;
    return d2 === parseInt(cpf[10]);
  }

  function formatPhone(raw?: string): string {
    const d = String(raw || "").replace(/\D/g, "").slice(0, 11);
    const area = d.slice(0, 2);
    const isMobile = d.length > 10;
    const first = isMobile ? d.slice(2, 7) : d.slice(2, 6);
    const last = isMobile ? d.slice(7, 11) : d.slice(6, 10);
    let out = "";
    if (area) out += `(${area})`;
    if (first) out += ` ${first}`;
    if (last) out += `-${last}`;
    return out || "—";
  }

  function formatISODateToBR(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  async function onLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    window.location.href = "/loja";
  }

  function onlyDigits(s: string): string { return (s || "").replace(/\D/g, ""); }
  function formatCEP(s: string): string { const d = onlyDigits(s).slice(0, 8); if (d.length <= 5) return d; return `${d.slice(0,5)}-${d.slice(5)}`; }
  function formatDateBR(s: string): string {
    const raw = onlyDigits(s).slice(0, 8);
    const dd = raw.slice(0, 2);
    const mm = raw.slice(2, 4);
    const yyyy = raw.slice(4, 8);
    let out = dd;
    if (mm) out += `/${mm}`;
    if (yyyy) out += `/${yyyy}`;
    return out;
  }
  function toISOFromBRDate(s?: string): string | undefined {
    if (!s) return undefined;
    const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return undefined;
    const [_, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  async function savePersonal() {
    setPersonalError(null);
    // Feedback imediato se CPF for inválido
    if (personCPF) {
      if (!isValidCPF(personCPF)) {
        setPersonalError("CPF inválido. Verifique os números digitados.");
        return;
      }
    }
    const payload: any = {
      name: personName,
      email: personEmail,
      profile: {
        cpf: onlyDigits(personCPF),
        telefone: onlyDigits(personPhone),
        data_nascimento: toISOFromBRDate(personDob),
      },
    };
    try {
      const res = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setPersonalError(d?.detail || "Falha ao salvar dados pessoais");
        return;
      }
      const updated = await res.json();
      setSession((prev) => ({
        ...(prev || { logged_in: true, username: null, name: null, address: null, addresses: [] }),
        name: updated?.name || personName,
        username: updated?.email || personEmail,
        profile: updated?.profile || (prev?.profile ?? null),
      }));
      setEditingPersonal(false);
    } catch {
      setPersonalError("Erro inesperado");
    }
  }
  function startEditAddress(a: Session["addresses"][number]) {
    setEditAddrId(a.id);
    setEditAddrForm({
      cep: a.cep || "",
      endereco: a.endereco || "",
      numero: a.numero || "",
      complemento: a.complemento || "",
      bairro: a.bairro || "",
      cidade: a.cidade || "",
      estado: a.estado || "",
      label: a.label || "",
    });
  }
  function cancelEditAddress() { setEditAddrId(null); }
  async function saveEditAddress() {
    if (!editAddrId) return;
    setAddrError(null);
    try {
      const payload = { ...editAddrForm, cep: onlyDigits(editAddrForm.cep || "") };
      const res = await fetch(`/api/addresses/${editAddrId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const r = await fetch("/api/addresses", { cache: "no-store" });
        const list = await r.json().catch(() => []);
        setAddresses(Array.isArray(list) ? list : []);
        setEditAddrId(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setAddrError(d?.detail || "Falha ao atualizar endereço");
      }
    } catch {
      setAddrError("Erro inesperado");
    }
  }

  async function saveAddress() {
    setAddrError(null);
    const required = ["cep", "endereco", "numero", "bairro", "cidade", "estado"] as const;
    for (const k of required) {
      if (!(addr as any)[k]) { setAddrError(`Campo obrigatório: ${k}`); return; }
    }
    setAddrSaving(true);
    try {
      const payload = { ...addr, cep: (addr.cep || "").replace(/\D/g, "") };
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const r = await fetch("/api/addresses", { cache: "no-store" });
        const list = await r.json().catch(() => []);
        setAddresses(Array.isArray(list) ? list : []);
        setNewAddrOpen(false);
        setAddr({ cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", label: "Entrega" });
      } else {
        const d = await res.json().catch(() => ({}));
        setAddrError(d?.detail || "Falha ao salvar endereço");
      }
    } catch {
      setAddrError("Erro inesperado");
    } finally {
      setAddrSaving(false);
    }
  }

  async function makeDefaultDelivery(id: number) {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default_delivery: true }),
      });
      if (res.ok) {
        const r = await fetch("/api/addresses", { cache: "no-store" });
        const list = await r.json().catch(() => []);
        setAddresses(Array.isArray(list) ? list : []);
      }
    } catch {}
  }

  async function removeAddress(id: number) {
    if (!confirm("Remover este endereço?")) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (res.ok) {
        const r = await fetch("/api/addresses", { cache: "no-store" });
        const list = await r.json().catch(() => []);
        setAddresses(Array.isArray(list) ? list : []);
      }
    } catch {}
  }

  // Busca endereço pelo CEP (novo endereço)
  async function lookupCEPNew() {
    const digits = onlyDigits(addr.cep || "");
    if (digits.length !== 8) return;
    setCepNewError(null);
    setCepNewLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) {
        setCepNewError("CEP não encontrado");
      } else {
        setAddr((s) => ({
          ...s,
          endereco: data.logradouro || "",
          complemento: data.complemento || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: (data.uf || "").toUpperCase(),
        }));
      }
    } catch {
      setCepNewError("Falha ao buscar CEP");
    } finally {
      setCepNewLoading(false);
    }
  }

  // Busca endereço pelo CEP (editar endereço)
  async function lookupCEPEdit() {
    const digits = onlyDigits(editAddrForm.cep || "");
    if (digits.length !== 8) return;
    setCepEditError(null);
    setCepEditLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) {
        setCepEditError("CEP não encontrado");
      } else {
        setEditAddrForm((s) => ({
          ...s,
          endereco: data.logradouro || "",
          complemento: data.complemento || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: (data.uf || "").toUpperCase(),
        }));
      }
    } catch {
      setCepEditError("Falha ao buscar CEP");
    } finally {
      setCepEditLoading(false);
    }
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b" style={{ backgroundColor: "#C9DAC7" }}>
          <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-xl font-semibold" style={{ color: "#3F5F4F" }}>Perfil</h1>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-sm" style={{ color: "#3F5F4F" }}>Carregando...</p>
        </main>
      </div>
    );
  }

  if (!isLogged) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b" style={{ backgroundColor: "#C9DAC7" }}>
          <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-xl font-semibold" style={{ color: "#3F5F4F" }}>Perfil</h1>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="max-w-lg">
            <h2 className="text-2xl font-semibold" style={{ color: "#3F5F4F" }}>Acesse para ver seu perfil</h2>
            <p className="mt-2 text-sm" style={{ color: "#3F5F4F" }}>
              Faça login para acessar seus dados pessoais, endereços e pedidos.
            </p>
            <div className="mt-6">
              <Link href="/login?next=/perfil" className="inline-block">
                <Button className="bg-primary text-black">Entrar</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b" style={{ backgroundColor: "#C9DAC7" }}>
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ color: "#3F5F4F" }}>Olá, {greeting || "cliente"}!</h1>
          <Button className="bg-transparent text-[#3F5F4F] hover:bg-[#C9DAC7]" onClick={onLogout}>Sair</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3">
            <nav className="space-y-2">
              {[
                { key: "dados", label: "Dados pessoais" },
                { key: "enderecos", label: "Endereços" },
                { key: "autenticacao", label: "Autenticação" },
                { key: "pedidos", label: "Pedidos" },
                { key: "sair", label: "Sair" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => (item.key === "sair" ? onLogout() : setSection(item.key as Section))}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    section === item.key ? "bg-[#C9DAC7]" : "bg-white"
                  }`}
                  style={{ color: "#3F5F4F", borderColor: "#C9DAC7" }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <section className="col-span-12 md:col-span-9">
            {section === "dados" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold" style={{ color: "#3F5F4F" }}>Dados pessoais</h2>
                <div className="grid grid-cols-2 gap-6 rounded-md border p-6" style={{ borderColor: "#C9DAC7" }}>
                  <div>
                    <p className="text-xs text-[#3F5F4F]/70">Nome</p>
                    {editingPersonal ? (
                      <Input value={personName} onChange={(e) => setPersonName(e.target.value)} />
                    ) : (
                      <p className="mt-1 text-sm text-[#3F5F4F]">{session?.name || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#3F5F4F]/70">Email</p>
                    {editingPersonal ? (
                      <Input type="email" value={personEmail} onChange={(e) => setPersonEmail(e.target.value)} />
                    ) : (
                      <p className="mt-1 text-sm text-[#3F5F4F]">{session?.username || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#3F5F4F]/70">CPF</p>
                    {editingPersonal ? (
                      <Input value={personCPF} onChange={(e) => setPersonCPF(formatCPF(e.target.value))} placeholder="000.000.000-00" />
                    ) : (
                      <p className="mt-1 text-sm text-[#3F5F4F]">{formatCPF(session?.profile?.cpf)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#3F5F4F]/70">Telefone</p>
                    {editingPersonal ? (
                      <Input value={personPhone} onChange={(e) => setPersonPhone(formatPhone(e.target.value))} placeholder="(99) 99999-9999" />
                    ) : (
                      <p className="mt-1 text-sm text-[#3F5F4F]">{formatPhone(session?.profile?.telefone)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#3F5F4F]/70">Data de nascimento</p>
                    {editingPersonal ? (
                      <Input value={personDob} onChange={(e) => setPersonDob(formatDateBR(e.target.value))} placeholder="dd/mm/aaaa" />
                    ) : (
                      <p className="mt-1 text-sm text-[#3F5F4F]">{formatISODateToBR(session?.profile?.data_nascimento || null)}</p>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-between">
                    {personalError && <p className="text-sm text-red-600">{personalError}</p>}
                    {!editingPersonal ? (
                      <button className="text-sm" style={{ color: "#3F5F4F" }} onClick={() => setEditingPersonal(true)}>Editar</button>
                    ) : (
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => { setEditingPersonal(false); setPersonalError(null); }}>Cancelar</Button>
                        <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8]" onClick={savePersonal}>Salvar</Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-md border p-6" style={{ borderColor: "#C9DAC7" }}>
                  <h3 className="text-sm font-semibold" style={{ color: "#3F5F4F" }}>Newsletter</h3>
                  <p className="mt-1 text-xs text-[#3F5F4F]/70">Deseja receber e-mails com promoções?</p>
                  <label className="mt-3 inline-flex items-center gap-2 text-sm" style={{ color: "#3F5F4F" }}>
                    <input type="checkbox" />
                    Quero receber e-mails com promoções.
                  </label>
                </div>
              </div>
            )}

            {section === "enderecos" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold" style={{ color: "#3F5F4F" }}>Endereços</h2>
                <div className="space-y-4">
                  {addresses.length === 0 && (
                    <p className="text-sm text-[#3F5F4F]/70">Nenhum endereço cadastrado.</p>
                  )}
                  {addresses.map((a) => (
                    <div key={a.id} className="rounded-md border p-4 flex items-start justify-between" style={{ borderColor: "#C9DAC7" }}>
                      <div className="flex-1">
                        {editAddrId === a.id ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>Etiqueta</label>
                              <Input value={editAddrForm.label} onChange={(e) => setEditAddrForm((s) => ({ ...s, label: e.target.value }))} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>CEP</label>
                              <Input value={formatCEP(editAddrForm.cep)} onChange={(e) => setEditAddrForm((s) => ({ ...s, cep: formatCEP(e.target.value) }))} onBlur={lookupCEPEdit} placeholder="00000-000" />
                              {cepEditLoading && <p className="mt-1 text-xs text-[#3F5F4F]/70">Buscando endereço...</p>}
                              {cepEditError && <p className="mt-1 text-xs text-red-600">{cepEditError}</p>}
                            </div>
                            <div>
                              <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>Endereço</label>
                              <Input value={editAddrForm.endereco} onChange={(e) => setEditAddrForm((s) => ({ ...s, endereco: e.target.value }))} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>Número</label>
                              <Input value={editAddrForm.numero} onChange={(e) => setEditAddrForm((s) => ({ ...s, numero: e.target.value }))} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>Complemento</label>
                              <Input value={editAddrForm.complemento} onChange={(e) => setEditAddrForm((s) => ({ ...s, complemento: e.target.value }))} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>Bairro</label>
                              <Input value={editAddrForm.bairro} onChange={(e) => setEditAddrForm((s) => ({ ...s, bairro: e.target.value }))} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>Cidade</label>
                              <Input value={editAddrForm.cidade} onChange={(e) => setEditAddrForm((s) => ({ ...s, cidade: e.target.value }))} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>Estado</label>
                              <Input value={editAddrForm.estado} onChange={(e) => setEditAddrForm((s) => ({ ...s, estado: e.target.value }))} />
                            </div>
                            <div className="col-span-1 md:col-span-2 flex gap-3 mt-2">
                              <Button variant="outline" onClick={cancelEditAddress}>Cancelar</Button>
                              <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8]" onClick={saveEditAddress}>Salvar</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium" style={{ color: "#3F5F4F" }}>{a.label}</p>
                            <p className="text-sm text-[#3F5F4F]/80">
                              {a.endereco}, {a.numero} — {a.bairro} — {a.cidade}/{a.estado} • CEP {a.cep}
                            </p>
                            {a.complemento && (
                              <p className="text-xs text-[#3F5F4F]/70">Complemento: {a.complemento}</p>
                            )}
                            {a.is_default_delivery && (
                              <span className="mt-1 inline-block rounded bg-[#C9DAC7] px-2 py-0.5 text-xs text-[#3F5F4F]">Entrega padrão</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {editAddrId !== a.id && (
                          <button className="text-sm hover:underline" style={{ color: "#3F5F4F" }} onClick={() => startEditAddress(a)}>Editar</button>
                        )}
                        {!a.is_default_delivery && (
                          <button className="text-sm hover:underline" style={{ color: "#3F5F4F" }} onClick={() => makeDefaultDelivery(a.id)}>Tornar padrão</button>
                        )}
                        <button className="text-sm hover:underline" style={{ color: "#3F5F4F" }} onClick={() => removeAddress(a.id)}>Remover</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Novo endereço */}
                <div className="rounded-md border p-6" style={{ borderColor: "#C9DAC7" }}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold" style={{ color: "#3F5F4F" }}>Adicionar novo endereço</h3>
                    <button className="text-sm hover:underline" style={{ color: "#3F5F4F" }} onClick={() => setNewAddrOpen((v) => !v)}>
                      {newAddrOpen ? "Fechar" : "Novo endereço"}
                    </button>
                  </div>
                  {newAddrOpen && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm" style={{ color: "#3F5F4F" }}>CEP</label>
                        <Input value={formatCEP(addr.cep)} onChange={(e) => setAddr((s) => ({ ...s, cep: formatCEP(e.target.value) }))} onBlur={lookupCEPNew} placeholder="00000-000" />
                        {cepNewLoading && <p className="mt-1 text-xs text-[#3F5F4F]/70">Buscando endereço...</p>}
                        {cepNewError && <p className="mt-1 text-xs text-red-600">{cepNewError}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm" style={{ color: "#3F5F4F" }}>Endereço</label>
                        <Input value={addr.endereco} onChange={(e) => setAddr((s) => ({ ...s, endereco: e.target.value }))} placeholder="Rua, Av..." />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm" style={{ color: "#3F5F4F" }}>Número</label>
                        <Input value={addr.numero} onChange={(e) => setAddr((s) => ({ ...s, numero: e.target.value }))} placeholder="Número" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm" style={{ color: "#3F5F4F" }}>Complemento</label>
                        <Input value={addr.complemento} onChange={(e) => setAddr((s) => ({ ...s, complemento: e.target.value }))} placeholder="Apto, bloco..." />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm" style={{ color: "#3F5F4F" }}>Bairro</label>
                        <Input value={addr.bairro} onChange={(e) => setAddr((s) => ({ ...s, bairro: e.target.value }))} placeholder="Bairro" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm" style={{ color: "#3F5F4F" }}>Cidade</label>
                        <Input value={addr.cidade} onChange={(e) => setAddr((s) => ({ ...s, cidade: e.target.value }))} placeholder="Cidade" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm" style={{ color: "#3F5F4F" }}>Estado</label>
                        <Input value={addr.estado} onChange={(e) => setAddr((s) => ({ ...s, estado: e.target.value.toUpperCase() }))} placeholder="UF" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm" style={{ color: "#3F5F4F" }}>Etiqueta</label>
                        <Input value={addr.label} onChange={(e) => setAddr((s) => ({ ...s, label: e.target.value }))} placeholder="Casa, Trabalho..." />
                      </div>
                      {addrError && <p className="text-xs text-red-600 md:col-span-2">{addrError}</p>}
                      <div className="md:col-span-2 flex justify-end">
                        <Button className="bg-primary text-black" disabled={addrSaving} onClick={saveAddress}>
                          {addrSaving ? "Salvando..." : "Salvar endereço"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === "autenticacao" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold" style={{ color: "#3F5F4F" }}>Autenticação</h2>
                <div className="rounded-md border p-6 space-y-4" style={{ borderColor: "#C9DAC7" }}>
                  <p className="text-sm" style={{ color: "#3F5F4F" }}>Usuário: <span className="font-medium">{session?.username}</span></p>
                  <ChangePasswordForm />
                  <div className="pt-2">
                    <Button className="bg-transparent text-[#3F5F4F] hover:bg-[#C9DAC7]" onClick={onLogout}>Sair da conta</Button>
                  </div>
                </div>
              </div>
            )}

            {section === "pedidos" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold" style={{ color: "#3F5F4F" }}>Pedidos</h2>
                {loadingOrders ? (
                  <p className="text-sm text-[#3F5F4F]/70">Carregando pedidos...</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-[#3F5F4F]/70">Nenhum pedido encontrado.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => (
                      <div key={o.id} className="rounded-md border p-4" style={{ borderColor: "#C9DAC7" }}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium" style={{ color: "#3F5F4F" }}>Pedido #{o.order_number}</p>
                          <span className="text-xs rounded bg-[#C9DAC7] px-2 py-0.5" style={{ color: "#3F5F4F" }}>{o.status}</span>
                        </div>
                        <p className="mt-1 text-sm text-[#3F5F4F]/80">Total: {currencyBRL(o.total)}</p>
                        {o.items && o.items.length > 0 && (
                          <ul className="mt-2 text-sm text-[#3F5F4F]/80 list-disc pl-5">
                            {o.items.slice(0, 3).map((it) => (
                              <li key={it.id}>{it.title} × {it.quantity}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }
    if (newPassword.length < 6) {
      setError("Nova senha deve ter ao menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Confirmação não confere");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.detail || "Falha ao alterar senha");
      } else {
        setSuccess("Senha alterada com sucesso");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold" style={{ color: "#3F5F4F" }}>Alterar senha</h3>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>Senha atual</label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>Nova senha</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs" style={{ color: "#3F5F4F" }}>Confirmar nova senha</label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
        {success && <p className="md:col-span-2 text-sm text-green-700">{success}</p>}
        <div className="md:col-span-2 flex justify-end">
          <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8]" disabled={saving} onClick={submit}>
            {saving ? "Salvando..." : "Alterar senha"}
          </Button>
        </div>
      </div>
    </div>
  );
}