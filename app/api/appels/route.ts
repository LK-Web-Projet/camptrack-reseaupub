import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appelCreateSchema, validateData } from '@/lib/validation/schemas';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { handleApiError } from '@/lib/utils/errorHandler';

// GET /api/appels — Liste tous les appels (filtrable par prestataireId)
export async function GET(req: Request) {
    try {
        const authResult = await requireAuth(req);
        if (!authResult.ok) {
            return authResult.response;
        }

        const { searchParams } = new URL(req.url);
        const prestataireId = searchParams.get('prestataireId');

        const appels = await prisma.appel.findMany({
            where: prestataireId ? { id_prestataire: prestataireId } : {},
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
            orderBy: {
                date_appel: 'desc',
            },
        });

        return NextResponse.json(appels, { status: 200 });
    } catch (error) {
        console.error('Error fetching appels:', error);
        return handleApiError(error);
    }
}

// POST /api/appels — Créer un nouvel appel
export async function POST(req: Request) {
    try {
        const authResult = await requireAuth(req);
        if (!authResult.ok) {
            return authResult.response;
        }

        const body = await req.json();
        const validation = validateData(appelCreateSchema, body);

        if (!validation.success) {
            return NextResponse.json({ message: validation.error }, { status: 400 });
        }

        const { id_prestataire, date_appel, direction, motif, duree_minutes, commentaire } =
            validation.data as {
                id_prestataire: string;
                date_appel: string;
                direction: 'ENTRANT' | 'SORTANT';
                motif: string;
                duree_minutes?: number | null;
                commentaire?: string | null;
            };

        // Vérifier que le prestataire existe
        const prestataire = await prisma.prestataire.findUnique({
            where: { id_prestataire },
        });
        if (!prestataire) {
            return NextResponse.json({ message: 'Prestataire introuvable' }, { status: 404 });
        }

        const newAppel = await prisma.appel.create({
            data: {
                id_prestataire,
                date_appel: new Date(date_appel),
                direction,
                motif,
                duree_minutes: duree_minutes ?? null,
                commentaire: commentaire ?? null,
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

        return NextResponse.json(newAppel, { status: 201 });
    } catch (error) {
        console.error('Error creating appel:', error);
        return handleApiError(error);
    }
}
