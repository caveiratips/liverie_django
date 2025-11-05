"use client";
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

export default function AdminSidebarNav({ active, onChange }: { active: string; onChange: (k: string) => void }) {
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