-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'SUPERVISEUR_CAMPAGNE', 'CONTROLEUR', 'OPERATIONNEL', 'EQUIPE');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('EXTERNE', 'INTERNE');

-- CreateEnum
CREATE TYPE "TypeCampagne" AS ENUM ('MASSE', 'PROXIMITE');

-- CreateEnum
CREATE TYPE "CampagneStatus" AS ENUM ('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TypePanneau" AS ENUM ('PETIT', 'GRAND');

-- CreateEnum
CREATE TYPE "EtatMateriel" AS ENUM ('BON', 'MOYEN', 'MAUVAIS');

-- CreateEnum
CREATE TYPE "TypeFichier" AS ENUM ('RAPPORT_JOURNALIER', 'RAPPORT_FINAL', 'PIGE');

-- CreateTable
CREATE TABLE "users" (
    "id_user" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom_utilisateur" TEXT,
    "type_user" "UserType" NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "contact" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revoked_tokens" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id_client" TEXT NOT NULL,
    "nom" TEXT,
    "prenom" TEXT,
    "entreprise" TEXT NOT NULL,
    "domaine_entreprise" TEXT,
    "adresse" TEXT,
    "contact" TEXT,
    "mail" TEXT,
    "type_client" "ClientType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id_client")
);

-- CreateTable
CREATE TABLE "lieux" (
    "id_lieu" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lieux_pkey" PRIMARY KEY ("id_lieu")
);

-- CreateTable
CREATE TABLE "services" (
    "id_service" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id_service")
);

-- CreateTable
CREATE TABLE "prestataires" (
    "id_prestataire" TEXT NOT NULL,
    "id_service" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "type_panneau" "TypePanneau",
    "couleur" TEXT,
    "marque" TEXT,
    "modele" TEXT,
    "plaque" TEXT,
    "id_verification" TEXT NOT NULL,
    "contrat_valide" BOOLEAN,
    "equipe_gps" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestataires_pkey" PRIMARY KEY ("id_prestataire")
);

-- CreateTable
CREATE TABLE "campagnes" (
    "id_campagne" TEXT NOT NULL,
    "id_client" TEXT NOT NULL,
    "id_lieu" TEXT NOT NULL,
    "id_gestionnaire" TEXT NOT NULL,
    "id_service" TEXT NOT NULL,
    "nom_campagne" TEXT NOT NULL,
    "description" TEXT,
    "objectif" TEXT,
    "quantite_service" INTEGER,
    "nbr_prestataire" INTEGER,
    "type_campagne" "TypeCampagne",
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CampagneStatus" NOT NULL DEFAULT 'PLANIFIEE',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campagnes_pkey" PRIMARY KEY ("id_campagne")
);

-- CreateTable
CREATE TABLE "prestataires_campagne" (
    "id_campagne" TEXT NOT NULL,
    "id_prestataire" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_fin" TIMESTAMP(3),
    "status" TEXT,
    "image_affiche" TEXT,

    CONSTRAINT "prestataires_campagne_pkey" PRIMARY KEY ("id_campagne","id_prestataire")
);

-- CreateTable
CREATE TABLE "paiements_prestataire" (
    "id_paiement" TEXT NOT NULL,
    "id_campagne" TEXT NOT NULL,
    "id_prestataire" TEXT NOT NULL,
    "paiement_base" DOUBLE PRECISION NOT NULL,
    "paiement_final" DOUBLE PRECISION NOT NULL,
    "date_paiement" TIMESTAMP(3),
    "statut_paiement" BOOLEAN NOT NULL DEFAULT false,
    "sanction_montant" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_prestataire_pkey" PRIMARY KEY ("id_paiement")
);

-- CreateTable
CREATE TABLE "materiels_case" (
    "id_materiels_case" TEXT NOT NULL,
    "id_campagne" TEXT,
    "id_prestataire" TEXT,
    "nom_materiel" TEXT NOT NULL,
    "etat" "EtatMateriel" NOT NULL,
    "description" TEXT NOT NULL,
    "montant_penalite" DOUBLE PRECISION NOT NULL,
    "penalite_appliquer" BOOLEAN NOT NULL DEFAULT false,
    "photo_url" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preuve_media" TEXT,

    CONSTRAINT "materiels_case_pkey" PRIMARY KEY ("id_materiels_case")
);

-- CreateTable
CREATE TABLE "fichiers_campagne" (
    "id_fichier" TEXT NOT NULL,
    "id_campagne" TEXT NOT NULL,
    "nom_fichier" TEXT NOT NULL,
    "description" TEXT,
    "lien_canva_drive" TEXT NOT NULL,
    "type_fichier" "TypeFichier" NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fichiers_campagne_pkey" PRIMARY KEY ("id_fichier")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ressource" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nom_utilisateur_key" ON "users"("nom_utilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "revoked_tokens_jti_key" ON "revoked_tokens"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "clients_mail_key" ON "clients"("mail");

-- CreateIndex
CREATE UNIQUE INDEX "prestataires_plaque_key" ON "prestataires"("plaque");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_prestataire_id_campagne_id_prestataire_key" ON "paiements_prestataire"("id_campagne", "id_prestataire");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revoked_tokens" ADD CONSTRAINT "revoked_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestataires" ADD CONSTRAINT "prestataires_id_service_fkey" FOREIGN KEY ("id_service") REFERENCES "services"("id_service") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campagnes" ADD CONSTRAINT "campagnes_id_client_fkey" FOREIGN KEY ("id_client") REFERENCES "clients"("id_client") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campagnes" ADD CONSTRAINT "campagnes_id_lieu_fkey" FOREIGN KEY ("id_lieu") REFERENCES "lieux"("id_lieu") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campagnes" ADD CONSTRAINT "campagnes_id_gestionnaire_fkey" FOREIGN KEY ("id_gestionnaire") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campagnes" ADD CONSTRAINT "campagnes_id_service_fkey" FOREIGN KEY ("id_service") REFERENCES "services"("id_service") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestataires_campagne" ADD CONSTRAINT "prestataires_campagne_id_campagne_fkey" FOREIGN KEY ("id_campagne") REFERENCES "campagnes"("id_campagne") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestataires_campagne" ADD CONSTRAINT "prestataires_campagne_id_prestataire_fkey" FOREIGN KEY ("id_prestataire") REFERENCES "prestataires"("id_prestataire") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements_prestataire" ADD CONSTRAINT "paiements_prestataire_id_campagne_id_prestataire_fkey" FOREIGN KEY ("id_campagne", "id_prestataire") REFERENCES "prestataires_campagne"("id_campagne", "id_prestataire") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiels_case" ADD CONSTRAINT "materiels_case_id_campagne_fkey" FOREIGN KEY ("id_campagne") REFERENCES "campagnes"("id_campagne") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiels_case" ADD CONSTRAINT "materiels_case_id_prestataire_fkey" FOREIGN KEY ("id_prestataire") REFERENCES "prestataires"("id_prestataire") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichiers_campagne" ADD CONSTRAINT "fichiers_campagne_id_campagne_fkey" FOREIGN KEY ("id_campagne") REFERENCES "campagnes"("id_campagne") ON DELETE RESTRICT ON UPDATE CASCADE;
