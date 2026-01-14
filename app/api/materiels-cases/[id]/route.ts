import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
import { materielsCaseUpdateSchema, validateData } from "@/lib/validation/materielsCaseSchemas";

// GET /api/materiels-cases/[id] - Récupérer un état de matériel spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;

    const materiels_case = await prisma.materielsCase.findUnique({
      where: { id_materiels_case: id },
      include: {
        campagne: {
          select: {
            id_campagne: true,
            nom_campagne: true,
            date_debut: true,
            date_fin: true,
            status: true,
            client: {
              select: {
                id_client: true,
                nom: true,
                type_client: true
              }
            }
          }
        },
        prestataire: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true,
            contact: true,
            type_panneau: true,
            plaque: true,
            marque: true,
            modele: true
          }
        }
      }
    });

    if (!materiels_case) {
      throw new AppError("État de matériel non trouvé", 404);
    }

    return NextResponse.json({ materiels_case });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/materiels-cases/[id] - Modifier un état de matériel
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const body = await request.json();

    // Valider les données d'entrée
    const validation = validateData(materielsCaseUpdateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    // Vérifier que l'enregistrement existe
    const existingRecord = await prisma.materielsCase.findUnique({
      where: { id_materiels_case: id }
    });

    if (!existingRecord) {
      throw new AppError("État de matériel non trouvé", 404);
    }

    // Vérifier les relations si fournies
    if (validation.data.id_campagne !== undefined) {
      const campagne = await prisma.campagne.findUnique({
        where: { id_campagne: validation.data.id_campagne }
      });
      if (!campagne) {
        throw new AppError("Campagne non trouvée", 404);
      }
    }

    if (validation.data.id_prestataire !== undefined) {
      const prestataire = await prisma.prestataire.findUnique({
        where: { id_prestataire: validation.data.id_prestataire }
      });
      if (!prestataire) {
        throw new AppError("Prestataire non trouvé", 404);
      }
    }

    // Mettre à jour l'enregistrement
    const updatedRecord = await prisma.materielsCase.update({
      where: { id_materiels_case: id },
      data: validation.data,
      include: {
        campagne: {
          select: {
            id_campagne: true,
            nom_campagne: true
          }
        },
        prestataire: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true,
            contact: true
          }
        }
      }
    });

    // Après mise à jour, recalculer les pénalités et mettre à jour/créer le paiement lié
    const id_campagne = updatedRecord.id_campagne;
    const id_prestataire = updatedRecord.id_prestataire;

    if (id_campagne && id_prestataire) {
      try {
        const penalitesAgg = await prisma.materielsCase.aggregate({
          where: {
            id_campagne: id_campagne,
            id_prestataire: id_prestataire,
            penalite_appliquer: true
          },
          _sum: { montant_penalite: true }
        });

        const totalPenalites = penalitesAgg._sum.montant_penalite ?? 0;

        const existingPaiement = await prisma.paiementPrestataire.findUnique({
          where: {
            id_campagne_id_prestataire: {
              id_campagne,
              id_prestataire
            }
          }
        });

        if (existingPaiement) {
          const nouveauFinal = Math.max(0, existingPaiement.paiement_base - totalPenalites);
          await prisma.paiementPrestataire.update({
            where: { id_paiement: existingPaiement.id_paiement },
            data: { sanction_montant: totalPenalites, paiement_final: nouveauFinal }
          });
        } else {
          const campagne = await prisma.campagne.findUnique({
            where: { id_campagne },
            select: { client: { select: { type_client: true } } }
          });
          const typeClient = campagne?.client?.type_client ?? 'EXTERNE';
          const paiementBase = typeClient === 'EXTERNE' ? 5000 : 3000;
          const paiementFinal = Math.max(0, paiementBase - totalPenalites);

          await prisma.paiementPrestataire.create({
            data: {
              id_campagne,
              id_prestataire,
              paiement_base: paiementBase,
              paiement_final: paiementFinal,
              sanction_montant: totalPenalites,
              statut_paiement: false
            }
          });
        }
      } catch (err) {
        // Log and continue
         
        console.error('Erreur lors de la mise à jour du paiement après modification MaterielsCase:', err);
      }
    }

    return NextResponse.json({
      message: "État de matériel modifié avec succès",
      materiels_case: updatedRecord
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/materiels-cases/[id] - Supprimer un état de matériel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;

    // Vérifier que l'enregistrement existe
    const existingRecord = await prisma.materielsCase.findUnique({
      where: { id_materiels_case: id }
    });

    if (!existingRecord) {
      throw new AppError("État de matériel non trouvé", 404);
    }

    // Supprimer l'enregistrement
    await prisma.materielsCase.delete({
      where: { id_materiels_case: id }
    });

    return NextResponse.json({
      message: "État de matériel supprimé avec succès"
    });

  } catch (error) {
    return handleApiError(error);
  }
}


