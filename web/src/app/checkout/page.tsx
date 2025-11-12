"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Heart, LogIn, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CartItem = { productId: number; title: string; price: number; image?: string; qty: number };

function currencyBRL(n: any): string {
  const num = Number(n || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function onlyDigits(s: string): string { return (s || "").replace(/\D/g, ""); }
function formatCEP(s: string): string { const d = onlyDigits(s).slice(0, 8); if (d.length <= 5) return d; return `${d.slice(0, 5)}-${d.slice(5)}`; }

export default function CheckoutPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<{ logged_in: boolean; username: string | null; name: string | null; address?: any; addresses?: any[]; defaultDeliveryAddressId?: number | null } | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  // Carregar sessão
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { logged_in: false, username: null }))
      .then((d) => setSession(d))
      .catch(() => {});
  }, []);

  // Carregar carrinho do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart_items");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("cart_items", JSON.stringify(items)); } catch {}
  }, [items]);

  // Etapas
  const steps = ["Login", "Sacola", "Endereço", "Frete", "Pagamento", "Finalizar"] as const;
  const startParam = useMemo(() => {
    const s = Number(search.get("start"));
    if (!Number.isNaN(s) && s >= 0 && s <= 5) return s as 0 | 1 | 2 | 3 | 4 | 5;
    return (session?.logged_in ? 1 : 0) as 0 | 1 | 2 | 3 | 4 | 5;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, session?.logged_in]);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  useEffect(() => { setStep(startParam); }, [startParam]);

  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => { setLoggedIn(!!session?.logged_in); }, [session?.logged_in]);

  // Login embutido
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: loginUser, password: loginPass }) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ detail: "Falha no login" }));
        setLoginError(d?.detail || "Falha no login");
      } else {
        try { await fetch("/api/auth/session", { cache: "no-store" }); } catch {}
        setLoggedIn(true);
        setStep(1);
      }
    } catch { setLoginError("Erro inesperado"); } finally { setLoginLoading(false); }
  }

  // Gestão de endereços
  const [addresses, setAddresses] = useState<any[]>(Array.isArray(session?.addresses) ? (session?.addresses as any[]) : []);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(session?.defaultDeliveryAddressId ?? null);
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(!(Array.isArray(session?.addresses) && session?.addresses.length > 0));
  const [address, setAddress] = useState({ cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" });
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const addr = session?.address;
    if (!addr) return;
    setAddress((prev) => ({
      cep: prev.cep || formatCEP(addr.cep || ""),
      endereco: prev.endereco || (addr.endereco || ""),
      numero: prev.numero || (addr.numero || ""),
      complemento: prev.complemento || (addr.complemento || ""),
      bairro: prev.bairro || (addr.bairro || ""),
      cidade: prev.cidade || (addr.cidade || ""),
      estado: prev.estado || (addr.estado || ""),
    }));
  }, [session]);

  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/addresses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (Array.isArray(data)) setAddresses(data); })
      .catch(() => {});
  }, [loggedIn]);

  useEffect(() => {
    if (selectedAddressId == null && Array.isArray(addresses) && addresses.length > 0) {
      const def = addresses.find((a: any) => !!a.is_default_delivery)?.id ?? addresses[0]?.id ?? null;
      if (def != null) setSelectedAddressId(Number(def));
    }
    setShowNewAddressForm(!(Array.isArray(addresses) && addresses.length > 0));
  }, [addresses]);

  async function lookupCEP() {
    const digits = onlyDigits(address.cep || "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data?.erro) {
        setAddress((a) => ({ ...a, endereco: data.logradouro || "", complemento: data.complemento || "", bairro: data.bairro || "", cidade: data.localidade || "", estado: (data.uf || "").toUpperCase() }));
      }
    } finally { setCepLoading(false); }
  }

  // Frete e pagamento
  const [shippingMethod, setShippingMethod] = useState<{ key: string; label: string; eta: string; price: number }>({ key: "gratis", label: "Grátis", eta: "5-7 dias", price: 0 });
  const shippingOptions: { key: string; label: string; eta: string; price: number }[] = [
    { key: "gratis", label: "Grátis", eta: "5-7 dias", price: 0 },
    { key: "expresso", label: "Expresso", eta: "2-3 dias", price: 25.9 },
  ];
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "boleto">("pix");
  const [card, setCard] = useState({ nome: "", numero: "", validade: "", cvv: "" });
  const [boletoCpf, setBoletoCpf] = useState<string>("");
  const [orderConfirmed, setOrderConfirmed] = useState<boolean>(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  function inc(productId: number) { setItems((prev: any) => prev.map((it: any) => (it.productId === productId ? { ...it, qty: it.qty + 1 } : it))); }
  function dec(productId: number) { setItems((prev: any) => prev.map((it: any) => (it.productId === productId ? { ...it, qty: Math.max(1, it.qty - 1) } : it))); }
  function remove(productId: number) { setItems((prev: any) => prev.filter((it: any) => it.productId !== productId)); }

  function isCartValid() { return !!loggedIn && items.length > 0; }
  function isAddressValid() {
    if (!loggedIn) return false;
    if (selectedAddressId != null) return true;
    if (showNewAddressForm) {
      const cepOk = onlyDigits(address.cep || "").length === 8;
      const obrigatorios = [address.endereco, address.numero, address.bairro, address.cidade, address.estado];
      const filled = obrigatorios.every((v) => !!String(v || "").trim());
      return cepOk && filled;
    }
    return false;
  }
  function isShippingValid() { return isAddressValid() && !!shippingMethod?.key; }
  function isPaymentValid() {
    if (!isShippingValid()) return false;
    if (paymentMethod === "pix") return true;
    if (paymentMethod === "cartao") {
      const numOk = onlyDigits(card.numero || "").length >= 13;
      const nomeOk = !!(card.nome || "").trim();
      const valOk = !!(card.validade || "").trim();
      const cvvOk = onlyDigits(card.cvv || "").length >= 3;
      return numOk && nomeOk && valOk && cvvOk;
    }
    if (paymentMethod === "boleto") {
      return onlyDigits(boletoCpf || "").length === 11;
    }
    return false;
  }
  function maxAllowedStep(): 0 | 1 | 2 | 3 | 4 | 5 {
    if (!loggedIn) return 0;
    if (!isCartValid()) return 1;
    if (!isAddressValid()) return 2;
    if (!isShippingValid()) return 3;
    if (!isPaymentValid()) return 4;
    return 5;
  }
  const allowedStep = maxAllowedStep();

  async function createAddress(label?: string) {
    setError(null);
    const required = ["cep", "endereco", "numero", "bairro", "cidade", "estado"] as const;
    for (const k of required) { if (!(address as any)[k]) { setError(`Campo obrigatório: ${k}`); return; } }
    const payload = { ...address, label: label || "Entrega", cep: onlyDigits(address.cep || "") };
    const res = await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      const created = await res.json().catch(() => null);
      if (created && created.id) {
        setAddresses((prev: any[]) => [created, ...prev]);
        setSelectedAddressId(Number(created.id));
        setShowNewAddressForm(false);
      }
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d?.detail || "Falha ao salvar endereço");
    }
  }

  async function finalizeOrder() {
    setError(null);
    const selected = addresses.find((a: any) => a.id === selectedAddressId) || address;
    if (!("id" in (selected as any))) {
      const required = ["cep", "endereco", "numero", "bairro", "cidade", "estado"] as const;
      for (const k of required) { if (!(selected as any)[k]) { setError(`Campo obrigatório: ${k}`); return; } }
    }
    if (paymentMethod === "cartao") {
      const cleanNum = onlyDigits(card.numero || "");
      if (!card.nome || cleanNum.length < 13 || !card.validade || onlyDigits(card.cvv || "").length < 3) {
        setError("Preencha os dados do cartão corretamente");
        return;
      }
    }
    if (paymentMethod === "boleto") {
      if (onlyDigits(boletoCpf || "").length !== 11) { setError("Informe um CPF válido para boleto"); return; }
    }
    const payload = {
      items: items.map((it) => ({ product_id: it.productId, title: it.title, image_url: it.image, unit_price: it.price, quantity: it.qty })),
      delivery_address_id: (selected as any)?.id,
      shipping_method: shippingMethod.key,
      payment_method: paymentMethod,
    } as any;
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      const num = (d?.order_number ?? d?.order?.order_number ?? d?.order?.orderNumber ?? d?.orderNumber) ?? null;
      if (num) setOrderNumber(String(num));
      setOrderConfirmed(true);
      try { localStorage.removeItem("cart_items"); } catch {}
      setItems([]);
      try { window.dispatchEvent(new CustomEvent("orders-updated")); } catch {}
    } else {
      setError(d?.detail || "Falha ao finalizar pedido");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8 py-6 text-[15px] md:text-base leading-relaxed">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold text-[#3F5F4F]">Checkout</h1>
        <div className="flex items-center gap-2 text-[#3F5F4F]">
          <Heart size={18} />
          <span className="text-sm md:text-base">Um toque de carinho para você</span>
        </div>
      </div>
      <div className="mt-2 text-xs">
        <Link href="/loja" className="text-[#3F5F4F]/70 hover:text-primary">← Voltar à loja</Link>
      </div>

      {/* Indicador de progresso */}
      <div className="mt-4">
        <div className="flex items-center gap-2 text-sm md:text-base">
          {steps.map((label, idx) => {
            const isCurrent = idx === step;
            const isCompleted = idx < step;
            const isLocked = idx > allowedStep;
            const dim = isLocked && !isCompleted && !isCurrent;
            const base = isCurrent
              ? "bg-[#3F5F4F] text-white"
              : isCompleted
                ? "bg-[#C9DAC7] text-[#3F5F4F]"
                : "bg-muted text-[#3F5F4F]/80";
            return (
              <div key={label} className="flex items-center gap-2">
                <button
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${base} ${dim ? "opacity-60 cursor-not-allowed" : ""} transition-transform hover:scale-[1.02] shadow-sm ${isCurrent ? "active-step" : ""}`}
                  onClick={() => { if (!isLocked) setStep(idx as 0 | 1 | 2 | 3 | 4 | 5); }}
                  disabled={isLocked}
                >
                  {isCompleted ? (
                    <CheckCircle size={16} className="text-[#2f4a3f]" />
                  ) : (
                    <span className="font-medium">{idx + 1}</span>
                  )}
                  <span>{label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <span className={`h-px w-12 md:w-16 ${idx < step ? "bg-[#BFD5C8]" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Container das etapas */}
      <div className="mt-4 space-y-6">
        {/* Login */}
        {step === 0 && (
          <div className="step-transition-enter">
            {loggedIn ? (
              <div className="rounded border bg-green-50 p-3 text-sm text-green-700">Você já está autenticado.</div>
            ) : (
              <form onSubmit={onLoginSubmit} className="mx-auto max-w-md grid gap-3 rounded border bg-[#C9DAC7]/30 p-4">
                <div>
                  <label className="mb-1 block text-sm text-[#3F5F4F]">Email</label>
                  <Input type="email" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="voce@exemplo.com" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#3F5F4F]">Senha</label>
                  <Input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="••••••••" />
                </div>
                {loginError && <p className="text-xs text-red-600">{loginError}</p>}
                <div className="flex items-center justify-between">
                  <Button className="bg-[#3F5F4F] text-white hover:bg-[#2f4a3f] transition-colors" type="submit" disabled={loginLoading}>
                    {loginLoading ? "Entrando..." : (
                      <span className="inline-flex items-center gap-1.5"><LogIn size={16} /> Entrar</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
            <div className="mt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="text-xs hover:text-primary">Ir para sacola</button>
              <Button className="bg-[#3F5F4F] text-white hover:bg-[#2f4a3f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(2)} disabled={!loggedIn}>Ir para endereço</Button>
            </div>
          </div>
        )}

        {/* Sacola */}
        {step === 1 && (
          <div className="step-transition-enter space-y-4">
            {items.length === 0 && <p className="text-base text-[#3F5F4F]/80">Sua sacola está vazia.</p>}
            {items.map((it) => (
              <div key={it.productId} className="flex items-center gap-3 rounded border bg-[#C9DAC7]/20 p-3">
                <div className="h-16 w-16 rounded bg-muted" style={{ backgroundImage: it.image ? `url(${it.image})` : undefined, backgroundSize: "cover" }} />
                <div className="flex-1">
                  <div className="text-base font-medium tracking-tight text-[#2f4a3f]">{it.title}</div>
                  <div className="text-sm text-[#3F5F4F]/70">{currencyBRL(it.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => dec(it.productId)} className="rounded border px-2 py-1 text-sm hover:bg-[#C9DAC7]/40">-</button>
                  <span className="text-sm">{it.qty}</span>
                  <button onClick={() => inc(it.productId)} className="rounded border px-2 py-1 text-sm hover:bg-[#C9DAC7]/40">+</button>
                </div>
                <button onClick={() => remove(it.productId)} className="text-sm text-red-600 hover:underline">Remover</button>
              </div>
            ))}
            <div className="flex items-center justify-between rounded bg-[#C9DAC7]/30 px-4 py-3 text-base">
              <span className="font-medium text-[#3F5F4F]">Total</span>
              <span className="font-semibold text-[#2f4a3f]">{currencyBRL(total)}</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button className="bg-[#3F5F4F] text-white hover:bg-[#2f4a3f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(2)} disabled={!isCartValid()}>Continuar</Button>
            </div>
          </div>
        )}

        {/* Endereço */}
        {step === 2 && (
          <div className="step-transition-enter space-y-4">
            {Array.isArray(addresses) && addresses.length > 0 && (
              <div className="space-y-2">
                <div className="text-base font-semibold tracking-tight text-[#3F5F4F]">Selecione um endereço de entrega</div>
                <div className="space-y-2">
                  {addresses.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-2 rounded border bg-[#C9DAC7]/20 p-3 text-sm">
                      <input type="checkbox" checked={selectedAddressId === a.id} onChange={(e) => setSelectedAddressId(e.target.checked ? a.id : null)} />
                      <span>{a.label || "Entrega"} • {a.endereco}, {a.numero} — {a.bairro}, {a.cidade}/{a.estado} • CEP {formatCEP(a.cep)}</span>
                      {a.is_default_delivery && <span className="ml-auto rounded bg-[#C9DAC7] px-2 py-0.5 text-[11px] text-[#1f3b2f]">Padrão</span>}
                      <label className="ml-auto flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={!!a.is_default_delivery}
                          onChange={async (e) => {
                            try {
                              const res = await fetch(`/api/addresses/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_default_delivery: e.target.checked }) });
                              if (res.ok) {
                                const checked = e.target.checked;
                                setAddresses((prev: any[]) => prev.map((x) => ({ ...x, is_default_delivery: x.id === a.id ? checked : false })));
                                if (checked) setSelectedAddressId(a.id);
                              }
                            } catch {}
                          }}
                        />
                        <span className="text-[11px]">Principal</span>
                      </label>
                    </div>
                  ))}
                </div>
                {Array.isArray(addresses) && addresses.length > 0 && !selectedAddressId && (
                  <p className="text-sm text-[#3F5F4F]/70">Selecione um endereço para continuar.</p>
                )}
                <div className="flex justify-between">
                  <button onClick={() => setShowNewAddressForm((v) => !v)} className="text-sm hover:text-primary">
                    {showNewAddressForm ? "Cancelar novo endereço" : "Cadastrar novo endereço"}
                  </button>
                  <Button className="bg-[#3F5F4F] text-white hover:bg-[#2f4a3f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(3)} disabled={!loggedIn || !selectedAddressId}>Usar este endereço</Button>
                </div>
              </div>
            )}

            {showNewAddressForm && (
              <>
                {session?.address && (
                  <div className="mb-2">
                    <button type="button" className="text-xs text-primary hover:underline" onClick={() => createAddress("Cadastro")}>Usar endereço do cadastro</button>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-sm text-[#3F5F4F]">CEP</label>
                    <Input value={address.cep} onChange={(e) => setAddress({ ...address, cep: formatCEP(e.target.value) })} onBlur={lookupCEP} placeholder="00000-000" />
                    {cepLoading && <p className="mt-1 text-sm text-[#3F5F4F]/70">Buscando endereço...</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm text-[#3F5F4F]">Endereço</label>
                    <Input value={address.endereco} onChange={(e) => setAddress({ ...address, endereco: e.target.value })} placeholder="Rua Exemplo" />
                  </div>
                </div>
              </>
            )}

            {showNewAddressForm && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm text-[#3F5F4F]">Número</label>
                  <Input value={address.numero} onChange={(e) => setAddress({ ...address, numero: e.target.value })} placeholder="123" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#3F5F4F]">Complemento</label>
                  <Input value={address.complemento} onChange={(e) => setAddress({ ...address, complemento: e.target.value })} placeholder="Apto, bloco, etc." />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#3F5F4F]">Bairro</label>
                  <Input value={address.bairro} onChange={(e) => setAddress({ ...address, bairro: e.target.value })} placeholder="Centro" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#3F5F4F]">Cidade</label>
                  <Input value={address.cidade} onChange={(e) => setAddress({ ...address, cidade: e.target.value })} placeholder="São Paulo" />
                </div>
              </div>
            )}

            {showNewAddressForm && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm text-[#3F5F4F]">Estado (UF)</label>
                  <Input value={address.estado} onChange={(e) => setAddress({ ...address, estado: e.target.value.toUpperCase() })} placeholder="SP" />
                </div>
                <div className="sm:col-span-2 flex items-end justify-end">
                  <Button className="bg-[#3F5F4F] text-white hover:bg-[#2f4a3f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(3)} disabled={!isAddressValid()}>Ir para frete</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Frete */}
        {step === 3 && (
          <div className="step-transition-enter space-y-4">
            <div className="rounded border bg-[#C9DAC7]/30 p-4 text-base">
              <div className="text-lg font-semibold text-[#3F5F4F]">Selecione o frete</div>
              <div className="mt-2 space-y-2">
                {shippingOptions.map((opt) => (
                  <label key={opt.key} className="flex items-center justify-between rounded border p-3 text-sm hover:bg-[#C9DAC7]/20">
                    <div className="flex items-center gap-2">
                      <input type="radio" name="shipping" checked={shippingMethod.key === opt.key} onChange={() => setShippingMethod(opt)} />
                      <span className="font-medium text-[#2f4a3f]">{opt.label}</span>
                      <span className="text-[#3F5F4F]/70">{opt.eta}</span>
                    </div>
                    <span className="text-[#2f4a3f]">{currencyBRL(opt.price)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="text-xs hover:text-primary">Voltar para endereço</button>
              <Button className="bg-[#3F5F4F] text-white hover:bg-[#2f4a3f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(4)} disabled={!isShippingValid()}>Ir para pagamento</Button>
            </div>
          </div>
        )}

        {/* Pagamento */}
        {step === 4 && (
          <div className="step-transition-enter space-y-4">
            <div className="rounded border bg-[#C9DAC7]/30 p-4 text-base">
              <div className="text-lg font-semibold text-[#3F5F4F]">Forma de pagamento</div>
              <div className="mt-2 flex gap-2">
                {[
                  { key: "pix", label: "PIX" },
                  { key: "cartao", label: "Cartão" },
                  { key: "boleto", label: "Boleto" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setPaymentMethod(m.key as any)}
                    className={`rounded px-3 py-1 transition-colors ${paymentMethod === m.key ? "bg-[#C9DAC7] text-[#1f3b2f] ring-1 ring-[#3F5F4F]" : "bg-muted text-[#3F5F4F]/80"}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {paymentMethod === "pix" && (
                <p className="mt-2 text-sm text-[#2f4a3f]">Geraremos um QR code após confirmar. Total: <span className="font-semibold">{currencyBRL(total)}</span></p>
              )}
              {paymentMethod === "cartao" && (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm text-[#3F5F4F]">Nome impresso no cartão</label>
                    <Input value={card.nome} onChange={(e) => setCard({ ...card, nome: e.target.value })} placeholder="Nome completo" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[#3F5F4F]">Número</label>
                    <Input value={card.numero} onChange={(e) => setCard({ ...card, numero: e.target.value })} placeholder="0000 0000 0000 0000" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[#3F5F4F]">Validade</label>
                    <Input value={card.validade} onChange={(e) => setCard({ ...card, validade: e.target.value })} placeholder="MM/AA" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[#3F5F4F]">CVV</label>
                    <Input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} placeholder="123" />
                  </div>
                </div>
              )}
              {paymentMethod === "boleto" && (
                <div className="mt-3">
                  <label className="mb-1 block text-sm text-[#3F5F4F]">CPF do pagador</label>
                  <Input value={boletoCpf} onChange={(e) => setBoletoCpf(e.target.value)} placeholder="000.000.000-00" />
                  <p className="mt-1 text-xs text-[#3F5F4F]/70">O boleto será gerado após confirmação.</p>
                </div>
              )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="text-xs hover:text-primary">Voltar para frete</button>
              <Button className="bg-[#3F5F4F] text-white hover:bg-[#2f4a3f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(5)} disabled={!isPaymentValid()}>Continuar</Button>
            </div>
          </div>
        )}

        {/* Finalizar */}
        {step === 5 && (
          <div className="step-transition-enter space-y-4">
            {!orderConfirmed ? (
              <>
                <div className="rounded border bg-[#C9DAC7]/30 p-5 text-base">
                  <div className="text-lg font-semibold">Resumo do pedido</div>
                  <div className="mt-2 space-y-2">
                    <div>
                      <div className="text-base font-medium">Itens</div>
                      <ul className="mt-1 space-y-1 text-base text-[#2f4a3f]">
                        {items.map((it) => (
                          <li key={it.productId} className="flex justify-between">
                            <span>{it.title} × {it.qty}</span>
                            <span>{currencyBRL(it.price * it.qty)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-base font-medium">Endereço</div>
                      <p className="text-base text-[#2f4a3f]">
                        {(() => {
                          const sel = addresses.find((a: any) => a.id === selectedAddressId) || address;
                          const cep = "cep" in sel ? sel.cep : sel?.cep;
                          const end = "endereco" in sel ? sel.endereco : sel?.endereco;
                          const num = "numero" in sel ? sel.numero : sel?.numero;
                          const bai = "bairro" in sel ? sel.bairro : sel?.bairro;
                          const cid = "cidade" in sel ? sel.cidade : sel?.cidade;
                          const uf = "estado" in sel ? sel.estado : sel?.estado;
                          return `${end}, ${num} — ${bai}, ${cid}/${uf} • CEP ${formatCEP(cep || "")}`;
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-base font-medium">Frete ({shippingMethod.label}, {shippingMethod.eta})</div>
                      <div className="text-base text-[#2f4a3f]">{currencyBRL(shippingMethod.price)}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-base font-medium">Pagamento</div>
                      <div className="text-base capitalize text-[#2f4a3f]">{paymentMethod}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-base font-semibold">Total</div>
                      <div className="text-base font-semibold text-[#2f4a3f]">{currencyBRL(total + shippingMethod.price)}</div>
                    </div>
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-between">
                  <button onClick={() => setStep(4)} className="text-base hover:text-primary">Voltar para pagamento</button>
                  <Button className="bg-[#3F5F4F] text-white hover:bg-[#2f4a3f] transition-colors" onClick={finalizeOrder}>Confirmar pedido</Button>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="rounded border bg-green-50 p-6 text-[#3F5F4F]">
                  <div className="text-2xl md:text-3xl font-semibold">Pedido confirmado!</div>
                  <div className="mt-2 text-lg md:text-xl">Número do pedido: <span className="font-bold">{orderNumber ?? "—"}</span></div>
                  <div className="mt-2 text-base md:text-lg">Em instantes enviaremos as instruções de pagamento.</div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] transition-colors" onClick={() => router.push("/perfil?tab=pedidos")}>Ver meus pedidos</Button>
                  <Button className="bg-[#3F5F4F] text-white hover:bg-[#2f4a3f] transition-colors" onClick={() => router.push("/loja")}>Continuar comprando</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}