import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/middleware/authMiddleware";

export async function POST(request: NextRequest) {
    try {
        const authCheck = await requireAuth(request);
        if (!authCheck.ok) return authCheck.response;

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ message: "Aucun fichier n'a été fourni" }, { status: 400 });
        }

        // Validation du type MIME
        const allowedTypes = [
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // .xlsx
        ];

        if (!allowedTypes.includes(file.type) && !file.type.startsWith("image/")) {
            return NextResponse.json({
                message: "Type de fichier non supporté. Sont acceptés : Images, PDF, Word, Excel"
            }, { status: 400 });
        }

        // Création du buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Définition du chemin de sauvegarde
        const isImage = file.type.startsWith("image/");
        const subDir = isImage ? "photos" : "files";
        const uploadDir = path.join(process.cwd(), "public", "uploads", "prestataires", subDir);

        // S'assurer que le dossier existe
        await mkdir(uploadDir, { recursive: true });

        // Générer un nom de fichier unique
        const extension = path.extname(file.name) || ".jpg";
        const filename = `${uuidv4()}${extension}`;
        const filepath = path.join(uploadDir, filename);

        // Écriture du fichier
        await writeFile(filepath, buffer);

        // Construire l'URL absolue
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${request.headers.get('host')}`;
        // Note: Using a consistent URL structure
        const relativeUrl = `/uploads/prestataires/${subDir}/${filename}`;
        const absoluteUrl = new URL(relativeUrl, baseUrl).toString();

        return NextResponse.json({
            message: "Image uploadée avec succès",
            url: absoluteUrl
        }, { status: 201 });

    } catch (error) {
        console.error("Upload error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue lors de l'upload.";
        return NextResponse.json({ message: "Erreur lors de l'upload du fichier.", error: message }, { status: 500 });
    }
}
