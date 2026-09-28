"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { formatARS } from "@/lib/money";

type PricingConfig = {
  id: string;
  name: string;
  isActive: boolean;
  fuelPricePerLiter: number;
  kmPerLiter: number;
  wearCostPerKm: number;
  maxPriceRatioVsReference: number;
};

type PlatformSettings = {
  platformCommissionPercent: number;
  updatedAt: string;
};

type TollSegment = {
  id?: string;
  corridor: string;
  fromCity: string;
  toCity: string;
  label: string;
  amount: number;
  sequence: number;
  isActive: boolean;
};

type ReferencePrice = {
  originCity: string;
  destinationCity: string;
  price: number;
  label: string;
};

function emptyToll(sequence: number): TollSegment {
  return {
    corridor: "RN7",
    fromCity: "",
    toCity: "",
    label: "",
    amount: 0,
    sequence,
    isActive: true,
  };
}

function normalizeCity(value: string) {
  const raw = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (["caba", "capital federal", "buenos aires", "bs as", "retiro"].includes(raw)) {
    return "retiro";
  }
  return raw;
}

function cityIndex(cities: string[], raw: string) {
  const needle = normalizeCity(raw);
  if (!needle) return -1;
  return cities.findIndex((city) => {
    const n = normalizeCity(city);
    return n === needle || n.includes(needle) || needle.includes(n);
  });
}

function resolveTolls(segments: TollSegment[], origin: string, dest: string) {
  const active = segments
    .filter((s) => s.isActive && s.fromCity.trim() && s.toCity.trim())
    .sort((a, b) => a.sequence - b.sequence);
  if (active.length === 0) return { total: 0, used: [] as TollSegment[] };

  const cities = [active[0].fromCity];
  for (const segment of active) {
    if (normalizeCity(cities[cities.length - 1]) !== normalizeCity(segment.fromCity)) {
      cities.push(segment.fromCity);
    }
    cities.push(segment.toCity);
  }

  let from = cityIndex(cities, origin);
  let to = cityIndex(cities, dest);
  if (from < 0 || to < 0 || from === to) return { total: 0, used: [] as TollSegment[] };
  if (from > to) [from, to] = [to, from];

  const used = active.filter((segment) => {
    const a = cityIndex(cities, segment.fromCity);
    const b = cityIndex(cities, segment.toCity);
    return a >= from && b <= to && a < b;
  });
  return { total: used.reduce((sum, s) => sum + Number(s.amount || 0), 0), used };
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [commission, setCommission] = useState("12.5");
  const [tolls, setTolls] = useState<TollSegment[]>([]);
  const [references, setReferences] = useState<ReferencePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [origin, setOrigin] = useState("Junín");
  const [destination, setDestination] = useState("Retiro");
  const [distanceKm, setDistanceKm] = useState("265");
  const [passengers, setPassengers] = useState("2");
  const [viajesMes, setViajesMes] = useState("40");
  const [asientosViaje, setAsientosViaje] = useState("2");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [configRes, settingsRes, tollsRes, refsRes] = await Promise.all([
        fetch("/api/proxy/api/pricing-config/active"),
        fetch("/api/proxy/admin/settings"),
        fetch("/api/proxy/admin/toll-segments"),
        fetch("/api/proxy/api/reference-prices"),
      ]);

      if (!configRes.ok) throw new Error("No se pudo cargar la configuración de pricing.");
      if (!settingsRes.ok) throw new Error("No se pudo cargar la comisión.");

      const active = (await configRes.json()) as PricingConfig;
      const settings = (await settingsRes.json()) as PlatformSettings;
      setConfig(active);
      setCommission(String(settings.platformCommissionPercent));
      if (tollsRes.ok) {
        setTolls((await tollsRes.json()) as TollSegment[]);
      }
      if (refsRes.ok) {
        setReferences((await refsRes.json()) as ReferencePrice[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const [pricingRes, commissionRes, tollsRes] = await Promise.all([
        fetch(`/api/proxy/api/pricing-config/${config.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        }),
        fetch("/api/proxy/admin/settings/commission", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platformCommissionPercent: Number(commission) }),
        }),
        fetch("/api/proxy/admin/toll-segments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tolls),
        }),
      ]);

      if (!pricingRes.ok || !commissionRes.ok || !tollsRes.ok) {
        throw new Error("No se pudieron guardar los cambios.");
      }

      setMessage("Configuración guardada. La app ya usa estos valores al publicar.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  const example = useMemo(() => {
    if (!config) return null;
    const km = Number(distanceKm) || 0;
    const seats = Math.max(1, Number(passengers) || 1);
    const rate = (Number(commission) || 0) / 100;
    const liters = config.kmPerLiter > 0 ? km / config.kmPerLiter : 0;
    const fuel = liters * config.fuelPricePerLiter;
    const { total: toll, used } = resolveTolls(tolls, origin, destination);
    const wear = km * config.wearCostPerKm;
    const total = fuel + toll + wear;
    const divisor = seats + 1;
    const perSeat = divisor > 0 ? total / divisor : total;
    const ref =
      references.find(
        (r) =>
          normalizeCity(r.originCity) === normalizeCity(origin) &&
          (normalizeCity(r.destinationCity) === normalizeCity(destination) ||
            normalizeCity(destination).includes(normalizeCity(r.destinationCity)) ||
            normalizeCity(r.destinationCity).includes(normalizeCity(destination)))
      ) ?? references[0];
    const cap = ref ? ref.price * config.maxPriceRatioVsReference : 0;
    const exceeds = cap > 0 && perSeat > cap;
    const suggested = exceeds ? cap : perSeat;
    const fee = suggested * rate;
    const passengerPays = suggested + fee;
    const trips = Math.max(0, Number(viajesMes) || 0);
    const seatsPaid = Math.max(0, Number(asientosViaje) || 0);
    const monthlyGmv = suggested * seatsPaid * trips;
    const monthlyFee = fee * seatsPaid * trips;
    const monthlyDriver = monthlyGmv;

    return {
      fuel,
      toll,
      wear,
      total,
      divisor,
      perSeat,
      suggested,
      fee,
      passengerPays,
      cap,
      exceeds,
      ref,
      used,
      monthlyGmv,
      monthlyFee,
      monthlyDriver,
    };
  }, [
    config,
    commission,
    tolls,
    references,
    origin,
    destination,
    distanceKm,
    passengers,
    viajesMes,
    asientosViaje,
  ]);

  function updateToll(index: number, patch: Partial<TollSegment>) {
    setTolls(tolls.map((item, i) => (i === index ? { ...item, ...patch, sequence: i + 1 } : item)));
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando...</p>;
  }

  if (!config) {
    return <p className="text-sm text-red-600">No hay configuración de pricing activa.</p>;
  }

  return (
    <div className="max-w-5xl">
      <h1 className="mb-2 text-lg font-semibold text-subite-dark">Pricing y comisión</h1>
      <p className="mb-6 text-sm text-slate-500">
        Acá se arma el precio que ve el conductor al publicar y lo que se suma al pasajero
        al pagar. Los cambios impactan en la app después de guardar.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-subite-dark">Costos del viaje</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Nombre</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Nafta ($/litro)"
              hint="Se multiplica por los km del viaje ÷ km por litro."
            >
              <input
                type="number"
                className={inputClass}
                value={config.fuelPricePerLiter}
                onChange={(e) =>
                  setConfig({ ...config, fuelPricePerLiter: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Km por litro" hint="Consumo promedio del auto.">
              <input
                type="number"
                step="0.1"
                className={inputClass}
                value={config.kmPerLiter}
                onChange={(e) => setConfig({ ...config, kmPerLiter: Number(e.target.value) })}
              />
            </Field>
            <Field label="Desgaste ($/km)" hint="Opcional. Neumáticos, service, etc.">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={config.wearCostPerKm}
                onChange={(e) =>
                  setConfig({ ...config, wearCostPerKm: Number(e.target.value) })
                }
              />
            </Field>
            <Field
              label="Tope vs colectivo (ratio)"
              hint="1 = no superar el precio de referencia. 0.8 = máximo 80% del micro."
            >
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={config.maxPriceRatioVsReference}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxPriceRatioVsReference: Number(e.target.value),
                  })
                }
              />
            </Field>
          </div>
          <Field
            label="Comisión Subite (%)"
            hint="Se suma al pasajero. El conductor cobra el precio del asiento; Subite se queda este %."
          >
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              className={`${inputClass} max-w-xs`}
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-subite-dark">Peajes por tramo</h2>
            <p className="mt-1 text-xs text-slate-500">
              La app suma solo los tramos que quedan entre origen y destino. Junín → Retiro
              usa todos; Chacabuco → Luján usa los del medio.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-2 pr-2">Desde</th>
                  <th className="pb-2 pr-2">Hasta</th>
                  <th className="pb-2 pr-2">Nombre del peaje</th>
                  <th className="pb-2 pr-2">Monto $</th>
                  <th className="pb-2 pr-2">Activo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tolls.map((toll, index) => (
                  <tr key={toll.id ?? `new-${index}`}>
                    <td className="py-1 pr-2">
                      <input
                        className={inputClass}
                        value={toll.fromCity}
                        onChange={(e) => updateToll(index, { fromCity: e.target.value })}
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        className={inputClass}
                        value={toll.toCity}
                        onChange={(e) => updateToll(index, { toCity: e.target.value })}
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        className={inputClass}
                        value={toll.label}
                        onChange={(e) => updateToll(index, { label: e.target.value })}
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        className={`${inputClass} w-28`}
                        value={toll.amount}
                        onChange={(e) =>
                          updateToll(index, { amount: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="checkbox"
                        checked={toll.isActive}
                        onChange={(e) => updateToll(index, { isActive: e.target.checked })}
                      />
                    </td>
                    <td className="py-1">
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() => setTolls(tolls.filter((_, i) => i !== index))}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-subite-primary"
            onClick={() => setTolls([...tolls, emptyToll(tolls.length + 1)])}
          >
            + Agregar tramo
          </button>
        </section>

        {example && (
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-subite-dark">
                Cómo se ve en la app
              </h2>
              <p className="mb-4 text-xs text-slate-500">
                Ejemplo en vivo. No se guarda: sirve para ver el impacto antes de confirmar.
              </p>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Origen"
                />
                <input
                  className={inputClass}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Destino"
                />
                <input
                  className={inputClass}
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="Km"
                />
                <input
                  className={inputClass}
                  type="number"
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  placeholder="Pasajeros"
                />
              </div>
              <BreakdownRow label="Nafta" value={example.fuel} />
              <BreakdownRow label="Peajes del tramo" value={example.toll} />
              {example.used.map((t) => (
                <p key={`${t.fromCity}-${t.toCity}`} className="pl-3 text-xs text-slate-400">
                  · {t.label || `${t.fromCity} → ${t.toCity}`}: {formatARS(t.amount)}
                </p>
              ))}
              <BreakdownRow label="Desgaste" value={example.wear} />
              <BreakdownRow label="Costo total del auto" value={example.total} bold />
              <p className="mt-2 text-xs text-slate-500">
                Se divide por {example.divisor} (pasajeros + conductor).
              </p>
              <BreakdownRow label="Precio por asiento" value={example.suggested} bold />
              {example.ref ? (
                <p className="mt-2 text-xs text-slate-500">
                  Tope colectivo {example.ref.label}: {formatARS(example.cap)}.{" "}
                  {example.exceeds
                    ? "El costo real lo supera: la app recorta al tope."
                    : "Cabe debajo del micro: se publica el costo real."}
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Sin precio de referencia para esta ruta: no hay tope.
                </p>
              )}
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                <p className="mb-2 font-medium text-slate-700">Al pagar un asiento</p>
                <BreakdownRow label="Va al conductor" value={example.suggested} />
                <BreakdownRow
                  label={`Comisión Subite (${commission}%)`}
                  value={example.fee}
                />
                <BreakdownRow label="Paga el pasajero" value={example.passengerPays} bold />
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-subite-dark">
                Proyección mensual
              </h2>
              <p className="mb-4 text-xs text-slate-500">
                Simulación con el precio del ejemplo. Cambiá viajes y asientos cobrados.
              </p>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <Field label="Viajes pagos / mes">
                  <input
                    type="number"
                    className={inputClass}
                    value={viajesMes}
                    onChange={(e) => setViajesMes(e.target.value)}
                  />
                </Field>
                <Field label="Asientos cobrados / viaje">
                  <input
                    type="number"
                    className={inputClass}
                    value={asientosViaje}
                    onChange={(e) => setAsientosViaje(e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-3">
                <Stat
                  label="Ganancia Subite / mes"
                  value={formatARS(example.monthlyFee)}
                  accent
                />
                <Stat
                  label="A conductores / mes"
                  value={formatARS(example.monthlyDriver)}
                />
                <Stat
                  label="Los pasajeros pagan / mes"
                  value={formatARS(example.monthlyGmv + example.monthlyFee)}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {formatARS(example.suggested)} × {asientosViaje} asientos × {viajesMes} viajes
                × {commission}% de comisión.
              </p>
            </div>
          </section>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-subite-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-600">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between py-1 text-sm ${bold ? "font-semibold" : ""}`}>
      <span className="text-slate-600">{label}</span>
      <span className="text-subite-dark">{formatARS(value)}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 ${accent ? "bg-emerald-50" : "bg-slate-50"}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-semibold ${accent ? "text-emerald-700" : "text-subite-dark"}`}>
        {value}
      </p>
    </div>
  );
}
