"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { X, Search, Check } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Client {
    id_client: string;
    nom: string | null;
    prenom: string | null;
    entreprise: string;
}

interface Lieu {
    id_lieu: string;
    nom: string;
    ville: string;
}

interface Service {
    id_service: string;
    nom: string;
}

interface Prestataire {
    id_prestataire: string;
    nom: string;
    prenom: string;
    contact: string;
    id_service: string;
}

interface ManualCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ManualCampaignModal({ isOpen, onClose, onSuccess }: ManualCampaignModalProps) {
    const { apiClient } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [lieux, setLieux] = useState<Lieu[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [allPrestataires, setAllPrestataires] = useState<Prestataire[]>([]);
    const [filteredPrestataires, setFilteredPrestataires] = useState<Prestataire[]>([]);
    const [searchPrestataire, setSearchPrestataire] = useState("");

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchOptions();
        }
    }, [isOpen]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            const [clientRes, lieuRes, serviceRes, prestRes] = await Promise.all([
                apiClient("/api/clients?limit=500"),
                apiClient("/api/lieux?limit=500"),
                apiClient("/api/services?limit=500"),
                apiClient("/api/prestataires?limit=1000"), // Get all prestataires
            ]);

            if (clientRes.ok) {
                const clientData = await clientRes.json();
                setClients(clientData.clients || []);
            }
            if (lieuRes.ok) {
                const lieuData = await lieuRes.json();
                setLieux(lieuData.lieux || []);
            }
            if (serviceRes.ok) {
                const serviceData = await serviceRes.json();
                setServices(serviceData.services || []);
            }
            if (prestRes.ok) {
                const prestData = await prestRes.json();
                setAllPrestataires(prestData.prestataires || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            nom_campagne: "",
            id_client: "",
            id_lieu: "",
            id_service: "",
            selectedPrestataires: [] as string[],
        },
        validationSchema: Yup.object({
            nom_campagne: Yup.string().required("Nom obligatoire"),
            id_client: Yup.string().required("Client obligatoire"),
            id_lieu: Yup.string().required("Lieu obligatoire"),
            id_service: Yup.string().required("Service obligatoire"),
            selectedPrestataires: Yup.array().min(1, "Sélectionnez au moins un prestataire"),
        }),
        onSubmit: async (values) => {
            setSubmitting(true);
            try {
                const res = await apiClient("/api/campagnes/manual", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values),
                });

                if (res.ok) {
                    toast.success("Campagne manuelle créée !");
                    onSuccess();
                    onClose();
                } else {
                    const data = await res.json();
                    toast.error(data.message || "Erreur lors de la création");
                }
            } catch (error) {
                console.error(error);
                toast.error("Erreur de connexion");
            } finally {
                setSubmitting(false);
            }
        },
    });

    // Filter prestataires based on service and search
    useEffect(() => {
        let filtered = allPrestataires;

        // Filter by service if selected
        if (formik.values.id_service) {
            filtered = filtered.filter(p => p.id_service === formik.values.id_service);
        }

        // Filter by search term
        if (searchPrestataire) {
            const term = searchPrestataire.toLowerCase();
            filtered = filtered.filter(p =>
                p.nom.toLowerCase().includes(term) ||
                p.prenom.toLowerCase().includes(term) ||
                p.contact.includes(term)
            );
        }

        setFilteredPrestataires(filtered);
    }, [allPrestataires, formik.values.id_service, searchPrestataire]);

    const togglePrestataire = (id: string) => {
        const current = formik.values.selectedPrestataires;
        const isSelected = current.includes(id);
        if (isSelected) {
            formik.setFieldValue("selectedPrestataires", current.filter(p => p !== id));
        } else {
            formik.setFieldValue("selectedPrestataires", [...current, id]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-2xl shadow-2xl relative border border-gray-200 dark:border-gray-800 max-h-[90vh] flex flex-col">
                <Button
                    variant="ghost"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <X className="w-5 h-5" />
                </Button>

                <div className="mb-4">
                    <h2 className="text-xl font-bold text-[#d61353]">Ajout Manuel de Campagne</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Pour les campagnes existantes avant l'application. Crée une campagne terminée et prépare les désinstallations.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto px-1">
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nom_campagne">Nom de la campagne</Label>
                            <Input
                                id="nom_campagne"
                                {...formik.getFieldProps("nom_campagne")}
                                placeholder="Ex: Campagne Hiver 2024"
                            />
                            {formik.touched.nom_campagne && formik.errors.nom_campagne && (
                                <p className="text-red-500 text-xs">{formik.errors.nom_campagne}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Client</Label>
                                <Select
                                    value={formik.values.id_client}
                                    onValueChange={(val) => formik.setFieldValue("id_client", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id_client} value={c.id_client}>
                                                {c.entreprise || `${c.nom} ${c.prenom}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formik.touched.id_client && formik.errors.id_client && (
                                    <p className="text-red-500 text-xs">{formik.errors.id_client}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Lieu</Label>
                                <Select
                                    value={formik.values.id_lieu}
                                    onValueChange={(val) => formik.setFieldValue("id_lieu", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un lieu" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lieux.map(l => (
                                            <SelectItem key={l.id_lieu} value={l.id_lieu}>
                                                {l.nom} ({l.ville})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formik.touched.id_lieu && formik.errors.id_lieu && (
                                    <p className="text-red-500 text-xs">{formik.errors.id_lieu}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Service (Filtrer les prestataires)</Label>
                            <Select
                                value={formik.values.id_service}
                                onValueChange={(val) => formik.setFieldValue("id_service", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un service" />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map(s => (
                                        <SelectItem key={s.id_service} value={s.id_service}>
                                            {s.nom}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formik.touched.id_service && formik.errors.id_service && (
                                <p className="text-red-500 text-xs">{formik.errors.id_service}</p>
                            )}
                        </div>

                        {/* Prestataire Selection */}
                        <div className="space-y-2 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex justify-between items-center mb-2">
                                <Label>Sélectionner les prestataires à désinstaller ({formik.values.selectedPrestataires.length})</Label>
                                {formik.touched.selectedPrestataires && formik.errors.selectedPrestataires && (
                                    <span className="text-red-500 text-xs">{typeof formik.errors.selectedPrestataires === 'string' ? formik.errors.selectedPrestataires : ''}</span>
                                )}
                            </div>

                            <div className="relative mb-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Rechercher un prestataire..."
                                    value={searchPrestataire}
                                    onChange={(e) => setSearchPrestataire(e.target.value)}
                                    className="pl-9 bg-white dark:bg-gray-900"
                                />
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border rounded-md p-2 bg-white dark:bg-gray-900 h-48">
                                {loading && allPrestataires.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-sm text-gray-500">Chargement...</p>
                                    </div>
                                ) : filteredPrestataires.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-sm text-gray-500">
                                            {formik.values.id_service ? "Aucun prestataire trouvé" : "Veuillez sélectionner un service"}
                                        </p>
                                    </div>
                                ) : (
                                    filteredPrestataires.map(prest => {
                                        const isSelected = formik.values.selectedPrestataires.includes(prest.id_prestataire);
                                        return (
                                            <div
                                                key={prest.id_prestataire}
                                                onClick={() => togglePrestataire(prest.id_prestataire)}
                                                className={`
                                                    flex items-center justify-between p-2 rounded cursor-pointer border transition-colors mb-1
                                                    ${isSelected
                                                        ? "bg-[#d61353]/10 border-[#d61353] dark:bg-[#d61353]/20"
                                                        : "bg-white border-gray-100 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                                                    }
                                                `}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{prest.nom} {prest.prenom}</span>
                                                    <span className="text-xs text-gray-500">{prest.contact}</span>
                                                </div>
                                                {isSelected && <Check className="w-4 h-4 text-[#d61353]" />}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </form>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="outline" onClick={onClose} type="button">
                        Annuler
                    </Button>
                    <Button
                        onClick={() => formik.handleSubmit()}
                        disabled={submitting || loading}
                        className="bg-[#d61353] hover:bg-[#b01044] text-white"
                    >
                        {submitting ? "Création..." : "Ajouter & Suivre"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
