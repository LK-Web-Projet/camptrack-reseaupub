"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface DownloadPhotosButtonProps {
    campagneNom: string;
    affectations: Array<{
        prestataire: {
            nom?: string;
            prenom?: string;
        };
        image_affiche?: string | null;
    }> | null;
}

export default function DownloadPhotosButton({
    campagneNom,
    affectations,
}: DownloadPhotosButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPhotos = async () => {
        if (!affectations || affectations.length === 0) {
            toast.info("Aucune photo disponible pour cette campagne.");
            return;
        }

        // Filtrer les affectations qui ont réellement une image
        const affectationsWithImages = affectations.filter((a) => !!a.image_affiche);

        if (affectationsWithImages.length === 0) {
            toast.info("Aucune photo disponible pour cette campagne.");
            return;
        }

        try {
            setIsDownloading(true);
            const zip = new JSZip();

            // Créer un dossier pour la campagne
            const folderName = `Photos_Campagne_${campagneNom.replace(/[^a-z0-9]/gi, '_')}`;
            const folder = zip.folder(folderName);

            if (!folder) {
                throw new Error("Impossible de créer le dossier ZIP");
            }

            // Télécharger chaque image et l'ajouter au ZIP
            const downloadPromises = affectationsWithImages.map(async (a, index) => {
                try {
                    // Extraire l'URL de l'image
                    const imageUrl = a.image_affiche!;

                    // Fetch the image as a blob
                    const response = await fetch(imageUrl);
                    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
                    const blob = await response.blob();

                    // Déterminer le nom du fichier
                    const prestName = `${a.prestataire?.nom || "Inconnu"}_${a.prestataire?.prenom || ""}`.trim().replace(/[^a-z0-9]/gi, '_');
                    // Essayer de déduire l'extension à partir de l'URL ou du type MIME, par défaut .jpg
                    let extension = "jpg";
                    if (imageUrl.toLowerCase().endsWith(".png")) extension = "png";
                    else if (imageUrl.toLowerCase().endsWith(".jpeg")) extension = "jpeg";
                    else if (imageUrl.toLowerCase().endsWith(".webp")) extension = "webp";

                    const filename = `${prestName}_${index + 1}.${extension}`;

                    // Ajouter au dossier ZIP
                    folder.file(filename, blob);
                } catch (error) {
                    console.error(`Erreur lors du téléchargement de l'image pour ${a.prestataire?.nom}:`, error);
                    // On ne jette pas l'erreur pour ne pas bloquer les autres téléchargements
                }
            });

            // Attendre que tous les téléchargements soient terminés
            await Promise.all(downloadPromises);

            // Générer le ZIP final et le télécharger
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${folderName}.zip`);

            toast.success("Photos téléchargées avec succès !");
        } catch (error) {
            console.error("Erreur globale ZIP:", error);
            toast.error("Erreur lors de la création de l'archive ZIP.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleDownloadPhotos}
            disabled={isDownloading || !affectations || affectations.filter(a => !!a.image_affiche).length === 0}
            className="gap-2 text-[#d61353] border-[#d61353] hover:bg-[#d61353] hover:text-white"
        >
            {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <DownloadCloud className="w-4 h-4" />
            )}
            Télécharger Photos
        </Button>
    );
}
