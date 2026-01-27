import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotificationRules() {
    console.log('🌱 Création des règles de notification...');

    const rules = [
        {
            type: 'CAMPAIGN_EXPIRING',
            days_before: 7,
            priority: 'HIGH',
            title_template: 'Campagne "{{nom_campagne}}" expire dans {{jours}} jours',
            message_template: 'La campagne "{{nom_campagne}}" se terminera le {{date_fin}}. Pensez à vérifier les derniers détails avant la clôture.',
            description: 'Notification envoyée 7 jours avant la fin d\'une campagne'
        },
        {
            type: 'ASSIGNMENT_WEEK_BEFORE',
            days_before: 7,
            priority: 'MEDIUM',
            title_template: 'Affectation de {{prestataire_nom}} se termine bientôt',
            message_template: 'L\'affectation de {{prestataire_nom}} pour la campagne "{{campagne_nom}}" se terminera le {{date_fin}}. Préparez la transition si nécessaire.',
            description: 'Notification envoyée 1 semaine avant la fin d\'une affectation'
        },
        {
            type: 'ASSIGNMENT_2DAYS_BEFORE',
            days_before: 2,
            priority: 'HIGH',
            title_template: 'Affectation de {{prestataire_nom}} se termine dans 2 jours',
            message_template: 'L\'affectation de {{prestataire_nom}} pour la campagne "{{campagne_nom}}" se terminera le {{date_fin}}. Action requise rapidement.',
            description: 'Notification envoyée 2 jours avant la fin d\'une affectation'
        }
    ];

    for (const rule of rules) {
        // @ts-ignore - On ignore les potentiels problèmes de typage enum ici
        await prisma.notificationRule.upsert({
            where: { type: rule.type as any },
            update: {
                days_before: rule.days_before,
                priority: rule.priority as any,
                title_template: rule.title_template,
                message_template: rule.message_template,
                description: rule.description,
                is_active: true
            },
            create: {
                type: rule.type as any,
                days_before: rule.days_before,
                priority: rule.priority as any,
                title_template: rule.title_template,
                message_template: rule.message_template,
                description: rule.description,
                is_active: true
            }
        });
        console.log(`✅ Règle créée/mise à jour: ${rule.type}`);
    }

    console.log('\n✅ Toutes les règles de notification ont été créées avec succès!');
}

seedNotificationRules()
    .catch((error) => {
        console.error('❌ Erreur lors du seed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
