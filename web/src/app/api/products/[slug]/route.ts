import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const revalidate = 0; // No cache

const BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : "http://localhost:8000/api";
const DEV_FALLBACK = "http://localhost:8000/api";

const productSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  price: z.number(),
  image: z.string(),
  description: z.string(),
  featured: z.boolean(),
});

async function fetchFrom(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const data = await response.json();
      if (data && (Array.isArray(data) ? data.length > 0 : data.id)) {
        return { data, response };
      }
    }
  } catch {}
  return { data: null, response: null };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const options: RequestInit = { next: { revalidate: 0 } };

  // 1. Try fetching the product directly from the primary API base.
  let { data: product } = await fetchFrom(`${BASE}/products/${slug}/`, options);

  // 2. If not found, try fetching the full list from the primary API base and filtering.
  if (!product) {
    const { data: productList } = await fetchFrom(`${BASE}/products/`, options);
    if (productList && Array.isArray(productList)) {
      product = productList.find((p: any) => p.slug === slug) || null;
    }
  }

  // 3. If still not found and we are in a different environment, try the dev fallback URL directly.
  if (!product && BASE !== DEV_FALLBACK) {
    let { data: fallbackProduct } = await fetchFrom(`${DEV_FALLBACK}/products/${slug}/`, options);
    product = fallbackProduct;
  }

  // 4. If still not found with the direct dev fallback, try the dev fallback list.
  if (!product && BASE !== DEV_FALLBACK) {
    const { data: fallbackProductList } = await fetchFrom(`${DEV_FALLBACK}/products/`, options);
    if (fallbackProductList && Array.isArray(fallbackProductList)) {
      product = fallbackProductList.find((p: any) => p.slug === slug) || null;
    }
  }

  if (!product) {
    return NextResponse.json({ detail: "No Product matches the given query." }, { status: 404 });
  }

  return NextResponse.json(product);
}