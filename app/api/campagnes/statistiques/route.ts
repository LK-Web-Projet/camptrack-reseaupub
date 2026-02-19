import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError } from "@/lib/utils/errorHandler";
import { Prisma } from "@prisma/client";

/**
 * GET /api/campagnes/statistiques
 * Obtenir les statistiques globales des campagnes
 * 
 * Query params optionnels:
 * - clientId: Filtrer par client
 * - lieuId: Filtrer par lieu
 * - dateDebut: Date de début (ISO string)
 * - dateFin: Date de fin (ISO string)
 */
export async function GET(request: NextRequest) {
    try {
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const lieuId = searchParams.get('lieuId');
        const dateDebut = searchParams.get('dateDebut');
        const dateFin = searchParams.get('dateFin');

        // Construction du filtre
        const where: Prisma.CampagneWhereInput = {};
        if (clientId) where.id_client = clientId;
        if (lieuId) where.id_lieu = lieuId;
        if (dateDebut || dateFin) {
            where.date_debut = {};
            if (dateDebut) where.date_debut.gte = new Date(dateDebut);
            if (dateFin) where.date_debut.lte = new Date(dateFin);
        }

        // Agrégation par status et type en parallèle
        const [
            campagnesParStatus,
            campagnesParType,
            totalCampagnes
        ] = await prisma.$transaction([
            // Grouper par status
            prisma.campagne.groupBy({
                by: ['status'],
                where,
                _count: {
                    id_campagne: true
                },
                orderBy: {
                    _count: {
                        id_campagne: 'desc'
                    }
                }
            }),
            // Grouper par type
            prisma.campagne.groupBy({
                by: ['type_campagne'],
                where,
                _count: {
                    id_campagne: true
                },
                orderBy: {
                    _count: {
                        id_campagne: 'desc'
                    }
                }
            }),
            // Compter le total
            prisma.campagne.count({ where })
        ]);

        // Formatage des statistiques pour le frontend
        const statistiques = {
            total: totalCampagnes,
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
        };

        // Remplir les statistiques par status
        campagnesParStatus.forEach(stat => {
            if (stat._count && typeof stat._count === 'object') {
                const count = stat._count as { id_campagne: number };
                statistiques.parStatus[stat.status] = count.id_campagne;
            }
        });

        // Remplir les statistiques par type
        campagnesParType.forEach(stat => {
            if (stat._count && typeof stat._count === 'object') {
                const count = stat._count as { id_campagne: number };
                if (stat.type_campagne) {
                    statistiques.parType[stat.type_campagne] = count.id_campagne;
                } else {
                    statistiques.parType.NON_SPECIFIE = count.id_campagne;
                }
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
