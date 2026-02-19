import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
import Joi from "joi";

// Validation schema for photo addition
const photoAddSchema = Joi.object({
    photos: Joi.array().items(Joi.string().uri()).required().min(1)
});

// POST /api/prestataires/[id]/photos - Ajouter des photos à un prestataire existant
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const { id } = await params;
        const prestataireId = id;

        const body = await request.json();

        const { error, value } = photoAddSchema.validate(body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const existingPrestataire = await prisma.prestataire.findUnique({
            where: { id_prestataire: prestataireId }
        });

        if (!existingPrestataire) {
            throw new AppError("Prestataire non trouvé", 404);
        }

        // Create photos
        await prisma.prestatairePhoto.createMany({
            data: value.photos.map((url: string) => ({
                id_prestataire: prestataireId,
                url: url
            }))
        });

        const updatedPhotos = await prisma.prestatairePhoto.findMany({
            where: { id_prestataire: prestataireId }
        });

        return NextResponse.json({
            message: "Photos ajoutées avec succès",
            photos: updatedPhotos
        });

    } catch (error) {
        return handleApiError(error);
    }
}
