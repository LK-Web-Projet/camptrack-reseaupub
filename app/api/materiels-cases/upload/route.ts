import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { requireAuth } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

export async function POST(request: NextRequest) {
    try {
        const authCheck = await requireAuth(request);
        if (!authCheck.ok) return authCheck.response;

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            throw new AppError("Aucun fichier n'a été fourni", 400);
        }

        // Validation du type MIME
        if (!file.type.startsWith("image/")) {
            throw new AppError("Le fichier doit être une image", 400);
        }

        // Générer un nom de fichier unique
        const extension = path.extname(file.name) || ".jpg";
        const filename = `materiels-cases/${uuidv4()}${extension}`;

        // Upload vers Vercel Blob
        const blob = await put(filename, file, {
            access: "public",
        });

        return NextResponse.json({
            message: "Image uploadée avec succès",
            url: blob.url
        }, { status: 201 });

    } catch (error) {
        return handleApiError(error);
    }
}
