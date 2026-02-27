import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";
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

        // Définir le sous-dossier selon le type
        const isImage = file.type.startsWith("image/");
        const subDir = isImage ? "photos" : "files";

        // Générer un nom de fichier unique
        const extension = path.extname(file.name) || ".jpg";
        const filename = `prestataires/${subDir}/${uuidv4()}${extension}`;

        // Upload vers Vercel Blob
        const blob = await put(filename, file, {
            access: "public",
        });

        return NextResponse.json({
            message: "Fichier uploadé avec succès",
            url: blob.url
        }, { status: 201 });

    } catch (error) {
        console.error("Upload error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue lors de l'upload.";
        return NextResponse.json({ message: "Erreur lors de l'upload du fichier.", error: message }, { status: 500 });
    }
}
