import Link from "next/link";
import { Product } from "@/data/types/product";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductGallery from "@/components/product/ProductGallery";

function getImageUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  const url = String(u);
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/media/")) return url;
  if (url.startsWith("/media/")) return `/api/media${url.replace('/media', '')}`;
  return url;
}

export function ProductPage({ product }: { product: Product }) {
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
          <ProductGallery images={product.images} title={product.title} />
          <ProductDetailClient product={product} />
        </div>
        <section className="mt-8">
          <h3 className="text-lg font-semibold text-primary">Descrição</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{product.description || "Sem descrição."}</p>
        </section>
      </main>
    </div>
  );
}