import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/ProductDetailClient";

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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/products/${slug}`, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) {
    return notFound();
  }
  const p = (await res.json().catch(() => null)) as Product | null;
  if (!p || !p.id) return notFound();
  const primary = (p.images || []).find((i) => i?.is_primary) || (p.images || [])[0];
  const imgUrl = getImageUrl(primary?.url || undefined);
  const onSale = Number(p.compare_at_price || 0) > Number(p.price || 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link href="/loja" className="text-2xl font-bold text-primary">Sua Loja</Link>
          <div className="ml-auto">
            <Link href="/loja" className="text-sm hover:text-primary">Voltar para loja</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-3">
            <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
              {imgUrl ? (
                <img src={imgUrl} alt={primary?.alt_text || p.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">Sem imagem</div>
              )}
            </div>
            {(p.images || []).length > 1 && (
              <div className="mt-3 flex gap-2">
                {(p.images || []).map((im, idx) => {
                  const small = getImageUrl(im?.url || undefined);
                  return (
                    <div key={idx} className="h-16 w-16 overflow-hidden rounded border bg-muted">
                      {small ? <img src={small} alt={im?.alt_text || p.title} className="h-full w-full object-cover" /> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <ProductDetailClient product={p} />
        </div>
        <section className="mt-8">
          <h3 className="text-lg font-semibold text-primary">Descrição</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{p.description || "Sem descrição."}</p>
        </section>
      </main>
    </div>
  );
}