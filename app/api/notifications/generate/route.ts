/**
 * API Endpoint: Génération des Notifications (Cron Job)
 * GET /api/notifications/generate
 * Protégé par CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notificationService';

export async function GET(request: NextRequest) {
    try {
        // Vérification du secret pour le cron job
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error('❌ CRON_SECRET non configuré');
            return NextResponse.json(
                { error: 'Configuration serveur invalide' },
                { status: 500 }
            );
        }

        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            console.error('❌ Tentative d\'accès non autorisée au cron de génération');
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        console.log('🚀 Démarrage de la génération des notifications...');
        const startTime = Date.now();

        // Générer les notifications
        const result = await notificationService.generateNotifications();

        const duration = Date.now() - startTime;

        console.log(`✅ Génération terminée en ${duration}ms`);

        return NextResponse.json({
            success: result.success,
            stats: {
                campaignNotifications: result.campaignNotifications,
                assignmentNotifications: result.assignmentNotifications,
                total: result.total
            },
            errors: result.errors,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur lors de la génération des notifications:', error);
        return NextResponse.json(
            {
                error: 'Erreur serveur',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
