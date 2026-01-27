import { PrismaClient } from '@prisma/client';

/**
 * Interface pour le résultat de l'auto-clôture des campagnes
 */
export interface AutoTerminationResult {
    success: boolean;
    campaignsTerminated: number;
    providersReleased: number;
    affectationsClosed: number;
    terminatedCampaignIds: string[];
    error?: string;
}

/**
 * Fonction utilitaire pour clôturer automatiquement les campagnes expirées
 * et libérer les prestataires assignés
 * 
 * @param prisma - Instance PrismaClient (ou transaction)
 * @returns Résultat de l'opération avec statistiques
 */
export async function autoTerminateCampaigns(
    prisma: PrismaClient | any
): Promise<AutoTerminationResult> {
    try {
        const now = new Date();

        // Identifier les campagnes expirées (date_fin passée et non terminées)
        const expiredCampaigns = await prisma.campagne.findMany({
            where: {
                date_fin: { lt: now },
                status: { notIn: ['TERMINEE', 'ANNULEE'] }
            },
            select: {
                id_campagne: true,
                nom_campagne: true,
                date_fin: true
            }
        });

        const expiredCampaignIds = expiredCampaigns.map((c: { id_campagne: string }) => c.id_campagne);

        if (expiredCampaignIds.length === 0) {
            return {
                success: true,
                campaignsTerminated: 0,
                providersReleased: 0,
                affectationsClosed: 0,
                terminatedCampaignIds: []
            };
        }

        // Mettre à jour uniquement le statut des campagnes
        // Les prestataires restent affectés jusqu'à leur date_fin personnelle
        await prisma.campagne.updateMany({
            where: { id_campagne: { in: expiredCampaignIds } },
            data: { status: 'TERMINEE' }
        });

        // Log pour le monitoring
        console.log(`[AUTO-TERMINATION] ${expiredCampaignIds.length} campagne(s) clôturée(s)`, {
            campaigns: expiredCampaigns.map((c: { id_campagne: string; nom_campagne: string; date_fin: Date }) => ({
                id: c.id_campagne,
                name: c.nom_campagne,
                endDate: c.date_fin
            })),
            timestamp: now.toISOString()
        });

        return {
            success: true,
            campaignsTerminated: expiredCampaignIds.length,
            providersReleased: 0, // Plus de libération automatique
            affectationsClosed: 0, // Plus de clôture automatique
            terminatedCampaignIds: expiredCampaignIds
        };

    } catch (error) {
        console.error('[AUTO-TERMINATION] Erreur lors de la clôture automatique:', error);
        return {
            success: false,
            campaignsTerminated: 0,
            providersReleased: 0,
            affectationsClosed: 0,
            terminatedCampaignIds: [],
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        };
    }
}

/**
 * Cache simple pour éviter l'exécution trop fréquente
 */
class AutoTerminationCache {
    private lastExecution: Date | null = null;
    private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    shouldExecute(): boolean {
        if (!this.lastExecution) {
            return true;
        }

        const now = new Date();
        const timeSinceLastExecution = now.getTime() - this.lastExecution.getTime();
        return timeSinceLastExecution >= this.CACHE_DURATION_MS;
    }

    markExecuted(): void {
        this.lastExecution = new Date();
    }

    reset(): void {
        this.lastExecution = null;
    }
}

export const autoTerminationCache = new AutoTerminationCache();
