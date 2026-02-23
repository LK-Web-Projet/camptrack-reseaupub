"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Phone, Search, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import AddAppelModal from "@/components/appels/AddAppelModal";
import EditAppelModal from "@/components/appels/EditAppelModal";
import DeleteAppelModal from "@/components/appels/DeleteAppelModal";
import { toast } from "react-toastify";
import { useAuth } from "@/app/context/AuthContext";
import { Paginate } from "@/components/Paginate";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export type Appel = {
    id_appel: string;
    id_prestataire: string;
    date_appel: string;
    duree_minutes?: number | null;
    direction: "ENTRANT" | "SORTANT";
    motif: string;
    commentaire?: string | null;
    created_at: string;
    updated_at: string;
    prestataire?: {
        id_prestataire: string;
        nom: string;
        prenom: string;
        contact?: string;
    };
};

const formatDate = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const ITEMS_PER_PAGE = 10;

export default function AppelTable() {
    const [appels, setAppels] = useState<Appel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const { apiClient } = useAuth();

    const searchParam = useSearchParams();
    const page = parseInt(searchParam?.get("page") || "1");

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [appelToEdit, setAppelToEdit] = useState<Appel | null>(null);
    const [appelToDelete, setAppelToDelete] = useState<Appel | null>(null);

    const fetchAppels = async () => {
        setLoading(true);
        try {
            const res = await apiClient("/api/appels");
            if (!res.ok) throw new Error("Erreur lors du chargement des appels");
            const data = await res.json();
            setAppels(Array.isArray(data) ? data : []);
        } catch {
            setError("Impossible de charger les appels");
            toast.error("Impossible de charger les appels");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppels();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredAppels = appels.filter((a) => {
        const search = searchQuery.toLowerCase();
        const nomPrestataire = `${a.prestataire?.nom || ""} ${a.prestataire?.prenom || ""}`.toLowerCase();
        return (
            nomPrestataire.includes(search) ||
            (a.motif || "").toLowerCase().includes(search) ||
            (a.commentaire || "").toLowerCase().includes(search)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredAppels.length / ITEMS_PER_PAGE));
    const paginatedAppels = filteredAppels.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleAddAppel = (newAppel: Appel) => {
        setAppels((prev) => [newAppel, ...prev]);
    };

    const handleEditAppel = (updated: Appel) => {
        setAppels((prev) => prev.map((a) => (a.id_appel === updated.id_appel ? updated : a)));
    };

    const handleDeleteAppel = async () => {
        if (!appelToDelete) return;
        try {
            const res = await apiClient(`/api/appels/${appelToDelete.id_appel}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Erreur lors de la suppression");
            setAppels((prev) => prev.filter((a) => a.id_appel !== appelToDelete.id_appel));
            toast.success("Appel supprimé avec succès");
        } catch {
            toast.error("Erreur lors de la suppression de l'appel");
        } finally {
            setAppelToDelete(null);
            setIsDeleteOpen(false);
        }
    };

    return (
        <div className="p-6 text-gray-900 dark:text-white">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 text-[#d61353]">
                    <Phone className="w-6 h-6" />
                    <h1 className="text-xl sm:text-2xl font-bold">Gestion des appels</h1>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 bg-[#d61353] hover:bg-[#b01044] text-white px-4 py-2 rounded-lg shadow transition mt-3 sm:mt-0"
                >
                    <Plus className="w-5 h-5" />
                    <span>Ajouter un appel</span>
                </button>
            </div>

            {/* Search */}
            <div className="flex justify-end mb-4">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Rechercher par prestataire ou motif..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white dark:bg-gray-800"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin" />
                        <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">Chargement des appels...</p>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-8">{error}</div>
                ) : filteredAppels.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Aucun appel trouvé</div>
                ) : (
                    <div>
                        <table className="min-w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800 text-left text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
                                    <th className="px-6 py-3">Prestataire</th>
                                    <th className="px-6 py-3">Date & Heure</th>
                                    <th className="px-6 py-3">Direction</th>
                                    <th className="px-6 py-3">Motif</th>
                                    <th className="px-6 py-3">Durée (min)</th>
                                    <th className="px-6 py-3">Commentaire</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedAppels.map((a, i) => (
                                    <tr
                                        key={a.id_appel}
                                        className={`transition hover:bg-gray-50 dark:hover:bg-gray-800 ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-950"
                                            }`}
                                    >
                                        <td className="px-6 py-4 font-medium">
                                            {a.prestataire ? `${a.prestataire.nom} ${a.prestataire.prenom}` : "-"}
                                            {a.prestataire?.contact && (
                                                <div className="text-xs text-gray-500">{a.prestataire.contact}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(a.date_appel)}</td>
                                        <td className="px-6 py-4">
                                            {a.direction === "ENTRANT" ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <PhoneIncoming className="w-3 h-3" />
                                                    Entrant
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                    <PhoneOutgoing className="w-3 h-3" />
                                                    Sortant
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px] truncate" title={a.motif}>{a.motif}</td>
                                        <td className="px-6 py-4">{a.duree_minutes ?? "-"}</td>
                                        <td className="px-6 py-4 max-w-[200px] truncate text-gray-500" title={a.commentaire ?? ""}>
                                            {a.commentaire || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-3">
                                                <button
                                                    onClick={() => { setAppelToEdit(a); setIsEditOpen(true); }}
                                                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setAppelToDelete(a); setIsDeleteOpen(true); }}
                                                    className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && <Paginate pages={totalPages} currentPage={page} />}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddAppelModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onAddAppel={(appel) => { handleAddAppel(appel); setIsAddOpen(false); }}
            />
            {appelToEdit && (
                <EditAppelModal
                    isOpen={isEditOpen}
                    onClose={() => { setIsEditOpen(false); setAppelToEdit(null); }}
                    appel={appelToEdit}
                    onEditAppel={(updated) => { handleEditAppel(updated); setIsEditOpen(false); setAppelToEdit(null); }}
                />
            )}
            <DeleteAppelModal
                isOpen={isDeleteOpen}
                onClose={() => { setIsDeleteOpen(false); setAppelToDelete(null); }}
                onConfirm={handleDeleteAppel}
            />
        </div>
    );
}
