"use client";

import { useState } from "react";

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: "Pasajero" | "Conductor";
  estado: "Activo" | "Bloqueado";
};

type UsersTableProps = {
  usuarios: Usuario[];
  onBloquear?: (id: number) => void;
};

export default function UsersTable({ usuarios, onBloquear }: UsersTableProps) {
  const [query, setQuery] = useState("");

  const filtrados = usuarios.filter((u) =>
    `${u.nombre} ${u.email}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-subite-primary focus:outline-none"
        />
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">Nombre</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Rol</th>
            <th className="px-4 py-2 font-medium">Estado</th>
            <th className="px-4 py-2 font-medium">Acción</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((u) => (
            <tr key={u.id} className="border-t border-slate-100">
              <td className="px-4 py-2">{u.nombre}</td>
              <td className="px-4 py-2 text-slate-500">{u.email}</td>
              <td className="px-4 py-2">{u.rol}</td>
              <td className="px-4 py-2">
                <span
                  className={
                    u.estado === "Activo"
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                      : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"
                  }
                >
                  {u.estado}
                </span>
              </td>
              <td className="px-4 py-2">
                {u.estado === "Activo" && onBloquear && (
                  <button
                    onClick={() => onBloquear(u.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Bloquear
                  </button>
                )}
              </td>
            </tr>
          ))}
          {filtrados.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                No se encontraron usuarios.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
