"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CampaignReport, { type ReportData } from "@/components/reports/CampaignReport";

interface DownloadReportButtonProps {
    campagneId: string;
    campagneName: string;
    /** Fonction apiClient du contexte Auth pour les appels authentifiés */
    apiClient: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function DownloadReportButton({
    campagneId,
    campagneName,
    apiClient,
}: DownloadReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            // 1. Récupérer les données agrégées depuis l'API
            const res = await apiClient(`/api/rapports/campagne/${campagneId}`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Erreur ${res.status} lors de la récupération des données du rapport`);
            }
            const { reportData }: { reportData: ReportData } = await res.json();

            // 2. Générer le PDF côté client avec React-PDF
            const blob = await pdf(<CampaignReport data={reportData} />).toBlob();

            // 3. Déclencher le téléchargement
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `rapport-${campagneName.replace(/\s+/g, "_").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Erreur génération rapport :", err);
            alert(err instanceof Error ? err.message : "Une erreur est survenue lors de la génération du rapport.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            onClick={handleDownload}
            disabled={isGenerating}
            variant="outline"
            className="flex items-center gap-2 border-[#d61353] text-[#d61353] hover:bg-[#d61353]/10 hover:text-[#d61353]"
            id="download-report-btn"
        >
            {isGenerating ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération…
                </>
            ) : (
                <>
                    <FileDown className="w-4 h-4" />
                    Rapport client
                </>
            )}
        </Button>
    );
}
