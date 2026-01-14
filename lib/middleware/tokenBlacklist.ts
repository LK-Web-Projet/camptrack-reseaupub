import { prisma } from "@/lib/prisma";

export async function isTokenRevoked(tokenHash: string): Promise<boolean> {
  const revokedToken = await prisma.refreshToken.findFirst({
    where: {
      token_hash: tokenHash,
      revoked: true
    }
  });
  
  return !!revokedToken;
}
