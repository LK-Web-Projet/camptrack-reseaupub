/**
 * API Endpoint: Marquer Toutes les Notifications comme Lues
 * PUT /api/notifications/read-all
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notificationService';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
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

        // Marquer toutes comme lues
        const count = await notificationService.markAllAsRead(userId);

        return NextResponse.json({
            success: true,
            message: `${count} notification(s) marquée(s) comme lue(s)`,
            count
        });

    } catch (error) {
        console.error('❌ Erreur lors du marquage de toutes les notifications:', error);
        return NextResponse.json(
            {
                error: 'Erreur serveur',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
