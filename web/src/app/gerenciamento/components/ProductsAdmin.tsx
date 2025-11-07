'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PlusCircle, Trash2, Edit } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image: string;
}

interface Category {
  id: number;
  name: string;
}

export function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: '', image: '' });

  useEffect(() => {
    fetch('/api/produtos').then(res => res.json()).then(setProducts);
    fetch('/api/categorias').then(res => res.json()).then(setCategories);
  }, []);

  async function handleAddProduct() {
    const res = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newProduct,
        price: parseFloat(newProduct.price),
        category: parseInt(newProduct.category)
      }),
    });
    if (res.ok) {
      const createdProduct = await res.json();
      setProducts([...products, createdProduct]);
      setNewProduct({ name: '', description: '', price: '', category: '', image: '' });
    }
  }

  async function handleDeleteProduct(id: number) {
    const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts(products.filter(p => p.id !== id));
    }
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-lg font-semibold">Produtos</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Nome do produto" />
        <Input value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Descrição" />
        <Input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Preço" />
        <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
          <option value="">Selecione a categoria</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Input value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} placeholder="URL da imagem" />
        <Button onClick={handleAddProduct} className="col-span-2"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto</Button>
      </div>
      <ul className="space-y-2">
        {products.map(product => (
          <li key={product.id} className="flex items-center justify-between rounded-md bg-gray-100 p-2">
            <div className="flex items-center gap-4">
              <img src={product.image} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-500">R$ {product.price}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}