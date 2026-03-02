import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("mv_session")?.value;

    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/prisijungti";
      return NextResponse.redirect(url);
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = "/prisijungti";
      const response = NextResponse.redirect(url);
      response.cookies.set("mv_session", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  if (
    pathname === "/prisijungti" ||
    pathname === "/registracija"
  ) {
    const token = request.cookies.get("mv_session")?.value;
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      } catch {
        // Invalid token, let them access login/register
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/prisijungti", "/registracija"],
};
