import { NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      throw new AppError("Refresh token manquant", 400);
    }

    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError("Refresh token invalide ou expiré", 401);
    }

    // Vérifier que le payload contient userId
    if (!payload.userId) {
      throw new AppError("Payload du token invalide", 401);
    }

    // Regénérer les tokens
    const newAccessToken = signAccessToken({ 
      userId: payload.userId, 
      role: payload.role 
    });
    
    const newRefreshToken = signRefreshToken({ 
      userId: payload.userId 
    });

    return NextResponse.json({ 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken 
    });

  } catch (error) {
    return handleApiError(error);
  }
}