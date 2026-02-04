import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/hash";
import { verifyAccessToken, verifyRefreshToken, TokenPayload } from "@/lib/auth/jwt";
import { handleApiError } from "@/lib/utils/errorHandler";

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key) {
      try {
        cookies[key] = value ? decodeURIComponent(value) : "";
      } catch {
        cookies[key] = value || "";
      }
    }
  });

  return cookies;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookies = parseCookies(req.headers.get("cookie"));

    const refreshToken = body?.refreshToken || cookies["refreshToken"];
    const accessToken =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      cookies["accessToken"];

    let userId: string | undefined;
    let revokedTokens = 0;



    // 1. RÉVOQUER LE ACCESS TOKEN via son jti
    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken) as TokenPayload;
        userId = payload.userId;

        // Ajouter le jti à la blacklist
        if (payload.jti) {
          await prisma.revokedToken.create({
            data: {
              jti: payload.jti,
              user_id: userId,
              expires_at: new Date(payload.exp * 1000), // Date d'expiration du JWT
            },
          });
          revokedTokens++;
        }
      } catch (error) {
        // Si le token est expiré, on ne peut pas le révoquer (c'est déjà fait)
        const err = error as Error;
        if (err.message !== "ACCESS_TOKEN_EXPIRED") {
          console.log("Erreur lors de la révocation du access token:", error);
        }
      }
    }

    // 2. RÉVOQUER LE REFRESH TOKEN
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken) as TokenPayload;

        // Ajouter le jti du refresh token à la blacklist
        if (payload.jti) {
          await prisma.revokedToken.create({
            data: {
              jti: payload.jti,
              user_id: payload.userId,
              expires_at: new Date(payload.exp * 1000),
            },
          });
          revokedTokens++;
        }

        // S'assurer d'avoir l'userId pour l'audit
        if (!userId) {
          userId = payload.userId;
        }

        // Révoquer aussi le refresh token dans la table refreshTokens
        const tokenRecords = await prisma.refreshToken.findMany({
          where: {
            userId: payload.userId,
            revoked: false,
            expires_at: { gt: new Date() },
          },
        });

        for (const record of tokenRecords) {
          const isMatch = await comparePassword(
            refreshToken,
            record.token_hash
          );
          if (isMatch) {
            await prisma.refreshToken.update({
              where: { id: record.id },
              data: { revoked: true },
            });
            revokedTokens++;
            break;
          }
        }
      } catch (error) {
        const err = error as Error;
        if (err.message !== "REFRESH_TOKEN_EXPIRED") {
          console.log("Erreur lors de la révocation du refresh token:", error);
        }
      }
    }

    // 3. JOURNALISATION
    if (userId) {
      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action: "LOGOUT",
          ressource: "AUTH",
          details: {
            tokens_revoked: revokedTokens,
            timestamp: new Date().toISOString(),
          },
          ip_address:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            "unknown",
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Déconnexion réussie",
      tokens_revoked: revokedTokens,
    });

    // 4. SUPPRIMER LES COOKIES
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 0,
      path: "/",
    };

    response.cookies.set("refreshToken", "", cookieOptions);
    response.cookies.set("accessToken", "", cookieOptions);

    return response;
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    return handleApiError(error);
  }
}
