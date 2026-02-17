"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { X, CreditCard, Calendar, Plus, History } from "lucide-react";
import TransactionModal from "./TransactionModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PaiementDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    paiementId: string;
}

interface Transaction {
    id_transaction: string;
    montant: number;
    date_transaction: string;
    moyen_paiement: string;
    reference: string;
    note: string;
    created_by: string;
}

interface PaiementDetail {
    id_paiement: string;
    paiement_base: number;
    paiement_final: number;
    sanction_montant: number;
    statut: "EN_ATTENTE" | "PARTIEL" | "PAYE" | "ANNULE";
    transactions: Transaction[];
    affectation: {
        campagne: {
            nom_campagne: string;
            client: { nom: string; entreprise: string };
        };
        prestataire: {
            nom: string;
            prenom: string;
            contact: string;
        };
    };
}

export default function PaiementDetailModal({
    isOpen,
    onClose,
    paiementId,
}: PaiementDetailModalProps) {
    const { apiClient } = useAuth();
    const [paiement, setPaiement] = useState<PaiementDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await apiClient(`/api/paiements/detail/${paiementId}`);
            if (res.ok) {
                const data = await res.json();
                setPaiement(data);
            }
        } catch (error) {
            console.error("Erreur chargement détails paiement", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && paiementId) {
            fetchDetails();
        }
    }, [isOpen, paiementId]);

    if (!isOpen) return null;

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const totalPaye = paiement?.transactions.reduce((acc, t) => acc + t.montant, 0) || 0;
    const resteAPayer = (paiement?.paiement_final || 0) - totalPaye;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#d61353]/10 rounded-lg">
                            <CreditCard className="w-6 h-6 text-[#d61353]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Détails du Paiement</h2>
                            <p className="text-sm text-gray-500">
                                {paiement?.affectation.campagne.nom_campagne} - {paiement?.affectation.prestataire.nom} {paiement?.affectation.prestataire.prenom}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-10 text-center">Chargement...</div>
                ) : paiement ? (
                    <div className="p-6 space-y-8">
                        {/* Résumé Financier */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                <p className="text-sm text-gray-500 mb-1">Total à Payer</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(paiement.paiement_final)}</p>
                                {paiement.sanction_montant > 0 && (
                                    <span className="text-xs text-red-500">Dont {formatMoney(paiement.sanction_montant)} de pénalités</span>
                                )}
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                                <p className="text-sm text-green-600 dark:text-green-400 mb-1">Déjà Payé</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatMoney(totalPaye)}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Reste à Payer</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatMoney(resteAPayer)}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end">
                            {resteAPayer > 0 && (
                                <button
                                    onClick={() => setIsTransactionModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#d61353] hover:bg-[#b01044] text-white rounded-lg transition shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter un paiement
                                </button>
                            )}
                        </div>

                        {/* Historique */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <History className="w-5 h-5 text-gray-500" />
                                Historique des transactions
                            </h3>
                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">Moyen</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">Référence</th>
                                            <th className="px-4 py-3 font-medium text-gray-500 text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {paiement.transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">Aucune transaction enregistrée</td>
                                            </tr>
                                        ) : (
                                            paiement.transactions.map((t) => (
                                                <tr key={t.id_transaction} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-4 py-3">
                                                        {format(new Date(t.date_transaction), "dd MMMM yyyy HH:mm", { locale: fr })}
                                                    </td>
                                                    <td className="px-4 py-3">{t.moyen_paiement || "-"}</td>
                                                    <td className="px-4 py-3 font-mono text-xs">{t.reference || "-"}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-green-600">
                                                        {formatMoney(t.montant)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 text-center text-red-500">Erreur lors du chargement des données.</div>
                )}
            </div>

            <TransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                paiementId={paiementId}
                onSuccess={() => {
                    fetchDetails();
                }}
                resteAPayer={resteAPayer}
            />
        </div>
    );
}
