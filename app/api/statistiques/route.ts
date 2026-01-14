import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError } from "@/lib/utils/errorHandler";

// GET /api/statistiques - Obtenir les statistiques globales
export async function GET(request: NextRequest) {
    try {
        // Vérification de l'authentification (admin requis pour voir les stats globales)
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const [
            usersCount,
            clientsCount,
            campagnesCount,
            prestatairesCount,
            lieuxCount,
            servicesCount,
            campagnesByStatus,
            campagnesByType,
            prestatairesDisponibles,
            prestatairesIndisponibles
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.client.count(),
            prisma.campagne.count(),
            prisma.prestataire.count(),
            prisma.lieu.count(),
            prisma.service.count(),
            prisma.campagne.groupBy({
                by: ['status'],
                _count: {
                    status: true
                }
            }),
            prisma.campagne.groupBy({
                by: ['type_campagne'],
                _count: {
                    type_campagne: true
                }
            }),
            prisma.prestataire.count({
                where: { disponible: true }
            }),
            prisma.prestataire.count({
                where: { disponible: false }
            })
        ]);

        // Formatage des données pour le frontend
        const stats = {
            counts: {
                users: usersCount,
                clients: clientsCount,
                campagnes: campagnesCount,
                prestataires: prestatairesCount,
                lieux: lieuxCount,
                services: servicesCount
            },
            campagnes: {
                parStatus: campagnesByStatus.reduce((acc, curr) => {
                    acc[curr.status] = curr._count.status;
                    return acc;
                }, {} as Record<string, number>),
                parType: campagnesByType.reduce((acc, curr) => {
                    if (curr.type_campagne) {
                        acc[curr.type_campagne] = curr._count.type_campagne;
                    }
                    return acc;
                }, {} as Record<string, number>)
            },
            prestataires: {
                total: prestatairesCount,
                disponibles: prestatairesDisponibles,
                indisponibles: prestatairesIndisponibles
            }
        };

        return NextResponse.json(stats);

    } catch (error) {
        return handleApiError(error);
    }
}
