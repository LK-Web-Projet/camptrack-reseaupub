/**
 * Service de Gestion des Notifications In-App
 * Génère et gère les notifications pour les campagnes et affectations
 */

import { PrismaClient, NotificationType, NotificationRule, NotificationPriority } from '@prisma/client';
import { renderTemplate } from '@/lib/utils/templateEngine';
import { addDays, startOfDay, endOfDay, formatDate } from '@/lib/utils/dateHelpers';

const prisma = new PrismaClient();

export interface GenerationResult {
    success: boolean;
    campaignNotifications: number;
    assignmentNotifications: number;
    total: number;
    errors: string[];
}

export interface GetNotificationsOptions {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
}

export class NotificationService {
    /**
     * Génère toutes les notifications selon les règles actives
     */
    async generateNotifications(): Promise<GenerationResult> {
        const result: GenerationResult = {
            success: true,
            campaignNotifications: 0,
            assignmentNotifications: 0,
            total: 0,
            errors: []
        };

        try {
            // Récupérer toutes les règles actives
            const rules = await prisma.notificationRule.findMany({
                where: { is_active: true }
            });

            console.log(`📋 ${rules.length} règles actives trouvées`);

            // Traiter chaque règle
            for (const rule of rules) {
                try {
                    if (rule.type === 'CAMPAIGN_EXPIRING') {
                        const count = await this.generateCampaignNotifications(rule);
                        result.campaignNotifications += count;
                        console.log(`✅ ${count} notifications de campagne créées`);
                    } else {
                        const count = await this.generateAssignmentNotifications(rule);
                        result.assignmentNotifications += count;
                        console.log(`✅ ${count} notifications d'affectation créées (${rule.type})`);
                    }
                } catch (error) {
                    const errorMsg = `Erreur pour la règle ${rule.type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(`❌ ${errorMsg}`);
                    result.errors.push(errorMsg);
                    result.success = false;
                }
            }

            result.total = result.campaignNotifications + result.assignmentNotifications;
            console.log(`\n🎉 Total: ${result.total} notifications générées`);

            return result;
        } catch (error) {
            console.error('❌ Erreur lors de la génération des notifications:', error);
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : 'Unknown error');
            return result;
        }
    }

    /**
     * Génère les notifications pour les campagnes qui expirent
     */
    async generateCampaignNotifications(rule: NotificationRule): Promise<number> {
        const targetDate = addDays(new Date(), rule.days_before);
        let count = 0;

        // Trouver les campagnes qui expirent à la date cible
        const campaigns = await prisma.campagne.findMany({
            where: {
                date_fin: {
                    gte: startOfDay(targetDate),
                    lte: endOfDay(targetDate)
                },
                status: {
                    notIn: ['TERMINEE', 'ANNULEE']
                }
            },
            include: {
                gestionnaire: true
            }
        });

        console.log(`🔍 ${campaigns.length} campagnes trouvées expirant le ${formatDate(targetDate)}`);

        for (const campaign of campaigns) {
            // Vérifier si la notification existe déjà
            const existing = await prisma.notification.findFirst({
                where: {
                    entity_type: 'CAMPAGNE',
                    entity_id: campaign.id_campagne,
                    type: rule.type,
                    user_id: campaign.id_gestionnaire
                }
            });

            if (!existing) {
                // Créer la notification
                await prisma.notification.create({
                    data: {
                        type: rule.type,
                        priority: rule.priority,
                        user_id: campaign.id_gestionnaire,
                        entity_type: 'CAMPAGNE',
                        entity_id: campaign.id_campagne,
                        title: renderTemplate(rule.title_template, {
                            nom_campagne: campaign.nom_campagne,
                            jours: rule.days_before
                        }),
                        message: renderTemplate(rule.message_template, {
                            nom_campagne: campaign.nom_campagne,
                            date_fin: formatDate(campaign.date_fin),
                            jours: rule.days_before
                        }),
                        action_url: `/campagnes/${campaign.id_campagne}`,
                        metadata: {
                            campaign_name: campaign.nom_campagne,
                            campaign_end: campaign.date_fin.toISOString(),
                            days_before: rule.days_before
                        }
                    }
                });
                count++;
            }
        }

        return count;
    }

    /**
     * Génère les notifications pour les affectations qui expirent
     */
    async generateAssignmentNotifications(rule: NotificationRule): Promise<number> {
        const targetDate = addDays(new Date(), rule.days_before);
        let count = 0;

        // Trouver les affectations qui expirent à la date cible
        const assignments = await prisma.prestataireCampagne.findMany({
            where: {
                date_fin: {
                    gte: startOfDay(targetDate),
                    lte: endOfDay(targetDate)
                },
                status: 'ACTIF'
            },
            include: {
                prestataire: true,
                campagne: {
                    include: {
                        gestionnaire: true
                    }
                }
            }
        });

        console.log(`🔍 ${assignments.length} affectations trouvées expirant le ${formatDate(targetDate)}`);

        for (const assignment of assignments) {
            const entityId = `${assignment.id_campagne}:${assignment.id_prestataire}`;

            // Vérifier si la notification existe déjà
            const existing = await prisma.notification.findFirst({
                where: {
                    entity_type: 'AFFECTATION',
                    entity_id: entityId,
                    type: rule.type,
                    user_id: assignment.campagne.id_gestionnaire
                }
            });

            if (!existing) {
                // Créer la notification
                await prisma.notification.create({
                    data: {
                        type: rule.type,
                        priority: rule.priority,
                        user_id: assignment.campagne.id_gestionnaire,
                        entity_type: 'AFFECTATION',
                        entity_id: entityId,
                        title: renderTemplate(rule.title_template, {
                            prestataire_nom: `${assignment.prestataire.prenom} ${assignment.prestataire.nom}`,
                            jours: rule.days_before
                        }),
                        message: renderTemplate(rule.message_template, {
                            prestataire_nom: `${assignment.prestataire.prenom} ${assignment.prestataire.nom}`,
                            campagne_nom: assignment.campagne.nom_campagne,
                            date_fin: assignment.date_fin ? formatDate(assignment.date_fin) : 'N/A',
                            jours: rule.days_before
                        }),
                        action_url: `/campagnes/${assignment.id_campagne}/prestataires`,
                        metadata: {
                            provider_name: `${assignment.prestataire.prenom} ${assignment.prestataire.nom}`,
                            campaign_name: assignment.campagne.nom_campagne,
                            assignment_end: assignment.date_fin?.toISOString(),
                            days_before: rule.days_before
                        }
                    }
                });
                count++;
            }
        }

        return count;
    }

    /**
     * Récupère les notifications d'un utilisateur
     */
    async getUserNotifications(userId: string, options?: GetNotificationsOptions) {
        const { unreadOnly = false, limit = 20, offset = 0 } = options || {};

        return await prisma.notification.findMany({
            where: {
                user_id: userId,
                ...(unreadOnly ? { is_read: false } : {})
            },
            orderBy: {
                created_at: 'desc'
            },
            take: limit,
            skip: offset
        });
    }

    /**
     * Compte les notifications non lues d'un utilisateur
     */
    async getUnreadCount(userId: string): Promise<number> {
        return await prisma.notification.count({
            where: {
                user_id: userId,
                is_read: false
            }
        });
    }

    /**
     * Marque une notification comme lue
     */
    async markAsRead(notificationId: string): Promise<void> {
        await prisma.notification.update({
            where: { id_notification: notificationId },
            data: {
                is_read: true,
                read_at: new Date()
            }
        });
    }

    /**
     * Marque toutes les notifications d'un utilisateur comme lues
     */
    async markAllAsRead(userId: string): Promise<number> {
        const result = await prisma.notification.updateMany({
            where: {
                user_id: userId,
                is_read: false
            },
            data: {
                is_read: true,
                read_at: new Date()
            }
        });

        return result.count;
    }

    /**
     * Supprime une notification
     */
    async deleteNotification(notificationId: string): Promise<void> {
        await prisma.notification.delete({
            where: { id_notification: notificationId }
        });
    }

    /**
     * Supprime les anciennes notifications (nettoyage)
     */
    async deleteOldNotifications(daysOld: number = 30): Promise<number> {
        const cutoffDate = addDays(new Date(), -daysOld);

        const result = await prisma.notification.deleteMany({
            where: {
                created_at: {
                    lt: cutoffDate
                }
            }
        });

        return result.count;
    }
}

// Export d'une instance singleton
export const notificationService = new NotificationService();
