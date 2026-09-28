"use client";

import { useEffect, useState } from "react";
import { formatARS } from "@/lib/money";

type ReferencePrice = {
  id: string;
  originCity: string;
  destinationCity: string;
  transportMode: string;
  label: string;
  price: number;
  source: string;
  validFrom: string;
  validTo?: string | null;
  updatedAt: string;
};

const emptyForm: Omit<ReferencePrice, "id" | "updatedAt"> = {
  originCity: "",
  destinationCity: "",
  transportMode: "bus_semi_cama",
  label: "",
  price: 0,
  source: "manual",
  validFrom: new Date().toISOString(),
  validTo: null,
};

type PricingConfig = {
  maxPriceRatioVsReference: number;
};

type PlatformSettings = {
  platformCommissionPercent: number;
};

export default function PreciosReferenciaPage() {
  const [items, setItems] = useState<ReferencePrice[]>([]);
  const [ratio, setRatio] = useState(1);
  const [commissionPercent, setCommissionPercent] = useState(12.5);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [res, configRes, settingsRes] = await Promise.all([
        fetch("/api/proxy/api/reference-prices"),
        fetch("/api/proxy/api/pricing-config/active"),
        fetch("/api/proxy/admin/settings"),
      ]);
      if (!res.ok) throw new Error("No se pudieron cargar los precios.");
      setItems((await res.json()) as ReferencePrice[]);
      if (configRes.ok) {
        const config = (await configRes.json()) as PricingConfig;
        setRatio(config.maxPriceRatioVsReference || 1);
      }
      if (settingsRes.ok) {
        const settings = (await settingsRes.json()) as PlatformSettings;
        setCommissionPercent(settings.platformCommissionPercent || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/proxy/api/reference-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("No se pudo crear el precio.");
      setForm(emptyForm);
      setMessage("Precio agregado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-subite-dark">Precios de referencia</h1>
      <p className="mb-6 text-sm text-slate-500">
        La app no deja publicar un asiento más caro que este precio × el ratio de
        Pricing ({ratio}). Si el costo real (nafta + peajes) da más, se recorta al tope.
      </p>

      <form
        onSubmit={handleCreate}
        className="mb-8 grid gap-3 rounded-xl bg-white p-6 shadow-sm md:grid-cols-2"
      >
        <input
          placeholder="Origen (ej. Junín)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.originCity}
          onChange={(e) => setForm({ ...form, originCity: e.target.value })}
          required
        />
        <input
          placeholder="Destino (ej. Buenos Aires)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.destinationCity}
          onChange={(e) => setForm({ ...form, destinationCity: e.target.value })}
          required
        />
        <input
          placeholder="Etiqueta"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Precio ($)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.price || ""}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          required
        />
        <input
          placeholder="Fuente (ej. plataforma10.com.ar)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-subite-primary px-4 py-2 text-sm font-medium text-white md:col-span-2 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Agregar precio"}
        </button>
        {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
        {message && <p className="text-sm text-green-700 md:col-span-2">{message}</p>}
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Ruta</th>
                <th className="px-4 py-3">Micro</th>
                <th className="px-4 py-3">Tope en la app</th>
                <th className="px-4 py-3">Comisión si se cobra el tope</th>
                <th className="px-4 py-3">Fuente</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.originCity} → {item.destinationCity}</div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                  </td>
                  <td className="px-4 py-3">{formatARS(item.price)}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatARS(item.price * ratio)}
                    <div className="text-xs font-normal text-slate-500">
                      ratio {ratio} × precio micro
                    </div>
                  </td>
                  <td className="px-4 py-3 text-emerald-700">
                    {formatARS(item.price * ratio * (commissionPercent / 100))}
                    <div className="text-xs font-normal text-slate-500">
                      {commissionPercent}% sobre el tope
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{item.source}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(item.updatedAt).toLocaleDateString("es-AR")}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
