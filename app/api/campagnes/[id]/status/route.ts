import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { campagneStatusSchema, validateData } from "@/lib/validation/campagneSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// PUT /api/campagnes/[id]/status - Changer le statut d'une campagne
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
    
    const validation = validateData(campagneStatusSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { status } = validation.data;

    const existingCampagne = await prisma.campagne.findUnique({
      where: { id_campagne: campagneId }
    });

    if (!existingCampagne) {
      throw new AppError("Campagne non trouvée", 404);
    }

    // Logique métier : validation des transitions de statut
    const transitionsValides = {
      'PLANIFIEE': ['EN_COURS', 'ANNULEE'],
      'EN_COURS': ['TERMINEE', 'ANNULEE'],
      'TERMINEE': [], // Une fois terminée, on ne peut plus changer
      'ANNULEE': [] // Une fois annulée, on ne peut plus changer
    };

    if (!transitionsValides[existingCampagne.status].includes(status)) {
      throw new AppError(
        `Transition de statut non autorisée: ${existingCampagne.status} → ${status}`,
        400
      );
    }

    // Vérifications supplémentaires selon le statut
    if (status === 'EN_COURS') {
      // Vérifier qu'il y a au moins un prestataire affecté
      const countPrestataires = await prisma.prestataireCampagne.count({
        where: { id_campagne: campagneId }
      });

      if (countPrestataires === 0) {
        throw new AppError(
          "Impossible de démarrer une campagne sans prestataires affectés",
          400
        );
      }
    }

    const updatedCampagne = await prisma.campagne.update({
      where: { id_campagne: campagneId },
      data: { status },
      select: {
        id_campagne: true,
        nom_campagne: true,
        status: true,
        date_debut: true,
        date_fin: true,
        updated_at: true
      }
    });

    return NextResponse.json({
      message: "Statut de la campagne modifié avec succès",
      campagne: updatedCampagne
    });

  } catch (error) {
    return handleApiError(error);
  }
}