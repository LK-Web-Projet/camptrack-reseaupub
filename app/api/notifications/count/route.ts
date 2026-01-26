/**
 * API Endpoint: Compteur de Notifications Non Lues
 * GET /api/notifications/count
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notificationService';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json(
                { error: 'Token invalide' },
                { status: 401 }
            );
        }

        const userId = decoded.userId;

        // Compter les notifications non lues
        const count = await notificationService.getUnreadCount(userId);

        return NextResponse.json({ count });

    } catch (error) {
        console.error('❌ Erreur lors du comptage des notifications:', error);
        return NextResponse.json(
            {
                error: 'Erreur serveur',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
