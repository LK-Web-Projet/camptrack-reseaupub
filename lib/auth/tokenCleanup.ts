import { prisma } from "@/lib/prisma";

export async function cleanupExpiredTokens() {
  try {
    // Nettoyer les revoked tokens expirés
    const deletedRevoked = await prisma.revokedToken.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });

    // Nettoyer les refresh tokens expirés
    const deletedRefresh = await prisma.refreshToken.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });

    console.log(`Nettoyage tokens: ${deletedRevoked.count} revoked, ${deletedRefresh.count} refresh supprimés`);
    
    return {
      revoked: deletedRevoked.count,
      refresh: deletedRefresh.count
    };
  } catch (error) {
    console.error("Erreur nettoyage tokens:", error);
    throw error;
  }
}