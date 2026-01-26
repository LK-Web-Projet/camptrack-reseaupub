import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotificationRules() {
    console.log('🌱 Création des règles de notification...');

    // Règle 1 : Campagne expire dans 7 jours
    const rule1 = await prisma.notificationRule.upsert({
        where: { type: 'CAMPAIGN_EXPIRING' },
        update: {},
        create: {
            type: 'CAMPAIGN_EXPIRING',
            days_before: 7,
            priority: 'HIGH',
            title_template: 'Campagne "{{nom_campagne}}" expire dans {{jours}} jours',
            message_template: 'La campagne "{{nom_campagne}}" se terminera le {{date_fin}}. Pensez à vérifier les derniers détails avant la clôture.',
            description: 'Notification envoyée 7 jours avant la fin d\'une campagne',
            is_active: true
        }
    });
    console.log('✅ Règle créée:', rule1.type);

    // Règle 2 : Affectation - 1 semaine avant
    const rule2 = await prisma.notificationRule.upsert({
        where: { type: 'ASSIGNMENT_WEEK_BEFORE' },
        update: {},
        create: {
            type: 'ASSIGNMENT_WEEK_BEFORE',
            days_before: 7,
            priority: 'MEDIUM',
            title_template: 'Affectation de {{prestataire_nom}} se termine bientôt',
            message_template: 'L\'affectation de {{prestataire_nom}} pour la campagne "{{campagne_nom}}" se terminera le {{date_fin}}. Préparez la transition si nécessaire.',
            description: 'Notification envoyée 1 semaine avant la fin d\'une affectation',
            is_active: true
        }
    });
    console.log('✅ Règle créée:', rule2.type);

    // Règle 3 : Affectation - 2 jours avant
    const rule3 = await prisma.notificationRule.upsert({
        where: { type: 'ASSIGNMENT_2DAYS_BEFORE' },
        update: {},
        create: {
            type: 'ASSIGNMENT_2DAYS_BEFORE',
            days_before: 2,
            priority: 'HIGH',
            title_template: 'Affectation de {{prestataire_nom}} se termine dans 2 jours',
            message_template: 'L\'affectation de {{prestataire_nom}} pour la campagne "{{campagne_nom}}" se terminera le {{date_fin}}. Action requise rapidement.',
            description: 'Notification envoyée 2 jours avant la fin d\'une affectation',
            is_active: true
        }
    });
    console.log('✅ Règle créée:', rule3.type);

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
