"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";

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
  colors?: Array<{ name?: string; hex?: string } | string>;
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
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const primary = (product.images || []).find((i) => i?.is_primary) || (product.images || [])[0];
  const image = getImageUrl(primary?.url || undefined);
  const hasVariations = Boolean((product.colors || []).length || (product.sizes || []).length);

  function addToCartLocal(q = 1) {
    try {
      const raw = localStorage.getItem("cart_items");
      const prev = raw ? JSON.parse(raw) : [];
      const price = Number(product.price || 0);
      // Exigir seleção se o produto possui variações
      if ((product.colors && product.colors.length > 0) && !selectedColorKey) {
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
          color: selectedColorKey || undefined,
          size: selectedSize || undefined,
        }];
      }
      localStorage.setItem("cart_items", JSON.stringify(next));
      const count = next.reduce((sum: number, it: any) => sum + (Number(it.qty) || 0), 0);
      // Notifica cabeçalho global para atualizar badge
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count } }));
    } catch {}
  }

  useEffect(() => {
    setQty(1);
    setSelectedColorKey(null);
    setSelectedSize(null);
  }, [product?.id]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight">{product.title}</h1>
      {product.brand && <div className="text-sm text-zinc-600">Marca: {product.brand}</div>}
      <div className="flex items-center gap-2">
        <span className="text-xl font-semibold">{hasVariations ? `a partir de ${currencyBRL(product.price)}` : currencyBRL(product.price)}</span>
        {Number(product.compare_at_price || 0) > Number(product.price || 0) && (
          <span className="text-sm text-zinc-500 line-through">{currencyBRL(product.compare_at_price)}</span>
        )}
      </div>
      {hasVariations && (
        <p className="text-sm text-zinc-600">*Selecione cor e tamanho para ver o preço</p>
      )}
      {product.free_shipping && (
        <span className="inline-block rounded bg-primary/20 px-2 py-1 text-xs text-primary">Frete grátis</span>
      )}

      {/* Seleção de cores */}
      {(product.colors && product.colors.length > 0) && (
        <div>
          {(() => {
            const normalized = (product.colors || []).map((c) => {
              if (typeof c === "string") {
                const str = c.trim();
                const pair = str.includes("|") ? str.split("|", 2) : (str.includes(":") ? str.split(":", 2) : null);
                if (pair && pair.length === 2) {
                  const nm = (pair[0] || "").trim();
                  const hx = (pair[1] || "").trim();
                  return { name: nm || hx || str, hex: hx || undefined, key: `${nm}|${hx}` };
                }
                return { name: str, hex: /^#|rgb|hsl/i.test(str) ? str : undefined, key: str };
              }
              const nm = (c?.name || "").trim();
              const hx = (c?.hex || "").trim();
              return { name: nm || hx || "", hex: hx || undefined, key: `${nm}|${hx}` };
            });
            const activeLabel = normalized.find((i) => i.key === selectedColorKey)?.name || normalized[0]?.name || "—";
            return (
              <>
                <div className="mb-1 text-sm font-medium">{`Cor: ${activeLabel}`}</div>
                <div className="flex flex-wrap gap-3">
                  {normalized.map((c) => {
                    const active = selectedColorKey === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setSelectedColorKey(c.key)}
                        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border ${active ? "border-primary ring-2 ring-primary/50" : "hover:border-primary"}`}
                        aria-pressed={active}
                      >
                        <span className="inline-block h-8 w-8 rounded-full border" style={{ backgroundColor: c.hex }} />
                      </button>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Seleção de tamanhos */}
      {(product.sizes && product.sizes.length > 0) && (
        <div>
          <div className="mb-1 text-sm font-medium">{`Tamanho${selectedSize ? ": " + selectedSize : ""}`}</div>
          <div className="flex flex-wrap gap-3">
            {product.sizes.map((s) => {
              const active = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm ${active ? "font-semibold" : ""} hover:border-primary`}
                  style={active ? { backgroundColor: '#C9DAC7', borderColor: '#C9DAC7' } : undefined}
                  aria-pressed={active}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="rounded border px-2 py-1 text-xs">-</button>
          <span className="text-sm">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="rounded border px-2 py-1 text-xs">+</button>
        </div>
        <a href="#guia-medidas" className="text-sm underline">Guia de medidas</a>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => { addToCartLocal(1); window.location.href = "/loja?buyNow=1"; }}
          className="w-full rounded-md px-3 py-3 text-sm font-semibold bg-[#3F5F4F] text-white hover:bg-[#2F5243] transition-colors inline-flex items-center justify-center gap-2"
        >
          <ShoppingBag size={18} />
          Comprar agora
        </button>
        <button
          onClick={() => { addToCartLocal(qty); }}
          className="w-full rounded-md border px-3 py-2 text-sm hover:border-primary hover:text-primary"
        >
          Adicionar à sacola
        </button>
      </div>
    </div>
  );
}