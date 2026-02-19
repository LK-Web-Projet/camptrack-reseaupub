"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "react-toastify";
import { Loader2, AlertTriangle, ArrowRightLeft, UserX } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

interface EndAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    campagneId: string;
    prestataireId: string;
    prestataireName: string;
}

export default function EndAssignmentModal({
    isOpen,
    onClose,
    onSuccess,
    campagneId,
    prestataireId,
    prestataireName
}: EndAssignmentModalProps) {
    const { apiClient } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"STANDARD" | "REASSIGNATION">("STANDARD");

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient("/api/campagnes/desinstallation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_campagne: campagneId,
                    id_prestataire: prestataireId,
                    mode
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Erreur lors de la fin de mission");
            }

            toast.success(
                mode === "STANDARD"
                    ? "Mission terminée. Paiement de dépose (2000 FCFA) généré."
                    : "Mission terminée (Réassignation). Aucun frais de dépose."
            );
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Fin de mission : {prestataireName}</DialogTitle>
                    <DialogDescription>
                        Veuillez sélectionner le motif de fin de mission pour calculer les frais de dépose.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <RadioGroup value={mode} onValueChange={(v) => setMode(v as "STANDARD" | "REASSIGNATION")} className="gap-4">

                        {/* Option 1: Standard */}
                        <div className={`flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${mode === "STANDARD" ? "border-[#d61353] bg-[#d61353]/5" : "border-gray-200 hover:bg-gray-50"}`}>
                            <RadioGroupItem value="STANDARD" id="standard" className="mt-1" />
                            <div className="grid gap-1.5 cursor-pointer" onClick={() => setMode("STANDARD")}>
                                <Label htmlFor="standard" className="font-semibold text-base cursor-pointer flex items-center gap-2">
                                    <UserX className="w-4 h-4" />
                                    Dépose Standard
                                </Label>
                                <p className="text-sm text-gray-500">
                                    Le prestataire retire les panneaux et s'en va.
                                </p>
                                <div className="text-sm font-medium text-[#d61353] mt-1">
                                    Impact : Génère un paiement de 2 000 FCFA
                                </div>
                            </div>
                        </div>

                        {/* Option 2: Réassignation */}
                        <div className={`flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${mode === "REASSIGNATION" ? "border-[#d61353] bg-[#d61353]/5" : "border-gray-200 hover:bg-gray-50"}`}>
                            <RadioGroupItem value="REASSIGNATION" id="reassign" className="mt-1" />
                            <div className="grid gap-1.5 cursor-pointer" onClick={() => setMode("REASSIGNATION")}>
                                <Label htmlFor="reassign" className="font-semibold text-base cursor-pointer flex items-center gap-2">
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Réassignation Immédiate
                                </Label>
                                <p className="text-sm text-gray-500">
                                    Le prestataire enchaîne directement sur une autre campagne.
                                </p>
                                <div className="text-sm font-medium text-green-600 mt-1">
                                    Impact : 0 FCFA (Pas de frais de dépose)
                                </div>
                            </div>
                        </div>

                    </RadioGroup>

                    {mode === "REASSIGNATION" && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-yellow-700">
                                En choisissant cette option, vous confirmez que le prestataire installe une nouvelle campagne dans la foulée (délai &lt; 72h). Aucun paiement de dépose ne sera versé.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#d61353] hover:bg-[#b00f43]">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmer la fin de mission
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
