import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
import Joi from "joi";

// Validation schema for file addition
const fileAddSchema = Joi.object({
    files: Joi.array().items(
        Joi.object({
            url: Joi.string().uri().required(),
            nom: Joi.string().required(),
            type: Joi.string().optional()
        })
    ).required().min(1)
});

// POST /api/prestataires/[id]/files - Ajouter des fichiers à un prestataire existant
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

        const { error, value } = fileAddSchema.validate(body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const existingPrestataire = await prisma.prestataire.findUnique({
            where: { id_prestataire: prestataireId }
        });

        if (!existingPrestataire) {
            throw new AppError("Prestataire non trouvé", 404);
        }

        // Create files
        await prisma.prestataireFichier.createMany({
            data: value.files.map((file: { url: string, nom: string, type?: string }) => ({
                id_prestataire: prestataireId,
                url: file.url,
                nom: file.nom,
                type: file.type || null
            }))
        });

        const updatedFiles = await prisma.prestataireFichier.findMany({
            where: { id_prestataire: prestataireId }
        });

        return NextResponse.json({
            message: "Fichiers ajoutés avec succès",
            files: updatedFiles
        });

    } catch (error) {
        return handleApiError(error);
    }
}
