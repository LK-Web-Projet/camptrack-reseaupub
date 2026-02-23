import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { appelUpdateSchema, validateData } from '@/lib/validation/schemas';
import { handleApiError, AppError } from '@/lib/utils/errorHandler';

// GET /api/appels/[id] — Récupérer un appel par son ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.ok) {
            return authResult.response;
        }

        const { id } = await params;

        const appel = await prisma.appel.findUnique({
            where: { id_appel: id },
            include: {
                prestataire: {
                    select: {
                        id_prestataire: true,
                        nom: true,
                        prenom: true,
                        contact: true,
                    },
                },
            },
        });

        if (!appel) {
            throw new AppError('Appel introuvable', 404);
        }

        return NextResponse.json(appel);
    } catch (error) {
        return handleApiError(error);
    }
}

// PATCH /api/appels/[id] — Mettre à jour un appel
export async function PATCH(
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

        const validation = validateData(appelUpdateSchema, body);
        if (!validation.success) {
            return NextResponse.json({ message: validation.error }, { status: 400 });
        }

        const existingAppel = await prisma.appel.findUnique({
            where: { id_appel: id },
        });

        if (!existingAppel) {
            throw new AppError('Appel introuvable', 404);
        }

        const data = validation.data as {
            id_prestataire?: string;
            date_appel?: string;
            direction?: 'ENTRANT' | 'SORTANT';
            motif?: string;
            duree_minutes?: number | null;
            commentaire?: string | null;
        };

        const updatedAppel = await prisma.appel.update({
            where: { id_appel: id },
            data: {
                ...(data.id_prestataire && { id_prestataire: data.id_prestataire }),
                ...(data.date_appel && { date_appel: new Date(data.date_appel) }),
                ...(data.direction && { direction: data.direction }),
                ...(data.motif && { motif: data.motif }),
                ...(data.duree_minutes !== undefined && { duree_minutes: data.duree_minutes }),
                ...(data.commentaire !== undefined && { commentaire: data.commentaire }),
            },
            include: {
                prestataire: {
                    select: {
                        id_prestataire: true,
                        nom: true,
                        prenom: true,
                    },
                },
            },
        });

        return NextResponse.json(updatedAppel);
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/appels/[id] — Supprimer un appel
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

        const existingAppel = await prisma.appel.findUnique({
            where: { id_appel: id },
        });

        if (!existingAppel) {
            throw new AppError('Appel introuvable', 404);
        }

        await prisma.appel.delete({
            where: { id_appel: id },
        });

        return NextResponse.json({ message: 'Appel supprimé avec succès' });
    } catch (error) {
        return handleApiError(error);
    }
}
