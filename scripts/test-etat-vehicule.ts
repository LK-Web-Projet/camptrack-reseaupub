import { prisma } from '@/lib/prisma';

/**
 * Script de test pour vérifier la persistance de etat_vehicule
 * Usage: npx tsx scripts/test-etat-vehicule.ts
 */

async function testEtatVehicule() {
    console.log('🔍 Test de persistance pour etat_vehicule...\n');

    let serviceId = '';
    let prestataireId = '';

    try {
        // 1. Créer un service de test (ou récupérer un existant)
        console.log('1️⃣  Récupération/Création d\'un service...');
        let service = await prisma.service.findFirst();
        if (!service) {
            service = await prisma.service.create({
                data: { nom: 'Service Test' }
            });
        }
        serviceId = service.id_service;
        console.log(`✅ Service ID: ${serviceId}`);

        // 2. Créer un prestataire avec etat_vehicule = 5
        console.log('\n2️⃣  Création d\'un prestataire avec etat_vehicule = 5...');
        const prestataire = await prisma.prestataire.create({
            data: {
                nom: 'TestVehicule',
                prenom: 'Script',
                contact: '00000000',
                disponible: true,
                service: { connect: { id_service: serviceId } },
                etat_vehicule: 5, // TEST DIRECT
                id_verification: `TEST-${Date.now()}`
            }
        });
        prestataireId = prestataire.id_prestataire;
        console.log(`✅ Prestataire créé ID: ${prestataireId}`);
        console.log(`📊 Valeur envoyée: 5`);
        console.log(`📊 Valeur enregistrée: ${prestataire.etat_vehicule}`);

        if (prestataire.etat_vehicule !== 5) {
            throw new Error(`❌ ÉCHEC: La valeur enregistrée est ${prestataire.etat_vehicule} au lieu de 5`);
        }

        // 3. Modifier le prestataire (mettre à 3)
        console.log('\n3️⃣  Mise à jour etat_vehicule = 3...');
        const updated = await prisma.prestataire.update({
            where: { id_prestataire: prestataireId },
            data: { etat_vehicule: 3 }
        });
        console.log(`📊 Valeur après update: ${updated.etat_vehicule}`);

        if (updated.etat_vehicule !== 3) {
            throw new Error(`❌ ÉCHEC UPDATE: La valeur est ${updated.etat_vehicule} au lieu de 3`);
        }

        console.log('\n🎉 SUCCÈS: Le champ etat_vehicule fonctionne correctement en base de données !');

    } catch (error) {
        console.error('\n❌ ERREUR:', error);
    } finally {
        // Cleanup
        if (prestataireId) {
            console.log('\n🧹 Nettoyage du prestataire de test...');
            await prisma.prestataire.delete({ where: { id_prestataire: prestataireId } });
        }
        await prisma.$disconnect();
    }
}

testEtatVehicule();
