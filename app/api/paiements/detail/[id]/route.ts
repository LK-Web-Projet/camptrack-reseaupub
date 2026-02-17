import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/paiements/[id] - Détails d'un paiement avec transactions
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const { id } = await params;

        const paiement = await prisma.paiementPrestataire.findUnique({
            where: { id_paiement: id },
            include: {
                transactions: {
                    orderBy: { created_at: "desc" },
                },
                affectation: {
                    select: {
                        id_campagne: true,
                        id_prestataire: true,
                        campagne: {
                            select: {
                                nom_campagne: true,
                                client: {
                                    select: { nom: true, entreprise: true },
                                },
                            },
                        },
                        prestataire: {
                            select: {
                                nom: true,
                                prenom: true,
                                contact: true,
                            },
                        },
                    },
                },
            },
        });

        if (!paiement) {
            throw new AppError("Paiement non trouvé", 404);
        }

        return NextResponse.json(paiement);
    } catch (error) {
        return handleApiError(error);
    }
}
