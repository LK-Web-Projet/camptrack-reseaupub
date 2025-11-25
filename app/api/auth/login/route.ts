import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, hashPassword } from "@/lib/auth/hash";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { loginSchema, validateData } from "@/lib/validation/schemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";


type LoginData = { email: string; password: string };

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validation
    const validation = validateData<LoginData>(loginSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { email, password } = validation.data;

    // Recherche utilisateur
    const user = await prisma.user.findFirst({
      where: { email, is_active: true },
      select: {
        id_user: true,
        nom: true,
        prenom: true,
        email: true,
        password: true,
        type_user: true,
        is_active: true
      }
    });

    if (!user) {
      throw new AppError("Email ou mot de passe incorrect", 401);
    }

    // Vérification mot de passe
    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      throw new AppError("Email ou mot de passe incorrect", 401);
    }

    // Génération des tokens
    const tokenPayload = {
      userId: user.id_user,
      email: user.email,
      role: user.type_user
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Stockage du refresh token (hashé)
    const hashedRefreshToken = await hashPassword(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    await prisma.refreshToken.create({
      data: {
        token_hash: hashedRefreshToken,
        userId: user.id_user,
        expires_at: expiresAt,
        revoked: false,
      },
    });

    // Journalisation
    await prisma.auditLog.create({
      data: {
        user_id: user.id_user,
        action: "LOGIN",
        ressource: "AUTH",
        details: {
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get("user-agent") || "unknown"
        },
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
      }
    });

    // Réponse sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });

    // Cookies sécurisés
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 7 * 24 * 60 * 60, // 7 jours en secondes
      path: "/"
    };

    response.cookies.set("refreshToken", refreshToken, cookieOptions);
    response.cookies.set("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 // 15 minutes
    });

    return response;

  } catch (error) {
    return handleApiError(error);
  }
}