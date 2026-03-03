import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
import { Prisma } from "@prisma/client";

// DELETE /api/campagnes/[id]/prestataires/[prestataireId] - Retirer un prestataire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prestataireId: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id, prestataireId } = await params;

    // 1. Vérifier que l'affectation existe
    const affectation = await prisma.prestataireCampagne.findUnique({
      where: {
        id_campagne_id_prestataire: {
          id_campagne: id,
          id_prestataire: prestataireId
        }
      },
      include: {
        paiement: true
      }
    });

    if (!affectation) {
      throw new AppError("Cette affectation n'existe pas", 404);
    }

    // 2. Bloquer si un paiement existe pour ce prestataire dans cette campagne
    if (affectation.paiement && affectation.paiement.length > 0) {
      throw new AppError(
        "Impossible de désassigner ce prestataire : un paiement est associé à cette affectation. Veuillez d'abord supprimer le paiement.",
        400
      );
    }

    // 3. Supprimer l'affectation et remettre le prestataire disponible (transaction)
    await prisma.$transaction(async (tx) => {
      // Supprimer la ligne PrestataireCampagne
      await tx.prestataireCampagne.delete({
        where: {
          id_campagne_id_prestataire: {
            id_campagne: id,
            id_prestataire: prestataireId
          }
        }
      });

      // Remettre le prestataire comme disponible
      await tx.prestataire.update({
        where: { id_prestataire: prestataireId },
        data: { disponible: true }
      });
    });

    return NextResponse.json({
      message: "Prestataire désassigné et retiré de la campagne avec succès"
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/campagnes/[id]/prestataires/[prestataireId] - Mettre à jour une affectation de prestataire
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prestataireId: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id, prestataireId } = await params;
    const body = await request.json();

    // Vérifier que l'affectation existe
    const affectation = await prisma.prestataireCampagne.findUnique({
      where: {
        id_campagne_id_prestataire: {
          id_campagne: id,
          id_prestataire: prestataireId
        }
      }
    });

    if (!affectation) {
      throw new AppError("Cette affectation n'existe pas", 404);
    }

    // Vérifier les champs à mettre à jour
    const updateData: Prisma.PrestataireCampagneUpdateInput = {};

    if (body.status !== undefined) {
      // Valider les statuts possibles
      const statutsValides = ["ACTIF", "INACTIF", "TERMINE", "ANNULE"];
      if (!statutsValides.includes(body.status)) {
        throw new AppError(`Statut invalide. Statuts valides: ${statutsValides.join(", ")}`, 400);
      }
      updateData.status = body.status;

      // Si on termine l'affectation, mettre la date de fin
      if (body.status === "TERMINE" || body.status === "ANNULE") {
        updateData.date_fin = new Date();
      }
    }

    if (body.image_affiche !== undefined) {
      updateData.image_affiche = body.image_affiche;
    }

    //  S'assurer qu'au moins un champ est fourni
    if (Object.keys(updateData).length === 0) {
      throw new AppError("Aucune donnée à mettre à jour fournie", 400);
    }

    // Mettre à jour l'affectation
    const updatedAffectation = await prisma.prestataireCampagne.update({
      where: {
        id_campagne_id_prestataire: {
          id_campagne: id,
          id_prestataire: prestataireId
        }
      },
      data: updateData,
      include: {
        prestataire: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Affectation mise à jour avec succès",
      affectation: updatedAffectation
    });

  } catch (error) {
    return handleApiError(error);
  }
}