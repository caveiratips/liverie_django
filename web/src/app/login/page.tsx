"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextUrl = (() => {
    try {
      const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : "");
      const n = sp.get('next');
      if (n && /^\//.test(n)) return n;
    } catch {}
    return "/loja";
  })();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ detail: "Falha no login" }));
        setError(d?.detail || "Falha no login");
      } else {
        window.location.href = nextUrl;
      }
    } catch (e) {
      setError("Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-primary p-4 text-black">
        <div className="mx-auto max-w-md">
          <h1 className="text-lg font-semibold">Entrar</h1>
          <p className="text-xs">Use seu email e senha para acessar.</p>
        </div>
      </header>
      <main className="mx-auto max-w-md p-6">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <Input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-between">
            <Button className="bg-primary text-black" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <a href="/cadastro" className="text-sm hover:text-primary">Cadastrar-se</a>
          </div>
        </form>
      </main>
    </div>
  );
}