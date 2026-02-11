import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// DELETE /api/campagnes/[id]/prestataires/[prestataireId]/photo - Supprimer l'image d'affiche d'une affectation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; prestataireId: string }> }
) {
    try {
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const { id, prestataireId } = await params;
        const campagneId = id;

        // Vérifier que la campagne existe
        const existingCampagne = await prisma.campagne.findUnique({
            where: { id_campagne: campagneId }
        });

        if (!existingCampagne) {
            throw new AppError("Campagne non trouvée", 404);
        }

        // Vérifier que l'affectation existe
        const affectation = await prisma.prestataireCampagne.findUnique({
            where: {
                id_campagne_id_prestataire: {
                    id_campagne: campagneId,
                    id_prestataire: prestataireId
                }
            }
        });

        if (!affectation) {
            throw new AppError("Affectation non trouvée", 404);
        }

        if (!affectation.image_affiche) {
            throw new AppError("Aucune image d'affiche à supprimer", 400);
        }

        // Supprimer l'image d'affiche (mettre à null)
        await prisma.prestataireCampagne.update({
            where: {
                id_campagne_id_prestataire: {
                    id_campagne: campagneId,
                    id_prestataire: prestataireId
                }
            },
            data: {
                image_affiche: null
            }
        });

        return NextResponse.json({
            message: "Image d'affiche supprimée avec succès"
        });

    } catch (error) {
        return handleApiError(error);
    }
}
