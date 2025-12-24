import { PrismaClient, TypePanneau } from '../app/generated/prisma'; // Adaptez le chemin si nécessaire
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import path from 'path';
const prisma = new PrismaClient();
// Chemin vers votre fichier Excel - MODIFIEZ CECI
const EXCEL_FILE_PATH = path.join(__dirname, '../data/prestataires.xlsx'); 
// Fonction utilitaire pour mapper les booléens
function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim();
    return v === 'yes' || v === 'oui' || v === 'true' || v === '1' || v === 'vrais';
  }
  return !!value;
}
// Fonction utilitaire pour mapper le type de panneau
function parsePanelType(value: string): TypePanneau | null {
  if (!value) return null;
  const v = value.toUpperCase().trim();
  if (v.includes('PETIT')) return 'PETIT';
  if (v.includes('GRAND')) return 'GRAND';
  return null; // ou gérer une valeur par défaut
}
async function main() {
  console.log('🚀 Démarrage de l\'importation...');
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    console.error(`❌ Erreur : Le fichier n'existe pas à l'emplacement : ${EXCEL_FILE_PATH}`);
    process.exit(1);
  }
  // Lecture du fichier Excel
  const workbook = XLSX.readFile(EXCEL_FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Conversion en JSON
  const data = XLSX.utils.sheet_to_json(sheet);
  console.log(`📄 ${data.length} lignes trouvées dans le fichier.`);
  let successCount = 0;
  let errorCount = 0;
  for (const [index, row] of data.entries()) {
    const rowNum = index + 2; // +1 pour 0-index, +1 pour le header
    const r = row as any;
    try {
      // Mapping des données
      await prisma.prestataire.create({
        data: {
          // Mapping des colonnes Excel -> Champs DB
          nom: r['Last Name'] || 'Inconnu',
          prenom: r['First Name'] || 'Inconnu',
          plaque: r['REGISTRATION NUMBER'] ? String(r['REGISTRATION NUMBER']) : null,
          id_verification: r['Verification ID'] ? String(r['Verification ID']) : `GEN-${Date.now()}-${index}`, // Fallback si manquant
          contact: r['CONTACTS'] ? String(r['CONTACTS']) : '',
          
          type_panneau: parsePanelType(r['panel_type']),
          marque: r['tricycle_brand'],
          couleur: r['VEHICLE_COLORS'],
          
          equipe_gps: parseBoolean(r['GPS_equipped']),
          contrat_valide: parseBoolean(r['VALID_CONTRACT']),
          
          // Gestion de la date
          created_at: r['Creation_Date'] ? new Date(r['Creation_Date']) : new Date(),
          
          // Relation Service - Assurez-vous que ce Service ID existe !
          service: {
            connect: { id_service: String(r['service_id']) }
          }
        }
      });
      
      process.stdout.write('.'); // Indicateur de progrès
      successCount++;
      
    } catch (error) {
      console.error(`\n❌ Erreur ligne ${rowNum} (${r['Last Name']} ${r['First Name']}):`);
      // Gestion spécifique des erreurs Prisma (ex: Unicité)
      if ((error as any).code === 'P2002') {
        console.error('   -> Doublon détecté (probablement plaque ou ID déjà existant).');
      } else if ((error as any).code === 'P2025') {
        console.error('   -> Service ID introuvable.');
      } else {
        console.error(`   -> ${error}`);
      }
      errorCount++;
    }
  }
  console.log('\n\n=== RAPPORT D\'IMPORTATION ===');
  console.log(`✅ Importés avec succès : ${successCount}`);
  console.log(`❌ Échecs : ${errorCount}`);
  console.log('=============================');
}
main()
  .catch((e) => {
    console.error('Erreur critique du script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });