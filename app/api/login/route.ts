import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "subite_admin_session";

/** Login mock: acepta cualquier email/contraseña y setea cookie de sesión. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = body?.email?.trim();
  if (!email) {
    return NextResponse.json({ message: "Email requerido." }, { status: 400 });
  }

  const response = NextResponse.json({ success: true, email });
  response.cookies.set(AUTH_COOKIE_NAME, "mock-session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  return response;
}
