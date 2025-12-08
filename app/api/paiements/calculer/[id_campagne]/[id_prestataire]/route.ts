import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/paiements/calculer/[id_campagne]/[id_prestataire] - Calculer le paiement automatiquement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_campagne: string; id_prestataire: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id_campagne, id_prestataire } = await params;

    // 1. Vérifier que l'affectation existe
    const affectation = await prisma.prestataireCampagne.findUnique({
      where: {
        id_campagne_id_prestataire: {
          id_campagne,
          id_prestataire,
        },
      },
      include: {
        campagne: {
          select: {
            id_campagne: true,
            nom_campagne: true,
            client: {
              select: {
                id_client: true,
                nom: true,
                type_client: true,
              },
            },
          },
        },
        prestataire: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!affectation) {
      throw new AppError("Affectation prestataire-campagne non trouvée", 404);
    }

    // 2. Déterminer le paiement de base selon le type de client
    const paiement_base =
      affectation.campagne.client.type_client === "EXTERNE" ? 5000 : 3000;

    // 3. Récupérer les pénalités appliquées pour cette campagne
    const penalites = await prisma.materielsCase.aggregate({
      where: {
        id_campagne,
        etat: "MAUVAIS",
        penalite_appliquer: true,
      },
      _sum: {
        montant_penalite: true,
      },
    });

    const sanction_montant = penalites._sum.montant_penalite || 0;

    // 4. Calculer le paiement final
    const paiement_final = Math.max(0, paiement_base - sanction_montant);

    return NextResponse.json({
      message: "Calcul du paiement réussi",
      calcul: {
        campagne: affectation.campagne,
        prestataire: affectation.prestataire,
        paiement_base,
        sanction_montant,
        paiement_final,
        details: {
          type_client: affectation.campagne.client.type_client,
          paiement_base_description:
            affectation.campagne.client.type_client === "EXTERNE"
              ? "Client EXTERNE = 5000 F CFA"
              : "Client INTERNE = 3000 F CFA",
          penalites_appliquees: sanction_montant,
          montant_net_a_payer: paiement_final,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
