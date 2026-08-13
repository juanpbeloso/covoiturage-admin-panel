import { NextRequest, NextResponse } from "next/server";
import { API_URL, AUTH_COOKIE_NAME } from "@/lib/server-api";

async function proxy(request: NextRequest, path: string) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const url = `${API_URL}${path}${request.nextUrl.search}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    headers["Content-Type"] = "application/json";
    body = await request.text();
  }

  const res = await fetch(url, {
    method: request.method,
    headers,
    body: body || undefined,
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text || null, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, `/${params.path.join("/")}`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, `/${params.path.join("/")}`);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, `/${params.path.join("/")}`);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, `/${params.path.join("/")}`);
}
