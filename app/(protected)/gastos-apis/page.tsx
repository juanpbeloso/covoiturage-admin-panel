"use client";

import { useEffect, useState } from "react";

type ApiBudget = {
  mapsDirectionsEnabled: boolean;
  mapsMonthlyRequestCap: number;
  mapsPricePerThousandUsd: number;
  keyConfigured: boolean;
  monthLabel: string;
  requestsThisMonth: number;
  successfulThisMonth: number;
  failedThisMonth: number;
  capRemaining: number;
  estimatedCostUsdThisMonth: number;
  googleFreeCap: number;
};

export default function GastosApisPage() {
  const [budget, setBudget] = useState<ApiBudget | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [cap, setCap] = useState("10000");
  const [price, setPrice] = useState("5");
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
      const res = await fetch("/api/proxy/admin/settings/apis");
      if (!res.ok) throw new Error("No se pudo cargar el uso de APIs.");
      const data = (await res.json()) as ApiBudget;
      setBudget(data);
      setEnabled(data.mapsDirectionsEnabled);
      setCap(String(data.mapsMonthlyRequestCap));
      setPrice(String(data.mapsPricePerThousandUsd));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/proxy/admin/settings/apis", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapsDirectionsEnabled: enabled,
          mapsMonthlyRequestCap: Number(cap),
          mapsPricePerThousandUsd: Number(price),
        }),
      });
      if (!res.ok) throw new Error("No se pudieron guardar los cambios.");
      setMessage("Límites actualizados.");
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

  const remainingLabel =
    !budget || budget.capRemaining < 0
      ? "Sin tope"
      : String(budget.capRemaining);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-lg font-semibold text-subite-dark">Gastos de APIs</h1>
      <p className="mb-6 text-sm text-slate-500">
        Controlá Google Directions (rutas en el mapa). La app llama a Subite; Subite
        cobra el cupo y puede cortar el servicio si llegás al tope.
      </p>

      {budget && !budget.keyConfigured && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Falta la variable <code className="font-mono">GoogleMaps__ApiKey</code> en
          el <code className="font-mono">.env</code> del VPS. Sin eso no hay rutas
          reales, aunque el interruptor esté encendido.
        </div>
      )}

      {budget && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={`Requests ${budget.monthLabel}`} value={budget.requestsThisMonth} />
          <Stat label="Exitosas" value={budget.successfulThisMonth} />
          <Stat label="Restantes del tope" value={remainingLabel} />
          <Stat
            label="Costo estimado (USD)"
            value={`$${budget.estimatedCostUsdThisMonth.toFixed(2)}`}
          />
        </div>
      )}

      {budget && (
        <p className="mb-6 text-xs text-slate-500">
          Google da {budget.googleFreeCap.toLocaleString("es-AR")} requests gratis por
          mes (SKU Directions). Recién después de esa cifra Subite estima USD con el
          precio de abajo. Fallos este mes: {budget.failedThisMonth}.
        </p>
      )}

      <form onSubmit={handleSave} className="mb-8 space-y-5 rounded-xl bg-white p-6 shadow-sm">
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-medium text-slate-700">
              Google Directions
            </span>
            <span className="text-xs text-slate-500">
              Si lo apagás, los mapas muestran una línea recta y no se cobra nada.
            </span>
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Tope mensual (requests exitosos)
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">0 = sin tope extra (solo el de Google).</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Precio USD / 1000 requests
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Directions clásico: 5. Directions Advanced: 10.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-subite-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar límites"}
        </button>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <h2 className="mb-3 font-semibold text-subite-dark">Cómo activar Directions</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Entrá a{" "}
            <a
              className="text-subite-primary underline"
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noreferrer"
            >
              Google Cloud Console
            </a>{" "}
            y creá o elegí el proyecto de Subite.
          </li>
          <li>Billing → vinculá una tarjeta. Sin billing Google no habilita Directions.</li>
          <li>
            APIs &amp; Services → Library → buscá <strong>Directions API</strong> → Enable.
            También podés habilitar Maps SDK for iOS si más adelante usás el mapa nativo de
            Google.
          </li>
          <li>
            Credentials → Create credentials → API key. Restringila a <em>Directions API</em>{" "}
            (y, si aplica, a la IP del VPS). No la pongas en la app Expo.
          </li>
          <li>
            En el VPS,{" "}
            <code className="rounded bg-slate-100 px-1 font-mono">deploy/.env</code>:{" "}
            <code className="rounded bg-slate-100 px-1 font-mono">GoogleMaps__ApiKey</code>{" "}
            = esa key. Después{" "}
            <code className="rounded bg-slate-100 px-1 font-mono">
              docker compose up -d --build api
            </code>
            . En local:{" "}
            <code className="rounded bg-slate-100 px-1 font-mono">GoogleMaps:ApiKey</code>{" "}
            en appsettings.Development.json.
          </li>
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-subite-dark">{value}</p>
    </div>
  );
}
