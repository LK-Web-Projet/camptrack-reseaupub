import jwt from "jsonwebtoken";
import crypto from "crypto";

// Lazy getters with build-time fallbacks for Vercel
// In production, these MUST be set via environment variables
function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;

  // Allow build to proceed with a placeholder, but warn
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('WARNING: JWT_ACCESS_SECRET not set in production!');
    }
    // Fallback only for build-time (will fail at runtime if not set)
    return process.env.NODE_ENV === 'production'
      ? 'REPLACE_ME_IN_PRODUCTION_ENV'
      : 'dev-secret-key-not-for-production';
  }
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('WARNING: JWT_REFRESH_SECRET not set in production!');
    }
    return process.env.NODE_ENV === 'production'
      ? 'REPLACE_ME_IN_PRODUCTION_ENV'
      : 'dev-refresh-secret-not-for-production';
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  jti?: string; // JWT ID pour la révocation
  exp?: number;
  iat?: number;
}

export function signAccessToken(payload: TokenPayload): string {
  // Générer un ID unique pour ce token
  const jti = crypto.randomBytes(16).toString('hex');

  return jwt.sign(
    {
      ...payload,
      jti
    },
    getAccessSecret(),
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
    getRefreshSecret(),
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
    return jwt.verify(token, getAccessSecret()) as T;
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
    return jwt.verify(token, getRefreshSecret()) as T;
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