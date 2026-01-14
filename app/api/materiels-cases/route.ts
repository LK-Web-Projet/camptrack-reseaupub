import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import {
  materielsCaseCreateSchema,
  materielsCaseQuerySchema,
  validateData,
  type MaterielsCase,
  type MaterielsQueryParams
} from "@/lib/validation/materielsCaseSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/materiels-cases - Lister tous les états de matériel
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    // Récupérer et valider les query params
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      id_campagne: searchParams.get('id_campagne') || undefined,
      id_prestataire: searchParams.get('id_prestataire') || undefined,
      etat: searchParams.get('etat') || undefined,
      penalite_appliquer: searchParams.get('penalite_appliquer') || undefined
    };

    // Supprimer les clés avec des valeurs nulles (paramètres non fournis)
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === null) {
        delete queryParams[key];
      }
    });

    const validation = validateData(materielsCaseQuerySchema, queryParams);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { page, limit, id_campagne, id_prestataire, etat, penalite_appliquer } = validation.data as MaterielsQueryParams;
    const skip = (page - 1) * limit;

    // Construire le filtre WHERE
    const where: Record<string, unknown> = {};

    if (id_campagne) where.id_campagne = id_campagne;
    if (id_prestataire) where.id_prestataire = id_prestataire;
    if (etat) where.etat = etat;
    if (penalite_appliquer !== undefined) {
      where.penalite_appliquer = penalite_appliquer;
    }

    // Compter le total
    const total = await prisma.materielsCase.count({ where });

    // Récupérer les enregistrements avec les relations
    const materiels_cases = await prisma.materielsCase.findMany({
      where,
      include: {
        campagne: {
          select: {
            id_campagne: true,
            nom_campagne: true,
            date_debut: true,
            date_fin: true,
            status: true,
            client: {
              select: {
                id_client: true,
                nom: true,
                type_client: true
              }
            }
          }
        },
        prestataire: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true,
            contact: true,
            type_panneau: true,
            plaque: true,
            marque: true,
            modele: true
          }
        }
      },
      orderBy: { date_creation: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json({
      materiels_cases,
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

// POST /api/materiels-cases - Créer un nouvel état de matériel
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();

    // Valider les données d'entrée
    const validation = validateData(materielsCaseCreateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const {
      id_campagne,
      id_prestataire,
      nom_materiel,
      etat,
      description,
      photo_url,
      preuve_media
    } = validation.data as MaterielsCase;

    // Vérifier que la campagne existe si fournie
    if (id_campagne) {
      const campagne = await prisma.campagne.findUnique({
        where: { id_campagne },
        include: {
          client: {
            select: {
              type_client: true
            }
          }
        }
      });
      if (!campagne) {
        throw new AppError("Campagne non trouvée", 404);
      }
    }

    // Vérifier que le prestataire existe si fourni
    if (id_prestataire) {
      const prestataire = await prisma.prestataire.findUnique({
        where: { id_prestataire }
      });
      if (!prestataire) {
        throw new AppError("Prestataire non trouvé", 404);
      }
    }

    // Vérifier si ce matériel a déjà été vérifié pour cette campagne et ce prestataire
    if (id_campagne && id_prestataire) {
      const existingCase = await prisma.materielsCase.findFirst({
        where: {
          id_campagne,
          id_prestataire,
          nom_materiel
        }
      });

      if (existingCase) {
        throw new AppError("Ce matériel a déjà été vérifié pour cette campagne et ce prestataire", 409);
      }
    }

    // ========================================================================
    // CALCUL AUTOMATIQUE DE LA PÉNALITÉ
    // ========================================================================
    // Si l'état est MAUVAIS, appliquer automatiquement une pénalité
    // Le montant dépend du type de client (EXTERNE: 2000 FCFA, INTERNE: 1000 FCFA)
    // Pour BON ou MOYEN, aucune pénalité n'est appliquée
    // ========================================================================
    let penaliteCalculee = 0;
    let penaliteAppliquer = false;

    if (etat === 'MAUVAIS' && id_campagne) {
      const campagne = await prisma.campagne.findUnique({
        where: { id_campagne },
        include: {
          client: {
            select: {
              type_client: true
            }
          }
        }
      });

      if (campagne && campagne.client) {
        // Définir la pénalité selon le type de client
        penaliteCalculee = campagne.client.type_client === 'EXTERNE' ? 2000 : 1000;
        penaliteAppliquer = true; // Appliquer automatiquement pour état MAUVAIS
      }
    }

    // Créer l'enregistrement
    const materiels_case = await prisma.materielsCase.create({
      data: {
        id_campagne: id_campagne || null,
        id_prestataire: id_prestataire || null,
        nom_materiel,
        etat,
        description,
        montant_penalite: penaliteCalculee,
        penalite_appliquer: penaliteAppliquer,
        photo_url: photo_url || null,
        preuve_media: preuve_media || null
      },
      include: {
        campagne: {
          select: {
            id_campagne: true,
            nom_campagne: true,
          }
        },
        prestataire: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true,
            contact: true
          }
        }
      }
    });

    // ========================================================================
    // GESTION AUTOMATIQUE DU PAIEMENT
    // ========================================================================
    // Le paiement est créé automatiquement lors de l'enregistrement du matériel casé,
    // peu importe l'état (BON, MOYEN, MAUVAIS).
    // Les pénalités sont calculées uniquement pour l'état MAUVAIS avec penalite_appliquer = true.
    // ========================================================================
    if (id_campagne && id_prestataire) {
      try {
        // 1. Vérifier que l'affectation existe
        const affectation = await prisma.prestataireCampagne.findUnique({
          where: {
            id_campagne_id_prestataire: {
              id_campagne,
              id_prestataire
            }
          }
        });

        if (!affectation) {
          // Si pas d'affectation, on log mais on ne bloque pas (très improbable ici)
          console.warn(`Affectation non trouvée pour paiement: cmp=${id_campagne}, prest=${id_prestataire}`);
        } else {
          // 2. Récupérer le type de client pour déterminer le paiement de base
          const campagne = await prisma.campagne.findUnique({
            where: { id_campagne },
            select: { client: { select: { type_client: true } } }
          });

          const typeClient = campagne?.client?.type_client ?? 'EXTERNE';
          const paiementBase = typeClient === 'EXTERNE' ? 5000 : 3000;

          // 3. Calculer la somme totale des pénalités appliquées
          const penalitesAgg = await prisma.materielsCase.aggregate({
            where: {
              id_campagne: id_campagne,
              id_prestataire: id_prestataire,
              etat: 'MAUVAIS',
              penalite_appliquer: true
            },
            _sum: { montant_penalite: true }
          });

          const totalPenalites = penalitesAgg._sum.montant_penalite ?? 0;
          const paiementFinal = Math.max(0, paiementBase - totalPenalites);

          // 4. Créer ou mettre à jour le paiement
          const existingPaiement = await prisma.paiementPrestataire.findUnique({
            where: {
              id_campagne_id_prestataire: {
                id_campagne,
                id_prestataire
              }
            }
          });

          if (existingPaiement) {
            // Mettre à jour le paiement existant
            await prisma.paiementPrestataire.update({
              where: {
                id_paiement: existingPaiement.id_paiement
              },
              data: {
                sanction_montant: totalPenalites,
                paiement_final: paiementFinal
              }
            });
          } else {
            // Créer un nouveau paiement
            await prisma.paiementPrestataire.create({
              data: {
                id_campagne,
                id_prestataire,
                paiement_base: paiementBase,
                paiement_final: paiementFinal,
                sanction_montant: totalPenalites,
                statut_paiement: false
              }
            });
          }
        }
      } catch (err) {
        // Log l'erreur mais ne pas empêcher la réponse de succès pour la création du matériel
         
        console.error('Erreur lors de la gestion du paiement après création MaterielsCase:', err);
      }
    }

    return NextResponse.json({
      message: "État de matériel enregistré avec succès",
      materiels_case
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}