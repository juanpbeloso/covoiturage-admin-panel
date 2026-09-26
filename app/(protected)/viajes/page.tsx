"use client";

import { useEffect, useState } from "react";

type Viaje = {
  id: string;
  origen: string;
  destino: string;
  salida: string;
  estado: string;
  conductorNombre: string;
  conductorEmail: string;
  asientosTotales: number;
  asientosDisponibles: number;
  precioPorAsiento: number;
  reservasActivas: number;
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

const ESTADOS = ["", "Active", "Full", "InProgress", "Completed", "Cancelled"];

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function ViajesPage() {
  const [items, setItems] = useState<Viaje[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load(nextQuery = query, nextEstado = estado) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        query: nextQuery,
        estado: nextEstado,
        page: "1",
        pageSize: "50",
      });
      const res = await fetch(`/api/proxy/admin/viajes?${params}`);
      if (!res.ok) throw new Error("No se pudieron cargar los viajes.");
      const data = (await res.json()) as Paged<Viaje>;
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelar(id: string) {
    if (!confirm("¿Cancelar este viaje y sus reservas activas?")) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/admin/viajes/${id}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelado por administración." }),
      });
      if (!res.ok) throw new Error("No se pudo cancelar el viaje.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-subite-dark">Viajes</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void load();
          }}
          placeholder="Buscar origen, destino o conductor..."
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            void load(query, e.target.value);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {ESTADOS.map((value) => (
            <option key={value || "all"} value={value}>
              {value || "Todos los estados"}
            </option>
          ))}
        </select>
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
                <th className="px-4 py-3">Ruta</th>
                <th className="px-4 py-3">Salida</th>
                <th className="px-4 py-3">Conductor</th>
                <th className="px-4 py-3">Asientos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((viaje) => (
                <tr key={viaje.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {viaje.origen} → {viaje.destino}
                    </div>
                    <div className="text-xs text-slate-500">
                      ${viaje.precioPorAsiento.toLocaleString("es-AR")} · {viaje.reservasActivas} reservas
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(viaje.salida)}</td>
                  <td className="px-4 py-3">
                    <div>{viaje.conductorNombre}</div>
                    <div className="text-xs text-slate-500">{viaje.conductorEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    {viaje.asientosDisponibles}/{viaje.asientosTotales}
                  </td>
                  <td className="px-4 py-3">{viaje.estado}</td>
                  <td className="px-4 py-3">
                    {viaje.estado !== "Cancelled" && viaje.estado !== "Completed" && (
                      <button
                        type="button"
                        disabled={busyId === viaje.id}
                        onClick={() => void cancelar(viaje.id)}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No hay viajes para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-slate-500">{total} viajes</p>
        </div>
      )}
    </div>
  );
}
