import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/campagnes/[id]/prestataires - Lister les prestataires d'une campagne
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const campagneId = id;

    // Vérifier que la campagne existe
    const campagne = await prisma.campagne.findUnique({
      where: { id_campagne: campagneId },
      select: {
        id_campagne: true,
        nom_campagne: true,
        nbr_prestataire: true
      }
    });

    if (!campagne) {
      throw new AppError("Campagne non trouvée", 404);
    }

    const affectations = await prisma.prestataireCampagne.findMany({
      where: { id_campagne: campagneId },
      select: {
        prestataire: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true,
            contact: true,
            disponible: true,
            type_panneau: true,
            marque: true,
            modele: true,
            plaque: true,
            couleur: true,
            id_verification: true,
            service: {
              select: {
                nom: true
              }
            }
          }
        },
        date_creation: true,
        date_fin: true,
        status: true,
        image_affiche: true,
        paiement: {
          select: {
            paiement_base: true,
            paiement_final: true,
            statut_paiement: true
          }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    return NextResponse.json({
      campagne: {
        id_campagne: campagne.id_campagne,
        nom_campagne: campagne.nom_campagne,
        nbr_prestataire: campagne.nbr_prestataire,
        // Ajout du comptage des affectations actives
        affectations_actuelles: affectations.filter(a => a.date_fin === null).length
      },
      affectations
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/campagnes/[id]/prestataires - Ajouter un prestataire à une campagne
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const campagneId = id;

    const body = await request.json();

    if (!body.id_prestataire) {
      throw new AppError("ID prestataire requis", 400);
    }

    const { id_prestataire } = body;

    // Vérifier que la campagne existe AVEC nbr_prestataire et id_service
    const campagne = await prisma.campagne.findUnique({
      where: { id_campagne: campagneId },
      select: {
        nbr_prestataire: true,
        id_campagne: true,
        id_service: true
      }
    });

    if (!campagne) {
      throw new AppError("Campagne non trouvée", 404);
    }

    // Vérifier que le prestataire existe
    const prestataire = await prisma.prestataire.findUnique({
      where: { id_prestataire },
      include: {
        service: true
      }
    });

    if (!prestataire) {
      throw new AppError("Prestataire non trouvé", 404);
    }

    // Vérifier que le prestataire est du même service que la campagne
    if (prestataire.id_service !== campagne.id_service) {
      throw new AppError("Ce prestataire n'appartient pas au même service que la campagne", 400);
    }

    // Vérifier que le prestataire n'est pas déjà affecté (même terminé)
    const existingAffectation = await prisma.prestataireCampagne.findUnique({
      where: {
        id_campagne_id_prestataire: {
          id_campagne: campagneId,
          id_prestataire
        }
      }
    });

    if (existingAffectation) {
      throw new AppError("Ce prestataire est déjà affecté à cette campagne", 409);
    }

    // Vérifier que le prestataire est disponible
    if (!prestataire.disponible) {
      throw new AppError("Ce prestataire n'est pas disponible", 400);
    }

    // ========================================================================
    // VALIDATION MÉTIER : Vérifier les affectations actives
    // ========================================================================
    // Un prestataire ne peut être affecté à une nouvelle campagne que s'il
    // n'est pas déjà affecté à une autre campagne active (non terminée).
    // Les statuts de campagne considérés comme "terminés" : TERMINEE, ANNULEE
    // ========================================================================
    const activeAssignments = await prisma.prestataireCampagne.findMany({
      where: {
        id_prestataire,
        // Exclure l'affectation à la campagne actuelle (si elle existe déjà)
        id_campagne: { not: campagneId },
        // Affectation encore active (pas de date de fin)
        date_fin: null
      },
      include: {
        campagne: {
          select: {
            id_campagne: true,
            nom_campagne: true,
            status: true
          }
        }
      }
    });

    // Filtrer pour ne garder que les campagnes non terminées
    const nonTerminatedAssignments = activeAssignments.filter(
      assignment =>
        assignment.campagne.status !== 'TERMINEE' &&
        assignment.campagne.status !== 'ANNULEE'
    );

    if (nonTerminatedAssignments.length > 0) {
      // Le prestataire a des affectations actives à des campagnes non terminées
      const activeCampaigns = nonTerminatedAssignments
        .map(a => a.campagne.nom_campagne)
        .join(', ');

      // Mettre à jour le statut de disponibilité du prestataire à false
      await prisma.prestataire.update({
        where: { id_prestataire },
        data: { disponible: false }
      });

      throw new AppError(
        `Ce prestataire est déjà affecté à une ou plusieurs campagnes actives (${activeCampaigns}). ` +
        `Il doit d'abord terminer ses affectations en cours avant d'être assigné à une nouvelle campagne. ` +
        `Son statut de disponibilité a été mis à jour.`,
        409
      );
    }

    // Vérifier la contrainte de nbr_prestataire si définie
    if (campagne.nbr_prestataire !== null) {
      const affectationsActives = await prisma.prestataireCampagne.count({
        where: {
          id_campagne: campagneId,
          date_fin: null
        }
      });

      if (affectationsActives >= campagne.nbr_prestataire) {
        throw new AppError(
          `Le nombre maximum de prestataires (${campagne.nbr_prestataire}) pour cette campagne est déjà atteint. Impossible d'ajouter un nouveau prestataire.`,
          400
        );
      }
    }

    // Créer l'affectation
    // Utiliser une transaction pour assurer la cohérence des données
    const affectation = await prisma.$transaction(async (tx) => {
      // 1. Créer l'affectation
      const createdAffectation = await tx.prestataireCampagne.create({
        data: {
          id_campagne: campagneId,
          id_prestataire,
          status: "ACTIF"
        },
        select: {
          prestataire: {
            select: {
              id_prestataire: true,
              nom: true,
              prenom: true,
              contact: true,
              service: {
                select: {
                  nom: true
                }
              },
              type_panneau: true,
              plaque: true,
              marque: true,
              modele: true,
              couleur: true
            }
          },
          date_creation: true,
          status: true
        }
      });

      // 2. Mettre à jour le statut de disponibilité du prestataire à false
      await tx.prestataire.update({
        where: { id_prestataire },
        data: { disponible: false }
      });

      return createdAffectation;
    });

    // NOTE : Le paiement sera créé automatiquement lors de l'enregistrement 
    // du premier matériel casé pour cette affectation (route /api/materiels-cases)

    return NextResponse.json({
      message: "Prestataire affecté à la campagne avec succès",
      affectation
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}