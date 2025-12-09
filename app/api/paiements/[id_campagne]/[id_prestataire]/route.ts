import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import {
  paiementUpdateStatusSchema,
  validateData,
  type PaiementPrestataire,
} from "@/lib/validation/paiementSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/paiements/[id_campagne]/[id_prestataire] - Récupérer un paiement spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_campagne: string; id_prestataire: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id_campagne, id_prestataire } = await params;

    const paiement = await prisma.paiementPrestataire.findUnique({
      where: {
        id_campagne_id_prestataire: {
          id_campagne,
          id_prestataire,
        },
      },
      include: {
        affectation: {
          select: {
            campagne: {
              select: {
                id_campagne: true,
                nom_campagne: true,
                client: {
                  select: {
                    nom: true,
                    type_client: true,
                  },
                },
              },
            },
            prestataire: {
              select: {
                id_prestataire: true,
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

    return NextResponse.json({ paiement });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/paiements/[id_campagne]/[id_prestataire] - Mettre à jour le statut du paiement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id_campagne: string; id_prestataire: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id_campagne, id_prestataire } = await params;
    const body = await request.json();

    // Valider les données d'entrée
    const validation = validateData(paiementUpdateStatusSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { statut_paiement, date_paiement } = validation.data as Partial<PaiementPrestataire>;

    // Vérifier que le paiement existe
    const paiementExistant = await prisma.paiementPrestataire.findUnique({
      where: {
        id_campagne_id_prestataire: {
          id_campagne,
          id_prestataire,
        },
      },
    });

    if (!paiementExistant) {
      throw new AppError("Paiement non trouvé", 404);
    }

    // Mettre à jour le paiement
    const paiementMisAJour = await prisma.paiementPrestataire.update({
      where: {
        id_campagne_id_prestataire: {
          id_campagne,
          id_prestataire,
        },
      },
      data: {
        statut_paiement,
        date_paiement: date_paiement ? new Date(date_paiement) : null,
      },
      include: {
        affectation: {
          select: {
            campagne: {
              select: {
                nom_campagne: true,
              },
            },
            prestataire: {
              select: {
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Paiement mis à jour avec succès",
      paiement: paiementMisAJour,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
