"use client";

import { useState } from "react";
import UsersTable, { Usuario } from "@/components/UsersTable";
// import { getUsuarios, bloquearUsuario } from "@/lib/api"; // usar cuando exista /admin/usuarios

// MOCK — reemplazar por: const { items } = await getUsuarios(token);
const MOCK_USUARIOS: Usuario[] = [
  { id: 1, nombre: "Juan Pérez", email: "juan@mail.com", rol: "Pasajero", estado: "Activo" },
  { id: 2, nombre: "María Gómez", email: "maria@mail.com", rol: "Conductor", estado: "Activo" },
  { id: 3, nombre: "Carlos Ruiz", email: "carlos@mail.com", rol: "Pasajero", estado: "Bloqueado" },
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(MOCK_USUARIOS);

  function handleBloquear(id: number) {
    // MOCK — reemplazar por: await bloquearUsuario(token, id);
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, estado: "Bloqueado" } : u))
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-subite-dark">Usuarios</h1>
      <UsersTable usuarios={usuarios} onBloquear={handleBloquear} />
    </div>
  );
}
