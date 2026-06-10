import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "nf_sesion";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo proteger /dashboard (y subrutas)
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Si no hay cookie de sesión, mandamos a /lock
  // /lock page se encargará de redirigir a /setup si no hay PIN configurado
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/lock";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
