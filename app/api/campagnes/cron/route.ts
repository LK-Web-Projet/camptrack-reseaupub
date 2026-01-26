import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoTerminateCampaigns } from "@/lib/utils/campaignAutoTermination";
import { handleApiError } from "@/lib/utils/errorHandler";

/**
 * GET /api/campagnes/cron
 * 
 * Endpoint dédié pour l'auto-clôture des campagnes expirées.
 * Destiné à être appelé par un cron job (Vercel Cron ou service externe).
 * 
 * Sécurité : Protégé par une clé secrète dans les headers
 */
export async function GET(request: NextRequest) {
    try {
        // Vérification de la clé secrète pour sécuriser l'endpoint
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error('[CRON] CRON_SECRET non configuré dans les variables d\'environnement');
            return NextResponse.json(
                { error: 'Configuration serveur manquante' },
                { status: 500 }
            );
        }

        // Vérifier le token d'autorisation
        const expectedAuth = `Bearer ${cronSecret}`;
        if (authHeader !== expectedAuth) {
            console.warn('[CRON] Tentative d\'accès non autorisée à l\'endpoint cron');
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // Exécuter l'auto-clôture
        console.log('[CRON] Démarrage de l\'auto-clôture des campagnes...');
        const startTime = Date.now();

        const result = await autoTerminateCampaigns(prisma);

        const executionTime = Date.now() - startTime;

        // Retourner un rapport détaillé
        return NextResponse.json({
            success: result.success,
            timestamp: new Date().toISOString(),
            executionTimeMs: executionTime,
            statistics: {
                campaignsTerminated: result.campaignsTerminated,
                providersReleased: result.providersReleased,
                affectationsClosed: result.affectationsClosed
            },
            terminatedCampaignIds: result.terminatedCampaignIds,
            error: result.error
        });

    } catch (error) {
        console.error('[CRON] Erreur lors de l\'exécution du cron:', error);
        return handleApiError(error);
    }
}
