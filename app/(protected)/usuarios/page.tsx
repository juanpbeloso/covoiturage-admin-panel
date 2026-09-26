"use client";

import { useEffect, useState } from "react";
import UsersTable, { Usuario } from "@/components/UsersTable";

type Paged<T> = { items: T[]; total: number };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
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
      const res = await fetch(`/api/proxy/admin/usuarios?${params}`);
      if (!res.ok) throw new Error("No se pudieron cargar los usuarios.");
      const data = (await res.json()) as Paged<Usuario>;
      setUsuarios(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBloquear(id: string) {
    const res = await fetch(`/api/proxy/admin/usuarios/${id}/bloquear`, { method: "POST" });
    if (!res.ok) {
      setError("No se pudo bloquear el usuario.");
      return;
    }
    await load();
  }

  async function handleDesbloquear(id: string) {
    const res = await fetch(`/api/proxy/admin/usuarios/${id}/desbloquear`, { method: "POST" });
    if (!res.ok) {
      setError("No se pudo desbloquear el usuario.");
      return;
    }
    await load();
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-subite-dark">Usuarios</h1>
      <div className="mb-4 flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void load();
          }}
          placeholder="Buscar por nombre o email..."
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
        <UsersTable
          usuarios={usuarios}
          onBloquear={handleBloquear}
          onDesbloquear={handleDesbloquear}
        />
      )}
    </div>
  );
}
