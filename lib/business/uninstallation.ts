import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/utils/errorHandler";

/**
 * Confirme la désinstallation des panneaux pour un prestataire sur une campagne.
 * - Vérifie que la campagne est terminée ou passée.
 * - Met à jour la date de désinstallation.
 * - Crée un paiement de 2000 FCFA pour le déplacement (SAUF si mode = REASSIGNATION).
 */
export async function confirmUninstallation(
  id_campagne: string,
  id_prestataire: string,
  mode: "STANDARD" | "REASSIGNATION" = "STANDARD"
) {
  // 1. Récupérer les infos de la campagne et de l'affectation
  const affectation = await prisma.prestataireCampagne.findUnique({
    where: {
      id_campagne_id_prestataire: {
        id_campagne,
        id_prestataire
      }
    },
    include: {
      campagne: true
    }
  });

  if (!affectation) {
    throw new AppError("Affectation non trouvée", 404);
  }

  // 2. Vérifier si la campagne est prête pour désinstallation
  const now = new Date();
  // On peut forcer la fin si c'est une réassignation manuelle, ou garder la contrainte
  // Ici on garde la contrainte que la campagne doit être terminée ou passée
  const isFinished = affectation.campagne.status === "TERMINEE" || new Date(affectation.campagne.date_fin) < now;

  // Optionnel : permettre la désinstallation anticipée si c'est une réassignation ?
  // Pour l'instant on garde la sécurité
  if (!isFinished && mode === "STANDARD") {
    // On pourrait être plus souple pour la réassignation, mais le cahier des charges ne le précise pas.
    // On laisse la vérification pour le moment.
    throw new AppError("La campagne n'est pas encore terminée", 400);
  }

  if (affectation.date_desinstallation) {
    throw new AppError("Désinstallation déjà confirmée pour ce prestataire", 400);
  }

  // 3. Transaction : Update date + Création paiement (Conditionnel)
  const result = await prisma.$transaction(async (tx) => {
    // 3.1 Update date désinstallation
    const updatedAffectation = await tx.prestataireCampagne.update({
      where: {
        id_campagne_id_prestataire: {
          id_campagne,
          id_prestataire
        }
      },
      data: {
        date_desinstallation: now,
        status: "TERMINE" // On marque explicitement comme terminé
      }
    });

    let paiement = null;

    // 3.2 Création paiement forfaitaire de 2000 FCFA UNIQUEMENT SI STANDARD
    if (mode === "STANDARD") {
      paiement = await tx.paiementPrestataire.create({
        data: {
          id_campagne,
          id_prestataire,
          type: "DESINSTALLATION",
          paiement_base: 2000,
          paiement_final: 2000,
          statut_paiement: false,
          sanction_montant: 0
        }
      });
    }

    return { updatedAffectation, paiement };
  });

  return result;
}

/**
 * Récupère les campagnes terminées nécessitant une désinstallation.
 */
/**
 * Récupère les campagnes terminées nécessitant une désinstallation.
 */
export async function getCampaignsForUninstallation() {
  const now = new Date();
  console.log("Recherche campagnes terminées avant:", now.toISOString());

  // On cherche les campagnes terminées ou dont la date de fin est passée
  // Et qui ont des prestataires sans date_desinstallation
  const campagnes = await prisma.campagne.findMany({
    where: {
      OR: [
        { status: "TERMINEE" },
        { date_fin: { lt: now } }
      ],
      // On ne filtre pas strictement ici sur les affectations pour pouvoir débuguer ce qui remonte
      // Mais idéalement on veut celles qui ont au moins une affectation
      affectations: {
        some: {}
      }
    },
    include: {
      client: {
        select: { nom: true, entreprise: true }
      },
      affectations: {
        include: {
          prestataire: true,
          paiements: true // On récupère tous les paiements pour filtrer en JS si besoin
        }
      }
    },
    orderBy: {
      date_fin: 'desc'
    }
  });

  console.log(`${campagnes.length} campagnes trouvées.`);
  return campagnes;
}
