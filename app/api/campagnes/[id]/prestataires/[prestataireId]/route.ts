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
                id_campagne: id,
                penalite_appliquer: false 
              }
            }
          }
        }
      }
    });

    if (!affectation) {
      throw new AppError("Cette affectation n'existe pas", 404);
    }

    // Vérifier si le prestataire est déjà retiré
    if (affectation.date_fin !== null) {
      throw new AppError("Ce prestataire a déjà été retiré de cette campagne", 400);
    }

    // Vérifier s'il y a un paiement finalisé associé
    if (affectation.paiement && affectation.paiement.statut_paiement) {
      throw new AppError(
        "Impossible de retirer ce prestataire car son paiement a déjà été finalisé",
        400
      );
    }

    // Vérifier s'il y a des dommages non résolus
    if (affectation.prestataire.dommages && affectation.prestataire.dommages.length > 0) {
      const dommagesNonResolus = affectation.prestataire.dommages.filter(
        d => !d.penalite_appliquer
      );
      
      if (dommagesNonResolus.length > 0) {
        throw new AppError(
          "Impossible de retirer ce prestataire car des dommages non résolus sont associés à cette campagne",
          400
        );
      }
    }


    await prisma.prestataireCampagne.update({
      where: {
        id_campagne_id_prestataire: {
          id_campagne: id,
          id_prestataire: prestataireId
        }
      },
      data: {
        date_fin: new Date(),
        status: "TERMINE"
      }
    });

    return NextResponse.json({
      message: "Prestataire retiré de la campagne avec succès"
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
    const updateData: any = {};
    
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
    
    //if (body.image_affiche !== undefined) {
      // Valider le format de l'URL si nécessaire
     // updateData.image_affiche = body.image_affiche;
    //}

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