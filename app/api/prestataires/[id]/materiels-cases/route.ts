import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/prestataires/[id]/materiels-cases - Lister les états de matériel d'un prestataire
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const penalite_appliquer = searchParams.get('penalite_appliquer');

    // Vérifier que le prestataire existe
    const prestataire = await prisma.prestataire.findUnique({
      where: { id_prestataire: id },
      select: { id_prestataire: true, nom: true, prenom: true }
    });

    if (!prestataire) {
      throw new AppError("Prestataire non trouvé", 404);
    }

    // Construire le filtre
    const where: any = { id_prestataire: id };
    if (penalite_appliquer !== null) {
      where.penalite_appliquer = penalite_appliquer === 'true';
    }

    // Récupérer les enregistrements
    const materiels_cases = await prisma.materielsCase.findMany({
      where,
      include: {
        campagne: {
          select: {
            id_campagne: true,
            nom_campagne: true,
            date_debut: true,
            date_fin: true,
            status: true
          }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    // Calculer les statistiques
    const total = materiels_cases.length;
    const penalites_total = materiels_cases.reduce((sum, mc) => sum + mc.montant_penalite, 0);
    const penalites_appliquees = materiels_cases
      .filter(mc => mc.penalite_appliquer)
      .reduce((sum, mc) => sum + mc.montant_penalite, 0);

    return NextResponse.json({
      prestataire: {
        id_prestataire: prestataire.id_prestataire,
        nom: prestataire.nom,
        prenom: prestataire.prenom
      },
      materiels_cases,
      statistiques: {
        total,
        penalites_total,
        penalites_appliquees
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}