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
    
    // VALIDATION AVEC JOI
    const validation = validateData<LoginData>(loginSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (!user) {
      throw new AppError("Utilisateur non trouvé", 401);
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      throw new AppError("Mot de passe incorrect", 401);
    }

    // Générer les tokens
    const accessToken = signAccessToken({ 
      userId: user.id_user, 
      role: user.type_user 
    });
    
    const refreshToken = signRefreshToken({ 
      userId: user.id_user 
    });

    // Stocker le refresh token (optionnel)
    try {
      const hashed = await hashPassword(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await prisma.refreshToken.create({ 
        data: { 
          token_hash: hashed, 
          userId: user.id_user, 
          expires_at: expiresAt 
        } 
      });
    } catch (e) {
      console.error("Échec du stockage du refresh token:", e);
    }

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ 
      user: userWithoutPassword,
      accessToken, 
      refreshToken 
    });

  } catch (error) {
    return handleApiError(error);
  }
}