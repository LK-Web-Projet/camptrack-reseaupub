import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

type TokenPayloadShape = { jti?: string; userId?: string; sub?: string };

interface AuthResult {
  ok: boolean;
  user?: unknown;
  response?: NextResponse;
}

// Fonction pour vérifier si un token est révoqué via son jti
async function isTokenRevoked(jti: string): Promise<boolean> {
  const revokedToken = await prisma.revokedToken.findFirst({
    where: {
      jti: jti,
      expires_at: {
        gt: new Date()
      }
    }
  });
  
  return !!revokedToken;
}

export async function requireAuth(req: Request): Promise<AuthResult> {
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Token d'autorisation manquant" }, { status: 401 })
      };
    }

    const token = auth.replace(/^Bearer\s+/i, "");
    
    let payload: TokenPayloadShape;
    try {
      payload = verifyAccessToken(token) as TokenPayloadShape;
    } catch (err) {
      console.error("❌ Token invalide:", err);
      return {
        ok: false,
        response: NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 })
      };
    }

    // VÉRIFICATION CRITIQUE : Token révoqué via jti ?
    if (payload && payload.jti) {
      const isRevoked = await isTokenRevoked(payload.jti);
      if (isRevoked) {
        return {
          ok: false,
          response: NextResponse.json({ error: "Session expirée - Veuillez vous reconnecter" }, { status: 401 })
        };
      }
    }

    const userId = payload && (payload.userId || payload.sub);
    if (!userId) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Payload du token invalide" }, { status: 401 })
      };
    }

    const user = await prisma.user.findFirst({
      where: {
        id_user: String(userId),
        is_active: true
      }
    });

    if (!user) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Utilisateur non trouvé ou compte désactivé" }, { status: 401 })
      };
    }

    return { ok: true, user };
  } catch (err) {
    console.error("❌ Erreur middleware:", err);
    return {
      ok: false,
      response: NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
    };
  }
}

export async function requireAdmin(req: Request): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  
  if (!authResult.ok) {
    return authResult;
  }

  if (authResult.user?.type_user !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Accès refusé - Admin requis" }, { status: 403 })
    };
  }

  return authResult;
}

export async function requireRoles(req: Request, allowedRoles: string[]): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  
  if (!authResult.ok) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.user?.type_user)) {
    return {
      ok: false,
      response: NextResponse.json({ 
        error: "Accès refusé - Rôle insuffisant",
        requiredRoles: allowedRoles 
      }, { status: 403 })
    };
  }

  return authResult;
}