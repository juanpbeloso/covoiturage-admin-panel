"use client";

import { useEffect, useState } from "react";

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

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [commission, setCommission] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [configRes, settingsRes] = await Promise.all([
        fetch("/api/proxy/api/pricing-config/active"),
        fetch("/api/proxy/admin/settings"),
      ]);

      if (!configRes.ok) throw new Error("No se pudo cargar la configuración de pricing.");
      if (!settingsRes.ok) throw new Error("No se pudo cargar la comisión.");

      const active = (await configRes.json()) as PricingConfig;
      const settings = (await settingsRes.json()) as PlatformSettings;
      setConfig(active);
      setCommission(String(settings.platformCommissionPercent));
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
      const [pricingRes, commissionRes] = await Promise.all([
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
      ]);

      if (!pricingRes.ok || !commissionRes.ok) {
        throw new Error("No se pudieron guardar los cambios.");
      }

      setMessage("Configuración guardada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando...</p>;
  }

  if (!config) {
    return <p className="text-sm text-red-600">No hay configuración de pricing activa.</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-lg font-semibold text-subite-dark">Pricing y comisión</h1>
      <p className="mb-6 text-sm text-slate-500">
        Parámetros usados para calcular el precio sugerido y la comisión al pagar con Mercado Pago.
      </p>

      <form onSubmit={handleSave} className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Nombre</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Nafta ($/litro)</label>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={config.fuelPricePerLiter}
              onChange={(e) =>
                setConfig({ ...config, fuelPricePerLiter: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Km por litro</label>
            <input
              type="number"
              step="0.1"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={config.kmPerLiter}
              onChange={(e) => setConfig({ ...config, kmPerLiter: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Desgaste ($/km)</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={config.wearCostPerKm}
              onChange={(e) =>
                setConfig({ ...config, wearCostPerKm: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Tope vs referencia (ratio)
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={config.maxPriceRatioVsReference}
              onChange={(e) =>
                setConfig({ ...config, maxPriceRatioVsReference: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Comisión plataforma (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Se suma al pasajero al pagar la reserva (ej. 12.5 = 12,5%).
          </p>
        </div>

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
