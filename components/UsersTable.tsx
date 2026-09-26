"use client";

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: "Activo" | "Bloqueado" | string;
};

type UsersTableProps = {
  usuarios: Usuario[];
  onBloquear?: (id: string) => void;
  onDesbloquear?: (id: string) => void;
};

export default function UsersTable({
  usuarios,
  onBloquear,
  onDesbloquear,
}: UsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
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
          {usuarios.map((u) => (
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
                    type="button"
                    onClick={() => onBloquear(u.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Bloquear
                  </button>
                )}
                {u.estado === "Bloqueado" && onDesbloquear && (
                  <button
                    type="button"
                    onClick={() => onDesbloquear(u.id)}
                    className="text-xs font-medium text-subite-primary hover:underline"
                  >
                    Desbloquear
                  </button>
                )}
              </td>
            </tr>
          ))}
          {usuarios.length === 0 && (
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
