-- CreateTable
CREATE TABLE "types_incident" (
    "id_type_incident" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "types_incident_pkey" PRIMARY KEY ("id_type_incident")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id_incident" TEXT NOT NULL,
    "id_prestataire" TEXT NOT NULL,
    "id_type_incident" TEXT NOT NULL,
    "date_incident" TIMESTAMP(3) NOT NULL,
    "commentaire" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id_incident")
);

-- CreateTable
CREATE TABLE "incident_photos" (
    "id_photo" TEXT NOT NULL,
    "id_incident" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_photos_pkey" PRIMARY KEY ("id_photo")
);

-- CreateIndex
CREATE UNIQUE INDEX "types_incident_nom_key" ON "types_incident"("nom");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_id_prestataire_fkey" FOREIGN KEY ("id_prestataire") REFERENCES "prestataires"("id_prestataire") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_id_type_incident_fkey" FOREIGN KEY ("id_type_incident") REFERENCES "types_incident"("id_type_incident") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_photos" ADD CONSTRAINT "incident_photos_id_incident_fkey" FOREIGN KEY ("id_incident") REFERENCES "incidents"("id_incident") ON DELETE CASCADE ON UPDATE CASCADE;
