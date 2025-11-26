import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("access_token")?.value;

  // Liste des pages protégées
  const protectedPaths = [
    "/dashboard/admin",
    "/dashboard/campagnes",
    "/dashboard/clients",
    "/dashboard/lieux",
     "/dashboard/services",
    "/dashboard/prestataires",
  ];

  const pathname = req.nextUrl.pathname;

  // Si la page est protégée mais pas de token → redirection login
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

// Applique le middleware sur TOUS les chemins
export const config = {
  matcher: ["/dashboard/:path*"],
};
