"use client";

import { Search, ShoppingCart, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Category = { id: number; name: string; slug: string };

export function Header() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <header className="bg-white shadow-md">
      {/* Top info bar, now in green C9DAC7 */}
      <div className="text-black text-center py-2 text-sm" style={{ backgroundColor: '#C9DAC7' }}>
        <span>10% OFF* NA PRIMEIRA COMPRA</span>
        <span className="mx-4">|</span>
        <span>CUPOUM: “CHEGUEI” • PIX PARCELADO</span>
      </div>
      {/* Main bar */}
      <div className="mx-auto max-w-6xl px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Search className="h-5 w-5 text-zinc-700" />
          <input
            type="text"
            placeholder="O que você procura?"
            className="border-b-2 border-zinc-300 focus:border-zinc-800 outline-none text-sm w-64"
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
        <div className="flex items-center gap-4 text-zinc-700">
          <Link href="/login" className="hover:text-zinc-900" prefetch>
            <User className="h-6 w-6" />
          </Link>
          <Link href="/loja?openCart=1" className="hover:text-zinc-900">
            <ShoppingCart className="h-6 w-6" />
          </Link>
        </div>
      </div>
      {/* Categories from Admin */}
      <nav className="mx-auto max-w-6xl px-4 pb-4 flex justify-center space-x-6 text-sm text-zinc-700">
        {categories.length === 0 ? (
          <span className="text-zinc-500">Nenhuma categoria cadastrada</span>
        ) : (
          categories.map((c) => (
            <Link
              key={c.id}
              href={`/loja?c=${encodeURIComponent(c.slug)}`}
              className="font-semibold text-zinc-800 hover:text-[#C9DAC7] hover:underline transition-colors"
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