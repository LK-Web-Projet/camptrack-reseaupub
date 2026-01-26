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

        const expiredCampaignIds = expiredCampaigns.map(c => c.id_campagne);

        if (expiredCampaignIds.length === 0) {
            return {
                success: true,
                campaignsTerminated: 0,
                providersReleased: 0,
                affectationsClosed: 0,
                terminatedCampaignIds: []
            };
        }

        // Utiliser une transaction pour assurer la cohérence
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Mettre à jour le statut des campagnes
            await tx.campagne.updateMany({
                where: { id_campagne: { in: expiredCampaignIds } },
                data: { status: 'TERMINEE' }
            });

            // 2. Récupérer les prestataires avec affectations actives sur ces campagnes
            const affectationsToClose = await tx.prestataireCampagne.findMany({
                where: {
                    id_campagne: { in: expiredCampaignIds },
                    date_fin: null
                },
                select: { id_prestataire: true }
            });

            const prestataireIds = [...new Set(affectationsToClose.map(a => a.id_prestataire))];
            const affectationsCount = affectationsToClose.length;

            if (prestataireIds.length > 0) {
                // 3. Clôturer les affectations (date_fin = now)
                await tx.prestataireCampagne.updateMany({
                    where: {
                        id_campagne: { in: expiredCampaignIds },
                        date_fin: null
                    },
                    data: { date_fin: now }
                });

                // 4. Libérer les prestataires (disponible = true)
                await tx.prestataire.updateMany({
                    where: { id_prestataire: { in: prestataireIds } },
                    data: { disponible: true }
                });
            }

            return {
                campaignsTerminated: expiredCampaignIds.length,
                providersReleased: prestataireIds.length,
                affectationsClosed: affectationsCount
            };
        });

        // Log pour le monitoring
        console.log(`[AUTO-TERMINATION] ${result.campaignsTerminated} campagne(s) clôturée(s)`, {
            campaigns: expiredCampaigns.map(c => ({
                id: c.id_campagne,
                name: c.nom_campagne,
                endDate: c.date_fin
            })),
            providersReleased: result.providersReleased,
            affectationsClosed: result.affectationsClosed,
            timestamp: now.toISOString()
        });

        return {
            success: true,
            ...result,
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
