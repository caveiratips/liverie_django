"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clsx } from "clsx";
import AdminSidebarNav from "@/components/AdminSidebarNav";

export default function PedidoEditarPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [recipientName, setRecipientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [deliveryAddressId, setDeliveryAddressId] = useState<number | null>(null);
  const [customAddress, setCustomAddress] = useState("");

  const [customerEmail, setCustomerEmail] = useState("");
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [profile, setProfile] = useState<any | null>(null);

  const [statuses, setStatuses] = useState<Array<{ key: string; label: string }>>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const isNumeric = /^\d+$/.test(id);
    const url = isNumeric ? `/api/admin/orders/${id}` : `/api/admin/orders/by-number/${id}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        setOrder(data);
        setRecipientName(data.recipient_name || "");
        setPaymentMethod(data.payment_method || "");
        setShippingMethod(data.shipping_method || "");
        setDeliveryAddressId(data.delivery_address?.id || null);
        setCustomAddress(data.shipping_address_text || "");
        setCustomerEmail(data.customer_profile?.email || "");
        const fullName = (data.customer_profile?.name || "").trim();
        const parts = fullName.split(" ");
        setCustomerFirstName(parts[0] || "");
        setCustomerLastName(parts.slice(1).join(" ") || "");
        setProfile(data.customer_profile?.profile || null);
      })
      .catch(async () => {
        const altUrl = isNumeric ? `/api/admin/orders/by-number/${id}` : `/api/admin/orders/${id}`;
        try {
          const r2 = await fetch(altUrl);
          if (r2.ok) {
            const data = await r2.json();
            setOrder(data);
            setRecipientName(data.recipient_name || "");
            setPaymentMethod(data.payment_method || "");
            setShippingMethod(data.shipping_method || "");
            setDeliveryAddressId(data.delivery_address?.id || null);
            setCustomAddress(data.shipping_address_text || "");
            setCustomerEmail(data.customer_profile?.email || "");
            const fullName = (data.customer_profile?.name || "").trim();
            const parts = fullName.split(" ");
            setCustomerFirstName(parts[0] || "");
            setCustomerLastName(parts.slice(1).join(" ") || "");
            setProfile(data.customer_profile?.profile || null);
          } else {
            setError("Pedido não encontrado");
            setOrder(null);
          }
        } catch {
          setError("Falha ao carregar pedido");
          setOrder(null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    async function loadStatuses() {
      setStatusLoading(true);
      try {
        const res = await fetch("/api/admin/order-statuses", { cache: "no-store" });
        const data = res.ok ? await res.json() : [];
        const active = Array.isArray(data) ? data.filter((s: any) => s.is_active) : [];
        setStatuses(active.map((s: any) => ({ key: s.key, label: s.label })));
      } catch {
        setStatuses([
          { key: "pending", label: "Pendente" },
          { key: "paid", label: "Pago" },
          { key: "separation", label: "Em separação" },
          { key: "shipped", label: "Enviado" },
          { key: "delivered", label: "Entregue" },
        ]);
      } finally {
        setStatusLoading(false);
      }
    }
    loadStatuses();
  }, []);

  async function saveOrder() {
    if (!order) return;
    setError(null);
    const payload: any = {
      recipient_name: recipientName,
      payment_method: paymentMethod,
      shipping_method: shippingMethod,
      shipping_address_text: customAddress,
    };
    payload.delivery_address_id = deliveryAddressId || null;
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Falha ao salvar pedido");
      return;
    }
    const updated = await res.json();
    setOrder(updated);
    setSuccess("Pedido atualizado com sucesso");
  }

  async function saveCustomer() {
    if (!order?.user_id) return;
    setError(null);
    const payload: any = {
      email: customerEmail,
      first_name: customerFirstName,
      last_name: customerLastName,
      profile: profile || {},
    };
    const res = await fetch(`/api/admin/customers/${order.user_id}`, {
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
    setCustomerEmail(updated?.email || "");
    setCustomerFirstName(updated?.first_name || "");
    setCustomerLastName(updated?.last_name || "");
    setProfile(updated?.profile || null);
  }

  async function deleteOrder() {
    if (!order) return;
    if (!confirm("Tem certeza que deseja excluir este pedido?")) return;
    const res = await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/gerenciamento");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.detail || "Falha ao excluir pedido");
    }
  }

  async function updateStatus(newStatus: string) {
    if (!order) return;
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.detail || "Falha ao atualizar status");
      return;
    }
    setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
    setSuccess("Status do pedido atualizado");
  }

  function statusBadgeClass(key: string) {
    return clsx(
      "rounded-full px-2 py-1 text-xs capitalize",
      {
        pending: "bg-yellow-100 text-yellow-800",
        paid: "bg-emerald-100 text-emerald-800",
        separation: "bg-blue-100 text-blue-800",
        shipped: "bg-indigo-100 text-indigo-800",
        delivered: "bg-zinc-200 text-zinc-800",
      }[key] || "bg-muted text-zinc-800"
    );
  }

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!order) return <div className="p-6">Pedido não encontrado</div>;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-primary p-4 text-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Editar Pedido #{order.order_number || order.id}</h1>
            <span className={statusBadgeClass(order.status)}>{({
              pending: "Pendente",
              paid: "Pago",
              separation: "Em separação",
              shipped: "Enviado",
              delivered: "Entregue",
            } as any)[order.status] || order.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-black text-black" onClick={() => router.push(`/gerenciamento/pedidos/${order.id}`)}>Voltar</Button>
            <Button variant="destructive" onClick={deleteOrder}>Deletar</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl">
        <AdminSidebarNav active="orders" onChange={(k) => router.push(`/gerenciamento?tab=${k}`)} />
        <main className="flex-1 p-6">
          {error && <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-3 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <h3 className="mb-2 text-lg font-semibold">Visão Geral do Pedido</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs">Status</label>
                  <select
                    className="mt-1 w-full rounded border px-2 py-1 text-sm"
                    value={order.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    disabled={statusLoading}
                  >
                    {statuses.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs">Criado</label>
                  <div className="mt-1 text-sm text-zinc-700">{new Date(order.created_at).toLocaleString()}</div>
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-600">Total: <strong>R$ {Number(order.total || 0).toFixed(2)}</strong></p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(String(order.order_number || order.id))}>Copiar número</Button>
                <Button variant="outline" onClick={() => window.print()}>Imprimir resumo</Button>
              </div>
            </Card>
            <Card className="p-4 sm:col-span-2">
              <h3 className="mb-2 text-lg font-semibold">Cliente</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs">Nome</label>
                  <Input className="mt-1" value={customerFirstName} onChange={(e) => setCustomerFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs">Sobrenome</label>
                  <Input className="mt-1" value={customerLastName} onChange={(e) => setCustomerLastName(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs">Email</label>
                  <Input className="mt-1" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div>
                  <label className="text-xs">Telefone</label>
                  <Input className="mt-1" value={profile?.telefone || ""} onChange={(e) => setProfile({ ...(profile || {}), telefone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs">CPF</label>
                  <Input className="mt-1" value={profile?.cpf || ""} onChange={(e) => setProfile({ ...(profile || {}), cpf: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs">CEP</label>
                  <Input className="mt-1" value={profile?.cep || ""} onChange={(e) => setProfile({ ...(profile || {}), cep: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs">Endereço</label>
                  <Input className="mt-1" value={profile?.endereco || ""} onChange={(e) => setProfile({ ...(profile || {}), endereco: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs">Número</label>
                  <Input className="mt-1" value={profile?.numero || ""} onChange={(e) => setProfile({ ...(profile || {}), numero: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs">Complemento</label>
                  <Input className="mt-1" value={profile?.complemento || ""} onChange={(e) => setProfile({ ...(profile || {}), complemento: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs">Bairro</label>
                  <Input className="mt-1" value={profile?.bairro || ""} onChange={(e) => setProfile({ ...(profile || {}), bairro: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs">Cidade</label>
                  <Input className="mt-1" value={profile?.cidade || ""} onChange={(e) => setProfile({ ...(profile || {}), cidade: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs">Estado</label>
                  <Input className="mt-1" value={profile?.estado || ""} onChange={(e) => setProfile({ ...(profile || {}), estado: e.target.value })} />
                </div>
              </div>
              <div className="mt-3">
                <Button className="bg-primary text-black" onClick={saveCustomer}>Salvar Cliente</Button>
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <h3 className="mb-2 text-lg font-semibold">Entrega</h3>
              <div>
                <label className="text-xs">Selecionar endereço salvo</label>
                <select className="mt-1 w-full rounded border px-2 py-1 text-xs" value={deliveryAddressId ?? ""} onChange={(e) => setDeliveryAddressId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— Nenhum (usar personalizado) —</option>
                  {(order.customer_addresses || []).map((a: any) => (
                    <option key={a.id} value={a.id}>{(a.label || a.endereco)} · {a.cidade}-{a.estado}</option>
                  ))}
                </select>
              </div>
              <div className="mt-2">
                <label className="text-xs">Endereço personalizado (texto)</label>
                <textarea className="mt-1 w-full rounded border p-2 text-xs" rows={4} value={customAddress} onChange={(e) => setCustomAddress(e.target.value)} />
              </div>
            </Card>
            <Card className="p-4 sm:col-span-2">
              <h3 className="mb-2 text-lg font-semibold">Pagamento & Frete</h3>
              <div>
                <label className="text-xs">Forma de pagamento</label>
                <Input className="mt-1" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              </div>
              <div className="mt-2">
                <label className="text-xs">Tipo de entrega</label>
                <Input className="mt-1" value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} />
              </div>
            </Card>
          </div>

          <div className="mt-4">
            <Button className="bg-primary text-black" onClick={saveOrder}>Salvar Pedido</Button>
          </div>
        </main>
      </div>
    </div>
  );
}