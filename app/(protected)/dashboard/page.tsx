import KpiCard from "@/components/KpiCard";
import KpiChart, { SeriePoint } from "@/components/KpiChart";
// import { getDashboardKpis } from "@/lib/api"; // usar cuando exista /admin/dashboard/kpis

// MOCK — reemplazar por: const kpis = await getDashboardKpis(token);
const MOCK_KPIS = {
  usuarios: 1204,
  viajesPublicados: 312,
  reservas: 540,
  pagosOk: 498,
  pagosFail: 42,
  gmvAproximado: 2100000,
};

// MOCK — reemplazar por: const serie = await getDashboardSeries(token);
const MOCK_SERIE: SeriePoint[] = [
  { fecha: "06/08", reservas: 12 },
  { fecha: "07/08", reservas: 19 },
  { fecha: "08/08", reservas: 14 },
  { fecha: "09/08", reservas: 22 },
  { fecha: "10/08", reservas: 28 },
  { fecha: "11/08", reservas: 24 },
  { fecha: "12/08", reservas: 31 },
];

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  // En una implementación real: leer token de la cookie httpOnly (server-side)
  // y llamar a getDashboardKpis(token) / getDashboardSeries(token) acá mismo,
  // ya que este es un Server Component por default en el App Router.
  const kpis = MOCK_KPIS;
  const serie = MOCK_SERIE;

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-subite-dark">
        Dashboard
      </h1>

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
    </div>
  );
}
