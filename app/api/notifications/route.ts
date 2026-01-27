/**
 * API Endpoint: Liste des Notifications
 * GET /api/notifications
 * Récupère les notifications de l'utilisateur connecté
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notificationService';
import { verifyAccessToken } from '@/lib/auth/jwt';

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

        const decoded = verifyAccessToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json(
                { error: 'Token invalide' },
                { status: 401 }
            );
        }

        const userId = decoded.userId;

        // Récupérer les paramètres de requête
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        // Récupérer les notifications
        const notifications = await notificationService.getUserNotifications(userId, {
            unreadOnly,
            limit,
            offset
        });

        // Compter le total de notifications non lues
        const unreadCount = await notificationService.getUnreadCount(userId);

        return NextResponse.json({
            notifications,
            total: notifications.length,
            unread_count: unreadCount,
            has_more: notifications.length === limit
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des notifications:', error);
        return NextResponse.json(
            {
                error: 'Erreur serveur',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
