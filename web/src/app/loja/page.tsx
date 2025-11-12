"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Heart, LogIn, LogOut, ShoppingBag, ShoppingCart, CreditCard, Truck, ChevronLeft, ChevronRight } from "lucide-react";
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
  category?: { id: number; name: string; slug: string } | null;
  brand?: string | null;
  price: number | string;
  compare_at_price?: number | string | null;
  free_shipping?: boolean;
  images?: ProductImage[];
};

// Tipos de pedido não são necessários na página da loja,
// pois a listagem de pedidos ficará somente na página de perfil.

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
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
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
  const router = useRouter();
  type CartItem = { productId: number; title: string; price: number; image?: string; qty: number };
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  // Removido estado de pedidos da página da loja.

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

  // Lê categoria da URL (?c=slug)
  useEffect(() => {
    try {
      const usp = new URLSearchParams(window.location.search);
      setCategorySlug(usp.get("c"));
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { logged_in: false, username: null }))
      .then((d) => setSession(d))
      .catch(() => {});
  }, []);

  // Removido carregamento e atualização de pedidos na home.

  // Redirecionar automaticamente para a página de checkout
  useEffect(() => {
    try {
      const usp = new URLSearchParams(window.location.search);
      if (usp.get("openCart") === "1") {
        const start = session?.logged_in ? 1 : 0;
        router.push(`/checkout?start=${start}`);
      } else if (usp.get("buyNow") === "1") {
        const start = session?.logged_in ? 2 : 0;
        router.push(`/checkout?start=${start}`);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Removido helper de requireLogin; fluxo segue diretamente para /checkout.

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
    router.push(`/checkout?start=${start}`);
  }

  function onAddToCart(p: Product) {
    addToCart(p, 1);
    const start = session?.logged_in ? 1 : 0;
    router.push(`/checkout?start=${start}`);
  }

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || (p.title || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q);
    const matchesCategory = !categorySlug || (p.category?.slug === categorySlug);
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topo e navegação são globais via AppChrome/Header */}
      <Banner />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-xl font-semibold text-[#3F5F4F]">Produtos</h2>
        {loading ? (
          <div className="text-sm text-[#3F5F4F]/80">Carregando produtos...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <ProductGrid products={filtered} onAdd={onAddToCart} onBuy={buyNow} />
        )}
      </section>
      {/* Removido bloco "Meus pedidos" da home. Os pedidos permanecem na página de perfil. */}
      {/* Rodapé global via AppChrome/Footer */}

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
            // Fecha modal após login; navegação ao checkout é feita via router nas ações.
            setShowLogin(false);
          }}
        />
      )}
      {showCadastro && (
        <CadastroModal onClose={() => setShowCadastro(false)} onOpenLogin={() => setShowLogin(true)} />
      )}
      {/* Checkout por modal foi desativado; navegação segue para /checkout */}
    </div>
  );
}

function getImageUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  const url = String(u);
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window !== "undefined") {
    if (url.startsWith("/api/media/")) return `${window.location.origin}${url}`;
    if (url.startsWith("/media/")) return `${window.location.origin}/api/media${url.replace('/media', '')}`;
  }
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

type BannerItem = { id?: number; image_url: string; link_url?: string; enabled?: boolean; order?: number };

function Banner() {
  const [items, setItems] = useState<BannerItem[]>([]);
  const [intervalSec, setIntervalSec] = useState<number>(10);
  const [index, setIndex] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/banners", { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          const arr: BannerItem[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
            ? data.items
            : [];
          const iv = Number(data?.interval_seconds ?? 10);
          if (!cancelled) {
            setItems(arr.filter((b) => b && (b.enabled ?? true)));
            setIntervalSec(Number.isFinite(iv) && iv > 0 ? iv : 10);
          }
          return;
        }
      } catch {}

      // Fallback localStorage para permitir uso imediato sem backend pronto
      try {
        const ls = typeof window !== "undefined" ? localStorage.getItem("home_banners") : null;
        const parsed = ls ? JSON.parse(ls) : [];
        const ivls = typeof window !== "undefined" ? Number(localStorage.getItem("home_banners_interval") || 10) : 10;
        if (!cancelled) {
          setItems(Array.isArray(parsed) ? parsed.filter((b: BannerItem) => b && (b.enabled ?? true)) : []);
          setIntervalSec(Number.isFinite(ivls) && ivls > 0 ? ivls : 10);
        }
      } catch {}
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (items.length > 1) {
      timerRef.current = window.setInterval(() => {
        setIndex((i) => (i + 1) % items.length);
      }, intervalSec * 1000) as unknown as number;
    }
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [items.length, intervalSec]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (items.length === 0) return;
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % items.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + items.length) % items.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  const goPrev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const goNext = () => setIndex((i) => (i + 1) % items.length);

  if (!items.length) return null;

  const current = items[index];
  const src = getImageUrl(current?.image_url);

  return (
    <section className="w-full bg-primary/10">
      <div className="w-full px-0">
        <div className="relative overflow-hidden">
          {/* Slides */}
          <div className="relative h-[55vh] sm:h-[65vh] md:h-[75vh] lg:h-[85vh]">
            {items.map((it, i) => {
              const img = getImageUrl(it.image_url);
              const active = i === index;
              const href = it.link_url || "#";
              return (
                <a
                  key={img + i}
                  href={href}
                  className={`absolute inset-0 block transition-opacity duration-700 ease-out ${active ? "opacity-100" : "opacity-0"}`}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={"banner"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-[#3F5F4F]/70">
                      Banner sem imagem
                    </div>
                  )}
                </a>
              );
            })}
          </div>

          {/* Controles */}
          <button
            aria-label="Anterior"
            onClick={goPrev}
            className="group absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur transition-colors hover:bg-black/40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Próximo"
            onClick={goNext}
            className="group absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur transition-colors hover:bg-black/40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
            {items.map((_, i) => (
              <span
                key={i}
                className={`pointer-events-auto h-2 w-2 rounded-full transition-all ${i === index ? "bg-white" : "bg-white/60"}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
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
        <div className="col-span-full text-center text-sm text-[#3F5F4F]/80">
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
            <div className="flex h-full w-full items-center justify-center text-sm text-[#3F5F4F]/70">
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
            <span className="text-xs text-[#3F5F4F]/70 line-through">
              {currencyBRL(p.compare_at_price)}
            </span>
          )}
        </div>
        {p.free_shipping && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#C9DAC7] px-3 py-1 text-xs text-[#3F5F4F]">
            <Truck size={12} />
            Frete grátis
          </span>
        )}
        <div className="mt-3 flex gap-2">
          <button onClick={onAdd} className="flex-1 rounded-md border px-3 py-2 text-xs inline-flex items-center justify-center gap-1.5 border-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] hover:border-[#BFD5C8] transition-colors">
            <ShoppingCart size={16} />
            Adicionar
          </button>
          <button onClick={onBuy} className="flex-1 rounded-md px-3 py-2 text-xs font-semibold bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] transition-colors inline-flex items-center justify-center gap-1.5">
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
          <ul className="mt-2 space-y-1 text-sm text-[#3F5F4F]/80">
            <li>História</li>
            <li>Nossas lojas</li>
            <li>Trabalhe conosco</li>
            <li>Seja um licenciado</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-primary">Ajuda & Suporte</h4>
          <ul className="mt-2 space-y-1 text-sm text-[#3F5F4F]/80">
            <li>Troca e devolução</li>
            <li>Política de privacidade</li>
            <li>Pagamento</li>
            <li>Acompanhar pedido</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-primary">Central de Atendimento</h4>
          <ul className="mt-2 space-y-1 text-sm text-[#3F5F4F]/80">
            <li>SAC: (11) 91166-4422</li>
            <li>WhatsApp: (11) 93339-9745</li>
            <li>Email: ecommerce@exemplo.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-[#3F5F4F]/70">
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
        <p className="text-xs text-[#3F5F4F]/70">Use seu email e senha para acessar.</p>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4">
          <div>
            <label className="mb-1 block text-sm text-[#3F5F4F]">Email</label>
            <Input type="email" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="voce@exemplo.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#3F5F4F]">Senha</label>
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

function CartModal({ items, setItems, startStep, onClose, onOpenCadastro, session }: { items: { productId: number; title: string; price: number; image?: string; qty: number }[]; setItems: (fn: (prev: any) => any) => void; startStep?: 0 | 1 | 2 | 3 | 4 | 5; onClose: () => void; onOpenCadastro: () => void; session: { logged_in: boolean; username: string | null; name: string | null; address?: { cep: string; endereco: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string } | null; addresses?: { id: number; label?: string; cep: string; endereco: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string; is_default_delivery?: boolean }[]; defaultDeliveryAddressId?: number | null } | null }) {
  const steps = ["Login", "Sacola", "Endereço", "Frete", "Pagamento", "Finalizar"] as const;
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
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(!(Array.isArray(session?.addresses) && session?.addresses.length > 0));
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

  // Após carregar endereços, pré-seleciona o padrão ou o primeiro e controla exibição do formulário de novo endereço
  useEffect(() => {
    if (selectedAddressId == null && Array.isArray(addresses) && addresses.length > 0) {
      const def = addresses.find((a: any) => !!a.is_default_delivery)?.id ?? addresses[0]?.id ?? null;
      if (def != null) setSelectedAddressId(Number(def));
    }
    setShowNewAddressForm(!(Array.isArray(addresses) && addresses.length > 0));
  }, [addresses]);

  // Persistir e restaurar progresso do checkout
  useEffect(() => {
    try {
      const saved = localStorage.getItem("checkout_step");
      if (saved !== null) {
        const s = Number(saved);
        if (s >= 0 && s <= 5) setStep(s as 0 | 1 | 2 | 3 | 4 | 5);
      } else if (startStep !== undefined) {
        setStep(startStep);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { localStorage.setItem("checkout_step", String(step)); } catch {}
  }, [step]);

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
        // Permanecer no passo de Endereço para o usuário ver e escolher
        setShowNewAddressForm(false);
      }
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d?.detail || "Falha ao salvar endereço");
    }
  }
  // Frete e Pagamento
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

  // Validações de fluxo por etapa (dinamiza e impede avançar sem concluir a atual)
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

  async function finalizeOrder() {
    setError(null);
    const selected = addresses.find((a: any) => a.id === selectedAddressId) || address;
    if (!("id" in (selected as any))) {
      const required = ["cep", "endereco", "numero", "bairro", "cidade", "estado"] as const;
      for (const k of required) {
        if (!(selected as any)[k]) { setError(`Campo obrigatório: ${k}`); return; }
      }
    }
    if (paymentMethod === "cartao") {
      const cleanNum = onlyDigits(card.numero || "");
      if (!card.nome || cleanNum.length < 13 || !card.validade || onlyDigits(card.cvv || "").length < 3) {
        setError("Preencha os dados do cartão corretamente");
        return;
      }
    }
    if (paymentMethod === "boleto") {
      if (onlyDigits(boletoCpf || "").length !== 11) {
        setError("Informe um CPF válido para boleto");
        return;
      }
    }
    const payload = {
      items: items.map((it) => ({
        product_id: it.productId,
        title: it.title,
        image_url: it.image,
        unit_price: it.price,
        quantity: it.qty,
      })),
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
      // Limpar carrinho e atualizar lista de pedidos
      try {
        localStorage.removeItem("cart_items");
      } catch {}
      setItems([]);
      try {
        const r = await fetch("/api/orders", { cache: "no-store" });
        const list = await r.json().catch(() => ([]));
        if (Array.isArray(list)) {
          // Atualiza na página principal também
          // @ts-ignore
          window.dispatchEvent(new CustomEvent('orders-updated'));
        }
      } catch {}
    } else {
      setError(d?.detail || "Falha ao finalizar pedido");
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className="mx-auto max-w-2xl text-[15px] md:text-base leading-relaxed">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#3F5F4F]">Checkout</h2>
          <div className="flex items-center gap-2 text-[#3F5F4F]">
            <Heart size={18} />
            <span className="text-sm md:text-base">Um toque de carinho para você</span>
          </div>
        </div>
        {/* Indicador de progresso */}
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm md:text-base">
            {steps.map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <button
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${idx <= step ? "bg-[#C9DAC7] text-[#3F5F4F]" : "bg-muted text-[#3F5F4F]/80"} ${idx > allowedStep ? "opacity-60 cursor-not-allowed" : ""}`}
                  onClick={() => { if (idx <= allowedStep) setStep(idx as 0 | 1 | 2 | 3 | 4 | 5); }}
                  disabled={idx > allowedStep}
                >
                  <span className="font-medium">{idx + 1}</span>
                  <span>{label}</span>
                </button>
                {idx < steps.length - 1 && <span className={`h-px w-8 ${idx < step ? "bg-[#BFD5C8]" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Container deslizante das etapas */}
        <div className="mt-4 overflow-hidden">
          <div className="flex w-[600%] transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${(step * 100) / steps.length}%)` }}>
            {/* Login */}
            <div className="w-1/6 px-1">
              {step === 0 && (
                <div>
                  {loggedIn ? (
                    <div className="rounded border bg-green-50 p-3 text-sm text-green-700">Você já está autenticado.</div>
                  ) : (
                    <form onSubmit={onLoginSubmit} className="mx-auto max-w-md grid gap-3">
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
                        <button type="button" className="text-sm hover:text-primary" onClick={onOpenCadastro}>Cadastrar-se</button>
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
                    <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(2)} disabled={!loggedIn}>Ir para endereço</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Sacola */}
            <div className="w-1/6 px-1">
              {step === 1 && (
                <div className="space-y-3">
                  {items.length === 0 && <p className="text-sm text-[#3F5F4F]/80">Sua sacola está vazia.</p>}
                  {items.map((it) => (
                    <div key={it.productId} className="flex items-center gap-3 rounded border p-3">
                      <div className="h-14 w-14 rounded bg-muted" style={{ backgroundImage: it.image ? `url(${it.image})` : undefined, backgroundSize: "cover" }} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{it.title}</div>
                        <div className="text-xs text-[#3F5F4F]/70">{currencyBRL(it.price)}</div>
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
                    <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(2)} disabled={!isCartValid()}>Continuar</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Endereço */}
            <div className="w-1/6 px-1">
              {step === 2 && (
                <div className="space-y-3">
                  {Array.isArray(addresses) && addresses.length > 0 && (
                    <div className="space-y-2">
                    <div className="text-sm font-medium text-[#3F5F4F]">Selecione um endereço de entrega</div>
                      <div className="space-y-2">
                         {addresses.map((a: any) => (
                           <div key={a.id} className="flex items-center gap-2 rounded border p-2 text-xs">
                             <input
                               type="checkbox"
                               checked={selectedAddressId === a.id}
                               onChange={(e) => setSelectedAddressId(e.target.checked ? a.id : null)}
                             />
                             <span>{a.label || "Entrega"} • {a.endereco}, {a.numero} — {a.bairro}, {a.cidade}/{a.estado} • CEP {formatCEP(a.cep)}</span>
                             {a.is_default_delivery && <span className="ml-auto rounded bg-primary/20 px-2 py-0.5 text-[10px] text-primary">Padrão</span>}
                             <label className="ml-auto flex items-center gap-1">
                               <input
                                 type="checkbox"
                                 checked={!!a.is_default_delivery}
                                 onChange={async (e) => {
                                   try {
                                     const res = await fetch(`/api/addresses/${a.id}`, {
                                       method: "PATCH",
                                       headers: { "Content-Type": "application/json" },
                                       body: JSON.stringify({ is_default_delivery: e.target.checked }),
                                     });
                                     if (res.ok) {
                                       const checked = e.target.checked;
                                       setAddresses((prev: any[]) => prev.map((x) => ({ ...x, is_default_delivery: x.id === a.id ? checked : false })));
                                       if (checked) setSelectedAddressId(a.id);
                                     }
                                   } catch {}
                                 }}
                               />
                               <span className="text-[10px]">Principal</span>
                             </label>
                           </div>
                         ))}
                      </div>
                      {Array.isArray(addresses) && addresses.length > 0 && !selectedAddressId && (
                        <p className="text-xs text-[#3F5F4F]/70">Selecione um endereço para continuar.</p>
                      )}
                      <div className="flex justify-between">
                        <button onClick={() => setShowNewAddressForm((v) => !v)} className="text-xs hover:text-primary">
                          {showNewAddressForm ? "Cancelar novo endereço" : "Cadastrar novo endereço"}
                        </button>
                      <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(3)} disabled={!loggedIn || !selectedAddressId}>Usar este endereço</Button>
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                      <label className="mb-1 block text-sm text-[#3F5F4F]">CEP</label>
                        <Input value={address.cep} onChange={(e) => setAddress({ ...address, cep: formatCEP(e.target.value) })} onBlur={lookupCEP} placeholder="00000-000" />
                        {cepLoading && <p className="mt-1 text-xs text-[#3F5F4F]/70">Buscando endereço...</p>}
                      </div>
                      <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm text-[#3F5F4F]">Endereço</label>
                        <Input value={address.endereco} onChange={(e) => setAddress({ ...address, endereco: e.target.value })} placeholder="Rua Exemplo" />
                      </div>
                    </div>
                  </>
                  )}
                  {showNewAddressForm && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-sm text-[#3F5F4F]">Estado (UF)</label>
                      <Input value={address.estado} onChange={(e) => setAddress({ ...address, estado: e.target.value.toUpperCase() })} placeholder="SP" />
                    </div>
                  </div>
                  )}
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <div className="flex justify-between">
                    <button onClick={() => setStep(1)} className="text-xs hover:text-primary">Voltar para sacola</button>
                    <div className="flex gap-2">
                      {showNewAddressForm && (
                        <Button variant={"outline" as any} className="border-rose-200 text-rose-900" onClick={() => createAddress()}>Salvar endereço</Button>
                      )}
                      <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(3)} disabled={!isAddressValid()}>Ir para frete</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Frete */}
            <div className="w-1/6 px-1">
              {step === 3 && (
                <div className="space-y-3">
                  <div className="rounded border bg-rose-50 p-3 text-sm">
                    <div className="font-semibold text-[#3F5F4F]">Selecione o frete</div>
                    <div className="mt-2 space-y-2">
                      {shippingOptions.map((opt) => (
                        <label key={opt.key} className="flex items-center justify-between rounded border p-2 text-xs">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shipping"
                              checked={shippingMethod.key === opt.key}
                              onChange={() => setShippingMethod(opt)}
                            />
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-[#3F5F4F]/70">{opt.eta}</span>
                          </div>
                          <span className="text-rose-900">{currencyBRL(opt.price)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button onClick={() => setStep(2)} className="text-xs hover:text-primary">Voltar para endereço</button>
                    <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(4)} disabled={!isShippingValid()}>Ir para pagamento</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Pagamento */}
            <div className="w-1/6 px-1">
              {step === 4 && (
                <div className="space-y-4">
                  <div className="rounded border bg-rose-50 p-3 text-sm">
                    <div className="font-semibold text-[#3F5F4F]">Forma de pagamento</div>
                    <div className="mt-2 flex gap-2">
                      {[
                        { key: "pix", label: "PIX" },
                        { key: "cartao", label: "Cartão" },
                        { key: "boleto", label: "Boleto" },
                      ].map((m) => (
                        <button
                          key={m.key}
                          onClick={() => setPaymentMethod(m.key as any)}
                          className={`rounded px-3 py-1 transition-colors ${paymentMethod === m.key ? "bg-[#C9DAC7] text-[#3F5F4F]" : "bg-muted"}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    {paymentMethod === "pix" && (
                      <p className="mt-2 text-xs text-rose-900">Geraremos um QR code após confirmar. Total: <span className="font-semibold">{currencyBRL(total)}</span></p>
                    )}
                    {paymentMethod === "cartao" && (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-[#3F5F4F]">Nome impresso no cartão</label>
                          <Input value={card.nome} onChange={(e) => setCard({ ...card, nome: e.target.value })} placeholder="Nome completo" />
                        </div>
                        <div>
                    <label className="mb-1 block text-xs text-[#3F5F4F]">Número</label>
                          <Input value={card.numero} onChange={(e) => setCard({ ...card, numero: e.target.value })} placeholder="0000 0000 0000 0000" />
                        </div>
                        <div>
                    <label className="mb-1 block text-xs text-[#3F5F4F]">Validade</label>
                          <Input value={card.validade} onChange={(e) => setCard({ ...card, validade: e.target.value })} placeholder="MM/AA" />
                        </div>
                        <div>
                    <label className="mb-1 block text-xs text-[#3F5F4F]">CVV</label>
                          <Input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} placeholder="123" />
                        </div>
                      </div>
                    )}
                    {paymentMethod === "boleto" && (
                      <div className="mt-3">
                    <label className="mb-1 block text-xs text-[#3F5F4F]">CPF do pagador</label>
                        <Input value={boletoCpf} onChange={(e) => setBoletoCpf(e.target.value)} placeholder="000.000.000-00" />
                        <p className="mt-1 text-[11px] text-[#3F5F4F]/70">O boleto será gerado após confirmação.</p>
                      </div>
                    )}
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <div className="flex justify-between">
                    <button onClick={() => setStep(3)} className="text-xs hover:text-primary">Voltar para frete</button>
                    <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setStep(5)} disabled={!isPaymentValid()}>Continuar</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Finalizar */}
            <div className="w-1/6 px-1">
              {step === 5 && (
                <div className="space-y-4">
                  {!orderConfirmed ? (
                    <>
                      <div className="rounded border bg-rose-50 p-4 text-base">
                        <div className="text-lg font-semibold">Resumo do pedido</div>
                        <div className="mt-2 space-y-2">
                          <div>
                            <div className="text-base font-medium">Itens</div>
                            <ul className="mt-1 space-y-1 text-base text-zinc-700">
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
                            <p className="text-base text-zinc-700">
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
                            <div className="text-base">{currencyBRL(shippingMethod.price)}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-base font-medium">Pagamento</div>
                            <div className="text-base capitalize">{paymentMethod}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-base font-semibold">Total</div>
                            <div className="text-base font-semibold text-rose-900">{currencyBRL(total + shippingMethod.price)}</div>
                          </div>
                        </div>
                      </div>
                      {error && <p className="text-sm text-red-600">{error}</p>}
                      <div className="flex justify-between">
                        <button onClick={() => setStep(4)} className="text-base hover:text-primary">Voltar para pagamento</button>
                        <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] transition-colors" onClick={finalizeOrder}>Confirmar pedido</Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-5">
                      <div className="rounded border bg-green-50 p-6 text-[#3F5F4F]">
                        <div className="text-2xl md:text-3xl font-semibold">Pedido confirmado!</div>
                        <div className="mt-2 text-lg md:text-xl">Número do pedido: <span className="font-bold">{orderNumber ?? "—"}</span></div>
                        <div className="mt-2 text-base md:text-lg">Em instantes enviaremos as instruções de pagamento.</div>
                      </div>
                      <div className="flex justify-end">
                        <Button className="bg-[#C9DAC7] text-[#3F5F4F] hover:bg-[#BFD5C8] transition-colors" onClick={onClose}>Fechar</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
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
    dataNascimento?: string;
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

  function formatDateBR(s: string): string {
    const d = onlyDigits(s).slice(0, 8);
    const p1 = d.slice(0, 2);
    const p2 = d.slice(2, 4);
    const p3 = d.slice(4, 8);
    let out = p1;
    if (p2) out += `/${p2}`;
    if (p3) out += `/${p3}`;
    return out;
  }
  function isValidDateBR(s?: string): boolean {
    if (!s) return false;
    const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    if (yyyy < 1900 || yyyy > 2100) return false;
    if (mm < 1 || mm > 12) return false;
    const days = new Date(yyyy, mm, 0).getDate();
    return dd >= 1 && dd <= days;
  }
  function toISOFromBRDate(s?: string): string | undefined {
    if (!s) return undefined;
    const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return undefined;
    const [_, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
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
    dataNascimento: z
      .string()
      .optional()
      .refine((v) => !v || isValidDateBR(v), "Informe uma data válida"),
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
      dataNascimento: "",
    },
  });

  const numeroReg = register("numero");
  const cepVal = watch("cep");
  const cpfVal = watch("cpf");
  const telVal = watch("telefone");
  const dobVal = watch("dataNascimento");

  useEffect(() => { setValue("cep", formatCEP(cepVal || ""), { shouldValidate: false }); }, [cepVal]);
  useEffect(() => { setValue("cpf", formatCPF(cpfVal || ""), { shouldValidate: false }); }, [cpfVal]);
  useEffect(() => { setValue("telefone", formatPhone(telVal || ""), { shouldValidate: false }); }, [telVal]);
  useEffect(() => { setValue("dataNascimento", formatDateBR(dobVal || ""), { shouldValidate: false }); }, [dobVal]);

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
      data_nascimento: toISOFromBRDate(values.dataNascimento) || undefined,
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
      <div className="mx-auto max-w-2xl text-[15px] md:text-base leading-relaxed">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#3F5F4F]">Cadastro de Cliente</h2>
        <p className="text-sm md:text-base text-[#3F5F4F]/70">Preencha primeiro o CEP para auto-completar o endereço.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <div>
              <label className="mb-1 block text-base text-[#3F5F4F]">Nome</label>
              <Input {...register("nome")} placeholder="Seu nome" />
              {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-base text-[#3F5F4F]">Sobrenome</label>
              <Input {...register("sobrenome")} placeholder="Seu sobrenome" />
              {errors.sobrenome && <p className="mt-1 text-sm text-red-600">{errors.sobrenome.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-base text-[#3F5F4F]">Email</label>
              <Input type="email" {...register("email")} placeholder="voce@exemplo.com" />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-base text-[#3F5F4F]">Senha</label>
              <Input type="password" {...register("senha")} placeholder="••••••••" />
              {errors.senha && <p className="mt-1 text-sm text-red-600">{errors.senha.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-base text-[#3F5F4F]">Confirmar senha</label>
              <Input type="password" {...register("confirmSenha")} placeholder="••••••••" />
              {errors.confirmSenha && <p className="mt-1 text-sm text-red-600">{errors.confirmSenha.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-base text-[#3F5F4F]">Telefone</label>
              <Input {...register("telefone")} placeholder="(99) 99999-9999" />
              {errors.telefone && <p className="mt-1 text-sm text-red-600">{errors.telefone.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-base text-[#3F5F4F]">CEP</label>
              <Input {...register("cep")} placeholder="00000-000" onBlur={lookupCEP} />
              {cepLoading && <p className="mt-1 text-sm text-[#3F5F4F]/70">Buscando endereço...</p>}
              {(errors.cep || cepError) && (
                <p className="mt-1 text-sm text-red-600">{errors.cep?.message || cepError}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-base text-[#3F5F4F]">Endereço</label>
              <Input {...register("endereco")} placeholder="Rua Exemplo" />
              {errors.endereco && <p className="mt-1 text-sm text-red-600">{errors.endereco.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#3F5F4F]">Número</label>
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
              <label className="mb-1 block text-sm text-[#3F5F4F]">Complemento</label>
              <Input {...register("complemento")} placeholder="Apto, bloco, etc." />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#3F5F4F]">Bairro</label>
              <Input {...register("bairro")} placeholder="Centro" />
              {errors.bairro && <p className="mt-1 text-xs text-red-600">{errors.bairro.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#3F5F4F]">Cidade</label>
              <Input {...register("cidade")} placeholder="São Paulo" />
              {errors.cidade && <p className="mt-1 text-xs text-red-600">{errors.cidade.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#3F5F4F]">Estado (UF)</label>
              <Input {...register("estado")} placeholder="SP" />
              {errors.estado && <p className="mt-1 text-xs text-red-600">{errors.estado.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[#3F5F4F]">CPF</label>
              <Input {...register("cpf")} placeholder="000.000.000-00" />
              {errors.cpf && <p className="mt-1 text-xs text-red-600">{errors.cpf.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#3F5F4F]">Data de nascimento</label>
              <Input {...register("dataNascimento")} placeholder="dd/mm/aaaa" />
              {errors.dataNascimento && <p className="mt-1 text-xs text-red-600">{errors.dataNascimento.message}</p>}
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