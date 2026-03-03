"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import {
    CreditCard,
    Download,
    Filter,
    Search,
    AlertCircle,
    CheckCircle,
    Eye,
    DollarSign,
    Clock,
    Ban,
    X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Paginate } from "@/components/Paginate";
import PaiementDetailModal from "./PaiementDetailModal";
import TransactionModal from "./TransactionModal";

interface Transaction {
    id_transaction: string;
    montant: number;
    date_transaction: string;
}

interface Paiement {
    id_paiement: string;
    paiement_base: number;
    paiement_final: number;
    sanction_montant: number;
    statut: "EN_ATTENTE" | "PARTIEL" | "PAYE" | "ANNULE";
    date_paiement: string | null;
    transactions: Transaction[];
    affectation: {
        campagne: {
            nom_campagne: string;
            client: { nom: string };
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

    // Modal de détails
    const [selectedPaiementId, setSelectedPaiementId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Modal de transaction
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const searchParam = useSearchParams();
    const page = parseInt(searchParam?.get("page") || "1");
    const searchFromUrl = searchParam?.get("search") || "";
    const statutFromUrl = searchParam?.get("statut") || "all";
    const campagneFromUrl = searchParam?.get("campagne") || "";
    const dateDebutFromUrl = searchParam?.get("date_debut") || "";
    const dateFinFromUrl = searchParam?.get("date_fin") || "";
    const [totalPages, setTotalPages] = useState(1);

    // États locaux des inputs
    const [searchInput, setSearchInput] = useState(searchFromUrl);
    const [campagneInput, setCampagneInput] = useState(campagneFromUrl);

    // Debounce recherche texte libre
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParam?.toString());
            if (searchInput) {
                params.set("search", searchInput);
            } else {
                params.delete("search");
            }
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Debounce filtre campagne
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParam?.toString());
            if (campagneInput) {
                params.set("campagne", campagneInput);
            } else {
                params.delete("campagne");
            }
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
        }, 400);
        return () => clearTimeout(timer);
    }, [campagneInput]);

    // Changement du filtre statut
    const setFilterStatut = (value: string) => {
        const params = new URLSearchParams(searchParam?.toString());
        if (value && value !== "all") {
            params.set("statut", value);
        } else {
            params.delete("statut");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    // Changement d'une date
    const setDateFilter = (key: "date_debut" | "date_fin", value: string) => {
        const params = new URLSearchParams(searchParam?.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    // Réinitialiser tous les filtres
    const clearAllFilters = () => {
        const params = new URLSearchParams();
        params.set("page", "1");
        setSearchInput("");
        setCampagneInput("");
        router.push(`${pathname}?${params.toString()}`);
    };

    const hasActiveFilters =
        searchFromUrl || campagneFromUrl || dateDebutFromUrl || dateFinFromUrl || statutFromUrl !== "all";

    const fetchPaiements = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                limit: "7",
                page: String(page)
            });

            if (statutFromUrl !== "all") params.append("statut", statutFromUrl);
            if (searchFromUrl) params.append("search", searchFromUrl);
            if (campagneFromUrl) params.append("campagne", campagneFromUrl);
            if (dateDebutFromUrl) params.append("date_debut", dateDebutFromUrl);
            if (dateFinFromUrl) params.append("date_fin", dateFinFromUrl);

            const res = await apiClient(`/api/paiements?${params.toString()}`);

            if (!res.ok) {
                throw new Error("Erreur lors du chargement des paiements");
            }

            const data = await res.json();
            setPaiements(data.paiements || []);
            setTotalPages(data?.pagination?.totalPages || 1);
        } catch (err) {
            console.error("Erreur fetch paiements:", err);
            const message = err instanceof Error ? err.message : "Erreur inconnue";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [apiClient, statutFromUrl, page, searchFromUrl, campagneFromUrl, dateDebutFromUrl, dateFinFromUrl]);

    useEffect(() => {
        fetchPaiements();
    }, [fetchPaiements]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleViewDetails = (id: string) => {
        setSelectedPaiementId(id);
        setIsDetailModalOpen(true);
    };

    const handleOpenTransaction = (id: string) => {
        setSelectedPaiementId(id);
        setIsTransactionModalOpen(true);
    };

    const getResteAPayer = (paiement: Paiement) => {
        const totalPaye = paiement.transactions.reduce((acc, t) => acc + t.montant, 0);
        return Math.max(0, paiement.paiement_final - totalPaye);
    };

    const getStatusStyle = (statut: string) => {
        switch (statut) {
            case "PAYE": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "PARTIEL": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            case "ANNULE": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
            default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
        }
    };

    const getStatusLabel = (statut: string) => {
        switch (statut) {
            case "PAYE": return <><CheckCircle className="w-3 h-3 mr-1" /> Payé</>;
            case "PARTIEL": return <><Clock className="w-3 h-3 mr-1" /> Partiel</>;
            case "ANNULE": return <><Ban className="w-3 h-3 mr-1" /> Annulé</>;
            default: return <><AlertCircle className="w-3 h-3 mr-1" /> En attente</>;
        }
    };

    return (
        <div className="p-6 text-gray-900 dark:text-white space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-[#d61353]">
                    <CreditCard className="w-6 h-6" />
                    <h1 className="text-xl sm:text-2xl font-bold">Gestion des Paiements</h1>
                </div>

                <div className="flex gap-3 mt-4 sm:mt-0">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm">
                        <Download className="w-4 h-4" />
                        <span>Exporter</span>
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                {/* Ligne 1 : Statut + Campagne */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    {/* Filtre Statut */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium whitespace-nowrap">Statut :</span>
                        <select
                            value={statutFromUrl}
                            onChange={(e) => setFilterStatut(e.target.value)}
                            className="text-sm border border-gray-300 rounded-md shadow-sm px-2 py-1.5 focus:border-[#d61353] focus:ring focus:ring-[#d61353]/20 dark:bg-gray-800 dark:border-gray-700"
                        >
                            <option value="all">Tous</option>
                            <option value="EN_ATTENTE">En attente</option>
                            <option value="PARTIEL">Partiel</option>
                            <option value="PAYE">Payés</option>
                            <option value="ANNULE">Annulés</option>
                        </select>
                    </div>

                    {/* Filtre Campagne */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Filtrer par campagne..."
                            value={campagneInput}
                            onChange={(e) => setCampagneInput(e.target.value)}
                            className="pl-9 bg-white dark:bg-gray-800"
                        />
                    </div>

                    {/* Recherche globale */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Rechercher prestataire, client..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 bg-white dark:bg-gray-800"
                        />
                    </div>
                </div>

                {/* Ligne 2 : Filtre par date de paiement */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap shrink-0">
                        Date de paiement :
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Du</span>
                            <input
                                type="date"
                                value={dateDebutFromUrl}
                                onChange={(e) => setDateFilter("date_debut", e.target.value)}
                                className="text-sm border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 bg-white dark:bg-gray-800 focus:border-[#d61353] focus:ring focus:ring-[#d61353]/20 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">au</span>
                            <input
                                type="date"
                                value={dateFinFromUrl}
                                min={dateDebutFromUrl || undefined}
                                onChange={(e) => setDateFilter("date_fin", e.target.value)}
                                className="text-sm border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 bg-white dark:bg-gray-800 focus:border-[#d61353] focus:ring focus:ring-[#d61353]/20 focus:outline-none"
                            />
                        </div>

                        {/* Bouton reset si des filtres actifs */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#d61353] transition ml-2"
                                title="Effacer tous les filtres"
                            >
                                <X className="w-3.5 h-3.5" />
                                Effacer les filtres
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tableau */}
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
                    <div>
                        <table className="min-w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prestataire</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campagne</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Montant Base</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Pénalités</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Net à Payer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Reste</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {paiements.map((paiement) => {
                                    const reste = getResteAPayer(paiement);
                                    return (
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
                                            <td className={`px-6 py-4 text-sm font-bold text-right ${reste > 0 ? "text-[#d61353]" : "text-green-600"}`}>
                                                {formatMoney(reste)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(paiement.statut)}`}>
                                                    {getStatusLabel(paiement.statut)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(paiement.id_paiement)}
                                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-[#d61353] transition"
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {reste > 0 && paiement.statut !== 'ANNULE' && (
                                                        <button
                                                            onClick={() => handleOpenTransaction(paiement.id_paiement)}
                                                            className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition"
                                                            title="Ajouter un paiement"
                                                        >
                                                            <DollarSign className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {totalPages > 1 && <Paginate pages={totalPages} currentPage={page} />}
                    </div>
                )}
            </div>

            {isDetailModalOpen && selectedPaiementId && (
                <PaiementDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedPaiementId(null);
                        fetchPaiements();
                    }}
                    paiementId={selectedPaiementId}
                />
            )}

            {isTransactionModalOpen && selectedPaiementId && (
                <TransactionModal
                    isOpen={isTransactionModalOpen}
                    onClose={() => setIsTransactionModalOpen(false)}
                    paiementId={selectedPaiementId}
                    resteAPayer={getResteAPayer(paiements.find(p => p.id_paiement === selectedPaiementId)!) || 0}
                    onSuccess={() => {
                        fetchPaiements();
                    }}
                />
            )}
        </div>
    );
}
