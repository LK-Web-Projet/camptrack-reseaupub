import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("Missing JWT secrets in environment variables");
}

export function signAccessToken(payload: object, options?: jwt.SignOptions): string {
  return jwt.sign(payload, ACCESS_SECRET!, { 
    algorithm: "HS256", 
    expiresIn: "1h", 
    ...(options || {}) 
  });
}

export function signRefreshToken(payload: object, options?: jwt.SignOptions): string {
  return jwt.sign(payload, REFRESH_SECRET!, { 
    algorithm: "HS256", 
    expiresIn: "7d", 
    ...(options || {}) 
  });
}

export function verifyAccessToken<T = any>(token: string): T {
  return jwt.verify(token, ACCESS_SECRET!) as T;
}

export function verifyRefreshToken<T = any>(token: string): T {
  return jwt.verify(token, REFRESH_SECRET!) as T;
}

export function decodeToken(token: string) {
  return jwt.decode(token);
}