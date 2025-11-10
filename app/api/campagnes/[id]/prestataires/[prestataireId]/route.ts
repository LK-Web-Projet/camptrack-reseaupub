import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// DELETE /api/campagnes/[id]/prestataires/[prestataireId] - Retirer un prestataire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prestataireId: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id, prestataireId } = await params; 

    // Vérifier que l'affectation existe
    const affectation = await prisma.prestataireCampagne.findUnique({
      where: {
        id_campagne_id_prestataire: {
          id_campagne: id,
          id_prestataire: prestataireId
        }
      },
      include: {
        paiement: true,
        prestataire: {
          include: {
            dommages: {
              where: {
                id_campagne: id
              }
            }
          }
        }
      }
    });

    if (!affectation) {
      throw new AppError("Cette affectation n'existe pas", 404);
    }

    // Vérifier s'il y a un paiement associé
    if (affectation.paiement) {
      throw new AppError(
        "Impossible de retirer ce prestataire car un paiement est associé",
        400
      );
    }

    if (affectation.prestataire.dommages && affectation.prestataire.dommages.length > 0) {
      throw new AppError(
        "Impossible de retirer ce prestataire car des dommages sont associés à cette campagne",
        400
      );
    }

    // Supprimer l'affectation
    await prisma.prestataireCampagne.delete({
      where: {
        id_campagne_id_prestataire: {
          id_campagne: id,
          id_prestataire: prestataireId
        }
      }
    });

    return NextResponse.json({
      message: "Prestataire retiré de la campagne avec succès"
    });

  } catch (error) {
    return handleApiError(error);
  }
}