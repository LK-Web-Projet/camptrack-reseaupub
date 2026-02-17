"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { CheckCircle, AlertCircle, Calendar, Archive, Users, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ManualCampaignModal from "@/components/desinstallation/ManualCampaignModal";
import EndAssignmentModal from "@/components/campagnes/EndAssignmentModal";

interface Prestataire {
    id_prestataire: string;
    nom: string;
    prenom: string;
    contact: string;
}

interface Paiement {
    type: "INSTALLATION" | "DESINSTALLATION" | "AUTRE";
    statut_paiement: boolean;
}

interface Affectation {
    id_campagne: string;
    id_prestataire: string;
    date_desinstallation: string | null;
    prestataire: Prestataire;
    paiement: Paiement[];
}

interface Campagne {
    id_campagne: string;
    nom_campagne: string;
    date_fin: string;
    status: string;
    client: {
        nom: string | null;
        entreprise: string;
    };
    affectations: Affectation[];
}

export default function DesinstallationPage() {
    const { apiClient } = useAuth();
    const [campagnes, setCampagnes] = useState<Campagne[]>([]);
    const [loading, setLoading] = useState(true);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isEndAssignmentModalOpen, setIsEndAssignmentModalOpen] = useState(false);
    const [selectedPrestataireForEndAssignment, setSelectedPrestataireForEndAssignment] = useState<{
        id_campagne: string;
        id_prestataire: string;
        nom: string;
        prenom: string;
    } | null>(null);

    const fetchCampagnes = async () => {
        try {
            const res = await apiClient("/api/campagnes/finished");
            if (res.ok) {
                const data = await res.json();
                setCampagnes(data.campagnes || []);
            }
        } catch (error) {
            console.error("Erreur fetch campagnes:", error);
            toast.error("Impossible de charger les campagnes terminées");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampagnes();
    }, []);

    const openEndAssignmentModal = (id_campagne: string, id_prestataire: string, nom: string, prenom: string) => {
        setSelectedPrestataireForEndAssignment({ id_campagne, id_prestataire, nom, prenom });
        setIsEndAssignmentModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d61353]"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Archive className="w-8 h-8 text-[#d61353]" />
                        Gestion des Désinstallations
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gérez le retrait des panneaux et les paiements associés pour les campagnes terminées.
                    </p>
                </div>
                <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="mt-4 sm:mt-0 px-4 py-2 bg-[#d61353] text-white rounded-lg hover:bg-[#b01044] transition flex items-center gap-2 shadow-lg shadow-pink-500/20"
                >
                    <span>+ Ajouter Campagne Manuelle</span>
                </button>
            </div>

            {campagnes.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800">
                    <Archive className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucune campagne terminée</h3>
                    <p className="text-gray-500">Toutes les campagnes sont en cours ou ont déjà été traitées.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {campagnes.map((campagne) => (
                        <div key={campagne.id_campagne} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{campagne.nom_campagne}</h3>
                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{campagne.client.nom || campagne.client.entreprise}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Fin: {new Date(campagne.date_fin).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                        {campagne.affectations.length} Prestataire(s)
                                    </span>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {campagne.affectations.map((aff) => {
                                    const isDone = !!aff.date_desinstallation;
                                    // On vérifie si un paiement de désinstallation existe
                                    const hasPayment = aff.paiement?.some(p => p.type === "DESINSTALLATION");

                                    return (
                                        <div key={aff.id_prestataire} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                                    ${isDone ? 'bg-green-500' : 'bg-gray-400'}`}>
                                                    {aff.prestataire.nom.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{aff.prestataire.nom} {aff.prestataire.prenom}</p>
                                                    <p className="text-xs text-gray-500">{aff.prestataire.contact}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                {isDone ? (
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Désinstallé le {new Date(aff.date_desinstallation!).toLocaleDateString()}
                                                        </span>
                                                        {hasPayment && (
                                                            <span className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded" title="Paiement généré">
                                                                <DollarSign className="w-3 h-3" />
                                                                2000 FCFA
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => openEndAssignmentModal(
                                                            campagne.id_campagne,
                                                            aff.id_prestataire,
                                                            aff.prestataire.nom,
                                                            aff.prestataire.prenom
                                                        )}
                                                        className="text-sm px-4 py-2 bg-white border border-[#d61353] text-[#d61353] rounded-lg hover:bg-[#d61353] hover:text-white transition w-full sm:w-auto flex items-center justify-center gap-2"
                                                    >
                                                        Fin de Mission
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* End Assignment Modal */}
            {selectedPrestataireForEndAssignment && (
                <EndAssignmentModal
                    isOpen={isEndAssignmentModalOpen}
                    onClose={() => {
                        setIsEndAssignmentModalOpen(false);
                        setSelectedPrestataireForEndAssignment(null);
                    }}
                    onSuccess={() => {
                        fetchCampagnes();
                    }}
                    campagneId={selectedPrestataireForEndAssignment.id_campagne}
                    prestataireId={selectedPrestataireForEndAssignment.id_prestataire}
                    prestataireName={`${selectedPrestataireForEndAssignment.nom} ${selectedPrestataireForEndAssignment.prenom}`}
                />
            )}

            <ManualCampaignModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                onSuccess={fetchCampagnes}
            />
        </div>
    );
}
