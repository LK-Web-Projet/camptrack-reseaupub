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

// POST /api/campagnes/[id]/prestataires - Ajouter un ou plusieurs prestataires à une campagne
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

        // Support single or multiple IDs
        let prestataireIds: string[] = [];
        if (body.id_prestataires && Array.isArray(body.id_prestataires)) {
            prestataireIds = body.id_prestataires;
        } else if (body.id_prestataire) {
            prestataireIds = [body.id_prestataire];
        }

        if (prestataireIds.length === 0) {
            throw new AppError("Aucun prestataire sélectionné", 400);
        }

        // Remove duplicates
        prestataireIds = Array.from(new Set(prestataireIds));

        // 1. Vérifier la campagne
        const campagne = await prisma.campagne.findUnique({
            where: { id_campagne: campagneId },
            select: {
                nbr_prestataire: true,
                id_campagne: true,
                id_service: true,
                nom_campagne: true
            }
        });

        if (!campagne) {
            throw new AppError("Campagne non trouvée", 404);
        }

        // 2. Récupérer tous les prestataires demandés
        const prestataires = await prisma.prestataire.findMany({
            where: {
                id_prestataire: { in: prestataireIds }
            },
            include: {
                service: true
            }
        });

        // Vérifier que tous les IDs existent
        if (prestataires.length !== prestataireIds.length) {
            throw new AppError("Certains prestataires demandés sont introuvables", 404);
        }

        // 3. Validations par prestataire
        const errors: string[] = [];
        const prestatairesToAssign: string[] = [];

        for (const p of prestataires) {
            // Service
            if (p.id_service !== campagne.id_service) {
                errors.push(`Prestataire ${p.nom} ${p.prenom}: Service différent de la campagne`);
                continue;
            }

            // Disponibilité
            if (!p.disponible) {
                errors.push(`Prestataire ${p.nom} ${p.prenom}: Non disponible`);
                continue;
            }

            prestatairesToAssign.push(p.id_prestataire);
        }

        if (errors.length > 0) {
            // Si on veut être strict (tout ou rien), on rejette. 
            // Ici on rejette si UN SEUL est invalide pour garder la cohérence simple.
            throw new AppError(`Validation échouée:\n${errors.join('\n')}`, 400);
        }

        // 4. Vérifier les affectations existantes (déjà dans CETTE campagne)
        const existingInCampaign = await prisma.prestataireCampagne.findMany({
            where: {
                id_campagne: campagneId,
                id_prestataire: { in: prestatairesToAssign }
            }
        });

        if (existingInCampaign.length > 0) {
            throw new AppError("Certains prestataires sont déjà affectés à cette campagne", 409);
        }

        // 5. Vérifier les affectations actives ailleurs (Double check de sécurité, même si disponible=true)
        // Un prestataire disponible=true ne devrait PAS avoir d'affectation active, mais on vérifie.
        const activeAssignments = await prisma.prestataireCampagne.findMany({
            where: {
                id_prestataire: { in: prestatairesToAssign },
                id_campagne: { not: campagneId },
                date_fin: null,
                campagne: {
                    status: { notIn: ['TERMINEE', 'ANNULEE'] }
                }
            },
            include: {
                prestataire: true,
                campagne: true
            }
        });

        if (activeAssignments.length > 0) {
            const details = activeAssignments.map(a => `${a.prestataire.nom} (${a.campagne.nom_campagne})`).join(', ');
            throw new AppError(`Certains prestataires sont déjà en mission active : ${details}`, 409);
        }

        // 6. Vérifier la capacité de la campagne
        if (campagne.nbr_prestataire !== null) {
            const currentCount = await prisma.prestataireCampagne.count({
                where: {
                    id_campagne: campagneId,
                    date_fin: null
                }
            });

            if (currentCount + prestatairesToAssign.length > campagne.nbr_prestataire) {
                throw new AppError(
                    `Capacité insuffisante. Places restantes : ${campagne.nbr_prestataire - currentCount}. Demandées : ${prestatairesToAssign.length}`,
                    400
                );
            }
        }

        // 7. Transaction d'insertion
        const result = await prisma.$transaction(async (tx) => {
            // Créer les affectations
            // createMany n'est pas supporté par SQLite standard facilement avec RETURNING, mais PostgreSQL oui.
            // Prisma createMany retourne le count.
            const created = await tx.prestataireCampagne.createMany({
                data: prestatairesToAssign.map(pid => ({
                    id_campagne: campagneId,
                    id_prestataire: pid,
                    status: "ACTIF"
                }))
            });

            // Mettre à jour les status
            await tx.prestataire.updateMany({
                where: { id_prestataire: { in: prestatairesToAssign } },
                data: { disponible: false }
            });

            return created;
        });

        return NextResponse.json({
            message: `${result.count} prestataire(s) affecté(s) avec succès`,
            count: result.count
        }, { status: 201 });

    } catch (error) {
        return handleApiError(error);
    }
}