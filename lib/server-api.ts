import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ?? "subite_admin_session";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5178";

export async function getAdminToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function adminFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAdminToken();
  if (!token) {
    throw new Error("No autorizado");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
