import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// DELETE /api/prestataires/[id]/photos/[photoId] - Supprimer une photo d'un prestataire
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; photoId: string }> }
) {
    try {
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const { id, photoId } = await params;
        const prestataireId = id;

        // Vérifier que le prestataire existe
        const existingPrestataire = await prisma.prestataire.findUnique({
            where: { id_prestataire: prestataireId }
        });

        if (!existingPrestataire) {
            throw new AppError("Prestataire non trouvé", 404);
        }

        // Vérifier que la photo existe et appartient au prestataire
        const photo = await prisma.prestatairePhoto.findUnique({
            where: { id_photo: photoId }
        });

        if (!photo) {
            throw new AppError("Photo non trouvée", 404);
        }

        if (photo.id_prestataire !== prestataireId) {
            throw new AppError("Cette photo n'appartient pas à ce prestataire", 403);
        }

        // Supprimer la photo
        await prisma.prestatairePhoto.delete({
            where: { id_photo: photoId }
        });

        return NextResponse.json({
            message: "Photo supprimée avec succès"
        });

    } catch (error) {
        return handleApiError(error);
    }
}
