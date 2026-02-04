import { NextResponse } from "next/server";
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/lib/auth/hash";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let refreshToken = body?.refreshToken;

    // Vérifier aussi dans les cookies
    if (!refreshToken) {
      const cookies = req.headers.get("cookie") || "";
      const refreshTokenCookie = cookies
        .split(";")
        .find(c => c.trim().startsWith("refreshToken="));

      if (refreshTokenCookie) {
        refreshToken = refreshTokenCookie.split("=")[1];
      }
    }

    if (!refreshToken) {
      throw new AppError("Refresh token manquant", 400);
    }

    // Vérification JWT du refresh token
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken<TokenPayload>(refreshToken);
    } catch (error) {
      const err = error as Error;
      if (err.message === "REFRESH_TOKEN_EXPIRED") {
        throw new AppError("Refresh token expiré", 401);
      }
      throw new AppError("Refresh token invalide", 401);
    }

    // Vérifier en base de données
    const tokenRecords = await prisma.refreshToken.findMany({
      where: {
        userId: payload.userId,
        revoked: false,
        expires_at: {
          gt: new Date()
        }
      }
    });

    let tokenValid = false;
    for (const record of tokenRecords) {
      const isMatch = await comparePassword(refreshToken, record.token_hash);
      if (isMatch) {
        tokenValid = true;

        // Révoquer l'ancien token
        await prisma.refreshToken.update({
          where: { id: record.id },
          data: { revoked: true }
        });
        break;
      }
    }

    if (!tokenValid) {
      throw new AppError("Refresh token révoqué ou invalide", 401);
    }

    // Vérifier l'utilisateur
    const user = await prisma.user.findFirst({
      where: {
        id_user: payload.userId,
        is_active: true
      },
      select: {
        id_user: true,
        email: true,
        type_user: true,
        nom: true,
        prenom: true
      }
    });

    if (!user) {
      throw new AppError("Utilisateur introuvable ou inactif", 401);
    }

    // Générer de nouveaux tokens
    const newTokenPayload = {
      userId: user.id_user,
      email: user.email,
      role: user.type_user
    };

    const newAccessToken = signAccessToken(newTokenPayload);
    const newRefreshToken = signRefreshToken(newTokenPayload);

    // Stocker le nouveau refresh token
    const hashedNewRefresh = await hashPassword(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token_hash: hashedNewRefresh,
        userId: user.id_user,
        expires_at: expiresAt,
        revoked: false
      }
    });

    const response = NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

    // Mettre à jour les cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 7 * 24 * 60 * 60,
      path: "/"
    };

    response.cookies.set("refreshToken", newRefreshToken, cookieOptions);
    response.cookies.set("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60
    });

    return response;

  } catch (error) {
    return handleApiError(error);
  }
}