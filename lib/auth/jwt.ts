import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET manquant dans les variables d'environnement");
}
if (!REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET manquant dans les variables d'environnement");
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  jti?: string; // JWT ID pour la révocation
}

export function signAccessToken(payload: TokenPayload): string {
  // Générer un ID unique pour ce token
  const jti = crypto.randomBytes(16).toString('hex');
  
  return jwt.sign(
    { 
      ...payload, 
      jti 
    }, 
    ACCESS_SECRET, 
    {
      algorithm: "HS256",
      // Access tokens valables 15 minutes (aligné avec le cookie accessToken)
      expiresIn: "15m",
      issuer: "campagne-app",
      subject: payload.userId
    }
  );
}

export function signRefreshToken(payload: TokenPayload): string {
  const jti = crypto.randomBytes(16).toString('hex');
  
  return jwt.sign(
    { 
      ...payload, 
      jti 
    }, 
    REFRESH_SECRET, 
    {
      algorithm: "HS256",
      expiresIn: "7d",
      issuer: "campagne-app",
      subject: payload.userId
    }
  );
}

export function verifyAccessToken<T = TokenPayload & { jti: string }>(token: string): T {
  try {
    return jwt.verify(token, ACCESS_SECRET) as T;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("ACCESS_TOKEN_EXPIRED");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("INVALID_ACCESS_TOKEN");
    }
    throw error;
  }
}

export function verifyRefreshToken<T = TokenPayload & { jti: string }>(token: string): T {
  try {
    return jwt.verify(token, REFRESH_SECRET) as T;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("REFRESH_TOKEN_EXPIRED");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }
    throw error;
  }
}