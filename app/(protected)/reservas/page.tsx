"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatARS } from "@/lib/money";

type Reserva = {
  id: string;
  rideId: string;
  ruta: string;
  pasajeroNombre: string;
  pasajeroEmail: string;
  asientos: number;
  monto: number;
  baseViaje?: number;
  ganancia?: number;
  estado: string;
  estadoPago: string;
  creada: string;
};

type GananciaSerie = {
  fecha: string;
  ganancia: number;
  gmv: number;
  pagos: number;
};

type GananciaPago = {
  id: string;
  ruta: string;
  fecha: string;
  montoPasajero: number;
  baseViaje: number;
  ganancia: number;
  estado: string;
};

type Ganancias = {
  days: number;
  totalGanancia: number;
  totalGmv: number;
  pagosOk: number;
  gananciaPromedio: number;
  series: GananciaSerie[];
  pagos: GananciaPago[];
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

const ESTADOS = ["", "Pending", "Confirmed", "Cancelled", "Completed", "Refunded"];

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function ReservasPage() {
  const [items, setItems] = useState<Reserva[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ganancias, setGanancias] = useState<Ganancias | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    void loadGanancias(days);
  }, [days]);

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
      const res = await fetch(`/api/proxy/admin/reservas?${params}`);
      if (!res.ok) throw new Error("No se pudieron cargar las reservas.");
      const data = (await res.json()) as Paged<Reserva>;
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }

  async function loadGanancias(nextDays: number) {
    try {
      const res = await fetch(`/api/proxy/admin/pagos/ganancias?days=${nextDays}`);
      if (!res.ok) return;
      setGanancias((await res.json()) as Ganancias);
    } catch {
      // la tabla de reservas igual se muestra
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-subite-dark">Reservas y pagos</h1>

      {ganancias && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-500">Ganancia de Subite (comisión cobrada)</p>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value={7}>7 días</option>
              <option value={30}>30 días</option>
              <option value={90}>90 días</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Ganancia" value={formatARS(ganancias.totalGanancia)} />
            <Stat label="Pagos OK" value={String(ganancias.pagosOk)} />
            <Stat label="Promedio / pago" value={formatARS(ganancias.gananciaPromedio)} />
            <Stat label="Cobrado a pasajeros" value={formatARS(ganancias.totalGmv)} />
          </div>
          <div className="h-72 rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-medium text-slate-600">
              Ganancia por día
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={ganancias.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "ganancia" || name === "gmv"
                      ? formatARS(value)
                      : value,
                    name === "ganancia" ? "Ganancia" : name === "gmv" ? "GMV" : "Pagos",
                  ]}
                />
                <Bar dataKey="ganancia" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void load();
          }}
          placeholder="Buscar pasajero o ruta..."
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
                <th className="px-4 py-3">Pasajero</th>
                <th className="px-4 py-3">Asientos</th>
                <th className="px-4 py-3">Pagó</th>
                <th className="px-4 py-3">Ganancia</th>
                <th className="px-4 py-3">Reserva</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {items.map((reserva) => (
                <tr key={reserva.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{reserva.ruta}</td>
                  <td className="px-4 py-3">
                    <div>{reserva.pasajeroNombre}</div>
                    <div className="text-xs text-slate-500">{reserva.pasajeroEmail}</div>
                  </td>
                  <td className="px-4 py-3">{reserva.asientos}</td>
                  <td className="px-4 py-3">
                    {formatARS(reserva.monto)}
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-700">
                    {reserva.estadoPago === "Approved"
                      ? formatARS(reserva.ganancia ?? 0)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{reserva.estado}</td>
                  <td className="px-4 py-3">{reserva.estadoPago}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(reserva.creada)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                    No hay reservas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-slate-500">{total} reservas</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-subite-dark">{value}</p>
    </div>
  );
}
