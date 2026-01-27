import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { exportDataToBuffer, ExportModel } from "@/lib/export-utils";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

export async function GET(request: NextRequest) {
    try {
        // 1. Auth check
        const authCheck = await requireAdmin(request);
        if (!authCheck.ok) return authCheck.response;

        // 2. Parse query params
        const searchParams = request.nextUrl.searchParams;
        const model = searchParams.get('model') as ExportModel | null;

        if (!model) {
            throw new AppError("Le paramètre 'model' est requis (campagne, prestataire, user, client)", 400);
        }

        const validModels: ExportModel[] = ['campagne', 'prestataire', 'user', 'client'];
        if (!validModels.includes(model)) {
            throw new AppError(`Modèle invalide. Valeurs acceptées: ${validModels.join(', ')}`, 400);
        }

        // 3. Generate export
        const buffer = await exportDataToBuffer(model);

        // 4. Return file
        const filename = `export-${model}-${new Date().toISOString().split('T')[0]}.xlsx`;

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        return handleApiError(error);
    }
}
