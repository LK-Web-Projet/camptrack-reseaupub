import { PrismaClient } from '@prisma/client';

/**
 * Interface pour le résultat de l'auto-libération des prestataires
 */
export interface AutoReleaseResult {
    success: boolean;
    providersReleased: number;
    affectationsClosed: number;
    releasedProviderIds: string[];
    error?: string;
}

/**
 * Fonction utilitaire pour libérer automatiquement les prestataires
 * dont la date_fin d'affectation est passée
 * 
 * @param prisma - Instance PrismaClient (ou transaction)
 * @returns Résultat de l'opération avec statistiques
 */
export async function autoReleaseProviders(
    prisma: PrismaClient | any
): Promise<AutoReleaseResult> {
    try {
        const now = new Date();

        // Trouver les affectations expirées (date_fin passée)
        const expiredAssignments = await prisma.prestataireCampagne.findMany({
            where: {
                date_fin: {
                    lt: now,
                    not: null
                }
            },
            select: {
                id_prestataire: true,
                id_campagne: true,
                date_fin: true,
                prestataire: {
                    select: {
                        nom: true,
                        prenom: true
                    }
                },
                campagne: {
                    select: {
                        nom_campagne: true
                    }
                }
            }
        });

        if (expiredAssignments.length === 0) {
            return {
                success: true,
                providersReleased: 0,
                affectationsClosed: 0,
                releasedProviderIds: []
            };
        }

        // Extraire les IDs uniques des prestataires
        const prestataireIds = [...new Set(expiredAssignments.map((a: { id_prestataire: string }) => a.id_prestataire))];

        // Libérer les prestataires
        await prisma.prestataire.updateMany({
            where: { id_prestataire: { in: prestataireIds } },
            data: { disponible: true }
        });

        // Log pour le monitoring
        console.log(`[AUTO-RELEASE] ${prestataireIds.length} prestataire(s) libéré(s)`, {
            providers: expiredAssignments.map((a: any) => ({
                id: a.id_prestataire,
                name: `${a.prestataire.nom} ${a.prestataire.prenom}`,
                campaign: a.campagne.nom_campagne,
                endDate: a.date_fin
            })),
            timestamp: now.toISOString()
        });

        return {
            success: true,
            providersReleased: prestataireIds.length,
            affectationsClosed: expiredAssignments.length,
            releasedProviderIds: prestataireIds
        };

    } catch (error) {
        console.error('[AUTO-RELEASE] Erreur lors de la libération automatique:', error);
        return {
            success: false,
            providersReleased: 0,
            affectationsClosed: 0,
            releasedProviderIds: [],
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        };
    }
}

/**
 * Calcule la date de fin personnalisée pour un prestataire
 * basée sur la durée de la campagne
 * 
 * @param dateDebutCampagne - Date de début de la campagne
 * @param dateFinCampagne - Date de fin de la campagne
 * @param dateAffectation - Date d'affectation du prestataire (défaut: maintenant)
 * @returns Date de fin personnalisée pour le prestataire
 */
export function calculateProviderEndDate(
    dateDebutCampagne: Date,
    dateFinCampagne: Date,
    dateAffectation: Date = new Date()
): Date {
    // Calculer la durée de la campagne en millisecondes
    const dureeCampagne = dateFinCampagne.getTime() - dateDebutCampagne.getTime();

    // Calculer la date de fin personnalisée
    const dateFinPrestataire = new Date(dateAffectation.getTime() + dureeCampagne);

    return dateFinPrestataire;
}

/**
 * Cache simple pour éviter l'exécution trop fréquente
 */
class AutoReleaseCache {
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

export const autoReleaseCache = new AutoReleaseCache();
