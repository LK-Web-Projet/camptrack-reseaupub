import { NextRequest, NextResponse } from "next/server";
import { confirmUninstallation } from "@/lib/business/uninstallation";
import { AppError } from "@/lib/utils/errorHandler";
import { z } from "zod";

const uninstallationSchema = z.object({
    id_campagne: z.string().min(1, "ID Campagne requis"),
    id_prestataire: z.string().min(1, "ID Prestataire requis"),
    mode: z.enum(["STANDARD", "REASSIGNATION"]).optional().default("STANDARD")
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = uninstallationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { message: "Données invalides", errors: validation.error.errors },
                { status: 400 }
            );
        }

        const { id_campagne, id_prestataire, mode } = validation.data;

        const result = await confirmUninstallation(id_campagne, id_prestataire, mode);

        return NextResponse.json(
            { message: "Désinstallation confirmée et paiement généré", data: result },
            { status: 200 }
        );

    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { message: error.message },
                { status: error.statusCode }
            );
        }
        console.error("Erreur lors de la confirmation de désinstallation:", error);
        return NextResponse.json(
            { message: "Une erreur interne est survenue" },
            { status: 500 }
        );
    }
}
