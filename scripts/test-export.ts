import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

/**
 * Script de test pour l'export Excel
 * Usage: npx tsx scripts/test-export.ts
 */

async function testExport() {
    console.log('🔍 Test de l\'export Excel...\n');

    try {
        // 1. Récupérer quelques prestataires
        console.log('📊 Récupération des prestataires...');
        const prestataires = await prisma.prestataire.findMany({
            include: {
                service: { select: { nom: true } }
            },
            take: 5,
            orderBy: { nom: 'asc' }
        });

        console.log(`✅ ${prestataires.length} prestataires récupérés\n`);

        if (prestataires.length === 0) {
            console.log('⚠️  Aucun prestataire dans la base de données');
            return;
        }

        // 2. Afficher un exemple de données brutes
        console.log('📋 Exemple de données brutes:');
        console.log(JSON.stringify(prestataires[0], null, 2));
        console.log('\n');

        // 3. Aplatir les données
        console.log('🔄 Aplatissement des données...');
        const flattenedData = prestataires.map(item => {
            const flatItem: any = {};
            for (const key in item) {
                const value = item[key];

                // Handle dates
                if (value instanceof Date) {
                    flatItem[key] = value.toISOString();
                }
                // Handle nested objects
                else if (typeof value === 'object' && value !== null) {
                    for (const subKey in value) {
                        const subValue = value[subKey];
                        if (subValue instanceof Date) {
                            flatItem[`${key}_${subKey}`] = subValue.toISOString();
                        } else {
                            flatItem[`${key}_${subKey}`] = subValue;
                        }
                    }
                }
                // Handle primitive values
                else {
                    flatItem[key] = value;
                }
            }
            return flatItem;
        });

        console.log('✅ Données aplaties\n');
        console.log('📋 Exemple de données aplaties:');
        console.log(JSON.stringify(flattenedData[0], null, 2));
        console.log('\n');

        // 4. Créer le fichier Excel
        console.log('📝 Création du fichier Excel...');
        const worksheet = XLSX.utils.json_to_sheet(flattenedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'prestataires');

        // 5. Écrire le fichier
        const filename = `test-export-${Date.now()}.xlsx`;
        XLSX.writeFile(workbook, filename);

        console.log(`✅ Fichier créé: ${filename}`);
        console.log('\n🎉 Test terminé avec succès!');
        console.log(`\n📂 Ouvre le fichier "${filename}" pour vérifier`);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

testExport();
