import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

/**
 * GET /api/rapports/campagne/[id]
 * Retourne les données agrégées d'une campagne pour la génération du rapport PDF client.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const { id } = await params;

        // Construire l'URL de base pour les images (react-pdf nécessite des URLs absolues)
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;

        const campagne = await prisma.campagne.findUnique({
            where: { id_campagne: id },
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
                        id_client: true,
                        nom: true,
                        prenom: true,
                        entreprise: true,
                        domaine_entreprise: true,
                        contact: true,
                        mail: true,
                        type_client: true,
                    },
                },
                lieu: { select: { nom: true, ville: true } },
                service: { select: { nom: true, description: true } },
                gestionnaire: { select: { nom: true, prenom: true, email: true } },
                superviseur: { select: { nom: true, prenom: true, email: true } },
                affectations: {
                    select: {
                        date_creation: true,
                        date_fin: true,
                        status: true,
                        image_affiche: true,
                        prestataire: {
                            select: {
                                id_prestataire: true,
                                nom: true,
                                prenom: true,
                                contact: true,
                                id_verification: true,
                                type_panneau: true,
                                plaque: true,
                                couleur: true,
                                marque: true,
                                modele: true,
                                score: true,
                                service: { select: { nom: true } },
                                photos: {
                                    select: { url: true, description: true, created_at: true },
                                    take: 4,
                                    orderBy: { created_at: "desc" },
                                },
                            },
                        },
                        paiement: {
                            select: {
                                id_paiement: true,
                                paiement_base: true,
                                paiement_final: true,
                                sanction_montant: true,
                                statut: true,
                                date_paiement: true,
                                type: true,
                                transactions: {
                                    select: { montant: true, date_transaction: true, moyen_paiement: true },
                                },
                            },
                        },
                    },
                    orderBy: { date_creation: "asc" },
                },
                _count: { select: { affectations: true, fichiers: true, dommages: true } },
            },
        });

        if (!campagne) throw new AppError("Campagne non trouvée", 404);

        const affectations = campagne.affectations ?? [];
        const totalPrestataires = affectations.length;

        const budgetTotal = affectations.reduce((sum, a) => sum + (a.paiement?.[0]?.paiement_final ?? 0), 0);
        const totalPaye = affectations.reduce((sum, a) => {
            const txTotal = a.paiement?.[0]?.transactions?.reduce((s, t) => s + t.montant, 0) ?? 0;
            return sum + txTotal;
        }, 0);
        const totalPenalites = affectations.reduce((sum, a) => sum + (a.paiement?.[0]?.sanction_montant ?? 0), 0);

        const dateDebut = campagne.date_debut ? new Date(campagne.date_debut) : null;
        const dateFin = campagne.date_fin ? new Date(campagne.date_fin) : null;
        const dureejours =
            dateDebut && dateFin
                ? Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24))
                : null;

        // Collecte des preuves visuelles (images d'affiches + photos terrain)
        // Les URLs sont converties en absolues pour react-pdf
        const visualEvidence: Array<{ url: string; caption: string; date: string | null; prestataire: string; plaque: string | null }> = [];
        for (const a of affectations) {
            const nomComplet = `${a.prestataire.prenom || ""} ${a.prestataire.nom || ""}`.trim();
            const numPlaque = a.prestataire.plaque || null;
            if (a.image_affiche) {
                const url = a.image_affiche.startsWith("http")
                    ? a.image_affiche
                    : `${baseUrl}${a.image_affiche.startsWith("/") ? "" : "/"}${a.image_affiche}`;
                visualEvidence.push({
                    url,
                    caption: `Affiche — ${nomComplet}`,
                    date: a.date_creation ? new Date(a.date_creation).toLocaleDateString("fr-FR") : null,
                    prestataire: nomComplet,
                    plaque: numPlaque,
                });
            }
            for (const photo of a.prestataire.photos ?? []) {
                const url = photo.url.startsWith("http")
                    ? photo.url
                    : `${baseUrl}${photo.url.startsWith("/") ? "" : "/"}${photo.url}`;
                visualEvidence.push({
                    url,
                    caption: photo.description || `Photo — ${nomComplet}`,
                    date: photo.created_at ? new Date(photo.created_at).toLocaleDateString("fr-FR") : null,
                    prestataire: nomComplet,
                    plaque: numPlaque,
                });
            }
        }

        const reportData = {
            campagne: {
                id: campagne.id_campagne,
                nom: campagne.nom_campagne,
                description: campagne.description,
                objectif: campagne.objectif,
                type: campagne.type_campagne,
                status: campagne.status,
                dateDebut: campagne.date_debut,
                dateFin: campagne.date_fin,
                dateGeneration: new Date().toISOString(),
            },
            client: campagne.client,
            lieu: campagne.lieu,
            service: campagne.service,
            gestionnaire: campagne.gestionnaire,
            superviseur: campagne.superviseur,
            kpis: {
                totalPrestataires,
                nbPrestatairesCible: campagne.nbr_prestataire,
                tauxCouverture:
                    campagne.nbr_prestataire && campagne.nbr_prestataire > 0
                        ? Math.round((totalPrestataires / campagne.nbr_prestataire) * 100)
                        : null,
                budgetTotal,
                totalPaye,
                resteAPayer: Math.max(0, budgetTotal - totalPaye),
                totalPenalites,
                dureejours,
                totalDommages: campagne._count.dommages,
                totalFichiers: campagne._count.fichiers,
            },
            prestataires: affectations.map((a) => ({
                nom: a.prestataire.nom,
                prenom: a.prestataire.prenom,
                contact: a.prestataire.contact,
                idVerification: a.prestataire.id_verification,
                typePanneau: a.prestataire.type_panneau,
                plaque: a.prestataire.plaque,
                vehicule: [a.prestataire.couleur, a.prestataire.marque, a.prestataire.modele].filter(Boolean).join(" "),
                score: a.prestataire.score,
                service: a.prestataire.service?.nom,
                dateAssignation: a.date_creation,
                dateFin: a.date_fin,
                statut: a.status,
                paiementBase: a.paiement?.[0]?.paiement_base ?? 0,
                paiementFinal: a.paiement?.[0]?.paiement_final ?? 0,
                sanction: a.paiement?.[0]?.sanction_montant ?? 0,
                statutPaiement: a.paiement?.[0]?.statut ?? null,
            })),
            visualEvidence: visualEvidence.slice(0, 20),
        };

        return NextResponse.json({ reportData });
    } catch (error) {
        return handleApiError(error);
    }
}
