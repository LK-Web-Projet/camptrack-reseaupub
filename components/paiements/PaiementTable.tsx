"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import {
    CreditCard,
    Eye,
    CheckCircle,
    AlertCircle,
    Search,
    Filter,
    Download,
    X,
    Save,
    Edit2
} from "lucide-react";
import Link from "next/link";

// Types basés sur l'API
interface Paiement {
    id_paiement: string;
    id_campagne: string;
    id_prestataire: string;
    paiement_base: number;
    sanction_montant: number;
    paiement_final: number;
    statut_paiement: boolean; // true = Payé, false = En attente
    date_paiement: string | null;
    created_at: string;
    affectation: {
        campagne: {
            nom_campagne: string;
            client: {
                nom: string;
            };
        };
        prestataire: {
            nom: string;
            prenom: string;
            contact: string;
        };
    };
}

export default function PaiementTable() {
    const { apiClient } = useAuth();
    const [paiements, setPaiements] = useState<Paiement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtres
    const [filterStatut, setFilterStatut] = useState<string>("all"); // all, paid, pending

    // Modal de détails et édition
    const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [materiels, setMateriels] = useState<any[]>([]);
    const [loadingMateriels, setLoadingMateriels] = useState(false);

    // États d'édition
    const [isEditing, setIsEditing] = useState(false);
    const [editStatut, setEditStatut] = useState<boolean>(false);
    const [editDate, setEditDate] = useState<string>("");
    const [saving, setSaving] = useState(false);

    const fetchPaiements = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Construction des query params
            const params = new URLSearchParams({
                limit: "100",
                page: "1"
            });
            if (filterStatut === "paid") params.append("statut_paiement", "true");
            if (filterStatut === "pending") params.append("statut_paiement", "false");

            const res = await apiClient(`/api/paiements?${params.toString()}`);

            if (!res.ok) {
                throw new Error("Erreur lors du chargement des paiements");
            }

            const data = await res.json();
            setPaiements(data.paiements || []);
        } catch (err) {
            console.error("Erreur fetch paiements:", err);
            const message = err instanceof Error ? err.message : "Erreur inconnue";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [apiClient, filterStatut]);

    useEffect(() => {
        fetchPaiements();
    }, [fetchPaiements]);

    // Fonction utilitaire pour le formatage monétaire
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Fonction pour ouvrir le modal de détails
    const handleViewDetails = async (paiement: Paiement) => {
        setSelectedPaiement(paiement);
        setIsEditing(false); // Reset edit mode

        // Initialiser les valeurs d'édition
        setEditStatut(paiement.statut_paiement);
        setEditDate(paiement.date_paiement ? new Date(paiement.date_paiement).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

        setIsDetailModalOpen(true);

        // Charger les matériels casés associés
        setLoadingMateriels(true);
        try {
            const params = new URLSearchParams({
                id_campagne: paiement.id_campagne,
                id_prestataire: paiement.id_prestataire
            });
            const res = await apiClient(`/api/materiels-cases?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setMateriels(data.materiels_cases || []);
            }
        } catch (err) {
            console.error("Erreur chargement matériels:", err);
        } finally {
            setLoadingMateriels(false);
        }
    };

    // Fonction pour sauvegarder les modifications
    const handleSaveStatus = async () => {
        if (!selectedPaiement) return;

        setSaving(true);
        try {
            const body = {
                statut_paiement: editStatut,
                date_paiement: editStatut ? editDate : null // Si non payé, pas de date
            };

            const res = await apiClient(`/api/paiements/${selectedPaiement.id_campagne}/${selectedPaiement.id_prestataire}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Erreur lors de la mise à jour");
            }

            const data = await res.json();
            toast.success("Statut de paiement mis à jour");

            // Mettre à jour l'état local et la liste
            setSelectedPaiement(data.paiement);
            setIsEditing(false);
            fetchPaiements(); // Rafraîchir la liste
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Erreur de mise à jour");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 text-gray-900 dark:text-white space-y-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-[#d61353]">
                    <CreditCard className="w-6 h-6" />
                    <h1 className="text-xl sm:text-2xl font-bold">Gestion des Paiements</h1>
                </div>

                <div className="flex gap-3 mt-4 sm:mt-0">
                    {/* Bouton Export (Placeholder) */}
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm">
                        <Download className="w-4 h-4" />
                        <span>Exporter</span>
                    </button>
                </div>
            </div>

            {/* BARRE D'OUTILS & FILTRES */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Filtrer par statut:</span>
                    <select
                        value={filterStatut}
                        onChange={(e) => setFilterStatut(e.target.value)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-[#d61353] focus:ring focus:ring-[#d61353] focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700"
                    >
                        <option value="all">Tous</option>
                        <option value="pending">En attente</option>
                        <option value="paid">Payés</option>
                    </select>
                </div>
            </div>

            {/* TABLEAU */}
            <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
                        <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">Chargement des données financières...</p>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-12 bg-red-50 dark:bg-red-900/10">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        {error}
                    </div>
                ) : paiements.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        Aucun paiement trouvé pour ces critères.
                    </div>
                ) : (
                    <table className="min-w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prestataire</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campagne</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Montant Base</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Pénalités</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Net à Payer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paiements.map((paiement) => (
                                <tr key={paiement.id_paiement} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold mr-3 text-gray-600 dark:text-gray-300">
                                                {paiement.affectation.prestataire.nom.charAt(0)}{paiement.affectation.prestataire.prenom.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {paiement.affectation.prestataire.nom} {paiement.affectation.prestataire.prenom}
                                                </div>
                                                <div className="text-xs text-gray-500">{paiement.affectation.prestataire.contact}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="font-medium">{paiement.affectation.campagne.nom_campagne}</div>
                                        <div className="text-xs text-gray-500">{paiement.affectation.campagne.client.nom}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                                        {formatMoney(paiement.paiement_base)}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-right text-red-600 dark:text-red-400">
                                        {paiement.sanction_montant > 0 ? `-${formatMoney(paiement.sanction_montant)}` : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-right text-gray-900 dark:text-white">
                                        {formatMoney(paiement.paiement_final)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paiement.statut_paiement
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            }`}>
                                            {paiement.statut_paiement ? (
                                                <>
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Payé
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-3 h-3 mr-1" /> En attente
                                                </>
                                            )}
                                        </span>
                                        {paiement.date_paiement && (
                                            <div className="text-[10px] text-gray-400 mt-1">
                                                le {new Date(paiement.date_paiement).toLocaleDateString("fr-FR")}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {/* Action Voir */}
                                            <button
                                                onClick={() => handleViewDetails(paiement)}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-[#d61353] transition"
                                                title="Voir détails / Modifier"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de détails du paiement */}
            {isDetailModalOpen && selectedPaiement && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-[#d61353]" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {isEditing ? "Modifier le paiement" : "Détails du Paiement"}
                                </h2>
                            </div>
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    setSelectedPaiement(null);
                                    setMateriels([]);
                                    setIsEditing(false);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Informations générales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prestataire</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {selectedPaiement.affectation.prestataire.nom} {selectedPaiement.affectation.prestataire.prenom}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPaiement.affectation.prestataire.contact}</p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Campagne</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedPaiement.affectation.campagne.nom_campagne}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Client: {selectedPaiement.affectation.campagne.client.nom}</p>
                                </div>
                            </div>

                            {/* Détails financiers */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Détails Financiers</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Montant de base</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(selectedPaiement.paiement_base)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                                        <span>Pénalités appliquées</span>
                                        <span className="font-semibold">-{formatMoney(selectedPaiement.sanction_montant)}</span>
                                    </div>
                                    <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-bold text-gray-900 dark:text-white">Net à payer</span>
                                        <span className="font-bold text-[#d61353]">{formatMoney(selectedPaiement.paiement_final)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Statut du paiement - Zone Modifiable */}
                            <div className={`p-4 rounded-lg ${isEditing ? "bg-white border-2 border-[#d61353]/20" : "bg-gray-50 dark:bg-gray-800"}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Statut du Paiement</h3>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 text-sm text-[#d61353] hover:underline"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Modifier
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">État du paiement</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={!editStatut}
                                                        onChange={() => setEditStatut(false)}
                                                        className="text-[#d61353] focus:ring-[#d61353]"
                                                    />
                                                    <span className="flex items-center gap-1 text-yellow-600"><AlertCircle className="w-4 h-4" /> En attente</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={editStatut}
                                                        onChange={() => setEditStatut(true)}
                                                        className="text-[#d61353] focus:ring-[#d61353]"
                                                    />
                                                    <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Payé</span>
                                                </label>
                                            </div>
                                        </div>

                                        {editStatut && (
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Date de paiement</label>
                                                <input
                                                    type="date"
                                                    value={editDate}
                                                    onChange={(e) => setEditDate(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                disabled={saving}
                                                className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={handleSaveStatus}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#d61353] hover:bg-[#b01044] text-white disabled:opacity-50"
                                            >
                                                {saving ? "Enregistrement..." : (
                                                    <><Save className="w-4 h-4" /> Enregistrer</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Affichage Lecture Seule */
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedPaiement.statut_paiement
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                }`}>
                                                {selectedPaiement.statut_paiement ? (
                                                    <><CheckCircle className="w-4 h-4 mr-1" /> Payé</>
                                                ) : (
                                                    <><AlertCircle className="w-4 h-4 mr-1" /> En attente</>
                                                )}
                                            </span>
                                        </div>
                                        {selectedPaiement.date_paiement ? (
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date de paiement</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {new Date(selectedPaiement.date_paiement).toLocaleDateString("fr-FR", {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Aucune date enregistrée</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Matériels casés */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Matériels Casés ({materiels.length})</h3>
                                </div>
                                <div className="p-4">
                                    {loadingMateriels ? (
                                        <div className="text-center py-4 text-gray-500">Chargement...</div>
                                    ) : materiels.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">Aucun matériel casé</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {materiels.map((materiel: any) => (
                                                <div key={materiel.id_materiels_case} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div className={`w-2 h-2 rounded-full mt-2 ${materiel.etat === 'BON' ? 'bg-green-500' :
                                                        materiel.etat === 'MOYEN' ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                        }`}></div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium text-gray-900 dark:text-white">{materiel.nom_materiel}</span>
                                                            <span className={`text-xs px-2 py-1 rounded ${materiel.etat === 'BON' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                                materiel.etat === 'MOYEN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                                }`}>
                                                                {materiel.etat}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{materiel.description}</p>
                                                        {materiel.penalite_appliquer && materiel.montant_penalite > 0 && (
                                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                                Pénalité: {formatMoney(materiel.montant_penalite)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
