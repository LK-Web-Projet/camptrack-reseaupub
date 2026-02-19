import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
import { renewCampaign } from "@/lib/business/renewal";
import { z } from "zod";

// Schéma de validation pour le renouvellement
const renewSchema = z.object({
    date_debut: z.string().datetime(),
    date_fin: z.string().datetime(),
    prestataire_ids: z.array(z.string()).optional()
}).refine(data => new Date(data.date_fin) > new Date(data.date_debut), {
    message: "La date de fin doit être après la date de début"
});

/**
 * POST /api/campagnes/[id]/renew
 * Renouvelle une campagne terminée
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const { id } = await params;
        const body = await request.json();

        // Validation des données
        const validation = renewSchema.safeParse(body);
        if (!validation.success) {
            throw new AppError(
                `Validation échouée: ${validation.error.errors.map(e => e.message).join(", ")}`,
                400
            );
        }

        const { date_debut, date_fin, prestataire_ids } = validation.data;

        // Appeler la logique métier
        const result = await renewCampaign({
            id_campagne: id,
            date_debut: new Date(date_debut),
            date_fin: new Date(date_fin),
            prestataire_ids
        });

        return NextResponse.json({
            message: "Campagne renouvelée avec succès",
            data: {
                nouvelle_campagne: result.nouvelle_campagne,
                nb_prestataires_affectes: result.nb_prestataires_affectes,
                prestataires_non_disponibles: result.prestataires_non_disponibles
            }
        }, { status: 201 });

    } catch (error) {
        return handleApiError(error);
    }
}
