/**
 * API Endpoint: Supprimer une Notification
 * DELETE /api/notifications/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notificationService';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Vérifier l'authentification
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
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
