/**
 * API Endpoint: Supprimer une Notification
 * DELETE /api/notifications/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notificationService';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        // Vérifier l'authentification
        const token = request.cookies.get('accessToken')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }
        const decoded = verifyAccessToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }
        const notificationId = params.id;
        // Supprimer la notification
        await notificationService.deleteNotification(notificationId);
        return NextResponse.json({ success: true, message: 'Notification supprimée' });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression de la notification:', error);
        return NextResponse.json(
            {
                error: 'Erreur serveur',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
