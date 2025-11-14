"use client";

import { Search, ShoppingCart, User } from 'lucide-react';
import { Bodoni_Moda } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Fonts must be initialized at module scope
const bodoni = Bodoni_Moda({ subsets: ['latin'], weight: ['400','500','600','700'] });

type ChildCategory = { id: number; name: string; slug: string; sort_order?: number; group_title?: string | null; image_url?: string | null };
type Category = { id: number; name: string; slug: string; image_url?: string | null; parent?: number | null; children?: ChildCategory[] };

function resolveImageUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  const url = String(u);
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (typeof window !== 'undefined') {
    if (url.startsWith('/api/media/')) return `${window.location.origin}${url}`;
    if (url.startsWith('/media/')) return `${window.location.origin}/api/media${url.replace('/media', '')}`;
  }
  return url;
}

// Agrupamento de subcategorias por faixas de sort_order.
// Ajuste as faixas e títulos para combinar com seu tema.
const GROUP_DEFS: Array<{ title: string; min: number; max: number }> = [
  { title: 'MODELOS', min: 0, max: 99 },
  { title: 'ESTILO', min: 100, max: 199 },
  { title: 'CARACTERÍSTICAS', min: 200, max: 299 },
  { title: 'CONHEÇA A COLEÇÃO', min: 300, max: 399 },
];

function groupSubcategories(children: ChildCategory[]): Array<{ title: string; items: ChildCategory[] }> {
  // Primeiro, se houver group_title definido em qualquer subcategoria, agrupar por ele.
  const hasCustom = children.some((c) => !!(c.group_title && c.group_title.trim()));
  if (hasCustom) {
    const map = new Map<string, ChildCategory[]>();
    for (const sc of children) {
      const so = Number(sc.sort_order || 0);
      const fall = GROUP_DEFS.find((g) => so >= g.min && so <= g.max)?.title || 'OUTROS';
      const key = (sc.group_title && sc.group_title.trim()) || fall;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(sc);
    }
    // Ordena itens dentro de cada grupo
    for (const [k, arr] of map) {
      arr.sort((a, b) => (Number(a.sort_order || 0) - Number(b.sort_order || 0)) || a.name.localeCompare(b.name));
    }
    // Ordena grupos: primeiro os definidos em GROUP_DEFS (na ordem), depois demais em ordem alfabética
    const preferred = GROUP_DEFS.map((g) => g.title);
    const groups = Array.from(map.entries()).map(([title, items]) => ({ title, items }));
    groups.sort((a, b) => {
      const ia = preferred.indexOf(a.title);
      const ib = preferred.indexOf(b.title);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.title.localeCompare(b.title);
    });
    return groups.filter((g) => g.items.length > 0);
  }
  // Caso não haja nenhum group_title, usar faixas de sort_order como antes.
  const used = new Set<number>();
  const groups = GROUP_DEFS.map((g) => {
    const items = children
      .filter((sc) => {
        const so = Number(sc.sort_order || 0);
        return so >= g.min && so <= g.max;
      })
      .sort((a, b) => (Number(a.sort_order || 0) - Number(b.sort_order || 0)) || a.name.localeCompare(b.name));
    items.forEach((it) => used.add(it.id));
    return { title: g.title, items };
  });
  const leftovers = children.filter((sc) => !used.has(sc.id));
  if (leftovers.length) {
    groups.push({
      title: 'OUTROS',
      items: leftovers.sort((a, b) => (Number(a.sort_order || 0) - Number(b.sort_order || 0)) || a.name.localeCompare(b.name)),
    });
  }
  return groups.filter((g) => g.items.length > 0);
}

export function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  function clearCloseTimer() {
    if (closeTimer.current !== null) {
      try { window.clearTimeout(closeTimer.current); } catch {}
      closeTimer.current = null;
    }
  }
  function scheduleClose(id: number) {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setOpenId((cur) => (cur === id ? null : cur));
    }, 220); // atraso suave (~0.2s)
  }

  useEffect(() => {
    fetch('/api/categories', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLoggedIn(!!d && (d.logged_in === true || !!d.username || !!d.name)))
      .catch(() => setLoggedIn(false));
  }, []);

  // Badge de quantidade da sacola (localStorage + eventos)
  useEffect(() => {
    function compute() {
      try {
        const raw = localStorage.getItem('cart_items');
        const arr = raw ? JSON.parse(raw) : [];
        const count = Array.isArray(arr) ? arr.reduce((s: number, it: any) => s + (Number(it?.qty) || 0), 0) : 0;
        setCartCount(count);
      } catch { setCartCount(0); }
    }
    compute();
    function onCartUpdated() { compute(); }
    function onStorage(e: StorageEvent) { if (e.key === 'cart_items') compute(); }
    window.addEventListener('cart-updated', onCartUpdated as any);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('cart-updated', onCartUpdated as any);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const mainCategories = (categories || []).filter((c) => (c.parent ?? null) === null);

  return (
    <header className="bg-white shadow-md relative z-50">
      {/* Top info bar, now in green C9DAC7 */}
      <div className="text-[#3F5F4F] text-center py-2 text-sm font-semibold uppercase tracking-wide" style={{ backgroundColor: '#C9DAC7' }}>
        <span>10% OFF* NA PRIMEIRA COMPRA</span>
        <span className="mx-4">|</span>
        <span>CUPOM: “CHEGUEI” • PIX PARCELADO</span>
      </div>
      {/* Main bar */}
      <div className="mx-auto max-w-6xl px-4 py-4 grid grid-cols-3 items-center">
        <form className="justify-self-start flex items-center" action="/loja" method="GET">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-[#3F5F4F]" />
            <input
              type="search"
              name="q"
              placeholder="O que você procura?"
              aria-label="O que você procura?"
              className="w-52 sm:w-60 md:w-[20rem] lg:w-[22rem] bg-transparent outline-none text-lg sm:text-xl font-medium text-[#3F5F4F] placeholder:text-[#3F5F4F]/70 border-b border-[#C9DAC7] focus:border-[#3F5F4F]"
            />
          </div>
        </form>
        <div className="justify-self-center">
          <Link href="/loja" prefetch className="select-none">
            <span
              className={`${bodoni.className} uppercase font-semibold tracking-wide text-4xl sm:text-6xl`}
              style={{ color: '#C9DAC7' }}
            >
              Liverie
            </span>
          </Link>
        </div>
        <div className="justify-self-end flex items-center gap-4 text-[#3F5F4F]">
          <Link href={loggedIn ? "/perfil" : "/login?next=/perfil"} className="hover:text-[#2F4C3F]" prefetch>
            <User className="h-6 w-6" />
          </Link>
          <Link href={loggedIn ? "/checkout?start=1" : "/checkout?start=0"} className="relative hover:text-[#2F4C3F]">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-[#C9DAC7] px-1 text-center text-[11px] font-semibold text-[#2F4C3F]">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      {/* Categories from Admin */}
      <nav className="mx-auto max-w-6xl px-4 pb-4 flex justify-center space-x-6 text-lg sm:text-xl text-[#3F5F4F] relative z-50">
        {mainCategories.length === 0 ? (
          <span className="text-[#3F5F4F]/60">Nenhuma categoria cadastrada</span>
        ) : (
          mainCategories.map((c) => (
            <div
              key={c.id}
              className=""
              onMouseEnter={() => { clearCloseTimer(); setOpenId(c.id); }}
              onMouseLeave={() => scheduleClose(c.id)}
            >
              <button
                type="button"
                className={`${bodoni.className} uppercase font-semibold tracking-wide text-[#3F5F4F] transition-colors border-b border-transparent hover:border-[#3F5F4F] hover:text-[#2F4C3F]`}
                onClick={() => setOpenId((cur) => (cur === c.id ? null : c.id))}
                aria-haspopup="true"
                aria-expanded={openId === c.id}
              >
                {c.name}
              </button>

              {/* Mega menu */}
              {openId === c.id && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[min(96vw,1200px)] rounded-md border bg-white p-6 shadow-lg z-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3">
                      {(() => {
                        const groups = groupSubcategories(c.children || []);
                        if (groups.length === 0) {
                          return <span className="text-sm text-[#3F5F4F]/60">Nenhuma subcategoria</span>;
                        }
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {groups.map((g) => (
                              <div key={g.title}>
                                <div className="mb-2 border-b border-[#C9DAC7] pb-1 text-sm md:text-base font-bold tracking-wide text-[#3F5F4F]">
                                  {g.title}
                                </div>
                                <div className="space-y-1">
                                  {g.items.map((sc) => (
                                    <Link
                                      key={sc.id}
                                      href={`/loja?c=${encodeURIComponent(sc.slug)}`}
                                      className="group -mx-2 w-full px-2 py-1 inline-flex items-center justify-between rounded text-sm text-[#3F5F4F] transition-all duration-200 ease-out hover:text-[#2F4C3F] hover:bg-[#C9DAC7]/25 hover:translate-x-[2px]"
                                      prefetch
                                    >
                                      <span className="truncate">{sc.name}</span>
                                      <span className="opacity-0 group-hover:opacity-100 text-[#3F5F4F] group-hover:text-[#2F4C3F] transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0">›</span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="md:col-span-1">
                      {resolveImageUrl(c.image_url) ? (
                        <img src={resolveImageUrl(c.image_url)} alt="Categoria" className="h-40 w-full object-cover rounded" />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center rounded bg-[#C9DAC7]/20 text-xs text-[#3F5F4F]/70">
                          Sem imagem
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </nav>
    </header>
  );
}