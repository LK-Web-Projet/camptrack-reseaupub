import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/hash";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

function parseCookie(header: string | null) {
  if (!header) return {} as Record<string,string>;
  return Object.fromEntries(header.split(";").map(p => p.split("=").map(s => s.trim())).map(([k,v]) => [k, decodeURIComponent(v)]));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let refreshToken: string | undefined = body?.refreshToken;

    if (!refreshToken) {
      const cookieHeader = req.headers.get("cookie");
      const cookies = parseCookie(cookieHeader);
      refreshToken = cookies["refreshToken"];
    }

    if (!refreshToken) {
      return NextResponse.json({ ok: true, message: "Aucun token à révoquer" });
    }

    // Trouver et révoquer le token
    const tokens = await prisma.refreshToken.findMany({ where: { revoked: false } });
    let tokenRow = null as null | (typeof tokens)[0];
    
    for (const t of tokens) {
      const ok = await comparePassword(refreshToken, t.token_hash);
      if (ok) { 
        tokenRow = t; 
        break; 
      }
    }

    if (tokenRow) {
      await prisma.refreshToken.update({ 
        where: { id: tokenRow.id }, 
        data: { revoked: true } 
      });
    }

    return NextResponse.json({ 
      ok: true, 
      message: "Déconnexion réussie" 
    });

  } catch (error) {
    return handleApiError(error);
  }
}