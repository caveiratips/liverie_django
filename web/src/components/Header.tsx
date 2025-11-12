"use client";

import { Search, ShoppingCart, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Category = { id: number; name: string; slug: string };

export function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

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

  return (
    <header className="bg-white shadow-md">
      {/* Top info bar, now in green C9DAC7 */}
      <div className="text-[#3F5F4F] text-center py-2 text-sm font-semibold uppercase tracking-wide" style={{ backgroundColor: '#C9DAC7' }}>
        <span>10% OFF* NA PRIMEIRA COMPRA</span>
        <span className="mx-4">|</span>
        <span>CUPOM: “CHEGUEI” • PIX PARCELADO</span>
      </div>
      {/* Main bar */}
      <div className="mx-auto max-w-6xl px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Search className="h-5 w-5 text-[#3F5F4F]" />
          <input
            type="text"
            placeholder="O que você procura?"
            aria-label="O que você procura?"
            className="border-b-2 border-[#C9DAC7] focus:border-[#3F5F4F] outline-none text-sm w-64 font-medium text-[#3F5F4F] placeholder:text-[#3F5F4F]/70"
          />
        </div>
        <div className="flex-1 flex justify-center">
          <Link href="/loja" prefetch className="select-none">
            <span
              className="uppercase font-semibold tracking-wide text-2xl sm:text-3xl"
              style={{ color: '#C9DAC7' }}
            >
              Liverie
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-[#3F5F4F]">
          <Link href={loggedIn ? "/perfil" : "/login?next=/perfil"} className="hover:text-[#2F4C3F]" prefetch>
            <User className="h-6 w-6" />
          </Link>
          <Link href="/loja?openCart=1" className="hover:text-[#2F4C3F]">
            <ShoppingCart className="h-6 w-6" />
          </Link>
        </div>
      </div>
      {/* Categories from Admin */}
      <nav className="mx-auto max-w-6xl px-4 pb-4 flex justify-center space-x-6 text-sm text-[#3F5F4F]">
        {categories.length === 0 ? (
          <span className="text-[#3F5F4F]/60">Nenhuma categoria cadastrada</span>
        ) : (
          categories.map((c) => (
            <Link
              key={c.id}
              href={`/loja?c=${encodeURIComponent(c.slug)}`}
              className="font-semibold tracking-wide text-[#3F5F4F] hover:text-[#2F4C3F] hover:underline transition-colors"
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