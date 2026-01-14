import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // On vérifie le refreshToken car l'backgroundColor peut être expiré mais la session valide
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const accessToken = req.cookies.get("accessToken")?.value;

  // Routes protégées
  const protectedRoutes = ["/dashboard"];

  // 1. Redirection si déjà connecté (évite d'accéder à la page de login)
  if (req.nextUrl.pathname === "/") {
    if (refreshToken) {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
  }

  // 2. Protection des routes privées
  if (protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
    // Si aucun token n'est présent, redirection login
    if (!refreshToken && !accessToken) {
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("authError", "true");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
