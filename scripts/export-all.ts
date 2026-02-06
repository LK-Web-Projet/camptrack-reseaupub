import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

/**
 * Script d'export complet pour tous les modèles
 * Usage: npx tsx scripts/export-all.ts
 */

async function exportPrestataires() {
    console.log('\n📊 Export des Prestataires...');
    const data = await prisma.prestataire.findMany({
        include: {
            service: { select: { nom: true } }
        },
        orderBy: { nom: 'asc' }
    });

    const flatData = data.map(p => ({
        id_prestataire: p.id_prestataire,
        nom: p.nom,
        prenom: p.prenom,
        contact: p.contact,
        disponible: p.disponible ? 'Oui' : 'Non',
        service: p.service?.nom || '',
        type_panneau: p.type_panneau || '',
        couleur: p.couleur || '',
        marque: p.marque || '',
        modele: p.modele || '',
        plaque: p.plaque || '',
        id_verification: p.id_verification || '',
        contrat_valide: p.contrat_valide ? 'Oui' : 'Non',
        equipe_gps: p.equipe_gps ? 'Oui' : 'Non',
        etat_vehicule: p.etat_vehicule || '',
        score: p.score || '',
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString()
    }));

    return { data: flatData, count: data.length };
}

async function exportCampagnes() {
    console.log('📊 Export des Campagnes...');
    const data = await prisma.campagne.findMany({
        include: {
            client: { select: { nom: true, entreprise: true } },
            lieu: { select: { nom: true, ville: true } },
            gestionnaire: { select: { nom: true, prenom: true } },
            superviseur: { select: { nom: true, prenom: true } },
            service: { select: { nom: true } }
        },
        orderBy: { date_creation: 'desc' }
    });

    const flatData = data.map(c => ({
        id_campagne: c.id_campagne,
        nom_campagne: c.nom_campagne,
        description: c.description || '',
        objectif: c.objectif || '',
        type_campagne: c.type_campagne || '',
        quantite_service: c.quantite_service || '',
        nbr_prestataire: c.nbr_prestataire || '',
        status: c.status,
        client_nom: c.client?.nom || '',
        client_entreprise: c.client?.entreprise || '',
        lieu_nom: c.lieu?.nom || '',
        lieu_ville: c.lieu?.ville || '',
        gestionnaire: `${c.gestionnaire?.nom || ''} ${c.gestionnaire?.prenom || ''}`.trim(),
        superviseur: c.superviseur ? `${c.superviseur.nom} ${c.superviseur.prenom}`.trim() : '',
        service: c.service?.nom || '',
        date_debut: c.date_debut.toISOString(),
        date_fin: c.date_fin.toISOString(),
        date_creation: c.date_creation.toISOString(),
        updated_at: c.updated_at.toISOString()
    }));

    return { data: flatData, count: data.length };
}

async function exportClients() {
    console.log('📊 Export des Clients...');
    const data = await prisma.client.findMany({
        orderBy: { nom: 'asc' }
    });

    const flatData = data.map(c => ({
        id_client: c.id_client,
        nom: c.nom || '',
        prenom: c.prenom || '',
        entreprise: c.entreprise,
        domaine_entreprise: c.domaine_entreprise || '',
        adresse: c.adresse || '',
        contact: c.contact || '',
        fonction_contact: c.fonction_contact || '',
        mail: c.mail || '',
        type_client: c.type_client,
        commentaire: c.commentaire || '',
        created_at: c.created_at.toISOString(),
        updated_at: c.updated_at.toISOString()
    }));

    return { data: flatData, count: data.length };
}

async function exportUsers() {
    console.log('📊 Export des Utilisateurs...');
    const data = await prisma.user.findMany({
        select: {
            id_user: true,
            nom: true,
            prenom: true,
            nom_utilisateur: true,
            email: true,
            type_user: true,
            contact: true,
            is_active: true,
            created_at: true,
            updated_at: true
        },
        orderBy: { nom: 'asc' }
    });

    const flatData = data.map(u => ({
        id_user: u.id_user,
        nom: u.nom,
        prenom: u.prenom,
        nom_utilisateur: u.nom_utilisateur || '',
        email: u.email,
        type_user: u.type_user,
        contact: u.contact || '',
        is_active: u.is_active ? 'Actif' : 'Inactif',
        created_at: u.created_at.toISOString(),
        updated_at: u.updated_at.toISOString()
    }));

    return { data: flatData, count: data.length };
}

async function exportAll() {
    console.log('🚀 Début de l\'export complet...\n');
    const timestamp = new Date().toISOString().split('T')[0];

    try {
        // Export Prestataires
        const prestataires = await exportPrestataires();
        if (prestataires.count > 0) {
            const ws = XLSX.utils.json_to_sheet(prestataires.data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Prestataires');
            const filename = `export-prestataires-${timestamp}.xlsx`;
            XLSX.writeFile(wb, filename);
            console.log(`✅ ${prestataires.count} prestataires exportés → ${filename}`);
        } else {
            console.log('⚠️  Aucun prestataire à exporter');
        }

        // Export Campagnes
        const campagnes = await exportCampagnes();
        if (campagnes.count > 0) {
            const ws = XLSX.utils.json_to_sheet(campagnes.data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Campagnes');
            const filename = `export-campagnes-${timestamp}.xlsx`;
            XLSX.writeFile(wb, filename);
            console.log(`✅ ${campagnes.count} campagnes exportées → ${filename}`);
        } else {
            console.log('⚠️  Aucune campagne à exporter');
        }

        // Export Clients
        const clients = await exportClients();
        if (clients.count > 0) {
            const ws = XLSX.utils.json_to_sheet(clients.data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Clients');
            const filename = `export-clients-${timestamp}.xlsx`;
            XLSX.writeFile(wb, filename);
            console.log(`✅ ${clients.count} clients exportés → ${filename}`);
        } else {
            console.log('⚠️  Aucun client à exporter');
        }

        // Export Users
        const users = await exportUsers();
        if (users.count > 0) {
            const ws = XLSX.utils.json_to_sheet(users.data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
            const filename = `export-users-${timestamp}.xlsx`;
            XLSX.writeFile(wb, filename);
            console.log(`✅ ${users.count} utilisateurs exportés → ${filename}`);
        } else {
            console.log('⚠️  Aucun utilisateur à exporter');
        }

        console.log('\n🎉 Export complet terminé avec succès!');
        console.log(`📂 Tous les fichiers sont dans le dossier: ${process.cwd()}`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'export:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

exportAll();
