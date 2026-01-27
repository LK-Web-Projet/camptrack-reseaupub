/**
 * API Endpoint: Marquer une Notification comme Lue
 * PUT /api/notifications/[id]/read
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notificationService';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        // Vérifier l'authentification
        const token = request.cookies.get('accessToken')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const decoded = verifyAccessToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json(
                { error: 'Token invalide' },
                { status: 401 }
            );
        }

        const notificationId = params.id;

        // Marquer comme lue
        await notificationService.markAsRead(notificationId);

        return NextResponse.json({
            success: true,
            message: 'Notification marquée comme lue'
        });

    } catch (error) {
        console.error('❌ Erreur lors du marquage de la notification:', error);
        return NextResponse.json(
            {
                error: 'Erreur serveur',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
