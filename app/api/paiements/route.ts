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
    const queryParams = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      id_campagne: searchParams.get("id_campagne") || undefined,
      id_prestataire: searchParams.get("id_prestataire") || undefined,
      statut_paiement: searchParams.get("statut_paiement") || undefined,
      statut: searchParams.get("statut") || undefined,
    };

    // Supprimer les clés avec des valeurs nulles (paramètres non fournis)
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === null || queryParams[key] === undefined || queryParams[key] === "") {
        delete queryParams[key];
      }
    });

    const validation = validateData(paiementQuerySchema, queryParams);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { page, limit, id_campagne, id_prestataire, statut_paiement, statut } =
      validation.data as PaiementQueryParams;
    const skip = (page - 1) * limit;

    // Paramètres de filtre supplémentaires (hors schema Zod)
    const search = searchParams.get("search")?.trim() || "";
    const campagneSearch = searchParams.get("campagne")?.trim() || "";
    const dateDebut = searchParams.get("date_debut") || "";
    const dateFin = searchParams.get("date_fin") || "";

    // Construire le filtre WHERE
    const baseWhere: Record<string, unknown> = {};
    if (id_campagne) baseWhere.id_campagne = id_campagne;
    if (id_prestataire) baseWhere.id_prestataire = id_prestataire;
    if (statut_paiement !== undefined) baseWhere.statut_paiement = statut_paiement;
    if (statut && statut !== 'all') baseWhere.statut = statut;

    // Filtre sur la date de création du paiement
    if (dateDebut || dateFin) {
      baseWhere.created_at = {
        ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
        ...(dateFin ? { lte: new Date(`${dateFin}T23:59:59.999Z`) } : {}),
      };
    }

    // Construire les critères OR de recherche (texte libre + campagne)
    const orConditions: object[] = [];
    if (search) {
      orConditions.push(
        { affectation: { prestataire: { nom: { contains: search, mode: 'insensitive' as const } } } },
        { affectation: { prestataire: { prenom: { contains: search, mode: 'insensitive' as const } } } },
        { affectation: { prestataire: { contact: { contains: search, mode: 'insensitive' as const } } } },
        { affectation: { campagne: { nom_campagne: { contains: search, mode: 'insensitive' as const } } } },
        { affectation: { campagne: { client: { nom: { contains: search, mode: 'insensitive' as const } } } } },
      );
    }
    if (campagneSearch) {
      orConditions.push(
        { affectation: { campagne: { nom_campagne: { contains: campagneSearch, mode: 'insensitive' as const } } } }
      );
    }

    const where = orConditions.length > 0
      ? { ...baseWhere, OR: orConditions }
      : baseWhere;

    // Compter le total
    const total = await prisma.paiementPrestataire.count({ where });

    // Récupérer les paiements paginés
    const paiements = await prisma.paiementPrestataire.findMany({
      where,
      include: {
        transactions: {
          orderBy: { date_transaction: 'desc' }
        },
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

    // Calculer les totaux agrégés sur TOUS les résultats (sans pagination)
    // Pour totalAPayer : somme de paiement_final
    const aggregatePaiement = await prisma.paiementPrestataire.aggregate({
      where,
      _sum: {
        paiement_final: true,
        sanction_montant: true,
      },
    });

    // Pour totalPaye : somme des transactions liées
    const allPaiementIds = await prisma.paiementPrestataire.findMany({
      where,
      select: { id_paiement: true },
    });
    const ids = allPaiementIds.map(p => p.id_paiement);

    const aggregateTransactions = await prisma.transaction.aggregate({
      where: { id_paiement: { in: ids } },
      _sum: { montant: true },
    });

    const totalAPayer = aggregatePaiement._sum.paiement_final ?? 0;
    const totalPaye = aggregateTransactions._sum.montant ?? 0;
    const totalReste = Math.max(0, totalAPayer - totalPaye);

    return NextResponse.json({
      paiements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      totaux: {
        totalAPayer,
        totalPaye,
        totalReste,
        count: total,
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
    const paiement_final = Math.max(0, paiement_base - sanction_montant);
    const hasFullPayment = !!date_paiement;

    // 5. Créer le paiement
    const paiement = await prisma.paiementPrestataire.create({
      data: {
        id_campagne,
        id_prestataire,
        paiement_base,
        paiement_final,
        sanction_montant,
        statut_paiement: hasFullPayment, // Deprecated compatibility
        statut: hasFullPayment ? "PAYE" : "EN_ATTENTE", // New status
        date_paiement: date_paiement || null,
        transactions: hasFullPayment ? {
          create: {
            montant: paiement_final,
            date_transaction: new Date(date_paiement!),
            moyen_paiement: 'AUTRE',
            reference: 'Initial Payment',
            created_by: 'SYSTEM'
          }
        } : undefined
      },
      include: {
        transactions: true,
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
