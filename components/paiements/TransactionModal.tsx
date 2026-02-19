"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { X, Save, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    paiementId: string;
    onSuccess: () => void;
    resteAPayer: number;
}

export default function TransactionModal({
    isOpen,
    onClose,
    paiementId,
    onSuccess,
    resteAPayer,
}: TransactionModalProps) {
    const { apiClient } = useAuth();
    const [montant, setMontant] = useState("");
    const [moyenPaiement, setMoyenPaiement] = useState("");
    const [reference, setReference] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await apiClient(`/api/paiements/detail/${paiementId}/transactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    montant: parseFloat(montant),
                    moyen_paiement: moyenPaiement,
                    reference,
                    note,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Erreur lors de l'ajout de la transaction");
            }

            toast.success("Transaction ajoutée avec succès");
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-[#d61353]" />
                        Ajouter un paiement
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Montant (FCFA)</label>
                        <Input
                            type="number"
                            value={montant}
                            onChange={(e) => setMontant(e.target.value)}
                            placeholder={`Max: ${resteAPayer}`}
                            max={resteAPayer}
                            min={1}
                            required
                            className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Reste à payer : {resteAPayer} FCFA</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Moyen de paiement</label>
                        <select
                            value={moyenPaiement}
                            onChange={(e) => setMoyenPaiement(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-[#d61353]"
                        >
                            <option value="">Sélectionner...</option>
                            <option value="ESPECE">Espèces</option>
                            <option value="MOBILE_MONEY">Mobile Money</option>
                            <option value="VIREMENT">Virement</option>
                            <option value="CHEQUE">Chèque</option>
                            <option value="AUTRE">Autre</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Référence (Optionnel)</label>
                        <Input
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Ex: ID Transaction Mobile Money"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Note (Optionnel)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-[#d61353]"
                            rows={2}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#d61353] hover:bg-[#b01044] text-white disabled:opacity-50 transition"
                        >
                            {loading ? "Enregistrement..." : (
                                <>
                                    <Save className="w-4 h-4" /> Enregistrer
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
