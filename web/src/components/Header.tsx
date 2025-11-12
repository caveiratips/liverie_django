"use client";

import { Search, ShoppingCart, User } from 'lucide-react';
import { Bodoni_Moda } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Fonts must be initialized at module scope
const bodoni = Bodoni_Moda({ subsets: ['latin'], weight: ['400','500','600','700'] });

type Category = { id: number; name: string; slug: string };

export function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);

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

  return (
    <header className="bg-white shadow-md">
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
      <nav className="mx-auto max-w-6xl px-4 pb-4 flex justify-center space-x-6 text-lg sm:text-xl text-[#3F5F4F]">
        {categories.length === 0 ? (
          <span className="text-[#3F5F4F]/60">Nenhuma categoria cadastrada</span>
        ) : (
          categories.map((c) => (
            <Link
              key={c.id}
              href={`/loja?c=${encodeURIComponent(c.slug)}`}
              className="font-medium tracking-normal text-[#3F5F4F] transition-colors border-b border-transparent hover:border-[#3F5F4F] hover:text-[#2F4C3F]"
              prefetch
            >
              {c.name}
            </Link>
          ))
        )}
      </nav>
    </header>
  );
}