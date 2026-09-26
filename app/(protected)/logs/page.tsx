"use client";

import { useEffect, useState } from "react";

type LogItem = {
  id: string;
  fecha: string;
  tipo: string;
  titulo: string;
  detalle: string;
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function LogsPage() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load(nextQuery = query) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        query: nextQuery,
        page: "1",
        pageSize: "50",
      });
      const res = await fetch(`/api/proxy/admin/logs?${params}`);
      if (!res.ok) throw new Error("No se pudieron cargar los logs.");
      const data = (await res.json()) as Paged<LogItem>;
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-subite-dark">Logs</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void load();
          }}
          placeholder="Buscar por tipo, título o detalle..."
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-subite-primary px-4 py-2 text-sm font-medium text-white"
        >
          Buscar
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Evento</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={`${log.tipo}-${log.id}-${log.fecha}`} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {new Date(log.fecha).toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3">{log.tipo}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{log.titulo}</div>
                    <div className="text-xs text-slate-500">{log.detalle}</div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    No hay eventos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-slate-500">{total} eventos</p>
        </div>
      )}
    </div>
  );
}
