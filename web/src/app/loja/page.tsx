"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Heart, LogIn, LogOut, ShoppingBag, ShoppingCart, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type Category = { id: number; name: string; slug: string };
type ProductImage = { url?: string | null; alt_text?: string | null; is_primary?: boolean };
type Product = {
  id: number;
  title: string;
  slug: string;
  brand?: string | null;
  price: number | string;
  compare_at_price?: number | string | null;
  free_shipping?: boolean;
  images?: ProductImage[];
};

function currencyBRL(n: any): string {
  const num = Number(n || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function LojaPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [session, setSession] = useState<{
    logged_in: boolean;
    username: string | null;
    name: string | null;
    address?: { cep: string; endereco: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string } | null;
    addresses?: { id: number; label?: string; cep: string; endereco: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string; is_default_delivery?: boolean }[];
    defaultDeliveryAddressId?: number | null;
  } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCadastro, setShowCadastro] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [startCheckoutStep, setStartCheckoutStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(1);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  type CartItem = { productId: number; title: string; price: number; image?: string; qty: number };
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/products", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Falha ao carregar produtos");
        return r.json();
      })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((e) => setError(e?.message || "Erro ao carregar produtos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { logged_in: false, username: null }))
      .then((d) => setSession(d))
      .catch(() => {});
  }, []);

  // Abrir sacola automaticamente vindo da página de produto
  useEffect(() => {
    try {
      const usp = new URLSearchParams(window.location.search);
      if (usp.get("openCart") === "1") {
        setStartCheckoutStep(session?.logged_in ? 1 : 0);
        setShowCart(true);
      } else if (usp.get("buyNow") === "1") {
        setStartCheckoutStep(session?.logged_in ? 2 : 0);
        setShowCart(true);
      }
    } catch {}
  }, [session?.logged_in]);

  // Carrinho: carregar e persistir
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart_items");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCartItems(parsed);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("cart_items", JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  function requireLogin(action: () => void) {
    if (session?.logged_in) {
      action();
    } else {
      setPendingAction(() => action);
      setShowLogin(true);
    }
  }

  function addToCart(p: Product, qty = 1) {
    const price = Number(p.price || 0);
    const img = (p.images || []).find((i) => i?.is_primary) || (p.images || [])[0];
    const image = getImageUrl(img?.url || undefined);
    setCartItems((prev) => {
      const existing = prev.find((it) => it.productId === p.id);
      if (existing) {
        return prev.map((it) => (it.productId === p.id ? { ...it, qty: it.qty + qty } : it));
      }
      return [...prev, { productId: p.id, title: p.title, price, image, qty }];
    });
  }

  function buyNow(p: Product) {
    addToCart(p, 1);
    const start = session?.logged_in ? 2 : 0; // login → endereço
    // 0: Login, 1: Sacola, 2: Endereço, 3: Frete, 4: Pagamento, 5: Finalizar
    setStartCheckoutStep(start as any);
    setShowCart(true);
  }

  function onAddToCart(p: Product) {
    addToCart(p, 1);
    const start = session?.logged_in ? 1 : 0;
    setStartCheckoutStep(start as any);
    setShowCart(true);
  }

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.title || "").toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Header
        query={query}
        setQuery={setQuery}
        session={session}
        onOpenLogin={() => setShowLogin(true)}
        onOpenCadastro={() => setShowCadastro(true)}
        onOpenCart={() => { setStartCheckoutStep(session?.logged_in ? 1 : 0); setShowCart(true); }}
        cartCount={cartItems.reduce((sum, it) => sum + it.qty, 0)}
      />
      <NavBar categories={categories} />
      <Banner />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-xl font-semibold text-primary">Produtos</h2>
        {loading ? (
          <div className="text-sm text-zinc-600">Carregando produtos...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <ProductGrid products={filtered} onAdd={onAddToCart} onBuy={buyNow} />
        )}
      </section>
      <Footer />

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onOpenCadastro={() => setShowCadastro(true)}
          onLoggedIn={async () => {
            // Atualiza sessão e executa ação pendente
            try {
              const r = await fetch("/api/auth/session", { cache: "no-store" });
              const d = await r.json();
              setSession(d);
            } catch {}
            const act = pendingAction;
            setPendingAction(null);
            if (act) act();
          }}
        />
      )}
      {showCadastro && (
        <CadastroModal onClose={() => setShowCadastro(false)} onOpenLogin={() => setShowLogin(true)} />
      )}
      {showCart && (
        <CartModal
          items={cartItems}
          setItems={setCartItems}
          startStep={startCheckoutStep}
          onClose={() => setShowCart(false)}
          session={session}
        />
      )}
    </div>
  );
}

function getImageUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  const url = String(u);
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/media/")) return url;
  if (url.startsWith("/media/")) return `/api/media${url.replace('/media', '')}`;
  return url;
}

function TopBar() {
  return (
    <div className="bg-primary/90 text-foreground/80">
      <div className="mx-auto max-w-6xl px-4 py-2 text-xs">
        Bem-vindo! Aproveite nossas ofertas.
      </div>
    </div>
  );
}

function Header({
  query,
  setQuery,
  session,
  onOpenLogin,
  onOpenCadastro,
  onOpenCart,
  cartCount,
}: {
  query: string;
  setQuery: (v: string) => void;
  session: { logged_in: boolean; username: string | null; name: string | null } | null;
  onOpenLogin: () => void;
  onOpenCadastro: () => void;
  onOpenCart: () => void;
  cartCount: number;
}) {
  async function onLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/loja";
  }
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
        <Link href="/loja" className="text-2xl font-bold text-primary">
          Sua Loja
        </Link>
        <div className="flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite aqui o que você procura..."
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div className="hidden gap-4 sm:flex">
          {session?.logged_in ? (
            <>
              <span className="text-sm">Olá, {session?.name || session?.username || "cliente"}!</span>
              <button onClick={onLogout} className="inline-flex items-center gap-1.5 text-sm hover:text-primary">
                <LogOut size={16} />
                Sair
              </button>
              <button onClick={onOpenCart} className="inline-flex items-center gap-1.5 text-sm hover:text-primary">
                <ShoppingBag size={16} />
                Minha sacola{cartCount ? ` (${cartCount})` : ""}
              </button>
            </>
          ) : (
            <>
              <button onClick={onOpenLogin} className="inline-flex items-center gap-1.5 text-sm hover:text-primary">
                <LogIn size={16} />
                Entrar
              </button>
              <button onClick={onOpenCadastro} className="text-sm hover:text-primary">Cadastrar-se</button>
              <button onClick={onOpenCart} className="inline-flex items-center gap-1.5 text-sm hover:text-primary">
                <ShoppingBag size={16} />
                Minha sacola{cartCount ? ` (${cartCount})` : ""}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavBar({ categories }: { categories: Category[] }) {
  return (
    <nav className="bg-primary/15">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex gap-4 overflow-x-auto py-2 text-sm">
          {categories.map((c) => (
            <a
              key={c.id}
              className="whitespace-nowrap hover:text-primary"
              href="#"
            >
              {c.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Banner() {
  return (
    <section className="bg-primary/10">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid items-center gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">
              Outubro está recheado de promoções!
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Nas compras acima de R$350 com produto infantil, ganhe um brinde!
            </p>
            <a
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium"
              href="#produtos"
            >
              Ver ofertas
            </a>
          </div>
          <div className="h-40 rounded-lg bg-gradient-to-br from-primary/60 to-primary/20 sm:h-52" />
        </div>
      </div>
    </section>
  );
}

function ProductGrid({ products, onAdd, onBuy }: { products: Product[]; onAdd: (p: Product) => void; onBuy: (p: Product) => void }) {
  return (
    <div id="produtos" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} onAdd={() => onAdd(p)} onBuy={() => onBuy(p)} />
      ))}
      {products.length === 0 && (
        <div className="col-span-full text-center text-sm text-zinc-600">
          Nenhum produto disponível
        </div>
      )}
    </div>
  );
}

function ProductCard({ p, onAdd, onBuy }: { p: Product; onAdd: () => void; onBuy: () => void }) {
  const img = (p.images || []).find((i) => i?.is_primary) || (p.images || [])[0];
  const onSale = Number(p.compare_at_price || 0) > Number(p.price || 0);
  const src = getImageUrl(img?.url || undefined);

  return (
    <div className="rounded-lg border bg-card p-3">
      <Link href={`/loja/produto/${p.slug}`} prefetch className="block">
        <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
          {src ? (
            <img
              src={src}
              alt={img?.alt_text || p.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
              Sem imagem
            </div>
          )}
        </div>
      </Link>
      <div className="mt-3 space-y-1">
        <Link href={`/loja/produto/${p.slug}`} prefetch className="line-clamp-2 text-sm font-medium hover:text-primary">{p.title}</Link>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">{currencyBRL(p.price)}</span>
          {onSale && (
            <span className="text-xs text-zinc-500 line-through">
              {currencyBRL(p.compare_at_price)}
            </span>
          )}
        </div>
        {p.free_shipping && (
          <span className="inline-block rounded bg-primary/20 px-2 py-1 text-xs text-primary">
            Frete grátis
          </span>
        )}
        <div className="mt-3 flex gap-2">
          <button onClick={onAdd} className="flex-1 rounded-md border px-3 py-2 text-xs hover:border-primary hover:text-primary inline-flex items-center justify-center gap-1.5">
            <ShoppingCart size={16} />
            Adicionar
          </button>
          <button onClick={onBuy} className="flex-1 rounded-md bg-rose-200 px-3 py-2 text-xs font-medium text-rose-900 hover:bg-rose-300 inline-flex items-center justify-center gap-1.5">
            <CreditCard size={16} />
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <h4 className="text-sm font-semibold text-primary">Sobre a Loja</h4>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            <li>História</li>
            <li>Nossas lojas</li>
            <li>Trabalhe conosco</li>
            <li>Seja um licenciado</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-primary">Ajuda & Suporte</h4>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            <li>Troca e devolução</li>
            <li>Política de privacidade</li>
            <li>Pagamento</li>
            <li>Acompanhar pedido</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-primary">Central de Atendimento</h4>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            <li>SAC: (11) 91166-4422</li>
            <li>WhatsApp: (11) 93339-9745</li>
            <li>Email: ecommerce@exemplo.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-zinc-600">
          Copyright © {new Date().getFullYear()} • Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div className="max-h-[85vh] overflow-y-auto rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div />
            <button onClick={onClose} className="text-sm hover:text-primary">Fechar</button>
          </div>
          <div className="px-4 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function LoginModal({ onClose, onOpenCadastro, onLoggedIn }: { onClose: () => void; onOpenCadastro: () => void; onLoggedIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ detail: "Falha no login" }));
        setError(d?.detail || "Falha no login");
      } else {
        try {
          await fetch("/api/auth/session", { cache: "no-store" });
        } catch {}
        onLoggedIn();
        onClose();
      }
    } catch (e) {
      setError("Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className="mx-auto max-w-md">
        <h2 className="text-lg font-semibold">Entrar</h2>
        <p className="text-xs text-zinc-600">Use seu email e senha para acessar.</p>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4">
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <Input type="email" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="voce@exemplo.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Senha</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-between">
            <Button className="bg-primary text-black" type="submit" disabled={loading}>
              {loading ? "Entrando..." : (
                <span className="inline-flex items-center gap-1.5">
                  <LogIn size={16} />
                  Entrar
                </span>
              )}
            </Button>
            <button type="button" onClick={() => { onClose(); onOpenCadastro(); }} className="text-sm hover:text-primary">Cadastrar-se</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function CartModal({ items, setItems, startStep, onClose, session }: { items: { productId: number; title: string; price: number; image?: string; qty: number }[]; setItems: (fn: (prev: any) => any) => void; startStep?: 0 | 1 | 2 | 3 | 4 | 5; onClose: () => void; session: { logged_in: boolean; username: string | null; name: string | null; address?: { cep: string; endereco: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string } | null; addresses?: { id: number; label?: string; cep: string; endereco: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string; is_default_delivery?: boolean }[]; defaultDeliveryAddressId?: number | null } | null }) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(startStep ?? (session?.logged_in ? 1 : 0));
  const [loggedIn, setLoggedIn] = useState<boolean>(!!session?.logged_in);
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  function inc(productId: number) {
    setItems((prev: any) => prev.map((it: any) => (it.productId === productId ? { ...it, qty: it.qty + 1 } : it)));
  }
  function dec(productId: number) {
    setItems((prev: any) => prev.map((it: any) => (it.productId === productId ? { ...it, qty: Math.max(1, it.qty - 1) } : it)));
  }
  function remove(productId: number) {
    setItems((prev: any) => prev.filter((it: any) => it.productId !== productId));
  }

  // Gestão de endereços (lista + novo)
  const [addresses, setAddresses] = useState<any[]>(Array.isArray(session?.addresses) ? (session?.addresses as any[]) : []);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(session?.defaultDeliveryAddressId ?? null);
  const [address, setAddress] = useState({ cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" });
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function onlyDigits(s: string): string { return (s || "").replace(/\D/g, ""); }
  function formatCEP(s: string): string { const d = onlyDigits(s).slice(0, 8); if (d.length <= 5) return d; return `${d.slice(0, 5)}-${d.slice(5)}`; }
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

  // Prefill endereço do cadastro (fallback para novo)
  useEffect(() => {
    const addr = session?.address;
    if (!addr) return;
    setAddress((prev) => {
      const next = { ...prev } as typeof prev;
      next.cep = prev.cep || formatCEP(addr.cep || "");
      next.endereco = prev.endereco || (addr.endereco || "");
      next.numero = prev.numero || (addr.numero || "");
      next.complemento = prev.complemento || (addr.complemento || "");
      next.bairro = prev.bairro || (addr.bairro || "");
      next.cidade = prev.cidade || (addr.cidade || "");
      next.estado = prev.estado || (addr.estado || "");
      return next;
    });
  }, [session]);

  // Fetch endereços quando logado
  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/addresses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAddresses(data);
      })
      .catch(() => {});
  }, [loggedIn]);

  // Login embutido (passo 0)
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ detail: "Falha no login" }));
        setLoginError(d?.detail || "Falha no login");
      } else {
        try { await fetch("/api/auth/session", { cache: "no-store" }); } catch {}
        setLoggedIn(true);
        setStep(1);
      }
    } catch {
      setLoginError("Erro inesperado");
    } finally {
      setLoginLoading(false);
    }
  }

  // Criar novo endereço e selecionar
  async function createAddress(label?: string) {
    setError(null);
    const required = ["cep", "endereco", "numero", "bairro", "cidade", "estado"] as const;
    for (const k of required) {
      if (!(address as any)[k]) { setError(`Campo obrigatório: ${k}`); return; }
    }
    const payload = { ...address, label: label || "Entrega", cep: onlyDigits(address.cep || "") };
    const res = await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      const created = await res.json().catch(() => null);
      if (created && created.id) {
        setAddresses((prev: any[]) => [created, ...prev]);
        setSelectedAddressId(Number(created.id));
      }
      setStep(3);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d?.detail || "Falha ao salvar endereço");
    }
  }

  async function finalizeOrder() {
    setError(null);
    // Obter endereço selecionado ou o preenchido
    const selected = addresses.find((a: any) => a.id === selectedAddressId) || address;
    // Se não houver na lista, validar o preenchido básico
    if (!("id" in (selected as any))) {
      const required = ["cep", "endereco", "numero", "bairro", "cidade", "estado"] as const;
      for (const k of required) {
        if (!(selected as any)[k]) { setError(`Campo obrigatório: ${k}`); return; }
      }
    }
    const payload = { items, address: selected, shipping: { method: "gratis", price: 0 }, total, method: "pix" };
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      setStep(5);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d?.detail || "Falha ao finalizar pedido");
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sua sacola</h2>
          <div className="flex items-center gap-2 text-rose-600">
            <Heart size={18} />
            <span className="text-xs">Um toque de carinho para você</span>
          </div>
        </div>
        <div className="mt-4 flex gap-3 text-xs">
          <button className={`rounded px-3 py-1 ${step === 0 ? "bg-rose-200 text-rose-900" : "bg-muted"}`} onClick={() => setStep(0)}>Login</button>
          <button className={`rounded px-3 py-1 ${step === 1 ? "bg-rose-200 text-rose-900" : "bg-muted"}`} onClick={() => setStep(1)}>Sacola</button>
          <button className={`rounded px-3 py-1 ${step === 2 ? "bg-rose-200 text-rose-900" : "bg-muted"}`} onClick={() => setStep(2)}>Endereço</button>
          <button className={`rounded px-3 py-1 ${step === 3 ? "bg-rose-200 text-rose-900" : "bg-muted"}`} onClick={() => setStep(3)}>Frete</button>
          <button className={`rounded px-3 py-1 ${step === 4 ? "bg-rose-200 text-rose-900" : "bg-muted"}`} onClick={() => setStep(4)}>Pagamento</button>
          <button className={`rounded px-3 py-1 ${step === 5 ? "bg-rose-200 text-rose-900" : "bg-muted"}`} onClick={() => setStep(5)}>Finalizar</button>
        </div>

        {step === 0 && (
          <div className="mt-4">
            {loggedIn ? (
              <div className="rounded border bg-green-50 p-3 text-sm text-green-700">Você já está autenticado.</div>
            ) : (
              <form onSubmit={onLoginSubmit} className="mx-auto max-w-md grid gap-3">
                <div>
                  <label className="mb-1 block text-sm">Email</label>
                  <Input type="email" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="voce@exemplo.com" />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Senha</label>
                  <Input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="••••••••" />
                </div>
                {loginError && <p className="text-xs text-red-600">{loginError}</p>}
                <div className="flex justify-end">
                  <Button className="bg-primary text-black" type="submit" disabled={loginLoading}>
                    {loginLoading ? "Entrando..." : (
                      <span className="inline-flex items-center gap-1.5"><LogIn size={16} /> Entrar</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
            <div className="mt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="text-xs hover:text-primary">Ir para sacola</button>
              <Button className="bg-rose-200 text-rose-900" onClick={() => setStep(2)} disabled={!loggedIn}>Ir para endereço</Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 space-y-3">
            {items.length === 0 && <p className="text-sm text-zinc-600">Sua sacola está vazia.</p>}
            {items.map((it) => (
              <div key={it.productId} className="flex items-center gap-3 rounded border p-3">
                <div className="h-14 w-14 rounded bg-muted" style={{ backgroundImage: it.image ? `url(${it.image})` : undefined, backgroundSize: "cover" }} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{it.title}</div>
                  <div className="text-xs text-zinc-600">{currencyBRL(it.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => dec(it.productId)} className="rounded border px-2 py-1 text-xs">-</button>
                  <span className="text-xs">{it.qty}</span>
                  <button onClick={() => inc(it.productId)} className="rounded border px-2 py-1 text-xs">+</button>
                </div>
                <button onClick={() => remove(it.productId)} className="text-xs text-red-600 hover:underline">Remover</button>
              </div>
            ))}
            <div className="flex items-center justify-between rounded bg-rose-50 px-3 py-2 text-sm">
              <span>Total</span>
              <span className="font-semibold text-rose-600">{currencyBRL(total)}</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button className="bg-rose-200 text-rose-900" onClick={() => setStep(2)} disabled={items.length === 0 || !loggedIn}>Continuar</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 space-y-3">
            {Array.isArray(addresses) && addresses.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Selecione um endereço de entrega</div>
                <div className="space-y-2">
                  {addresses.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-2 rounded border p-2 text-xs">
                      <input type="radio" name="selectedAddress" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} />
                      <span>{a.label || "Entrega"} • {a.endereco}, {a.numero} — {a.bairro}, {a.cidade}/{a.estado} • CEP {formatCEP(a.cep)}</span>
                      {a.is_default_delivery && <span className="ml-auto rounded bg-primary/20 px-2 py-0.5 text-[10px] text-primary">Padrão</span>}
                      {!a.is_default_delivery && (
                        <button
                          type="button"
                          className="ml-auto rounded border px-2 py-0.5 hover:bg-muted"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/addresses/${a.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ is_default_delivery: true }),
                              });
                              if (res.ok) {
                                setAddresses((prev: any[]) => prev.map((x) => ({ ...x, is_default_delivery: x.id === a.id })));
                              }
                            } catch {}
                          }}
                        >
                          Definir padrão
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-sm">CEP</label>
                <Input value={address.cep} onChange={(e) => setAddress({ ...address, cep: formatCEP(e.target.value) })} onBlur={lookupCEP} placeholder="00000-000" />
                {cepLoading && <p className="mt-1 text-xs text-zinc-600">Buscando endereço...</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">Endereço</label>
                <Input value={address.endereco} onChange={(e) => setAddress({ ...address, endereco: e.target.value })} placeholder="Rua Exemplo" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm">Número</label>
                <Input value={address.numero} onChange={(e) => setAddress({ ...address, numero: e.target.value })} placeholder="123" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Complemento</label>
                <Input value={address.complemento} onChange={(e) => setAddress({ ...address, complemento: e.target.value })} placeholder="Apto, bloco, etc." />
              </div>
              <div>
                <label className="mb-1 block text-sm">Bairro</label>
                <Input value={address.bairro} onChange={(e) => setAddress({ ...address, bairro: e.target.value })} placeholder="Centro" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Cidade</label>
                <Input value={address.cidade} onChange={(e) => setAddress({ ...address, cidade: e.target.value })} placeholder="São Paulo" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm">Estado (UF)</label>
                <Input value={address.estado} onChange={(e) => setAddress({ ...address, estado: e.target.value.toUpperCase() })} placeholder="SP" />
              </div>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="text-xs hover:text-primary">Voltar para sacola</button>
              <div className="flex gap-2">
                <Button variant={"outline" as any} className="border-rose-200 text-rose-900" onClick={() => createAddress()}>Salvar endereço</Button>
                <Button className="bg-rose-200 text-rose-900" onClick={() => setStep(3)} disabled={!loggedIn}>Ir para frete</Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 space-y-3">
            <div className="rounded border bg-primary/10 p-3 text-sm">
              <div className="font-semibold">Frete</div>
              <div className="text-zinc-700">Frete grátis para esta compra.</div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="text-xs hover:text-primary">Voltar para endereço</button>
              <Button className="bg-rose-200 text-rose-900" onClick={() => setStep(4)}>Ir para pagamento</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-4 space-y-4">
            <div className="rounded border bg-rose-50 p-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Heart size={18} />
                <span className="text-sm font-medium">Pagamento via Pix (instantâneo)</span>
              </div>
              <p className="mt-2 text-xs text-rose-900">Geraremos um QR code após confirmar. Total: <span className="font-semibold">{currencyBRL(total)}</span></p>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="text-xs hover:text-primary">Voltar para frete</button>
              <Button className="bg-rose-200 text-rose-900" onClick={finalizeOrder}>Confirmar pedido</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="mt-4 space-y-4">
            <div className="rounded border bg-green-50 p-3 text-sm text-green-700">
              <span>Pedido confirmado! Em instantes enviaremos instruções de pagamento.</span>
            </div>
            <div className="flex justify-end">
              <Button className="bg-rose-200 text-rose-900" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function CadastroModal({ onClose, onOpenLogin }: { onClose: () => void; onOpenLogin: () => void }) {
  type FormData = {
    nome: string;
    sobrenome: string;
    email: string;
    telefone?: string;
    senha: string;
    confirmSenha: string;
    cep: string;
    endereco: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cpf: string;
  };

  function onlyDigits(s: string): string {
    return (s || "").replace(/\D/g, "");
  }
  function formatCEP(s: string): string {
    const d = onlyDigits(s).slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  }
  function formatCPF(s: string): string {
    const d = onlyDigits(s).slice(0, 11);
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 9);
    const p4 = d.slice(9, 11);
    let out = p1;
    if (p2) out += `.${p2}`;
    if (p3) out += `.${p3}`;
    if (p4) out += `-${p4}`;
    return out;
  }
  function formatPhone(s: string): string {
    const d = onlyDigits(s).slice(0, 11);
    const area = d.slice(0, 2);
    const isMobile = d.length > 10;
    const first = isMobile ? d.slice(2, 7) : d.slice(2, 6);
    const last = isMobile ? d.slice(7, 11) : d.slice(6, 10);
    let out = "";
    if (area) out += `(${area})`;
    if (first) out += ` ${first}`;
    if (last) out += `-${last}`;
    return out;
  }
  function isValidCPF(raw: string): boolean {
    const cpf = onlyDigits(raw);
    if (!cpf || cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
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

  const schema = z.object({
    nome: z.string().min(2, "Informe seu nome"),
    sobrenome: z.string().min(2, "Informe seu sobrenome"),
    email: z.string().email("Email inválido"),
    telefone: z
      .string()
      .optional()
      .refine((v) => !v || onlyDigits(v).length === 10 || onlyDigits(v).length === 11, "Telefone deve ter 10 ou 11 dígitos"),
    senha: z.string().min(6, "Senha mínima de 6 caracteres"),
    confirmSenha: z.string().min(6, "Confirme sua senha"),
    cep: z.string().refine((v) => onlyDigits(v).length === 8, "CEP deve ter 8 dígitos"),
    endereco: z.string().min(3, "Endereço é obrigatório"),
    numero: z.string().min(1, "Número é obrigatório").refine((v) => /^\d+$/.test(v), "Número deve ser inteiro"),
    bairro: z.string().min(2, "Bairro é obrigatório"),
    cidade: z.string().min(2, "Cidade é obrigatória"),
    estado: z.string().transform((v) => v.toUpperCase()).refine((v) => /^[A-Z]{2}$/.test(v), "UF deve ter 2 letras"),
    cpf: z.string().refine(isValidCPF, "CPF inválido"),
  }).refine((data) => data.senha === data.confirmSenha, {
    path: ["confirmSenha"],
    message: "As senhas não coincidem",
  });

  const numeroRef = useRef<HTMLInputElement | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, getValues, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      sobrenome: "",
      email: "",
      telefone: "",
      senha: "",
      confirmSenha: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cpf: "",
    },
  });

  const numeroReg = register("numero");
  const cepVal = watch("cep");
  const cpfVal = watch("cpf");
  const telVal = watch("telefone");

  useEffect(() => { setValue("cep", formatCEP(cepVal || ""), { shouldValidate: false }); }, [cepVal]);
  useEffect(() => { setValue("cpf", formatCPF(cpfVal || ""), { shouldValidate: false }); }, [cpfVal]);
  useEffect(() => { setValue("telefone", formatPhone(telVal || ""), { shouldValidate: false }); }, [telVal]);

  async function lookupCEP() {
    const digits = onlyDigits(cepVal || "");
    if (digits.length !== 8) return;
    setCepError(null);
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) {
        setCepError("CEP não encontrado");
      } else {
        setValue("endereco", data.logradouro || "");
        setValue("complemento", data.complemento || "");
        setValue("bairro", data.bairro || "");
        setValue("cidade", data.localidade || "");
        setValue("estado", (data.uf || "").toUpperCase());
        numeroRef.current?.focus();
      }
    } catch {
      setCepError("Falha ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  }

  async function onSubmit(values: FormData) {
    const raw = getValues();
    const nomeCompleto = `${(values.nome || "").trim()} ${(values.sobrenome || "").trim()}`.trim();
    const { confirmSenha, ...base } = values;
    const payload = {
      ...base,
      nome: nomeCompleto,
      complemento: raw.complemento,
      cep: onlyDigits(values.cep),
      cpf: onlyDigits(values.cpf),
      telefone: onlyDigits(values.telefone || ""),
      estado: values.estado.toUpperCase(),
    };
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert("Cadastro realizado com sucesso! Faça login para continuar.");
      onClose();
      onOpenLogin();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d?.detail || "Falha ao cadastrar");
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className="mx-auto max-w-2xl">
        <h2 className="text-lg font-semibold">Cadastro de Cliente</h2>
        <p className="text-xs text-zinc-600">Preencha primeiro o CEP para auto-completar o endereço.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm">Nome</label>
              <Input {...register("nome")} placeholder="Seu nome" />
              {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Sobrenome</label>
              <Input {...register("sobrenome")} placeholder="Seu sobrenome" />
              {errors.sobrenome && <p className="mt-1 text-xs text-red-600">{errors.sobrenome.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Email</label>
              <Input type="email" {...register("email")} placeholder="voce@exemplo.com" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Senha</label>
              <Input type="password" {...register("senha")} placeholder="••••••••" />
              {errors.senha && <p className="mt-1 text-xs text-red-600">{errors.senha.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Confirmar senha</label>
              <Input type="password" {...register("confirmSenha")} placeholder="••••••••" />
              {errors.confirmSenha && <p className="mt-1 text-xs text-red-600">{errors.confirmSenha.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm">Telefone</label>
              <Input {...register("telefone")} placeholder="(99) 99999-9999" />
              {errors.telefone && <p className="mt-1 text-xs text-red-600">{errors.telefone.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">CEP</label>
              <Input {...register("cep")} placeholder="00000-000" onBlur={lookupCEP} />
              {cepLoading && <p className="mt-1 text-xs text-zinc-600">Buscando endereço...</p>}
              {(errors.cep || cepError) && (
                <p className="mt-1 text-xs text-red-600">{errors.cep?.message || cepError}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm">Endereço</label>
              <Input {...register("endereco")} placeholder="Rua Exemplo" />
              {errors.endereco && <p className="mt-1 text-xs text-red-600">{errors.endereco.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Número</label>
              <Input
                {...numeroReg}
                ref={(el) => {
                  numeroReg.ref(el);
                  numeroRef.current = el;
                }}
                placeholder="123"
              />
              {errors.numero && <p className="mt-1 text-xs text-red-600">{errors.numero.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm">Complemento</label>
              <Input {...register("complemento")} placeholder="Apto, bloco, etc." />
            </div>
            <div>
              <label className="mb-1 block text-sm">Bairro</label>
              <Input {...register("bairro")} placeholder="Centro" />
              {errors.bairro && <p className="mt-1 text-xs text-red-600">{errors.bairro.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Cidade</label>
              <Input {...register("cidade")} placeholder="São Paulo" />
              {errors.cidade && <p className="mt-1 text-xs text-red-600">{errors.cidade.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Estado (UF)</label>
              <Input {...register("estado")} placeholder="SP" />
              {errors.estado && <p className="mt-1 text-xs text-red-600">{errors.estado.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block text-sm">CPF</label>
              <Input {...register("cpf")} placeholder="000.000.000-00" />
              {errors.cpf && <p className="mt-1 text-xs text-red-600">{errors.cpf.message}</p>}
            </div>
          </div>

          <div>
            <Button className="bg-primary text-black" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}