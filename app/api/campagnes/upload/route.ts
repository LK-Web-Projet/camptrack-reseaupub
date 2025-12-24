import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

/**
 * POST /api/campagnes/upload
 * Upload d'images pour les photos officielles de campagne (panneaux installés)
 * Distinct de /api/materiels-cases/upload qui est pour les vérifications matérielles
 */
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

        // Validation de la taille (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new AppError("L'image ne doit pas dépasser 5MB", 400);
        }

        // Création du buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Définition du chemin de sauvegarde
        // Dossier séparé pour les photos de campagne
        const uploadDir = path.join(process.cwd(), "public", "uploads", "campagnes");

        // S'assurer que le dossier existe
        await mkdir(uploadDir, { recursive: true });

        // Générer un nom de fichier unique
        const extension = path.extname(file.name) || ".jpg";
        const filename = `${uuidv4()}${extension}`;
        const filepath = path.join(uploadDir, filename);

        // Écriture du fichier
        await writeFile(filepath, buffer);

        // Retourner l'URL relative
        const fileUrl = `/uploads/campagnes/${filename}`;

        return NextResponse.json({
            message: "Photo de campagne uploadée avec succès",
            url: fileUrl
        }, { status: 201 });

    } catch (error) {
        return handleApiError(error);
    }
}
