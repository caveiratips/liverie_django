export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
  images?: ProductImage[];
  brand?: string;
  compare_at_price?: number;
  free_shipping?: boolean;
}

export interface ProductImage {
  url: string;
  alt_text: string;
  is_primary: boolean;
}