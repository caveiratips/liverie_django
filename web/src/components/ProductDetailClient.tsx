"use client";

import { useEffect, useState } from "react";

type ProductImage = { url?: string | null; alt_text?: string | null; is_primary?: boolean };
type Product = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  brand?: string | null;
  price: number | string;
  compare_at_price?: number | string | null;
  free_shipping?: boolean;
  images?: ProductImage[];
  colors?: string[];
  sizes?: string[];
};

function currencyBRL(n: any): string {
  const num = Number(n || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getImageUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  const url = String(u);
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/media/")) return url;
  if (url.startsWith("/media/")) return `/api/media${url.replace('/media', '')}`;
  return url;
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const primary = (product.images || []).find((i) => i?.is_primary) || (product.images || [])[0];
  const image = getImageUrl(primary?.url || undefined);

  function addToCartLocal(q = 1) {
    try {
      const raw = localStorage.getItem("cart_items");
      const prev = raw ? JSON.parse(raw) : [];
      const price = Number(product.price || 0);
      // Exigir seleção se o produto possui variações
      if ((product.colors && product.colors.length > 0) && !selectedColor) {
        alert("Selecione uma cor antes de adicionar à sacola.");
        return;
      }
      if ((product.sizes && product.sizes.length > 0) && !selectedSize) {
        alert("Selecione um tamanho antes de adicionar à sacola.");
        return;
      }
      const existing = Array.isArray(prev) ? prev.find((it: any) => it.productId === product.id) : null;
      let next;
      if (existing) {
        next = prev.map((it: any) => it.productId === product.id ? { ...it, qty: it.qty + q } : it);
      } else {
        next = [...(Array.isArray(prev) ? prev : []), {
          productId: product.id,
          title: product.title,
          price,
          image,
          qty: q,
          color: selectedColor || undefined,
          size: selectedSize || undefined,
        }];
      }
      localStorage.setItem("cart_items", JSON.stringify(next));
    } catch {}
  }

  useEffect(() => {
    setQty(1);
    setSelectedColor(null);
    setSelectedSize(null);
  }, [product?.id]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{product.title}</h1>
      {product.brand && <div className="text-sm text-zinc-600">Marca: {product.brand}</div>}
      <div className="flex items-center gap-2">
        <span className="text-xl font-semibold">{currencyBRL(product.price)}</span>
        {Number(product.compare_at_price || 0) > Number(product.price || 0) && (
          <span className="text-sm text-zinc-500 line-through">{currencyBRL(product.compare_at_price)}</span>
        )}
      </div>
      {product.free_shipping && (
        <span className="inline-block rounded bg-primary/20 px-2 py-1 text-xs text-primary">Frete grátis</span>
      )}

      {/* Seleção de cores */}
      {(product.colors && product.colors.length > 0) && (
        <div>
          <div className="mb-1 text-sm font-medium">Cor</div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const active = selectedColor === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs ${active ? "border-primary bg-primary/30" : "hover:border-primary"}`}
                  aria-pressed={active}
                >
                  <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: /^#|rgb|hsl/i.test(c) ? c : undefined }} />
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Seleção de tamanhos */}
      {(product.sizes && product.sizes.length > 0) && (
        <div>
          <div className="mb-1 text-sm font-medium">Tamanho</div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const active = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`inline-flex items-center rounded-md border px-3 py-1 text-xs ${active ? "border-primary bg-primary/30" : "hover:border-primary"}`}
                  aria-pressed={active}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="rounded border px-2 py-1 text-xs">-</button>
        <span className="text-sm">{qty}</span>
        <button onClick={() => setQty((q) => q + 1)} className="rounded border px-2 py-1 text-xs">+</button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { addToCartLocal(qty); window.location.href = "/loja?openCart=1"; }}
          className="flex-1 rounded-md border px-3 py-2 text-sm hover:border-primary hover:text-primary"
        >
          Adicionar à sacola
        </button>
        <button
          onClick={() => { addToCartLocal(1); window.location.href = "/loja?buyNow=1"; }}
          className="flex-1 rounded-md bg-rose-200 px-3 py-2 text-sm font-medium text-rose-900 hover:bg-rose-300"
        >
          Comprar agora
        </button>
      </div>
    </div>
  );
}