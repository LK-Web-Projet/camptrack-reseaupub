import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import {
  paiementCreateSchema,
  paiementQuerySchema,
  validateData,
  type PaiementPrestataire,
  type PaiementQueryParams,
} from "@/lib/validation/paiementSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/paiements - Lister tous les paiements avec filtres
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    // Récupérer et valider les query params
    const { searchParams } = new URL(request.url);
    const queryParams: any = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      id_campagne: searchParams.get("id_campagne"),
      id_prestataire: searchParams.get("id_prestataire"),
      statut_paiement: searchParams.get("statut_paiement"),
    };

    // Supprimer les clés avec des valeurs nulles (paramètres non fournis)
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === null) {
        delete queryParams[key];
      }
    });

    const validation = validateData(paiementQuerySchema, queryParams);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { page, limit, id_campagne, id_prestataire, statut_paiement } =
      validation.data as PaiementQueryParams;
    const skip = (page - 1) * limit;

    // Construire le filtre WHERE
    const where: Record<string, unknown> = {};
    if (id_campagne) where.id_campagne = id_campagne;
    if (id_prestataire) where.id_prestataire = id_prestataire;
    if (statut_paiement !== undefined) where.statut_paiement = statut_paiement;

    // Compter le total
    const total = await prisma.paiementPrestataire.count({ where });

    // Récupérer les paiements avec les relations
    const paiements = await prisma.paiementPrestataire.findMany({
      where,
      include: {
        affectation: {
          select: {
            id_campagne: true,
            id_prestataire: true,
            date_creation: true,
            date_fin: true,
            status: true,
            campagne: {
              select: {
                id_campagne: true,
                nom_campagne: true,
                date_debut: true,
                date_fin: true,
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
                contact: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      paiements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/paiements - Créer un paiement
// Ce endpoint est appelé automatiquement après la vérification du matériel
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();

    // Valider les données d'entrée
    const validation = validateData(paiementCreateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { id_campagne, id_prestataire, paiement_base, date_paiement } =
      validation.data as PaiementPrestataire;

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
            id_client: true,
            client: {
              select: {
                type_client: true,
              },
            },
          },
        },
      },
    });

    if (!affectation) {
      throw new AppError("Affectation prestataire-campagne non trouvée", 404);
    }

    // 2. Vérifier qu'un paiement n'existe pas déjà
    const paiementExistant = await prisma.paiementPrestataire.findUnique({
      where: {
        id_campagne_id_prestataire: {
          id_campagne,
          id_prestataire,
        },
      },
    });

    if (paiementExistant) {
      throw new AppError(
        "Un paiement existe déjà pour cette affectation",
        409
      );
    }

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
    const paiement_final = paiement_base - sanction_montant;

    // 5. Créer le paiement
    const paiement = await prisma.paiementPrestataire.create({
      data: {
        id_campagne,
        id_prestataire,
        paiement_base,
        paiement_final: Math.max(0, paiement_final), // Ne pas aller en négatif
        sanction_montant,
        statut_paiement: !!date_paiement, // true si date_paiement est fournie
        date_paiement: date_paiement || null,
      },
      include: {
        affectation: {
          select: {
            campagne: {
              select: {
                nom_campagne: true,
                client: {
                  select: {
                    nom: true,
                  },
                },
              },
            },
            prestataire: {
              select: {
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Paiement créé avec succès",
        paiement,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
