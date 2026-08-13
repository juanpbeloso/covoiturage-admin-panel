import { NextRequest, NextResponse } from "next/server";
import { API_URL, AUTH_COOKIE_NAME } from "@/lib/server-api";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const res = await fetch(`${API_URL}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data as { message?: string; error?: string } | null)?.message ??
      (data as { error?: string } | null)?.error ??
      "Credenciales inválidas";
    return NextResponse.json({ message }, { status: res.status });
  }

  const token = (data as { accessToken?: string }).accessToken;
  if (!token) {
    return NextResponse.json({ message: "Respuesta inválida del servidor." }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
