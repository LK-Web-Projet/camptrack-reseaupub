import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { campagneUpdateSchema, validateData } from "@/lib/validation/campagneSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
import { UserType } from "@prisma/client";

// GET /api/campagnes/[id] - Récupérer une campagne spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const campagneId = id;

    const campagne = await prisma.campagne.findUnique({
      where: { id_campagne: campagneId },
      select: {
        id_campagne: true,
        nom_campagne: true,
        description: true,
        objectif: true,
        quantite_service: true,
        nbr_prestataire: true,
        type_campagne: true,
        date_debut: true,
        date_fin: true,
        status: true,
        date_creation: true,
        updated_at: true,
        client: {
          select: {
            id_client: true,
            nom: true,
            prenom: true,
            entreprise: true,
            contact: true,
            mail: true
          }
        },
        lieu: {
          select: {
            id_lieu: true,
            nom: true,
            ville: true
          }
        },
        service: {
          select: {
            id_service: true,
            nom: true,
            description: true
          }
        },
        gestionnaire: {
          select: {
            id_user: true,
            nom: true,
            prenom: true,
            email: true,
            type_user: true
          }
        },
        superviseur: {
          select: {
            id_user: true,
            nom: true,
            prenom: true,
            email: true,
            type_user: true
          }
        },
        id_campagne_parent: true,
        campagne_parent: {
          select: {
            id_campagne: true,
            nom_campagne: true
          }
        },
        affectations: {
          select: {
            prestataire: {
              select: {
                id_prestataire: true,
                nom: true,
                prenom: true,
                contact: true,
                disponible: true,
                type_panneau: true,
                plaque: true,
                couleur: true,
                marque: true,
                modele: true,
                id_verification: true
              }
            },
            paiement: {
              select: {
                id_paiement: true,
                paiement_base: true,
                paiement_final: true,
                sanction_montant: true,
                date_paiement: true,
                statut_paiement: true,
                created_at: true
              }
            },
            date_creation: true,
            status: true,
            image_affiche: true
          }
        },
        fichiers: {
          select: {
            id_fichier: true,
            nom_fichier: true,
            description: true,
            type_fichier: true,
            date_creation: true
          },
          orderBy: { date_creation: 'desc' }
        },
        _count: {
          select: {
            affectations: true,
            fichiers: true,
            dommages: true
          }
        }
      }
    });

    if (!campagne) {
      throw new AppError("Campagne non trouvée", 404);
    }

    return NextResponse.json({ campagne });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/campagnes/[id] - Modifier une campagne
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const campagneId = id;

    const body = await request.json();

    const validation = validateData(campagneUpdateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const existingCampagne = await prisma.campagne.findUnique({
      where: { id_campagne: campagneId }
    });

    if (!existingCampagne) {
      throw new AppError("Campagne non trouvée", 404);
    }

    // Vérifier le superviseur si fourni dans la mise à jour
    if (validation.data.id_superviseur) {
      const superviseur = await prisma.user.findUnique({
        where: { id_user: validation.data.id_superviseur }
      });

      if (!superviseur) {
        throw new AppError("Superviseur non trouvé", 404);
      }

      if (superviseur.type_user !== UserType.SUPERVISEUR_CAMPAGNE) {
        throw new AppError("L'utilisateur spécifié n'est pas un superviseur", 400);
      }
    }



    const updatedCampagne = await prisma.campagne.update({
      where: { id_campagne: campagneId },
      data: validation.data,
      select: {
        id_campagne: true,
        nom_campagne: true,
        description: true,
        objectif: true,
        quantite_service: true,
        nbr_prestataire: true,
        type_campagne: true,
        date_debut: true,
        date_fin: true,
        status: true,
        date_creation: true,
        updated_at: true,
        client: {
          select: {
            nom: true,
            prenom: true,
            entreprise: true
          }
        },
        lieu: {
          select: {
            nom: true,
            ville: true
          }
        },
        superviseur: {
          select: {
            id_user: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Campagne modifiée avec succès",
      campagne: updatedCampagne
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/campagnes/[id] - Supprimer une campagne
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const campagneId = id;

    const existingCampagne = await prisma.campagne.findUnique({
      where: { id_campagne: campagneId }
    });

    if (!existingCampagne) {
      throw new AppError("Campagne non trouvée", 404);
    }

    // Vérifier si la campagne a des affectations ou fichiers
    const relatedData = await prisma.campagne.findUnique({
      where: { id_campagne: campagneId },
      include: {
        _count: {
          select: {
            affectations: true,
            fichiers: true
          }
        }
      }
    });

    if (relatedData && (relatedData._count.affectations > 0 || relatedData._count.fichiers > 0)) {
      throw new AppError(
        "Impossible de supprimer cette campagne car elle a des prestataires affectés ou des fichiers associés",
        400
      );
    }

    await prisma.campagne.delete({
      where: { id_campagne: campagneId }
    });

    return NextResponse.json({
      message: "Campagne supprimée avec succès"
    });

  } catch (error) {
    return handleApiError(error);
  }
}