"use client";

import { useEffect, useState } from "react";
import KpiCard from "@/components/KpiCard";
import KpiChart, { SeriePoint } from "@/components/KpiChart";

type Kpis = {
  usuarios: number;
  viajesPublicados: number;
  reservas: number;
  pagosOk: number;
  pagosFail: number;
  gmvAproximado: number;
};

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [serie, setSerie] = useState<SeriePoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [kpisRes, serieRes] = await Promise.all([
          fetch("/api/proxy/admin/dashboard/kpis"),
          fetch("/api/proxy/admin/dashboard/series?days=7"),
        ]);
        if (!kpisRes.ok || !serieRes.ok) {
          throw new Error("No se pudieron cargar los indicadores.");
        }
        setKpis((await kpisRes.json()) as Kpis);
        setSerie((await serieRes.json()) as SeriePoint[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar.");
      }
    }

    void load();
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-subite-dark">Dashboard</h1>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {!kpis ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Usuarios" value={kpis.usuarios} />
            <KpiCard label="Viajes publicados" value={kpis.viajesPublicados} />
            <KpiCard label="Reservas" value={kpis.reservas} />
            <KpiCard
              label="GMV aproximado"
              value={formatARS(kpis.gmvAproximado)}
              hint={`${kpis.pagosOk} pagos OK / ${kpis.pagosFail} fallidos`}
            />
          </div>
          <KpiChart data={serie} />
        </>
      )}
    </div>
  );
}
