"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle } from "lucide-react";

interface AddTypeIncidentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onTypeAdded: (newType: { id_type_incident: string; nom: string; description: string | null }) => void;
}

export default function AddTypeIncidentDialog({
    isOpen,
    onClose,
    onTypeAdded
}: AddTypeIncidentDialogProps) {
    const { apiClient } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [nom, setNom] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nom.trim()) {
            toast.error("Veuillez entrer le nom du type d'incident.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = { nom, description };
            const res = await apiClient("/api/types-incidents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || "Erreur lors de la création du type d'incident.");
            }

            const newType = await res.json();
            toast.success(`Nouveau type d'incident "${newType.nom}" créé.`);
            onTypeAdded(newType); // Callback to parent with new type data
            setNom("");
            setDescription("");
            onClose();
        } catch (err) {
            console.error("Error creating incident type:", err);
            toast.error(err instanceof Error ? err.message : "Erreur inconnue lors de la création du type.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PlusCircle className="h-5 w-5 text-[#d61353]" />
                        Créer un Nouveau Type d'Incident
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="space-y-1">
                        <Label htmlFor="nom" className="text-right">
                            Nom
                        </Label>
                        <Input
                            id="nom"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            placeholder="Ex: Retard, Panne Véhicule"
                            required
                            className="col-span-3"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="description" className="text-right">
                            Description (Optionnel)
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description détaillée du type d'incident."
                            className="col-span-3"
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={submitting} className="bg-[#d61353] hover:bg-[#b01044]">
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                "Créer"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
