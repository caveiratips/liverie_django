'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      onLoggedIn();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || 'Falha no login');
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
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </Card>
    </form>
  );
}