import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/utils/errorHandler";
import { Campagne } from "@prisma/client";

/**
 * Paramètres pour le renouvellement d'une campagne
 */
export interface RenewCampaignParams {
    id_campagne: string;
    date_debut: Date;
    date_fin: Date;
    prestataire_ids?: string[]; // Optionnel : si non fourni, tous les prestataires sont reconduits
}

/**
 * Résultat du renouvellement
 */
export interface RenewCampaignResult {
    nouvelle_campagne: Campagne;
    nb_prestataires_affectes: number;
    prestataires_non_disponibles: Array<{
        id: string;
        nom: string;
        raison: string;
    }>;
}

/**
 * Renouvelle une campagne terminée en créant une nouvelle campagne liée
 * avec les mêmes paramètres et en reconduisant les prestataires.
 * 
 * Suit le même processus que la création initiale :
 * 1. Créer la campagne
 * 2. Affecter les prestataires (avec vérifications)
 * 3. Les paiements seront générés plus tard via le processus normal
 */
export async function renewCampaign(
    params: RenewCampaignParams
): Promise<RenewCampaignResult> {
    const { id_campagne, date_debut, date_fin, prestataire_ids } = params;

    // 1. VALIDATION DE LA CAMPAGNE ORIGINALE
    const campagneOriginale = await prisma.campagne.findUnique({
        where: { id_campagne },
        include: {
            affectations: {
                select: {
                    id_prestataire: true,
                    status: true,
                    date_fin: true,
                    prestataire: {
                        include: {
                            service: true
                        }
                    }
                }
            },
            client: true,
            lieu: true,
            service: true
        }
    });

    if (!campagneOriginale) {
        throw new AppError("Campagne non trouvée", 404);
    }

    if (campagneOriginale.status !== "TERMINEE") {
        throw new AppError("Seules les campagnes terminées peuvent être renouvelées", 400);
    }

    // 2. DÉTERMINER LES PRESTATAIRES ÈLIGIBLES
    // On récupère TOUS les prestataires qui ont participé à la campagne, quel que soit leur statut final
    // (car la campagne est terminée, donc ils sont techniquement tous "finis")
    let prestatairesToRenew = campagneOriginale.affectations.map(a => a.prestataire);

    // Filtrer selon la sélection du frontend
    if (prestataire_ids && prestataire_ids.length > 0) {
        prestatairesToRenew = prestatairesToRenew.filter(p =>
            prestataire_ids.includes(p.id_prestataire)
        );
    }

    if (prestatairesToRenew.length === 0) {
        throw new AppError("Aucun prestataire sélectionné pour le renouvellement", 400);
    }

    // 3. VÉRIFICATIONS PAR PRESTATAIRE
    const prestataireValides: string[] = [];
    const prestataireInvalides: Array<{ id: string; nom: string; raison: string }> = [];

    for (const p of prestatairesToRenew) {
        // Vérification 1 : Service compatible
        if (p.id_service !== campagneOriginale.id_service) {
            prestataireInvalides.push({
                id: p.id_prestataire,
                nom: `${p.nom} ${p.prenom}`,
                raison: "Service incompatible"
            });
            continue;
        }

        // Vérification 2 : Pas d'affectation active ailleurs
        // NOTE IMPORTANTE : On ne vérifie PAS `!p.disponible` ici.
        // Pourquoi ? Parce que si la campagne précédente s'est terminée automatiquement, 
        // le flag `disponible` peut être resté à `false` par erreur ou design.
        // On vérifie donc la VRAIE disponibilité : est-ce qu'ils sont sur une AUTRE campagne active ?
        const affectationActive = await prisma.prestataireCampagne.findFirst({
            where: {
                id_prestataire: p.id_prestataire,
                id_campagne: { not: id_campagne }, // Pas la campagne qu'on renouvelle (elle est finie)
                date_fin: null,
                campagne: {
                    status: { notIn: ["TERMINEE", "ANNULEE"] }
                }
            },
            include: { campagne: true }
        });

        if (affectationActive) {
            prestataireInvalides.push({
                id: p.id_prestataire,
                nom: `${p.nom} ${p.prenom}`,
                raison: `Déjà en mission active (${affectationActive.campagne.nom_campagne})`
            });
            continue;
        }

        // Si tout est bon, on l'ajoute
        prestataireValides.push(p.id_prestataire);
    }

    // 4. TRANSACTION : CRÉATION CAMPAGNE + AFFECTATIONS
    const result = await prisma.$transaction(async (tx) => {
        // 4.1 Créer la nouvelle campagne
        const nouvelleCampagne = await tx.campagne.create({
            data: {
                id_client: campagneOriginale.id_client,
                id_lieu: campagneOriginale.id_lieu,
                id_service: campagneOriginale.id_service,
                id_gestionnaire: campagneOriginale.id_gestionnaire,
                id_superviseur: campagneOriginale.id_superviseur,
                nom_campagne: `${campagneOriginale.nom_campagne} (Renouvellement)`,
                description: campagneOriginale.description,
                objectif: campagneOriginale.objectif,
                quantite_service: campagneOriginale.quantite_service,
                nbr_prestataire: prestataireValides.length, // Ajusté au nombre réel
                type_campagne: campagneOriginale.type_campagne,
                date_debut: new Date(date_debut),
                date_fin: new Date(date_fin),
                id_campagne_parent: id_campagne // LIEN AVEC LA CAMPAGNE PARENT
            }
        });

        // 4.2 Calculer la durée de la nouvelle campagne
        const dureeCampagne = nouvelleCampagne.date_fin.getTime() - nouvelleCampagne.date_debut.getTime();
        const now = new Date();
        const dateFinPrestataire = new Date(now.getTime() + dureeCampagne);

        // 4.3 Créer les affectations
        if (prestataireValides.length > 0) {
            await tx.prestataireCampagne.createMany({
                data: prestataireValides.map(pid => ({
                    id_campagne: nouvelleCampagne.id_campagne,
                    id_prestataire: pid,
                    status: "ACTIF",
                    date_fin: dateFinPrestataire
                }))
            });

            // 4.4 Marquer les prestataires comme non disponibles
            await tx.prestataire.updateMany({
                where: { id_prestataire: { in: prestataireValides } },
                data: { disponible: false }
            });
        }

        return { nouvelleCampagne, nb_affectes: prestataireValides.length };
    });

    return {
        nouvelle_campagne: result.nouvelleCampagne,
        nb_prestataires_affectes: result.nb_affectes,
        prestataires_non_disponibles: prestataireInvalides
    };
}
