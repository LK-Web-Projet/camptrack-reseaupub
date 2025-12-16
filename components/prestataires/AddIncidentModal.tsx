"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { UploadCloud, AlertTriangle, Info } from "lucide-react";

interface Affectation {
    campagne: {
        id_campagne: string;
        nom_campagne: string;
    };
}

interface AddIncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    prestataireId: string;
    affectations: Affectation[];
    onIncidentAdded: () => void;
}

export default function AddIncidentModal({
    isOpen,
    onClose,
    prestataireId,
    affectations,
    onIncidentAdded
}: AddIncidentModalProps) {
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form states
    const [selectedCampagne, setSelectedCampagne] = useState<string>("");
    const [etat, setEtat] = useState<"BON" | "MOYEN" | "MAUVAIS">("MAUVAIS");
    const [description, setDescription] = useState("");

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            if (affectations.length > 0) {
                setSelectedCampagne(affectations[0].campagne.id_campagne);
            }
            setEtat("MAUVAIS");
            setDescription("");
        }
    }, [isOpen, affectations]);

    const handleSubmit = async () => {
        if (!selectedCampagne) {
            toast.error("Veuillez sélectionner une campagne.");
            return;
        }
        if (!description.trim()) {
            toast.error("Veuillez fournir une description.");
            return;
        }

        setLoading(true);
        try {
            // Payload simplifié - les pénalités sont calculées automatiquement par l'API
            const payload = {
                id_prestataire: prestataireId,
                id_campagne: selectedCampagne,
                nom_materiel: "Matériel Publicitaire",
                etat,
                description,
            };

            const res = await apiClient("/api/materiels-cases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Erreur lors de la déclaration de l'incident");
            }

            toast.success("Incident déclaré et impact financier calculé automatiquement.");
            onIncidentAdded();
            onClose();
        } catch (err) {
            console.error("Erreur incident:", err);
            toast.error(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#d61353]">
                        <AlertTriangle className="w-5 h-5" />
                        Déclarer un Incident
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Campagne */}
                    <div className="space-y-2">
                        <Label>Campagne Concernée</Label>
                        <Select value={selectedCampagne} onValueChange={setSelectedCampagne}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une campagne" />
                            </SelectTrigger>
                            <SelectContent>
                                {affectations.length === 0 ? (
                                    <SelectItem value="none" disabled>Aucune campagne active</SelectItem>
                                ) : (
                                    affectations.map((aff) => (
                                        <SelectItem key={aff.campagne.id_campagne} value={aff.campagne.id_campagne}>
                                            {aff.campagne.nom_campagne}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* État */}
                    <div className="space-y-2">
                        <Label>État du Matériel</Label>
                        <div className="flex gap-2">
                            {(["BON", "MOYEN", "MAUVAIS"] as const).map((e) => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => setEtat(e)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${etat === e
                                        ? e === "BON"
                                            ? "bg-green-100 border-green-500 text-green-700"
                                            : e === "MOYEN"
                                                ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                                                : "bg-red-100 border-red-500 text-red-700"
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        }`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Description de l&apos;incident</Label>
                        <Textarea
                            placeholder="Détails sur l'incident (ex: Déchirure, panne...)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none"
                        />
                    </div>

                    {/* Info message about automatic penalty calculation */}
                    <div className="flex items-start gap-2 border p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Calcul automatique des pénalités
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Si l&apos;état est MAUVAIS, une pénalité sera automatiquement appliquée selon le type de client.
                            </p>
                        </div>
                    </div>

                    {/* Photo (Fake Upload UI for now since API needs URL and we strictly implement what's needed for flow) */}
                    <div className="space-y-2">
                        <Label>Photo Preuve (Optionnel)</Label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer">
                            <UploadCloud className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-xs">Glisser-déposer ou cliquer (Non implémenté)</span>
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button
                        className="bg-[#d61353] hover:bg-[#b01044]"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Enregistrement..." : "Enregistrer l'incident"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
