'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

export function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetch('/api/categorias').then(res => res.json()).then(setCategories);
  }, []);

  async function handleAddCategory() {
    if (!newCategoryName) return;
    const res = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName }),
    });
    if (res.ok) {
      const newCategory = await res.json();
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
    }
  }

  async function handleDeleteCategory(id: number) {
    const res = await fetch(`/api/categorias/${id}`,
      { method: 'DELETE' }
    );
    if (res.ok) {
      setCategories(categories.filter(c => c.id !== id));
    }
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-lg font-semibold">Categorias</h3>
      <div className="mb-3 flex gap-2">
        <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nova categoria" />
        <Button onClick={handleAddCategory}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Button>
      </div>
      <ul className="space-y-2">
        {categories.map(category => (
          <li key={category.id} className="flex items-center justify-between rounded-md bg-gray-100 p-2">
            <span>{category.name}</span>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}