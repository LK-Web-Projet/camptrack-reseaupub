"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { ArrowLeft, MapPin, Phone, Mail, Building, User, Calendar, Activity, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

type Client = {
    id_client: string;
    nom?: string | null;
    prenom?: string | null;
    entreprise?: string | null;
    domaine_entreprise?: string | null;
    adresse?: string | null;
    contact?: string | null;
    mail?: string | null;
    type_client?: string | null;
    created_at: string;
};

type Campagne = {
    id_campagne: string;
    nom_campagne: string;
    description?: string | null;
    objectif?: string | null;
    type_campagne: string;
    date_debut: string;
    date_fin: string;
    status: string;
    lieu?: {
        nom: string;
        ville: string;
    } | null;
};

type Statistics = {
    campagnes: {
        total: number;
        actives: number;
        parStatus: {
            PLANIFIEE: number;
            EN_COURS: number;
            TERMINEE: number;
            ANNULEE: number;
        };
        parType: {
            MASSE: number;
            PROXIMITE: number;
            NON_SPECIFIE: number;
        };
    };
    prestataires: {
        totalAffectations: number;
    };
};

const formatDate = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
};

export default function ClientDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { apiClient } = useAuth();

    const [client, setClient] = useState<Client | null>(null);
    const [campagnes, setCampagnes] = useState<Campagne[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            setLoading(true);
            try {
                // Fetch client details
                const clientRes = await apiClient(`/api/clients/${id}`);
                if (!clientRes.ok) throw new Error("Impossible de charger les informations du client");
                const clientData = await clientRes.json();
                setClient(clientData.client);

                // Fetch client campaigns
                const campaignsRes = await apiClient(`/api/clients/${id}/campagnes`);
                if (!campaignsRes.ok) throw new Error("Impossible de charger les campagnes du client");
                const campaignsData = await campaignsRes.json();
                setCampagnes(Array.isArray(campaignsData.campagnes) ? campaignsData.campagnes : []);



                // Fetch client statistics
                const statsRes = await apiClient(`/api/clients/${id}/campagnes/statistiques`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStatistics(statsData);
                }

            } catch (err) {
                console.error(err);
                setError("Une erreur est survenue lors du chargement des données");
                toast.error("Erreur lors du chargement des données");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, apiClient]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 h-full">
                <div className="w-12 h-12 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Chargement des détails...</p>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="p-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Retour</span>
                </button>
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center">
                    {error || "Client introuvable"}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 text-gray-900 dark:text-white max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <User className="w-6 h-6 text-[#d61353]" />
                        {client.nom} {client.prenom}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Client depuis le {formatDate(client.created_at)}
                    </p>
                </div>
            </div>

            {/* Client Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Contact Info */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Phone className="w-5 h-5 text-blue-500" />
                        Coordonnées
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Email</p>
                                <p className="font-medium">{client.mail || "-"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Téléphone</p>
                                <p className="font-medium">{client.contact || "-"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Adresse</p>
                                <p className="font-medium">{client.adresse || "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional Info */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Building className="w-5 h-5 text-purple-500" />
                        Informations Professionnelles
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Entreprise</p>
                            <p className="font-medium text-lg">{client.entreprise || "-"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Domaine</p>
                                <p className="font-medium">{client.domaine_entreprise || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Type</p>
                                <p className="font-medium">{client.type_client || "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Summary (Placeholder for future stats) */}
                {/* Stats Summary */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 md:col-span-2 lg:col-span-1">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Activity className="w-5 h-5 text-green-500" />
                        Statistiques Campagnes
                    </h2>

                    {statistics ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                                <p className="text-xs text-gray-500 uppercase mb-1">Total</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.campagnes.total}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                                <p className="text-xs text-green-600 dark:text-green-400 uppercase mb-1">En cours</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{statistics.campagnes.parStatus.EN_COURS}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase mb-1">Planifiées</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{statistics.campagnes.parStatus.PLANIFIEE}</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl">
                                <p className="text-xs text-gray-600 dark:text-gray-300 uppercase mb-1">Terminées</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{statistics.campagnes.parStatus.TERMINEE}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-gray-500">
                            Chargement des stats...
                        </div>
                    )}
                </div>

            </div>

            {/* Campaigns Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#d61353]" />
                        Historique des Campagnes
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Nom Campagne</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Période</th>
                                <th className="px-6 py-4">Lieu</th>
                                <th className="px-6 py-4">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {campagnes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Aucune campagne trouvée pour ce client.
                                    </td>
                                </tr>
                            ) : (
                                campagnes.map((campagne) => (
                                    <tr key={campagne.id_campagne} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {campagne.nom_campagne}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${campagne.status === 'EN_COURS' ? 'bg-green-100 text-green-700' :
                                                campagne.status === 'TERMINEE' ? 'bg-gray-100 text-gray-700' :
                                                    campagne.status === 'PLANIFIEE' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {campagne.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            <div className="flex flex-col text-xs">
                                                <span>Du {formatDate(campagne.date_debut)}</span>
                                                <span>Au {formatDate(campagne.date_fin)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {campagne.lieu ? `${campagne.lieu.nom}, ${campagne.lieu.ville}` : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {campagne.type_campagne}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
