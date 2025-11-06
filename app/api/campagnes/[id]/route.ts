import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware"; 
import { campagneUpdateSchema, validateData } from "@/lib/validation/campagneSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

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
        affectations: {
          select: {
            prestataire: {
              select: {
                id_prestataire: true,
                nom: true,
                prenom: true,
                contact: true,
                disponible: true,
                vehicule: {
                  select: {
                    type_panneau: true,
                    plaque: true
                  }
                }
              }
            },
            date_creation: true,
            status: true
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

    // Vérifier les conflits de dates si les dates sont modifiées
    if ((validation.data.date_debut || validation.data.date_fin) && existingCampagne.status !== 'ANNULEE') {
      const dateDebut = validation.data.date_debut ? new Date(validation.data.date_debut) : existingCampagne.date_debut;
      const dateFin = validation.data.date_fin ? new Date(validation.data.date_fin) : existingCampagne.date_fin;

      const conflitCampagne = await prisma.campagne.findFirst({
        where: {
          id_lieu: existingCampagne.id_lieu,
          id_campagne: { not: campagneId },
          OR: [
            {
              date_debut: { lte: dateFin },
              date_fin: { gte: dateDebut }
            }
          ],
          status: { not: 'ANNULEE' }
        }
      });

      if (conflitCampagne) {
        throw new AppError(
          `Une autre campagne existe déjà pour ce lieu pendant cette période: ${conflitCampagne.nom_campagne}`,
          409
        );
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