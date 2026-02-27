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
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ message: "Le fichier doit être une image" }, { status: 400 });
        }

        // Générer un nom de fichier unique
        const extension = path.extname(file.name) || ".jpg";
        const filename = `incidents/${uuidv4()}${extension}`;

        // Upload vers Vercel Blob
        const blob = await put(filename, file, {
            access: "public",
        });

        return NextResponse.json({
            message: "Image uploadée avec succès",
            url: blob.url
        }, { status: 201 });

    } catch (error) {
        console.error("Upload error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue lors de l'upload.";
        return NextResponse.json({ message: "Erreur lors de l'upload du fichier.", error: message }, { status: 500 });
    }
}
