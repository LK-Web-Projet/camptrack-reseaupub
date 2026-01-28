import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

/**
 * GET /api/clients/[id]/campagnes/statistiques
 * Obtenir les statistiques des campagnes pour un client spécifique
 * 
 * Query params optionnels:
 * - dateDebut: Date de début (ISO string)
 * - dateFin: Date de fin (ISO string)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const clientId = params.id;
        const { searchParams } = new URL(request.url);
        const dateDebut = searchParams.get('dateDebut');
        const dateFin = searchParams.get('dateFin');

        // Vérifier que le client existe
        const client = await prisma.client.findUnique({
            where: { id_client: clientId },
            select: {
                id_client: true,
                nom: true,
                prenom: true,
                entreprise: true
            }
        });

        if (!client) {
            throw new AppError("Client non trouvé", 404);
        }

        // Construction du filtre
        const where: any = { id_client: clientId };
        if (dateDebut || dateFin) {
            where.date_debut = {};
            if (dateDebut) where.date_debut.gte = new Date(dateDebut);
            if (dateFin) where.date_debut.lte = new Date(dateFin);
        }

        // Agrégation des statistiques
        const [
            campagnesParStatus,
            campagnesParType,
            totalCampagnes,
            campagnesActives,
            totalPrestataires
        ] = await prisma.$transaction([
            // Grouper par status
            prisma.campagne.groupBy({
                by: ['status'],
                where,
                _count: {
                    id_campagne: true
                }
            }),
            // Grouper par type
            prisma.campagne.groupBy({
                by: ['type_campagne'],
                where,
                _count: {
                    id_campagne: true
                }
            }),
            // Total des campagnes
            prisma.campagne.count({ where }),
            // Campagnes actives (EN_COURS)
            prisma.campagne.count({
                where: {
                    ...where,
                    status: 'EN_COURS'
                }
            }),
            // Total des affectations de prestataires
            prisma.prestataireCampagne.count({
                where: {
                    campagne: {
                        id_client: clientId
                    }
                }
            })
        ]);

        // Formatage des statistiques
        const statistiques = {
            client: {
                id: client.id_client,
                nom: client.nom,
                prenom: client.prenom,
                entreprise: client.entreprise
            },
            campagnes: {
                total: totalCampagnes,
                actives: campagnesActives,
                parStatus: {
                    PLANIFIEE: 0,
                    EN_COURS: 0,
                    TERMINEE: 0,
                    ANNULEE: 0
                },
                parType: {
                    MASSE: 0,
                    PROXIMITE: 0,
                    NON_SPECIFIE: 0
                }
            },
            prestataires: {
                totalAffectations: totalPrestataires
            }
        };

        // Remplir les statistiques par status
        campagnesParStatus.forEach(stat => {
            statistiques.campagnes.parStatus[stat.status] = stat._count.id_campagne;
        });

        // Remplir les statistiques par type
        campagnesParType.forEach(stat => {
            if (stat.type_campagne) {
                statistiques.campagnes.parType[stat.type_campagne] = stat._count.id_campagne;
            } else {
                statistiques.campagnes.parType.NON_SPECIFIE = stat._count.id_campagne;
            }
        });

        return NextResponse.json(statistiques, {
            headers: {
                // Cache public pendant 5 minutes, stale-while-revalidate pendant 10 minutes
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        });

    } catch (error) {
        return handleApiError(error);
    }
}
