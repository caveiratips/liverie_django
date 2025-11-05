import Link from "next/link";
import { Product } from "@/data/types/product";
import ProductDetailClient from "@/components/ProductDetailClient";

function getImageUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  const url = String(u);
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/media/")) return url;
  if (url.startsWith("/media/")) return `/api/media${url.replace('/media', '')}`;
  return url;
}

export function ProductPage({ product }: { product: Product }) {
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  const imageUrl = getImageUrl(primaryImage?.url);

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
              {imageUrl ? (
                <img src={imageUrl} alt={primaryImage?.alt_text || product.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">Sem imagem</div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.map((image, idx) => {
                  const smallImageUrl = getImageUrl(image.url);
                  return (
                    <div key={idx} className="h-16 w-16 overflow-hidden rounded border bg-muted">
                      {smallImageUrl ? <img src={smallImageUrl} alt={image.alt_text || product.title} className="h-full w-full object-cover" /> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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