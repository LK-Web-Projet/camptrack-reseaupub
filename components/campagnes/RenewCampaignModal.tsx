"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface PrestataireSummary {
    id_prestataire: string;
    nom: string;
    prenom: string;
    contact: string;
    disponible: boolean;
}

interface RenewCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    campagneId: string;
    nomCampagne: string;
    prestataires: PrestataireSummary[];
}

export default function RenewCampaignModal({
    isOpen,
    onClose,
    campagneId,
    nomCampagne,
    prestataires,
}: RenewCampaignModalProps) {
    const { apiClient } = useAuth();
    const router = useRouter();
    const [dateDebut, setDateDebut] = useState<Date | undefined>(undefined);
    const [dateFin, setDateFin] = useState<Date | undefined>(undefined);
    const [selectedPrestataires, setSelectedPrestataires] = useState<string[]>(
        prestataires.map((p) => p.id_prestataire)
    );
    const [isLoading, setIsLoading] = useState(false);

    // Toggle selection
    const togglePrestataire = (id: string) => {
        setSelectedPrestataires((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const handleRenew = async () => {
        if (!dateDebut || !dateFin) {
            toast.error("Veuillez sélectionner les dates de début et de fin.");
            return;
        }

        if (dateFin <= dateDebut) {
            toast.error("La date de fin doit être après la date de début.");
            return;
        }

        if (selectedPrestataires.length === 0) {
            toast.error("Veuillez sélectionner au moins un prestataire à renouveler.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await apiClient(`/api/campagnes/${campagneId}/renew`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date_debut: dateDebut.toISOString(),
                    date_fin: dateFin.toISOString(),
                    prestataire_ids: selectedPrestataires,
                }),
            });

            const body = await res.json();

            if (!res.ok) {
                throw new Error(body.error || "Erreur lors du renouvellement");
            }

            toast.success(
                `Renouvellement créé ! ${body.data.nb_prestataires_affectes} prestataires affectés.`
            );

            if (body.data.prestataires_non_disponibles.length > 0) {
                toast.warning(
                    `${body.data.prestataires_non_disponibles.length} prestataires n'ont pas pu être reconduits (indisponibles).`
                );
            }

            // Redirection vers la nouvelle campagne
            if (body.data.nouvelle_campagne?.id_campagne) {
                router.push(`/dashboard/campagnes/${body.data.nouvelle_campagne.id_campagne}`);
            }

            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Erreur inconnue");
        } finally {
            setIsLoading(false);
        }
    };

    // Calcul durée
    const getDuration = () => {
        if (!dateDebut || !dateFin) return null;
        const diffTime = Math.abs(dateFin.getTime() - dateDebut.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const duration = getDuration();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Renouveler : {nomCampagne}</DialogTitle>
                    <DialogDescription>
                        Créez une nouvelle campagne basée sur celle-ci. Les mêmes vérifications
                        seront effectuées pour les prestataires.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Section 1: Dates */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2 border-b pb-2">
                            <CalendarIcon className="w-4 h-4" /> Nouvelles Dates
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date de début</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !dateDebut && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateDebut ? (
                                                format(dateDebut, "dd/MM/yyyy", { locale: fr })
                                            ) : (
                                                <span>Choisir date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={dateDebut}
                                            onSelect={setDateDebut}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Date de fin</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !dateFin && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateFin ? (
                                                format(dateFin, "dd/MM/yyyy", { locale: fr })
                                            ) : (
                                                <span>Choisir date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={dateFin}
                                            onSelect={setDateFin}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        {duration !== null && (
                            <p className="text-sm text-muted-foreground text-right">
                                Durée : <span className="font-medium text-foreground">{duration} jours</span>
                            </p>
                        )}
                    </div>

                    {/* Section 2: Prestataires */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2 border-b pb-2">
                            <span className="text-sm border px-1.5 rounded bg-muted">
                                {selectedPrestataires.length} / {prestataires.length}
                            </span>
                            Prestataires à reconduire
                        </h3>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                            {prestataires.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucun prestataire affecté.</p>
                            ) : (
                                prestataires.map((p) => (
                                    <div
                                        key={p.id_prestataire}
                                        className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md"
                                    >
                                        <input
                                            type="checkbox"
                                            id={`p-${p.id_prestataire}`}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={selectedPrestataires.includes(p.id_prestataire)}
                                            onChange={() => togglePrestataire(p.id_prestataire)}
                                        />
                                        <label
                                            htmlFor={`p-${p.id_prestataire}`}
                                            className="flex-1 text-sm cursor-pointer flex justify-between items-center"
                                        >
                                            <span>
                                                <span className="font-medium">{p.nom} {p.prenom}</span>
                                                {!p.disponible && (
                                                    <span className="ml-2 text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                                        Indisponible
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-muted-foreground text-xs">{p.contact}</span>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <button
                                className="hover:underline"
                                onClick={() => setSelectedPrestataires(prestataires.map((p) => p.id_prestataire))}
                            >
                                Tout sélectionner
                            </button>
                            <button
                                className="hover:underline"
                                onClick={() => setSelectedPrestataires([])}
                            >
                                Tout désélectionner
                            </button>
                        </div>
                    </div>

                    {/* Section 3: Info */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800 text-sm space-y-2 text-blue-800 dark:text-blue-300">
                        <div className="flex gap-2">
                            <Info className="w-5 h-5 flex-shrink-0" />
                            <p>
                                <strong>Processus de paiement :</strong> Aucun paiement n'est généré automatiquement.
                                Suivez le processus habituel (vérification matériel → création paiement) une fois la campagne lancée.
                            </p>
                        </div>
                        <div className="flex gap-2 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p>
                                Les prestataires qui ne sont plus disponibles (en mission ailleurs ou statut indisponible)
                                seront automatiquement exclus lors de la création.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button onClick={handleRenew} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Créer le Renouvellement
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
