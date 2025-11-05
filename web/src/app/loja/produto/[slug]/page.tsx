import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Product } from "@/data/types/product";
import { api } from "@/data/api";
import { ProductPage } from "@/components/product/page";

export const revalidate = 0; // No cache

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await api(`/products/${slug}`, {
      next: {
        revalidate: 0, // No cache
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch product ${slug}. Status: ${response.status}, Body: ${errorText}`,
      );
      return null;
    }

    const product = await response.json();
    return product;
  } catch (error) {
    console.error(`Failed to fetch product ${slug}:`, error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Produto não encontrado",
    };
  }

  return {
    title: product.title,
  };
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || !product.id) {
    notFound();
  }

  return <ProductPage product={product} />;
}