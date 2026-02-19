
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware/authMiddleware";
import { typeIncidentCreateSchema, validateData } from "@/lib/validation/schemas";

// PUT /api/types-incidents/[id] - Modifier un type d'incident
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.ok) {
            return authResult.response;
        }

        const { id } = await params;
        const body = await request.json();

        const validation = validateData(typeIncidentCreateSchema, body);
        if (!validation.success) {
            return NextResponse.json({ message: validation.error }, { status: 400 });
        }

        const existingType = await prisma.typeIncident.findUnique({
            where: { id_type_incident: id },
        });

        if (!existingType) {
            return NextResponse.json({ message: "Type d'incident non trouvé" }, { status: 404 });
        }

        const updatedType = await prisma.typeIncident.update({
            where: { id_type_incident: id },
            data: {
                nom: validation.data.nom,
                description: validation.data.description,
            },
        });

        return NextResponse.json(updatedType);
    } catch (error) {
        console.error("Error updating incident type:", error);
        return NextResponse.json({ message: "Erreur lors de la mise à jour du type d'incident" }, { status: 500 });
    }
}

// DELETE /api/types-incidents/[id] - Supprimer un type d'incident
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.ok) {
            return authResult.response;
        }

        const { id } = await params;

        const existingType = await prisma.typeIncident.findUnique({
            where: { id_type_incident: id },
        });

        if (!existingType) {
            return NextResponse.json({ message: "Type d'incident non trouvé" }, { status: 404 });
        }

        // Vérifier si le type est utilisé par des incidents
        const usageCount = await prisma.incident.count({
            where: { id_type_incident: id },
        });

        if (usageCount > 0) {
            return NextResponse.json(
                { message: "Impossible de supprimer ce type car il est utilisé par des incidents existants" },
                { status: 400 }
            );
        }

        await prisma.typeIncident.delete({
            where: { id_type_incident: id },
        });

        return NextResponse.json({ message: "Type d'incident supprimé avec succès" });
    } catch (error) {
        console.error("Error deleting incident type:", error);
        return NextResponse.json({ message: "Erreur lors de la suppression du type d'incident" }, { status: 500 });
    }
}
