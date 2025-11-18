import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/campagnes/[id]/materiels-cases - Lister les états de matériel d'une campagne
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const etat = searchParams.get('etat') as 'BON' | 'MOYEN' | 'MAUVAIS' | null;

    // Vérifier que la campagne existe
    const campagne = await prisma.campagne.findUnique({
      where: { id_campagne: id },
      select: { id_campagne: true, nom_campagne: true }
    });

    if (!campagne) {
      throw new AppError("Campagne non trouvée", 404);
    }

    // Construire le filtre
    const where: any = { id_campagne: id };
    if (etat) where.etat = etat;

    // Récupérer les enregistrements
    const materiels_cases = await prisma.materielsCase.findMany({
      where,
      include: {
        prestataire: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true,
            contact: true,
            type_panneau: true,
            plaque: true
          }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    // Calculer les statistiques
    const total = materiels_cases.length;
    const etat_bon = materiels_cases.filter(mc => mc.etat === 'BON').length;
    const etat_moyen = materiels_cases.filter(mc => mc.etat === 'MOYEN').length;
    const etat_mauvais = materiels_cases.filter(mc => mc.etat === 'MAUVAIS').length;
    const penalites_total = materiels_cases.reduce((sum, mc) => sum + mc.montant_penalite, 0);

    return NextResponse.json({
      campagne: {
        id_campagne: campagne.id_campagne,
        nom_campagne: campagne.nom_campagne
      },
      materiels_cases,
      statistiques: {
        total,
        etat_bon,
        etat_moyen,
        etat_mauvais,
        penalites_total
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}