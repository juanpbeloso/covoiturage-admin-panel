/**
 * Wrapper mínimo de fetch para consumir subite-api desde el panel admin.
 * - Adjunta el Bearer token (leído de cookie httpOnly server-side, o de un
 *   token en memoria en cliente, según dónde se invoque).
 * - Centraliza el manejo de errores 401/403.
 *
 * NOTA: esto es un esqueleto. El manejo real de la cookie httpOnly debe
 * hacerse en Route Handlers de Next (app/api/*) o en Server Components,
 * nunca leyendo la cookie httpOnly desde el cliente (por diseño no se puede).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string; // access token, si se maneja en memoria en el cliente
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token }: ApiOptions = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new ApiError("No autorizado. Iniciá sesión nuevamente.", res.status);
    }
    const text = await res.text().catch(() => "");
    throw new ApiError(text || `Error ${res.status}`, res.status);
  }

  // Algunos endpoints (ej. 204 No Content) no devuelven body
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// --- Endpoints admin (mapean 1:1 con ADMIN_PANEL.md sección C) ---
// Reemplazar los "MOCK" de las páginas por llamadas a estas funciones
// cuando los endpoints /admin/* existan en subite-api.

export function login(email: string, password: string, token?: string) {
  return apiFetch<{ accessToken: string; refreshToken: string }>(
    "/admin/auth/login",
    { method: "POST", body: { email, password }, token }
  );
}

export function getDashboardKpis(token: string, desde?: string, hasta?: string) {
  const qs = new URLSearchParams({
    ...(desde ? { desde } : {}),
    ...(hasta ? { hasta } : {}),
  });
  return apiFetch<{
    usuarios: number;
    viajesPublicados: number;
    reservas: number;
    pagosOk: number;
    pagosFail: number;
    gmvAproximado: number;
  }>(`/admin/dashboard/kpis?${qs.toString()}`, { token });
}

export function getUsuarios(
  token: string,
  params: { query?: string; page?: number; pageSize?: number } = {}
) {
  const qs = new URLSearchParams({
    query: params.query ?? "",
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20),
  });
  return apiFetch<{
    items: Array<{
      id: number;
      nombre: string;
      email: string;
      rol: "Pasajero" | "Conductor";
      estado: "Activo" | "Bloqueado";
    }>;
    total: number;
  }>(`/admin/usuarios?${qs.toString()}`, { token });
}

export function bloquearUsuario(token: string, id: number) {
  return apiFetch<void>(`/admin/usuarios/${id}/bloquear`, {
    method: "POST",
    token,
  });
}
