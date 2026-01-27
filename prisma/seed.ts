import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth/hash'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seeding...')

  // Créer l'admin principal
  const adminPassword = await hashPassword('admin123')

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@camptrack.com' },
    update: {},
    create: {
      nom: 'Admin',
      prenom: 'CampTrack',
      email: 'admin@camptrack.com',
      password: adminPassword,
      type_user: 'ADMIN',
      nom_utilisateur: 'admin',
      contact: '+225 01 23 45 67 89',
    },
  })

  console.log('✅ Admin créé:', {
    id: adminUser.id_user,
    email: adminUser.email,
    type: adminUser.type_user
  })

  // CORRECTION : Le service n'a pas de champ unique "nom", on utilise create directement
  try {
    const service = await prisma.service.create({
      data: {
        nom: 'Publicité Tricycle',
        description: 'Service de publicité sur tricycles',
      },
    })
    console.log('✅ Service créé:', service.nom)
  } catch (error) {
    console.log('ℹ️ Service déjà existant ou autre erreur, continuation...')
  }

  // Créer des règles de notification par défaut
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
  ]

  console.log('🔔 Création des règles de notification...')
  for (const rule of rules) {
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
    })
  }
  console.log('✅ 4 Règles de notification créées/vérifiées')

  console.log('🎉 Seeding terminé!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur de seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })