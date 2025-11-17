// lib/middleware/authentication.ts - VERSION CORRIGÉE
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function requireAdmin(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return { 
        ok: false, 
        response: NextResponse.json({ error: "Token d'autorisation manquant" }, { status: 401 }) 
      } as const;
    }

    const token = auth.replace(/^Bearer\s+/i, "");
    
    let payload: any;
    try {
      payload = verifyAccessToken(token);
      console.log("🔍 Payload JWT décodé:", payload);
    } catch (err) {
      console.error("Échec de vérification du token:", err);
      return { 
        ok: false, 
        response: NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 }) 
      } as const;
    }

    const userId = payload?.userId || payload?.sub;
    console.log("🔍 UserID extrait:", userId); // Debug
    
    if (!userId) {
      console.log("❌ Aucun userId trouvé dans le payload:", payload);
      return { 
        ok: false, 
        response: NextResponse.json({ error: "Payload du token invalide" }, { status: 401 }) 
      } as const;
    }

    const user = await prisma.user.findUnique({ 
      where: { id_user: String(userId) }
    });
    
    if (!user) {
      return { 
        ok: false, 
        response: NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 401 }) 
      } as const;
    }
    
    if (user.type_user !== "ADMIN") {
      return { 
        ok: false, 
        response: NextResponse.json({ error: "Accès refusé - Admin requis" }, { status: 403 }) 
      } as const;
    }

    return { ok: true, user } as const;
  } catch (err) {
    console.error("❌ Erreur middleware:", err);
    return { 
      ok: false, 
      response: NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 }) 
    } as const;
  }
}

export async function requireAuth(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Token d'autorisation manquant" }, { status: 401 }),
      } as const;
    }

    const token = auth.replace(/^Bearer\s+/i, "");

    let payload: any;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 }),
      } as const;
    }

    const userId = payload?.userId || payload?.sub;
    if (!userId) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Payload du token invalide" }, { status: 401 }),
      } as const;
    }

    const user = await prisma.user.findUnique({ where: { id_user: String(userId) } });
    if (!user) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 401 }),
      } as const;
    }

    return { ok: true, user } as const;
  } catch (err) {
    console.error("❌ Erreur middleware requireAuth:", err);
    return {
      ok: false,
      response: NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 }),
    } as const;
  }
}