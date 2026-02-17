import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import {
    transactionCreateSchema,
    validateData,
    type TransactionCreate,
} from "@/lib/validation/paiementSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// POST /api/paiements/[id]/transactions - Ajouter une transaction
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        const { id } = await params;
        const body = await request.json();

        // Valider les données
        const validation = validateData(transactionCreateSchema, body);
        if (!validation.success) {
            throw new AppError(validation.error, 400);
        }

        const { montant, moyen_paiement, reference, note } = validation.data as TransactionCreate;

        // 1. Récupérer le paiement
        const paiement = await prisma.paiementPrestataire.findUnique({
            where: { id_paiement: id },
            include: {
                transactions: true,
            },
        });

        if (!paiement) {
            throw new AppError("Paiement non trouvé", 404);
        }

        // 2. Créer la transaction
        const transaction = await prisma.transaction.create({
            data: {
                id_paiement: id,
                montant,
                moyen_paiement,
                reference,
                note,
                created_by: authCheck.user?.id_user,
            },
        });

        // 3. Calculer le nouveau statut
        const totalTransactions = paiement.transactions.reduce(
            (acc, t) => acc + t.montant,
            0
        ) + montant;

        let statut: "EN_ATTENTE" | "PARTIEL" | "PAYE" = "EN_ATTENTE";
        if (totalTransactions >= paiement.paiement_final) {
            statut = "PAYE";
        } else if (totalTransactions > 0) {
            statut = "PARTIEL";
        }

        // 4. Mettre à jour le paiement
        const updatedPaiement = await prisma.paiementPrestataire.update({
            where: { id_paiement: id },
            data: {
                statut,
                statut_paiement: statut === "PAYE", // Backward compatibility
                // On pourrait aussi mettre à jour date_paiement si c'est le premier paiement ?
                // date_paiement: statut === "PAYE" ? new Date() : paiement.date_paiement
            },
            include: {
                transactions: {
                    orderBy: { created_at: "desc" },
                },
            },
        });

        return NextResponse.json(
            {
                message: "Transaction ajoutée avec succès",
                paiement: updatedPaiement,
                transaction,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
