"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Truck,
  CreditCard,
  BadgePercent,
  Megaphone,
  Images,
  FileText,
  Search,
} from "lucide-react";

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      onLoggedIn();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Falha no login");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm">
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Acesso ao Gerenciamento</h2>
        <label className="mb-2 block text-sm">Usuário</label>
        <Input className="mb-4" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="seu_usuario" />
        <label className="mb-2 block text-sm">Senha</label>
        <Input className="mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <Button className="w-full bg-primary text-black" disabled={loading} type="submit">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </Card>
    </form>
  );
}

function CategoriesAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/categories", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function createCategory() {
    setError(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setName("");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Erro ao criar categoria");
    }
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-lg font-semibold">Categorias</h3>
      <div className="mb-4 flex gap-2">
        <Input
          className="flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nova categoria"
        />
        <Button className="bg-primary text-black" onClick={createCategory}>Criar</Button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <ul className="divide-y">
        {items.map((c) => (
          <li key={c.id} className="py-2">
            <span className="font-medium">{c.name}</span>
            <span className="ml-2 text-xs text-zinc-500">/{c.slug}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ProductsAdmin() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [gtin, setGtin] = useState("");
  const [mpn, setMpn] = useState("");
  const [brand, setBrand] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [freeShipping, setFreeShipping] = useState(false);
  const [weight, setWeight] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [length, setLength] = useState("");
  const [taxable, setTaxable] = useState(true);
  const [tags, setTags] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: number; url: string | null; alt_text: string; is_primary: boolean }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragNewIndex, setDragNewIndex] = useState<number | null>(null);
  const [dragExistingIndex, setDragExistingIndex] = useState<number | null>(null);

  function getImageUrl(u: string | null): string | undefined {
    if (!u) return undefined;
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    if (u.startsWith("/media/")) return `/api/media${u.replace('/media', '')}`;
    return u;
  }

  useEffect(() => {
    fetch("/api/admin/categories").then(async (r) => {
      if (r.ok) setCategories(await r.json());
    });
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoadingList(true);
    const r = await fetch("/api/admin/products", { cache: "no-store" });
    if (r.ok) setProducts(await r.json());
    setLoadingList(false);
  }

  function formatCurrencyInput(raw: string) {
    const digits = (raw || "").replace(/\D/g, "");
    const num = Number(digits || "0") / 100;
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDecimal3Input(raw: string) {
    const digits = (raw || "").replace(/\D/g, "");
    const num = Number(digits || "0") / 1000;
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }

  function toFloatBR(v: string | null | undefined): number {
    if (!v) return NaN;
    const normalized = String(v).replace(/\./g, "").replace(",", ".");
    const n = parseFloat(normalized);
    return n;
  }

  async function uploadImages(productId: number) {
    if (!imageFiles.length) return;
    for (let i = 0; i < imageFiles.length; i++) {
      const fd = new FormData();
      fd.append("product", String(productId));
      fd.append("image", imageFiles[i]);
      fd.append("alt_text", title || "");
      fd.append("is_primary", i === 0 ? "true" : "false");
      fd.append("sort_order", String(i));
      const resImg = await fetch("/api/admin/product-images", {
        method: "POST",
        body: fd,
      });
      if (!resImg.ok) {
        const data = await resImg.json().catch(() => ({}));
        throw new Error(data?.detail || "Falha ao enviar imagem");
      }
    }
  }

  function handleSelectFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const newFiles = Array.from(list);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeNewImage(idx: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => {
      const url = prev[idx];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function makePrimaryNew(idx: number) {
    setImageFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(idx, 1);
      arr.unshift(item);
      return arr;
    });
    setImagePreviews((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(idx, 1);
      arr.unshift(item);
      return arr;
    });
  }

  async function removeExistingImage(id: number) {
    if (!confirm("Excluir esta imagem?")) return;
    const res = await fetch(`/api/admin/product-images/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setExistingImages((prev) => prev.filter((img) => img.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data?.detail || "Falha ao excluir imagem");
    }
  }

  async function makePrimaryExisting(id: number) {
    // Define esta imagem como principal e remove a flag das demais
    const target = existingImages.find((i) => i.id === id);
    if (!target) return;
    const res = await fetch(`/api/admin/product-images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_primary: true }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.detail || "Falha ao definir imagem como principal");
      return;
    }
    // Unset primary for others
    for (const img of existingImages) {
      if (img.id !== id && img.is_primary) {
        await fetch(`/api/admin/product-images/${img.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_primary: false }),
        }).catch(() => {});
      }
    }
    setExistingImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === id }))); 
  }

  function handleDropNew(toIndex: number) {
    if (dragNewIndex == null || dragNewIndex === toIndex) return;
    setImageFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(dragNewIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    });
    setImagePreviews((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(dragNewIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    });
    setDragNewIndex(null);
  }

  async function handleDropExisting(toIndex: number) {
    if (dragExistingIndex == null || dragExistingIndex === toIndex) return;
    let newOrder: Array<{ id: number; url: string | null; alt_text: string; is_primary: boolean }> = [];
    setExistingImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(dragExistingIndex, 1);
      arr.splice(toIndex, 0, item);
      newOrder = arr;
      return arr;
    });
    setDragExistingIndex(null);
    // Persistir ordenação se estamos editando um produto
    if (editingId) {
      const bodyUpdates = newOrder.map((img, idx) => ({ id: img.id, sort_order: idx }));
      for (const up of bodyUpdates) {
        await fetch(`/api/admin/product-images/${up.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: up.sort_order }),
        }).catch(() => {});
      }
    }
  }

  async function saveProduct() {
    setError(null);
    setFormErrors([]);
    const errs: string[] = [];
    if (!title.trim()) errs.push("Título é obrigatório");
    const hasCategoryInput = Boolean(categoryName.trim()) || Boolean(categoryId);
    if (!hasCategoryInput) errs.push("Categoria é obrigatória");
    const priceNum = toFloatBR(price);
    if (Number.isNaN(priceNum)) errs.push("Preço deve ser um número válido");
    else if (priceNum < 0) errs.push("Preço deve ser maior ou igual a 0");
    const stockInt = stockQty ? parseInt(stockQty) : 0;
    if (stockQty && Number.isNaN(stockInt)) errs.push("Estoque deve ser um inteiro");
    else if (stockInt < 0) errs.push("Estoque deve ser maior ou igual a 0");
    const cmpNum = compareAtPrice ? toFloatBR(compareAtPrice) : null;
    if (compareAtPrice && (cmpNum === null || Number.isNaN(cmpNum))) errs.push("Preço comparativo deve ser um número válido");
    else if (cmpNum !== null && cmpNum < 0) errs.push("Preço comparativo deve ser maior ou igual a 0");
    const costNum = costPrice ? toFloatBR(costPrice) : null;
    if (costPrice && (costNum === null || Number.isNaN(costNum))) errs.push("Custo deve ser um número válido");
    else if (costNum !== null && costNum < 0) errs.push("Custo deve ser maior ou igual a 0");
    const wNum = weight ? toFloatBR(weight) : null;
    if (weight && (wNum === null || Number.isNaN(wNum))) errs.push("Peso deve ser um número válido");
    else if (wNum !== null && wNum < 0) errs.push("Peso deve ser maior ou igual a 0");
    const wdNum = width ? toFloatBR(width) : null;
    if (width && (wdNum === null || Number.isNaN(wdNum))) errs.push("Largura deve ser um número válido");
    else if (wdNum !== null && wdNum < 0) errs.push("Largura deve ser maior ou igual a 0");
    const hNum = height ? toFloatBR(height) : null;
    if (height && (hNum === null || Number.isNaN(hNum))) errs.push("Altura deve ser um número válido");
    else if (hNum !== null && hNum < 0) errs.push("Altura deve ser maior ou igual a 0");
    const lNum = length ? toFloatBR(length) : null;
    if (length && (lNum === null || Number.isNaN(lNum))) errs.push("Comprimento deve ser um número válido");
    else if (lNum !== null && lNum < 0) errs.push("Comprimento deve ser maior ou igual a 0");
    if (errs.length) { setFormErrors(errs); return; }
    // Garantir category_id válido: se o nome digitado não estiver cadastrado, cria antes de salvar
    async function ensureCategoryId(): Promise<number> {
      // Se já temos um id válido, usa
      const existingId = Number(categoryId);
      if (existingId && !Number.isNaN(existingId)) return existingId;
      const name = categoryName.trim();
      if (!name) throw new Error("Categoria é obrigatória");
      // Tenta localizar por nome
      const found = categories.find((c) => (c?.name || "").toLowerCase() === name.toLowerCase());
      if (found?.id) return Number(found.id);
      // Cria categoria
      const resCat = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!resCat.ok) {
        const data = await resCat.json().catch(() => ({}));
        const detail = data?.detail || "Falha ao criar categoria";
        throw new Error(detail);
      }
      const data = await resCat.json();
      // Atualiza cache local de categorias
      setCategories((prev) => [{ ...data }, ...prev]);
      return Number(data.id);
    }

    let catIdNum: number;
    try {
      catIdNum = await ensureCategoryId();
    } catch (e: any) {
      setError(e?.message || "Falha ao preparar categoria");
      return;
    }

    const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        price: priceNum,
        compare_at_price: cmpNum,
        cost_price: costNum,
        sku,
        barcode,
        gtin,
        mpn,
        brand,
        stock_quantity: stockInt,
        track_inventory: trackInventory,
        weight: wNum,
        width: wdNum,
        height: hNum,
        length: lNum,
        taxable,
        tags,
        available_colors: (colors || []).join(", "),
        available_sizes: sizes,
        seo_title: seoTitle,
        seo_description: seoDescription,
        is_featured: isFeatured,
        free_shipping: freeShipping,
        is_active: isActive,
        category_id: catIdNum,
      }),
    });
    if (res.ok) {
      const saved = await res.json().catch(() => ({}));
      const productId = editingId ? editingId : Number(saved?.id);
      try {
        if (productId) {
          await uploadImages(productId);
        }
      } catch (e: any) {
        setError(e?.message || "Imagens: houve uma falha ao enviar");
      }
      await loadProducts();
      setTitle("");
      setDescription("");
      setPrice("");
      setCompareAtPrice("");
      setCostPrice("");
      setSku("");
      setBarcode("");
      setGtin("");
      setMpn("");
      setBrand("");
      setStockQty("");
      setTrackInventory(true);
      setWeight("");
      setWidth("");
      setHeight("");
      setLength("");
      setTaxable(true);
      setTags("");
      setColors([]);
      setSizes("");
      setSeoTitle("");
      setSeoDescription("");
      setIsFeatured(false);
      setFreeShipping(false);
      setIsActive(true);
      setCategoryId("");
      setEditingId(null);
      setCategoryName("");
      // Limpar previews e arquivos
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImages([]);
      alert("Produto criado!");
    } else {
      const data = await res.json().catch(() => ({}));
      const errsResp: string[] = data?.errors || [];
      if (Array.isArray(errsResp) && errsResp.length) {
        setFormErrors(errsResp);
      } else {
        setError(data?.detail || "Erro ao criar produto");
      }
    }
  }

  function startEdit(p: any) {
    setEditingId(p.id);
    setTitle(p.title || "");
    setDescription(p.description || "");
    setPrice(p.price != null ? formatCurrencyInput(String(p.price)) : "");
    setCompareAtPrice(p.compare_at_price != null ? formatCurrencyInput(String(p.compare_at_price)) : "");
    setCostPrice(p.cost_price != null ? formatCurrencyInput(String(p.cost_price)) : "");
    setSku(p.sku || "");
    setBarcode(p.barcode || "");
    setGtin(p.gtin || "");
    setMpn(p.mpn || "");
    setBrand(p.brand || "");
    setStockQty(p.stock_quantity != null ? String(p.stock_quantity) : "");
    setTrackInventory(Boolean(p.track_inventory));
    setFreeShipping(Boolean(p.free_shipping));
    setWeight(p.weight != null ? formatDecimal3Input(String(p.weight)) : "");
    setWidth(p.width != null ? formatDecimal3Input(String(p.width)) : "");
    setHeight(p.height != null ? formatDecimal3Input(String(p.height)) : "");
    setLength(p.length != null ? formatDecimal3Input(String(p.length)) : "");
    setTaxable(Boolean(p.taxable));
    setTags(p.tags || "");
    const colorsArr = Array.isArray(p.colors)
      ? p.colors
      : String(p.available_colors || "")
          .split(/[;,]/)
          .map((s: string) => s.trim())
          .filter(Boolean);
    const sizesCsv = Array.isArray(p.sizes) ? p.sizes.join(", ") : (p.available_sizes || "");
    setColors(colorsArr || []);
    setSizes(sizesCsv || "");
    setSeoTitle(p.seo_title || "");
    setSeoDescription(p.seo_description || "");
    setIsFeatured(Boolean(p.is_featured));
    setIsActive(Boolean(p.is_active));
    setCategoryId(p.category?.id != null ? String(p.category.id) : "");
    setCategoryName(p.category?.name || "");
    const imgs: Array<{ id: number; url: string | null; alt_text: string; is_primary: boolean }> = Array.isArray(p.images) ? p.images : [];
    setExistingImages(imgs);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(id: number) {
    if (!confirm("Deseja excluir este produto?")) return;
    const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (r.ok) {
      if (editingId === id) setEditingId(null);
      await loadProducts();
    } else {
      const data = await r.json().catch(() => ({}));
      alert(data?.detail || "Falha ao excluir produto");
    }
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-lg font-semibold">Produtos</h3>
      <div className="grid grid-cols-1 gap-4">
        {formErrors.length > 0 && (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <ul className="list-disc pl-4">
              {formErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex flex-col">
            <Input list="categoriesList" placeholder="Categoria" value={categoryName} onChange={(e) => {
              const val = e.target.value;
              setCategoryName(val);
              const match = categories.find((c) => (c?.name || "").toLowerCase() === val.toLowerCase());
              setCategoryId(match?.id != null ? String(match.id) : "");
            }} />
            <datalist id="categoriesList">
              {categories.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            <small className="mt-1 text-xs text-zinc-500">Digite para sugerir. Se não existir, criaremos a categoria ao salvar.</small>
          </div>
          <Input type="text" inputMode="numeric" placeholder="Preço (R$)" value={price} onChange={(e) => setPrice(formatCurrencyInput(e.target.value))} />
          <Input type="text" inputMode="numeric" placeholder="Preço comparativo (de)" value={compareAtPrice} onChange={(e) => setCompareAtPrice(formatCurrencyInput(e.target.value))} />
          <Input type="text" inputMode="numeric" placeholder="Custo" value={costPrice} onChange={(e) => setCostPrice(formatCurrencyInput(e.target.value))} />
          <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <Input placeholder="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
          <Input placeholder="GTIN" value={gtin} onChange={(e) => setGtin(e.target.value)} />
          <Input placeholder="MPN" value={mpn} onChange={(e) => setMpn(e.target.value)} />
          <Input placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <Input type="number" min={0} step={1} placeholder="Estoque" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input type="text" inputMode="numeric" placeholder="Peso (kg)" value={weight} onChange={(e) => setWeight(formatDecimal3Input(e.target.value))} />
          <Input type="text" inputMode="numeric" placeholder="Largura (cm)" value={width} onChange={(e) => setWidth(formatDecimal3Input(e.target.value))} />
          <Input type="text" inputMode="numeric" placeholder="Altura (cm)" value={height} onChange={(e) => setHeight(formatDecimal3Input(e.target.value))} />
          <Input type="text" inputMode="numeric" placeholder="Comprimento (cm)" value={length} onChange={(e) => setLength(formatDecimal3Input(e.target.value))} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input placeholder="Tags (separadas por vírgula)" value={tags} onChange={(e) => setTags(e.target.value)} />
          {/* Paleta de cores (múltiplas) */}
          <div>
            <div className="mb-1 text-sm">Cores (paleta)</div>
            <div className="flex flex-wrap items-center gap-3">
              {colors.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : "#000000"}
                    onChange={(e) => {
                      const next = [...colors];
                      next[idx] = e.target.value;
                      setColors(next);
                    }}
                  />
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => {
                      const next = colors.filter((_, i) => i !== idx);
                      setColors(next);
                    }}
                    aria-label="Remover cor"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded-md border px-2 py-1 text-xs"
                onClick={() => setColors([...(colors || []), "#000000"]) }
              >
                + Adicionar cor
              </button>
            </div>
            <div className="mt-1 text-xs text-zinc-500">As cores escolhidas serão exibidas como swatches na página do produto.</div>
          </div>
          <Input placeholder="Tamanhos (separados por vírgula)" value={sizes} onChange={(e) => setSizes(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} /> Tributável
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={trackInventory} onChange={(e) => setTrackInventory(e.target.checked)} /> Controlar inventário
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Destaque
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Ativo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={freeShipping} onChange={(e) => setFreeShipping(e.target.checked)} /> Frete grátis
          </label>
        </div>

        <textarea
          className="min-h-24 rounded-md border px-3 py-2"
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input placeholder="SEO Título" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          <Input placeholder="SEO Descrição" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
        </div>
        <div className="mt-3">
          <label className="mb-2 block text-sm font-medium">Imagens do produto</label>

          {existingImages.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-xs text-zinc-600">Imagens já cadastradas</p>
              <div className="flex items-start gap-3">
                {/* Zona da imagem principal */}
                <div
                  className={clsx("relative h-28 w-28 flex-shrink-0 overflow-hidden rounded border bg-white", "ring-2 ring-primary")}
                  onDragOver={(e) => {
                    e.preventDefault();
                    try { e.dataTransfer.dropEffect = "move"; } catch {}
                  }}
                  onDrop={() => {
                    if (dragExistingIndex != null) {
                      const others = existingImages.filter((i) => !i.is_primary);
                      const cand = others[dragExistingIndex];
                      if (cand) makePrimaryExisting(cand.id);
                      setDragExistingIndex(null);
                    }
                  }}
                >
                  {(() => {
                    const primary = existingImages.find((i) => i.is_primary);
                    if (primary?.url) {
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img draggable={false} src={getImageUrl(primary.url)} alt={primary.alt_text || ""} className="h-full w-full object-cover" />
                      );
                    }
                    return (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-zinc-600 p-2 text-center">
                        Arraste uma imagem aqui para torná-la principal
                      </div>
                    );
                  })()}
                  <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white">Principal</span>
                </div>
                {/* Linha vertical divisória */}
                <div className="w-px self-stretch bg-zinc-200" />
                {/* Outras imagens */}
                <div className="flex flex-wrap gap-2">
                  {existingImages.filter((i) => !i.is_primary).map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative h-24 w-24 overflow-hidden rounded border bg-white"
                      draggable
                      onDragStart={(e) => {
                        setDragExistingIndex(idx);
                        try {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", `existing:${idx}`);
                        } catch {}
                      }}
                      onDragEnd={() => setDragExistingIndex(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropExisting(idx)}
                    >
                      {img.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img draggable={false} src={getImageUrl(img.url)} alt={img.alt_text || ""} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">Sem imagem</div>
                      )}
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/70 px-2 text-xs text-white"
                        onClick={() => removeExistingImage(img.id)}
                        aria-label="Excluir imagem"
                      >
                        ×
                      </button>
                      <button
                        type="button"
                        className="absolute bottom-1 right-1 rounded bg-primary px-1 text-[10px] text-white"
                        onClick={() => makePrimaryExisting(img.id)}
                      >
                        Definir como principal
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-zinc-600">Novas imagens (não enviadas ainda). Arraste para a esquerda para definir a principal.</p>
          <div className="mt-1 flex items-start gap-3">
            {/* Zona principal para novas imagens */}
            <div
              className={clsx("relative h-28 w-28 flex-shrink-0 overflow-hidden rounded border bg-white", imagePreviews.length > 0 ? "ring-2 ring-primary" : "")}
              onDragOver={(e) => {
                e.preventDefault();
                try { e.dataTransfer.dropEffect = "move"; } catch {}
              }}
              onDrop={() => {
                if (dragNewIndex != null) {
                  makePrimaryNew(dragNewIndex);
                  setDragNewIndex(null);
                }
              }}
            >
              {imagePreviews[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img draggable={false} src={imagePreviews[0]} alt="Pré-visualização" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-zinc-600 p-2 text-center">
                  Arraste uma nova imagem aqui para ser principal
                </div>
              )}
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white">Principal</span>
            </div>
            {/* Linha vertical divisória */}
            <div className="w-px self-stretch bg-zinc-200" />
            {/* Demais novas imagens */}
            <div className="flex flex-wrap gap-2">
              {imagePreviews.slice(1).map((url, idx) => (
                <div
                  key={url}
                  className="relative h-24 w-24 overflow-hidden rounded border bg-white"
                  draggable
                  onDragStart={(e) => {
                    const index = idx + 1;
                    setDragNewIndex(index);
                    try {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", `new:${index}`);
                    } catch {}
                  }}
                  onDragEnd={() => setDragNewIndex(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropNew(idx + 1)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img draggable={false} src={url} alt="Pré-visualização" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-black/70 px-2 text-xs text-white"
                    onClick={() => removeNewImage(idx + 1)}
                    aria-label="Remover imagem"
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 rounded bg-primary px-1 text-[10px] text-white"
                    onClick={() => makePrimaryNew(idx + 1)}
                  >
                    Definir como principal
                  </button>
                </div>
              ))}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleSelectFiles(e.target.files)}
          />
          <div className="mt-2">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Adicionar imagem
            </Button>
          </div>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex items-center gap-2">
        <Button className="bg-primary text-black" onClick={saveProduct}>{editingId ? "Atualizar Produto" : "Salvar Produto"}</Button>
        {editingId && (
          <Button variant="outline" onClick={() => { setEditingId(null); setFormErrors([]); setError(null); }}>Cancelar edição</Button>
        )}
      </div>

      <div className="mt-8">
        <h4 className="mb-2 text-md font-semibold">Lista de Produtos</h4>
        {loadingList ? (
          <p className="text-sm text-zinc-600">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Título</th>
                  <th className="p-2 text-left">Preço</th>
                  <th className="p-2 text-left">Estoque</th>
                  <th className="p-2 text-left">Disponível</th>
                  <th className="p-2 text-left">Frete</th>
                  <th className="p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2">{p.title}</td>
                    <td className="p-2">R$ {Number(p.price).toFixed(2)}</td>
                    <td className="p-2">{p.stock_quantity}</td>
                    <td className="p-2">{p.available_for_sale ? "Sim" : "Não"}</td>
                    <td className="p-2">{p.free_shipping ? "Grátis" : "—"}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => startEdit(p)}>Editar</Button>
                        <Button variant="destructive" onClick={() => deleteProduct(p.id)}>Excluir</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-zinc-600">Nenhum produto cadastrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

function SidebarNav({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "products", label: "Produtos", icon: Package },
    { key: "categories", label: "Categorias", icon: Tags },
    { key: "users", label: "Usuários", icon: Users },
    { key: "orders", label: "Pedidos/Vendas", icon: ShoppingCart },
    { key: "customers", label: "Clientes", icon: Users },
    { key: "inventory", label: "Inventário", icon: Package },
    { key: "promotions", label: "Promoções/Cupons", icon: BadgePercent },
    { key: "marketing", label: "Marketing", icon: Megaphone },
    { key: "shipping", label: "Frete", icon: Truck },
    { key: "payments", label: "Pagamentos", icon: CreditCard },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "banners", label: "Banners", icon: Images },
    { key: "pages", label: "Páginas", icon: FileText },
    { key: "seo", label: "SEO", icon: Search },
    { key: "settings", label: "Configurações", icon: Settings },
  ];
  return (
    <aside className="w-64 border-r bg-white">
      <nav className="p-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={clsx(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left",
                active === it.key ? "bg-primary/40 text-black" : "hover:bg-zinc-100"
              )}
            >
              <Icon size={18} />
              <span className="text-sm">{it.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function Dashboard() {
  const [counts, setCounts] = useState<{ products: number; categories: number } | null>(null);
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/products").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/categories").then((r) => (r.ok ? r.json() : [])),
    ]).then(([p, c]) => {
      setCounts({ products: p.length || 0, categories: c.length || 0 });
    });
  }, []);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-sm text-zinc-500">Produtos</h3>
        <p className="mt-2 text-3xl font-semibold">{counts?.products ?? "—"}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm text-zinc-500">Categorias</h3>
        <p className="mt-2 text-3xl font-semibold">{counts?.categories ?? "—"}</p>
      </Card>
    </div>
  );
}

function UsersAdmin() {
  return (
    <Card className="p-4">
      <h3 className="mb-2 text-lg font-semibold">Usuários</h3>
      <p className="text-sm text-zinc-600">Gerencie usuários pelo Django Admin por enquanto.</p>
      <a className="mt-3 inline-block rounded-md border px-3 py-1" href="http://localhost:8000/admin/auth/user/" target="_blank">Abrir Django Admin</a>
    </Card>
  );
}

function CustomersAdmin() {
  const [items, setItems] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const url = q ? `/api/admin/customers?q=${encodeURIComponent(q)}` : "/api/admin/customers";
    const res = await fetch(url, { cache: "no-store" });
    const data = res.ok ? await res.json() : [];
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function viewCustomer(id: number) {
    setError(null);
    const res = await fetch(`/api/admin/customers/${id}/`, { cache: "no-store" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Falha ao carregar cliente");
      return;
    }
    const det = await res.json();
    setSelected(det);
    setEditMode(false);
  }

  async function editCustomer(id: number) {
    setError(null);
    const res = await fetch(`/api/admin/customers/${id}/`, { cache: "no-store" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Falha ao carregar cliente");
      return;
    }
    const det = await res.json();
    setSelected(det);
    setEditMode(true);
  }

  async function saveCustomer() {
    if (!selected) return;
    setError(null);
    const payload = {
      email: selected.email || "",
      first_name: selected.first_name || "",
      last_name: selected.last_name || "",
      profile: {
        telefone: selected.profile?.telefone || "",
        cpf: selected.profile?.cpf || "",
        cep: selected.profile?.cep || "",
        endereco: selected.profile?.endereco || "",
        numero: selected.profile?.numero || "",
        complemento: selected.profile?.complemento || "",
        bairro: selected.profile?.bairro || "",
        cidade: selected.profile?.cidade || "",
        estado: selected.profile?.estado || "",
      },
    };
    const res = await fetch(`/api/admin/customers/${selected.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Falha ao salvar cliente");
      return;
    }
    const updated = await res.json();
    setSelected(updated);
    setItems((prev) => prev.map((c) => (c.id === updated.id ? { ...c, email: updated.email, first_name: updated.first_name, last_name: updated.last_name, profile: updated.profile } : c)));
    setEditMode(false);
  }

  async function deleteCustomer(id: number) {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    setError(null);
    const res = await fetch(`/api/admin/customers/${id}/`, { method: "DELETE" });
    if (!res.ok) {
      let data: any = {};
      try { data = await res.json(); } catch {}
      setError(data?.detail || "Falha ao excluir cliente");
      return;
    }
    setItems((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Clientes</h3>
      <div className="mb-3 flex gap-2">
        <Input className="flex-1" placeholder="Buscar por nome, email ou usuário" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button className="bg-primary text-black" onClick={load}>Buscar</Button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-600">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Cidade/UF</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const nome = `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.username || "—";
                const cidadeUF = c.profile ? `${c.profile.cidade || ""}/${c.profile.estado || ""}`.replace(/\/\//g, "") : "—";
                return (
                  <tr key={c.id} className="border-b">
                    <td className="p-2">{c.id}</td>
                    <td className="p-2">{nome}</td>
                    <td className="p-2">{c.email || "—"}</td>
                    <td className="p-2">{cidadeUF || "—"}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => viewCustomer(c.id)}>Visualizar</Button>
                        <Button size="sm" className="bg-primary text-black" onClick={() => editCustomer(c.id)}>Editar</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteCustomer(c.id)}>Excluir</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td className="p-2 text-sm text-zinc-600" colSpan={5}>Nenhum cliente encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Card className="mt-6 p-4">
          <h4 className="mb-3 text-md font-semibold">{editMode ? "Editar Cliente" : "Detalhes do Cliente"}</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Email</label>
              <Input disabled={!editMode} value={selected.email || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Primeiro Nome</label>
              <Input disabled={!editMode} value={selected.first_name || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Sobrenome</label>
              <Input disabled={!editMode} value={selected.last_name || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, last_name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Telefone</label>
              <Input disabled={!editMode} value={selected.profile?.telefone || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, profile: { ...prev.profile, telefone: e.target.value } }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm">CPF</label>
              <Input disabled={!editMode} value={selected.profile?.cpf || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, profile: { ...prev.profile, cpf: e.target.value } }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm">CEP</label>
              <Input disabled={!editMode} value={selected.profile?.cep || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, profile: { ...prev.profile, cep: e.target.value } }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm">Endereço</label>
              <Input disabled={!editMode} value={selected.profile?.endereco || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, profile: { ...prev.profile, endereco: e.target.value } }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Número</label>
              <Input disabled={!editMode} value={selected.profile?.numero || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, profile: { ...prev.profile, numero: e.target.value } }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Complemento</label>
              <Input disabled={!editMode} value={selected.profile?.complemento || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, profile: { ...prev.profile, complemento: e.target.value } }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Bairro</label>
              <Input disabled={!editMode} value={selected.profile?.bairro || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, profile: { ...prev.profile, bairro: e.target.value } }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Cidade</label>
              <Input disabled={!editMode} value={selected.profile?.cidade || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, profile: { ...prev.profile, cidade: e.target.value } }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Estado (UF)</label>
              <Input disabled={!editMode} value={selected.profile?.estado || ""} onChange={(e) => setSelected((prev: any) => ({ ...prev, profile: { ...prev.profile, estado: e.target.value } }))} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {!editMode && (
              <Button className="bg-primary text-black" onClick={() => setEditMode(true)}>Editar</Button>
            )}
            {editMode && (
              <>
                <Button className="bg-primary text-black" onClick={saveCustomer}>Salvar</Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
              </>
            )}
            <Button variant="destructive" onClick={() => deleteCustomer(selected.id)}>Excluir Cliente</Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </Card>
      )}
      {error && !selected && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function OrdersAdmin() {
  const router = useRouter();
  const [orders, setOrders] = useState<Array<any>>([]);
  const [statuses, setStatuses] = useState<Array<{ id: number; key: string; label: string; is_active?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallbackStatuses = [
    { key: "pending", label: "Pendente" },
    { key: "paid", label: "Pago" },
    { key: "separation", label: "Em separação" },
    { key: "shipped", label: "Enviado" },
    { key: "delivered", label: "Entregue" },
  ];

  async function load() {
    setLoading(true);
    setError(null);
    const [oRes, sRes] = await Promise.all([
      fetch("/api/admin/orders", { cache: "no-store" }),
      fetch("/api/admin/order-statuses", { cache: "no-store" }),
    ]);
    const oData = oRes.ok ? await oRes.json() : [];
    const sData = sRes.ok ? await sRes.json() : [];
    setOrders(Array.isArray(oData) ? oData : []);
    const activeStatuses = Array.isArray(sData) ? sData.filter((s: any) => s.is_active) : [];
    setStatuses(activeStatuses.length ? activeStatuses : fallbackStatuses.map((s, i) => ({ id: i + 1, key: s.key, label: s.label, is_active: true })));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(orderId: number, statusKey: string) {
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusKey }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Falha ao atualizar status");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: statusKey } : o)));
  }

  function openDetail(o: any) {
    const slug = o.order_number || o.id;
    router.push(`/gerenciamento/pedidos/${slug}`);
  }

  function openEdit(o: any) {
    const slug = o.order_number || o.id;
    router.push(`/gerenciamento/pedidos/${slug}/editar`);
  }

  async function deleteOrder(id: number) {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) return;
    const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Falha ao excluir pedido");
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Pedidos/Vendas</h3>
      {loading ? (
        <p className="text-sm text-zinc-600">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Pedido</th>
                <th className="p-2 text-left">Cliente</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Total</th>
                <th className="p-2 text-left">Criado</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="p-2">{o.order_number || o.id}</td>
                  <td className="p-2">{o.customer_name || "—"}<br /><span className="text-xs text-zinc-500">{o.customer_email || ""}</span></td>
                  <td className="p-2">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="rounded border px-2 py-1"
                    >
                      {statuses.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">R$ {Number(o.total || 0).toFixed(2)}</td>
                  <td className="p-2">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDetail(o)}>Visualizar</Button>
                      <Button size="sm" className="bg-primary text-black" onClick={() => openEdit(o)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteOrder(o.id)}>Deletar</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td className="p-2 text-sm text-zinc-600" colSpan={5}>Nenhum pedido encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

    </div>
  );
}

function OrderStatusesAdmin() {
  const [items, setItems] = useState<Array<any>>([]);
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [sort, setSort] = useState(0);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function slugify(s: string) {
    return s
      .normalize("NFD")
      // @ts-ignore remove diacritics
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/admin/order-statuses", { cache: "no-store" });
    const data = res.ok ? await res.json() : [];
    setItems(Array.isArray(data) ? data : []);
  }

  async function createStatus() {
    setError(null);
    const payload = { label, key: key || slugify(label), sort_order: sort, is_active: active };
    const res = await fetch("/api/admin/order-statuses/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setLabel("");
      setKey("");
      setSort(0);
      setActive(true);
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Erro ao criar status");
    }
  }

  async function updateItem(it: any) {
    setError(null);
    const res = await fetch(`/api/admin/order-statuses/${it.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: it.label, key: it.key, sort_order: it.sort_order, is_active: it.is_active }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Erro ao atualizar");
    }
  }

  async function removeItem(id: number) {
    setError(null);
    const res = await fetch(`/api/admin/order-statuses/${id}/`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Erro ao remover");
    }
  }

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Status do Pedido</h3>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input placeholder="Key (slug)" value={key} onChange={(e) => setKey(e.target.value)} />
        <Input placeholder="Ordem" value={String(sort)} onChange={(e) => setSort(parseInt(e.target.value || "0") || 0)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Ativo
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Button className="bg-primary text-black" onClick={createStatus}>Criar status</Button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Label</th>
              <th className="p-2 text-left">Key</th>
              <th className="p-2 text-left">Ordem</th>
              <th className="p-2 text-left">Ativo</th>
              <th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id || idx} className="border-b">
                <td className="p-2"><Input value={it.label} onChange={(e) => setItems((prev) => prev.map((p) => p.id === it.id ? { ...p, label: e.target.value } : p))} /></td>
                <td className="p-2"><Input value={it.key} onChange={(e) => setItems((prev) => prev.map((p) => p.id === it.id ? { ...p, key: e.target.value } : p))} /></td>
                <td className="p-2"><Input value={String(it.sort_order ?? 0)} onChange={(e) => setItems((prev) => prev.map((p) => p.id === it.id ? { ...p, sort_order: parseInt(e.target.value || "0") || 0 } : p))} /></td>
                <td className="p-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!it.is_active} onChange={(e) => setItems((prev) => prev.map((p) => p.id === it.id ? { ...p, is_active: e.target.checked } : p))} /> Ativo
                  </label>
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => updateItem(it)}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => removeItem(it.id)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-2 text-sm text-zinc-600" colSpan={5}>Nenhum status cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function SettingsAdmin() {
  const [activeTab, setActiveTab] = useState<string>("site");
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Configurações</h3>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={clsx("rounded px-3 py-1", activeTab === "site" ? "bg-primary text-black" : "border")}
          onClick={() => setActiveTab("site")}
        >
          Configurações do Site
        </button>
        <button
          className={clsx("rounded px-3 py-1", activeTab === "order_statuses" ? "bg-primary text.black" : "border")}
          onClick={() => setActiveTab("order_statuses")}
        >
          Status do Pedido
        </button>
      </div>
      {activeTab === "site" && <Placeholder title="Configurações do Site" />}
      {activeTab === "order_statuses" && <OrderStatusesAdmin />}
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <Card className="p-4">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-zinc-600">Funcionalidade em desenvolvimento.</p>
    </Card>
  );
}

export default function ManagementPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [active, setActive] = useState("dashboard");
  const searchParams = useSearchParams();

  useEffect(() => {
    // ping categorias admin; se autorizado (200) considera logado
    fetch("/api/admin/categories").then((res) => {
      setLoggedIn(res.ok);
    });
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActive(tab);
  }, [searchParams]);

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <header className="border-b bg-primary p-4 text-black">
          <h1 className="text-lg font-semibold">Gerenciamento</h1>
        </header>
        <main className="mx-auto max-w-4xl p-6">
          <LoginForm onLoggedIn={() => setLoggedIn(true)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-primary p-4 text-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-lg font-semibold">Gerenciamento</h1>
          <Button
            variant="outline"
            className="border-black text-black"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              setLoggedIn(false);
              setActive("dashboard");
            }}
          >
            Sair
          </Button>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl">
        <SidebarNav active={active} onChange={setActive} />
        <main className="flex-1 p-6">
          {active === "dashboard" && <Dashboard />}
          {active === "categories" && <CategoriesAdmin />}
          {active === "products" && <ProductsAdmin />}
          {active === "users" && <UsersAdmin />}
          {active === "orders" && <OrdersAdmin />}
          {active === "customers" && <CustomersAdmin />}
          {active === "inventory" && <Placeholder title="Inventário" />}
          {active === "promotions" && <Placeholder title="Promoções/Cupons" />}
          {active === "marketing" && <Placeholder title="Marketing" />}
          {active === "shipping" && <Placeholder title="Frete" />}
          {active === "payments" && <Placeholder title="Pagamentos" />}
          {active === "analytics" && <Placeholder title="Analytics" />}
          {active === "banners" && <Placeholder title="Banners" />}
          {active === "pages" && <Placeholder title="Páginas" />}
          {active === "seo" && <Placeholder title="SEO" />}
          {active === "settings" && <SettingsAdmin />}
          {active === "order_statuses" && <OrderStatusesAdmin />}
        </main>
      </div>
    </div>
  );
}