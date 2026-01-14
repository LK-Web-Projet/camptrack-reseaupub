import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { campagneCreateSchema, validateData } from "@/lib/validation/campagneSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/campagnes - Lister toutes les campagnes
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    // ========================================================================
    // AUTO-TERMINATION : Clôturer les campagnes expirées
    // ========================================================================
    const now = new Date();

    // Identifier les campagnes expirées (date_fin passée et non terminées)
    const expiredCampaigns = await prisma.campagne.findMany({
      where: {
        date_fin: { lt: now },
        status: { notIn: ['TERMINEE', 'ANNULEE'] }
      },
      select: { id_campagne: true }
    });

    const expiredCampaignIds = expiredCampaigns.map(c => c.id_campagne);

    if (expiredCampaignIds.length > 0) {
      // Utiliser une transaction pour assurer la cohérence
      await prisma.$transaction(async (tx) => {
        // 1. Mettre à jour le statut des campagnes
        await tx.campagne.updateMany({
          where: { id_campagne: { in: expiredCampaignIds } },
          data: { status: 'TERMINEE' }
        });

        // 2. Récupérer les prestataires avec affectations actives sur ces campagnes
        const affectationsToClose = await tx.prestataireCampagne.findMany({
          where: {
            id_campagne: { in: expiredCampaignIds },
            date_fin: null
          },
          select: { id_prestataire: true }
        });

        const prestataireIds = affectationsToClose.map(a => a.id_prestataire);

        if (prestataireIds.length > 0) {
          // 3. Clôturer les affectations (date_fin = now)
          await tx.prestataireCampagne.updateMany({
            where: {
              id_campagne: { in: expiredCampaignIds },
              date_fin: null
            },
            data: { date_fin: now }
          });

          // 4. Libérer les prestataires (disponible = true)
          await tx.prestataire.updateMany({
            where: { id_prestataire: { in: prestataireIds } },
            data: { disponible: true }
          });
        }
      });
    }
    // ========================================================================

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const lieuId = searchParams.get('lieuId');

    // Construction du filtre
    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.id_client = clientId;
    if (lieuId) where.id_lieu = lieuId;

    const total = await prisma.campagne.count({ where });

    const campagnes = await prisma.campagne.findMany({
      where,
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
        service: {
          select: {
            nom: true
          }
        },
        gestionnaire: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        },
        _count: {
          select: {
            affectations: true,
            fichiers: true
          }
        }
      },
      orderBy: { date_debut: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json({
      campagnes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/campagnes - Créer une nouvelle campagne
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();

    const validation = validateData(campagneCreateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const {
      id_client,
      id_lieu,
      id_service,
      nom_campagne,
      description,
      objectif,
      quantite_service,
      nbr_prestataire,
      type_campagne,
      date_debut,
      date_fin
    } = validation.data;

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id_client }
    });
    if (!client) {
      throw new AppError("Client non trouvé", 404);
    }

    // Vérifier que le lieu existe
    const lieu = await prisma.lieu.findUnique({
      where: { id_lieu }
    });
    if (!lieu) {
      throw new AppError("Lieu non trouvé", 404);
    }

    // Vérifier que le service existe
    const service = await prisma.service.findUnique({
      where: { id_service: id_service }
    });
    if (!service) {
      throw new AppError("Service non trouvé", 404);
    }

    // Créer la campagne
    const campagne = await prisma.campagne.create({
      data: {
        id_client,
        id_lieu,
        id_service,
        id_gestionnaire: authCheck.user.id_user,
        nom_campagne,
        description: description || null,
        objectif: objectif || null,
        quantite_service: quantite_service || null,
        nbr_prestataire: nbr_prestataire || null,
        type_campagne: type_campagne || null,
        date_debut: new Date(date_debut),
        date_fin: new Date(date_fin)
      },
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
        service: {
          select: {
            nom: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Campagne créée avec succès",
      campagne
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}