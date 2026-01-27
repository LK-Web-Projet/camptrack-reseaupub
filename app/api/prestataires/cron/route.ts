import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoReleaseProviders } from "@/lib/utils/providerAutoRelease";
import { handleApiError } from "@/lib/utils/errorHandler";

/**
 * GET /api/prestataires/cron
 * 
 * Endpoint dédié pour l'auto-libération des prestataires dont la date_fin est passée.
 * Destiné à être appelé par un cron job (service externe).
 * 
 * Sécurité : Protégé par une clé secrète dans les headers
 */
export async function GET(request: NextRequest) {
    try {
        // Vérification de la clé secrète pour sécuriser l'endpoint
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error('[CRON-PROVIDERS] CRON_SECRET non configuré dans les variables d\'environnement');
            return NextResponse.json(
                { error: 'Configuration serveur manquante' },
                { status: 500 }
            );
        }

        // Vérifier le token d'autorisation
        const expectedAuth = `Bearer ${cronSecret}`;
        if (authHeader !== expectedAuth) {
            console.warn('[CRON-PROVIDERS] Tentative d\'accès non autorisée à l\'endpoint cron');
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // Exécuter l'auto-libération
        console.log('[CRON-PROVIDERS] Démarrage de l\'auto-libération des prestataires...');
        const startTime = Date.now();

        const result = await autoReleaseProviders(prisma);

        const executionTime = Date.now() - startTime;

        // Retourner un rapport détaillé
        return NextResponse.json({
            success: result.success,
            timestamp: new Date().toISOString(),
            executionTimeMs: executionTime,
            statistics: {
                providersReleased: result.providersReleased,
                affectationsClosed: result.affectationsClosed
            },
            releasedProviderIds: result.releasedProviderIds,
            error: result.error
        });

    } catch (error) {
        console.error('[CRON-PROVIDERS] Erreur lors de l\'exécution du cron:', error);
        return handleApiError(error);
    }
}
