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