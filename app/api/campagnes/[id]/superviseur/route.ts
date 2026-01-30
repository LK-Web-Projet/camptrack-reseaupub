import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserType } from '@prisma/client';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const id_campagne = id;

        const body = await request.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Verify user exists and is a supervisor
        const user = await prisma.user.findUnique({
            where: { id_user: user_id },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user is a supervisor
        if (user.type_user !== UserType.SUPERVISEUR_CAMPAGNE) {
            return NextResponse.json(
                { error: 'User is not a supervisor (Type required: SUPERVISEUR_CAMPAGNE)' },
                { status: 400 }
            );
        }

        // Update campaign
        const updatedCampagne = await prisma.campagne.update({
            where: { id_campagne },
            data: {
                id_superviseur: user_id,
            },
            include: {
                superviseur: {
                    select: {
                        id_user: true,
                        nom: true,
                        prenom: true,
                        email: true,
                        type_user: true,
                    }
                }
            }
        });

        return NextResponse.json(updatedCampagne);
    } catch (error) {
        console.error('Error updating campaign supervisor:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
