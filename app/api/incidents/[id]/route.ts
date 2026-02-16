
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware/authMiddleware";
import { incidentCreateSchema, validateData } from "@/lib/validation/schemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// PUT /api/incidents/[id] - Modifier un incident
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.ok) {
            return authResult.response;
        }

        const { id } = await params;
        const body = await request.json();

        // Utilisation du même schéma que pour la création pour simplifier, 
        // mais idéalement on devrait avoir un schéma spécifique "Update" si les champs diffèrent
        const validation = validateData(incidentCreateSchema, body);

        if (!validation.success) {
            // Validation échouée, mais vérifions si c'est juste une mise à jour partielle
            // Pour l'instant on exige que le body respecte le schema complet ou on adapte la logique
            // Ici on suppose qu'on envoie tout l'objet
            return NextResponse.json({ message: validation.error }, { status: 400 });
        }

        const { id_prestataire, id_type_incident, date_incident, commentaire, photos } = validation.data as {
            id_prestataire: string;
            id_type_incident: string;
            date_incident: string;
            commentaire: string;
            photos?: string[];
        };

        const existingIncident = await prisma.incident.findUnique({
            where: { id_incident: id },
        });

        if (!existingIncident) {
            throw new AppError("Incident non trouvé", 404);
        }

        // Transaction pour mettre à jour l'incident et ses photos
        const updatedIncident = await prisma.$transaction(async (tx) => {
            // 1. Mise à jour des champs de base
            const incident = await tx.incident.update({
                where: { id_incident: id },
                data: {
                    id_prestataire,
                    id_type_incident,
                    date_incident: new Date(date_incident),
                    commentaire,
                },
            });

            // 2. Gestion des photos (si fournies)
            if (photos) {
                // Supprimer les anciennes photos (ou stratégie de fusion à définir)
                // Ici on remplace tout pour simplifier (suppression + recréation)
                await tx.incidentPhoto.deleteMany({
                    where: { id_incident: id },
                });

                if (photos.length > 0) {
                    await tx.incidentPhoto.createMany({
                        data: photos.map((url) => ({
                            id_incident: id,
                            url,
                        })),
                    });
                }
            }

            return incident;
        });

        // Récupérer l'objet complet avec relations pour la réponse
        const finalIncident = await prisma.incident.findUnique({
            where: { id_incident: id },
            include: {
                type_incident: true,
                photos: true,
            },
        });

        return NextResponse.json(finalIncident);

    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/incidents/[id] - Supprimer un incident
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.ok) {
            return authResult.response;
        }

        const { id } = await params;

        const existingIncident = await prisma.incident.findUnique({
            where: { id_incident: id },
        });

        if (!existingIncident) {
            throw new AppError("Incident non trouvé", 404);
        }

        // La suppression en cascade des photos est gérée par Prisma (onDelete: Cascade dans schema)
        await prisma.incident.delete({
            where: { id_incident: id },
        });

        return NextResponse.json({ message: "Incident supprimé avec succès" });

    } catch (error) {
        return handleApiError(error);
    }
}
