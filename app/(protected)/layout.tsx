import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/configuracion", label: "Pricing y comisión" },
  { href: "/precios-referencia", label: "Precios referencia" },
  { href: "/usuarios", label: "Usuarios" },
  { href: "/viajes", label: "Viajes" },
  { href: "/reservas", label: "Reservas y pagos" },
  { href: "/logs", label: "Logs" },
  { href: "/gastos-apis", label: "Gastos de APIs" },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <p className="font-semibold text-subite-dark">Subite Admin</p>
        </div>
        <nav className="p-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 bg-slate-50 p-6">{children}</main>
    </div>
  );
}
