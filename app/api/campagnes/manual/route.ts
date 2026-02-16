import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware"; // Or appropriate auth check
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
import { z } from "zod";

const manualCampaignSchema = z.object({
    nom_campagne: z.string().min(1, "Nom requis"),
    id_client: z.string().min(1, "Client requis"),
    id_lieu: z.string().min(1, "Lieu requis"),
    id_service: z.string().min(1, "Service requis"),
    selectedPrestataires: z.array(z.string()).min(1, "Au moins un prestataire requis"),
});

export async function POST(request: NextRequest) {
    try {
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const body = await request.json();
        const validation = manualCampaignSchema.safeParse(body);

        if (!validation.success) {
            throw new AppError(validation.error.issues[0].message, 400);
        }

        const { nom_campagne, id_client, id_lieu, id_service, selectedPrestataires } = validation.data;

        // Verify existence of foreign keys
        const [client, lieu, service] = await Promise.all([
            prisma.client.findUnique({ where: { id_client } }),
            prisma.lieu.findUnique({ where: { id_lieu } }),
            prisma.service.findUnique({ where: { id_service } }),
        ]);

        if (!client) throw new AppError("Client non trouvé", 404);
        if (!lieu) throw new AppError("Lieu non trouvé", 404);
        if (!service) throw new AppError("Service non trouvé", 404);

        // Verify prestataires exist and belong to the service (optional but good)
        // For speed, we just trust the IDs sent if they are valid CUIDs, but checking is safer.
        const prestatairesCount = await prisma.prestataire.count({
            where: {
                id_prestataire: { in: selectedPrestataires },
                id_service: id_service // Enforce service match
            }
        });

        if (prestatairesCount !== selectedPrestataires.length) {
            // Some mismatch or invalid IDs
            // We can proceed with just the valid ones or error out. Let's error out for safety.
            throw new AppError("Certains prestataires sélectionnés ne sont pas valides ou ne correspondent pas au service", 400);
        }

        // Create Campaign
        // Dates: Assume it started 1 month ago and ended yesterday to be "TERMINEE"
        const dateFin = new Date();
        dateFin.setDate(dateFin.getDate() - 1); // Yesterday
        const dateDebut = new Date(dateFin);
        dateDebut.setMonth(dateDebut.getMonth() - 1); // 1 month before end

        const campagne = await prisma.campagne.create({
            data: {
                nom_campagne,
                id_client,
                id_lieu,
                id_service,
                id_gestionnaire: authCheck.user.id_user,
                status: "TERMINEE", // Crucial for Desinstallation page
                date_debut: dateDebut,
                date_fin: dateFin,
                quantite_service: selectedPrestataires.length,
                nbr_prestataire: selectedPrestataires.length,
                type_campagne: "MASSE", // Default or add field to modal? defaulting is safe for legacy
                description: "Campagne manuelle (Legacy)",

                // Create Affectations
                affectations: {
                    create: selectedPrestataires.map(id_prestataire => ({
                        id_prestataire,
                        // status: "A_DESINSTALLER", // If you have an enum or string for status
                        date_desinstallation: null, // Crucial: means NOT yet uninstalled
                        // No payments generated yet, they will be generated upon uninstallation
                    }))
                }
            }
        });

        return NextResponse.json({
            message: "Campagne manuelle créée avec succès",
            campagne
        }, { status: 201 });

    } catch (error) {
        return handleApiError(error);
    }
}
