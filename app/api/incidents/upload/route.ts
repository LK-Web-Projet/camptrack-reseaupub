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
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ message: "Le fichier doit être une image" }, { status: 400 });
        }

        // Création du buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Définition du chemin de sauvegarde
        const uploadDir = path.join(process.cwd(), "public", "uploads", "incidents");

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
        const relativeUrl = `/uploads/incidents/${filename}`;
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

