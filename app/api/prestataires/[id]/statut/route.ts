import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const prestataireId = id;

    const body = await request.json();
    const { disponible, raison } = body; 

    if (typeof disponible !== 'boolean') {
      throw new AppError("Le champ 'disponible' doit être un booléen", 400);
    }

    const existingPrestataire = await prisma.prestataire.findUnique({
      where: { id_prestataire: prestataireId }
    });

    if (!existingPrestataire) {
      throw new AppError("Prestataire non trouvé", 404);
    }

    const updatedPrestataire = await prisma.prestataire.update({
      where: { id_prestataire: prestataireId },
      data: { 
        disponible,
      },
      select: {
        id_prestataire: true,
        nom: true,
        prenom: true,
        disponible: true,
        updated_at: true,
        type_panneau: true,
        plaque: true
      }
    });

    return NextResponse.json({
      message: `Prestataire ${disponible ? 'activé' : 'désactivé'} avec succès`,
      prestataire: updatedPrestataire
    });

  } catch (error) {
    return handleApiError(error);
  }
}