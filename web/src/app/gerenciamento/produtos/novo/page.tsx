"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { clsx } from "clsx";
import { Package, Tags, BadgePercent, Ruler, Palette, Images, FileText } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdParam = searchParams.get("id");
  const editingId = editIdParam ? Number(editIdParam) : null;

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
  const [colors, setColors] = useState<Array<{ name: string; hex: string }>>([]);
  const [sizes, setSizes] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [parentCatId, setParentCatId] = useState<string>("");
  const [subCatId, setSubCatId] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: number; url: string | null; alt_text: string; is_primary: boolean }>>([]);
  const [dragNewIndex, setDragNewIndex] = useState<number | null>(null);
  const [dragExistingIndex, setDragExistingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  }, []);

  useEffect(() => {
    async function loadForEdit(id: number) {
      const r = await fetch(`/api/admin/products/${id}`, { cache: "no-store" });
      if (!r.ok) return;
      const p = await r.json();
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
      const colorsArr: Array<{ name: string; hex: string }> = Array.isArray(p.colors)
        ? p.colors.map((c: any) => {
            if (typeof c === "string") {
              const s = c.trim();
              const pair = s.includes("|") ? s.split("|", 2) : (s.includes(":") ? s.split(":", 2) : null);
              if (pair && pair.length === 2) {
                return { name: (pair[0] || "").trim(), hex: (pair[1] || "").trim() || "#000000" };
              }
              const isHex = /^#|rgb|hsl/i.test(s);
              return { name: s, hex: isHex ? s : "#000000" };
            }
            return { name: (c?.name || "").trim(), hex: (c?.hex || "#000000").trim() };
          })
        : String(p.available_colors || "")
            .split(/[;,]/)
            .map((s: string) => s.trim())
            .filter(Boolean)
            .map((s: string) => {
              const pair = s.includes("|") ? s.split("|", 2) : (s.includes(":") ? s.split(":", 2) : null);
              if (pair && pair.length === 2) {
                return { name: (pair[0] || "").trim(), hex: (pair[1] || "").trim() || "#000000" };
              }
              const isHex = /^#|rgb|hsl/i.test(s);
              return { name: s, hex: isHex ? s : "#000000" };
            });
      const sizesCsv = Array.isArray(p.sizes) ? p.sizes.join(", ") : (p.available_sizes || "");
      setColors(colorsArr || []);
      setSizes(sizesCsv || "");
      setSeoTitle(p.seo_title || "");
      setSeoDescription(p.seo_description || "");
      setIsFeatured(Boolean(p.is_featured));
      setIsActive(Boolean(p.is_active));
      setCategoryId(p.category?.id != null ? String(p.category.id) : "");
      setCategoryName(p.category?.name || "");
      const catId = p.category?.id;
      const catParent = p.category?.parent ?? null;
      if (catId != null) {
        if (catParent != null) {
          setParentCatId(String(catParent));
          setSubCatId(String(catId));
        } else {
          setParentCatId(String(catId));
          setSubCatId("");
        }
      } else {
        setParentCatId("");
        setSubCatId("");
      }
      const imgs: Array<{ id: number; url: string | null; alt_text: string; is_primary: boolean }> = Array.isArray(p.images) ? p.images : [];
      setExistingImages(imgs);
    }
    if (editingId) loadForEdit(editingId);
  }, [editingId]);

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

  async function ensureCategoryId(): Promise<number> {
    const subIdNum = Number(subCatId);
    if (subIdNum && !Number.isNaN(subIdNum)) return subIdNum;
    const parentIdNum = Number(parentCatId);
    if (parentIdNum && !Number.isNaN(parentIdNum)) return parentIdNum;
    const existingId = Number(categoryId);
    if (existingId && !Number.isNaN(existingId)) return existingId;
    const name = categoryName.trim();
    if (!name) throw new Error("Categoria é obrigatória");
    const found = categories.find((c) => (c?.name || "").toLowerCase() === name.toLowerCase());
    if (found?.id) return Number(found.id);
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
    setCategories((prev) => [{ ...data }, ...prev]);
    return Number(data.id);
  }

  async function saveProduct() {
    setError(null);
    setFormErrors([]);
    const errs: string[] = [];
    if (!title.trim()) errs.push("Título é obrigatório");
    const hasCategoryInput = Boolean(subCatId) || Boolean(parentCatId) || Boolean(categoryName.trim()) || Boolean(categoryId);
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
        available_colors: (colors || []).map((c) => `${(c.name || '').trim()}|${c.hex || '#000000'}`).join(", "),
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
      alert(editingId ? "Produto atualizado!" : "Produto criado!");
      router.push("/gerenciamento?tab=products");
    } else {
      const data = await res.json().catch(() => ({}));
      const errsResp: string[] = data?.errors || [];
      if (Array.isArray(errsResp) && errsResp.length) {
        setFormErrors(errsResp);
      } else {
        setError(data?.detail || "Erro ao salvar produto");
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/gerenciamento?tab=products')}>Voltar</Button>
            <Input className="w-[320px]" placeholder="Título do produto" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/gerenciamento?tab=products')}>Cancelar</Button>
            <Button className="bg-primary text-white hover:bg-primary/90" onClick={saveProduct}>{editingId ? 'Atualizar' : 'Salvar'}</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <div className="space-y-6">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#3F5F4F]" />
              <h4 className="text-md font-semibold text-[#3F5F4F]">Detalhes</h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
              <Input placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} />
              <Input placeholder="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
              <Input placeholder="GTIN" value={gtin} onChange={(e) => setGtin(e.target.value)} />
              <Input placeholder="MPN" value={mpn} onChange={(e) => setMpn(e.target.value)} />
            </div>
            <textarea className="mt-3 min-h-24 w-full rounded-md border px-3 py-2" placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Tags className="h-4 w-4 text-[#3F5F4F]" />
              <h4 className="text-md font-semibold text-[#3F5F4F]">Categoria</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="mb-1 block text-sm">Categoria</label>
                <select className="w-full rounded-md border px-3 py-2 text-sm" value={parentCatId} onChange={(e) => { setParentCatId(e.target.value); setSubCatId(""); }}>
                  <option value="">Selecione uma categoria</option>
                  {(categories || []).filter((c) => !c.parent).sort((a, b) => String(a.name).localeCompare(String(b.name))).map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">Subcategoria</label>
                <select className="w-full rounded-md border px-3 py-2 text-sm" value={subCatId} onChange={(e) => setSubCatId(e.target.value)} disabled={!parentCatId}>
                  <option value="">{parentCatId ? "Selecione uma subcategoria (opcional)" : "Escolha a categoria primeiro"}</option>
                  {(() => {
                    const parent = (categories || []).find((c) => String(c.id) === String(parentCatId));
                    const children = parent?.children || [];
                    return children.sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))).map((sc: any) => (
                      <option key={sc.id} value={String(sc.id)}>{sc.name}</option>
                    ));
                  })()}
                </select>
              </div>
                <small className="mt-1 text-xs text-muted-foreground">Opcional: digite um nome de categoria; criaremos se não existir.</small>
              <Input placeholder="ou digite o nome da categoria" value={categoryName} onChange={(e) => {
                const val = e.target.value;
                setCategoryName(val);
                const match = categories.find((c) => (c?.name || "").toLowerCase() === val.toLowerCase());
                setCategoryId(match?.id != null ? String(match.id) : "");
              }} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <BadgePercent className="h-4 w-4 text-[#3F5F4F]" />
              <h4 className="text-md font-semibold text-[#3F5F4F]">Preço e estoque</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Input type="text" inputMode="numeric" placeholder="Preço (R$)" value={price} onChange={(e) => setPrice(formatCurrencyInput(e.target.value))} />
              <Input type="text" inputMode="numeric" placeholder="Preço comparativo (de)" value={compareAtPrice} onChange={(e) => setCompareAtPrice(formatCurrencyInput(e.target.value))} />
              <Input type="text" inputMode="numeric" placeholder="Custo" value={costPrice} onChange={(e) => setCostPrice(formatCurrencyInput(e.target.value))} />
              <Input type="number" min={0} step={1} placeholder="Estoque" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={trackInventory} onChange={(e) => setTrackInventory(e.target.checked)} /> Controlar inventário</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} /> Tributável</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={freeShipping} onChange={(e) => setFreeShipping(e.target.checked)} /> Frete grátis</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Ativo</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Destaque</label>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Ruler className="h-4 w-4 text-[#3F5F4F]" />
              <h4 className="text-md font-semibold text-[#3F5F4F]">Dimensões</h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Input type="text" inputMode="numeric" placeholder="Peso (kg)" value={weight} onChange={(e) => setWeight(formatDecimal3Input(e.target.value))} />
              <Input type="text" inputMode="numeric" placeholder="Largura (cm)" value={width} onChange={(e) => setWidth(formatDecimal3Input(e.target.value))} />
              <Input type="text" inputMode="numeric" placeholder="Altura (cm)" value={height} onChange={(e) => setHeight(formatDecimal3Input(e.target.value))} />
              <Input type="text" inputMode="numeric" placeholder="Comprimento (cm)" value={length} onChange={(e) => setLength(formatDecimal3Input(e.target.value))} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#3F5F4F]" />
              <h4 className="text-md font-semibold text-[#3F5F4F]">Variações</h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-sm">Cores (nome + paleta)</div>
                <div className="flex flex-col gap-2">
                  {colors.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input placeholder="Nome da cor (ex: Denim)" value={c.name} onChange={(e) => { const next = [...colors]; next[idx] = { ...next[idx], name: e.target.value }; setColors(next); }} />
                      <input type="color" value={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.hex) ? c.hex : "#000000"} onChange={(e) => { const next = [...colors]; next[idx] = { ...next[idx], hex: e.target.value }; setColors(next); }} />
                      <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => { const next = colors.filter((_, i) => i !== idx); setColors(next); }} aria-label="Remover cor">Remover</button>
                    </div>
                  ))}
                  <button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={() => setColors([...(colors || []), { name: "", hex: "#000000" }])}>+ Adicionar cor</button>
                </div>
                  <div className="mt-1 text-xs text-muted-foreground">Informe o nome da cor e escolha a paleta; será exibido na página do produto.</div>
              </div>
              <Input placeholder="Tamanhos (separados por vírgula)" value={sizes} onChange={(e) => setSizes(e.target.value)} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Images className="h-4 w-4 text-[#3F5F4F]" />
              <h4 className="text-md font-semibold text-[#3F5F4F]">Imagens</h4>
            </div>
            {existingImages.length > 0 && (
              <div className="mb-2">
                <p className="mb-1 text-xs text-muted-foreground">Imagens já cadastradas</p>
                <div className="flex items-start gap-3">
                  <div
                    className={clsx("relative h-28 w-28 flex-shrink-0 overflow-hidden rounded border bg-white", "ring-2 ring-primary")}
                    onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = "move"; } catch {} }}
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
                          <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] text-muted-foreground">
                            Arraste uma imagem aqui para torná-la principal
                          </div>
                        );
                    })()}
                    <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white">Principal</span>
                  </div>
                  <div className="w-px self-stretch bg-zinc-200" />
                  <div className="flex flex-wrap gap-2">
                    {existingImages.filter((i) => !i.is_primary).map((img, idx) => (
                      <div
                        key={img.id}
                        className="relative h-24 w-24 overflow-hidden rounded border bg-white"
                        draggable
                        onDragStart={(e) => {
                          setDragExistingIndex(idx);
                          try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", `existing:${idx}`); } catch {}
                        }}
                        onDragEnd={() => setDragExistingIndex(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropExisting(idx)}
                      >
                        {img.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img draggable={false} src={getImageUrl(img.url)} alt={img.alt_text || ""} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sem imagem</div>
                          )}
                        <button type="button" className="absolute right-1 top-1 rounded-full bg-black/70 px-2 text-xs text-white" onClick={() => removeExistingImage(img.id)} aria-label="Excluir imagem">×</button>
                        <button type="button" className="absolute bottom-1 right-1 rounded bg-primary px-1 text-[10px] text-white" onClick={() => makePrimaryExisting(img.id)}>Definir como principal</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Novas imagens (não enviadas ainda). Arraste para a esquerda para definir a principal.</p>
            <div className="mt-1 flex items-start gap-3">
              <div
                className={clsx("relative h-28 w-28 flex-shrink-0 overflow-hidden rounded border bg-white", imagePreviews.length > 0 ? "ring-2 ring-primary" : "")}
                onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = "move"; } catch {} }}
                onDrop={() => { if (dragNewIndex != null) { makePrimaryNew(dragNewIndex); setDragNewIndex(null); } }}
              >
                {imagePreviews[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img draggable={false} src={imagePreviews[0]} alt="Pré-visualização" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] text-muted-foreground">Arraste uma nova imagem aqui para ser principal</div>
                )}
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white">Principal</span>
              </div>
              <div className="w-px self-stretch bg-zinc-200" />
              <div className="flex flex-wrap gap-2">
                {imagePreviews.slice(1).map((url, idx) => (
                  <div
                    key={url}
                    className="relative h-24 w-24 overflow-hidden rounded border bg-white"
                    draggable
                    onDragStart={(e) => {
                      const index = idx + 1;
                      setDragNewIndex(index);
                      try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", `new:${index}`); } catch {}
                    }}
                    onDragEnd={() => setDragNewIndex(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropNew(idx + 1)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img draggable={false} src={url} alt="Pré-visualização" className="h-full w-full object-cover" />
                    <button type="button" className="absolute right-1 top-1 rounded-full bg-black/70 px-2 text-xs text-white" onClick={() => removeNewImage(idx + 1)} aria-label="Remover imagem">×</button>
                    <button type="button" className="absolute bottom-1 right-1 rounded bg-primary px-1 text-[10px] text-white" onClick={() => makePrimaryNew(idx + 1)}>Definir como principal</button>
                  </div>
                ))}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleSelectFiles(e.target.files)} />
            <div className="mt-2">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Adicionar imagem</Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#3F5F4F]" />
              <h4 className="text-md font-semibold text-[#3F5F4F]">SEO</h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input placeholder="SEO Título" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              <Input placeholder="SEO Descrição" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
            </div>
          </Card>

          {formErrors.length > 0 && (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              <ul className="list-disc pl-4">
                {formErrors.map((e, i) => (<li key={i}>{e}</li>))}
              </ul>
            </div>
          )}
          {error && (<p className="text-sm text-red-600">{error}</p>)}
        </div>
      </main>
    </div>
  );
}