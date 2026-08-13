"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // MOCK — reemplazar por POST a /app/api/login (Route Handler) que a su
      // vez llame a subite-api /admin/auth/login y setee la cookie httpOnly.
      // const res = await fetch("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
      // if (!res.ok) throw new Error("Credenciales inválidas");

      await new Promise((r) => setTimeout(r, 600)); // simula latencia
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm"
      >
        <h1 className="mb-6 text-xl font-semibold text-subite-dark">
          Subite Admin
        </h1>

        <label className="mb-1 block text-sm font-medium text-slate-600">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-subite-primary focus:outline-none"
          placeholder="admin@subite.com"
        />

        <label className="mb-1 block text-sm font-medium text-slate-600">
          Contraseña
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-subite-primary focus:outline-none"
          placeholder="••••••••"
        />

        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-subite-primary py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
