"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import type { Appel } from "@/components/appels/AppelTable";

type Prestataire = {
    id_prestataire: string;
    nom: string;
    prenom: string;
};

interface AddAppelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddAppel?: (appel: Appel) => void;
}

export default function AddAppelModal({ isOpen, onClose, onAddAppel }: AddAppelModalProps) {
    const { apiClient } = useAuth();
    const [prestataires, setPrestataires] = useState<Prestataire[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        apiClient("/api/prestataires")
            .then((r) => r.json())
            .then((data) => {
                const list = Array.isArray(data) ? data : data?.prestataires || [];
                setPrestataires(list);
            })
            .catch(() => toast.error("Impossible de charger les prestataires"));
    }, [isOpen, apiClient]);

    const formik = useFormik({
        initialValues: {
            id_prestataire: "",
            date_appel: new Date().toISOString().slice(0, 16),
            direction: "SORTANT" as "ENTRANT" | "SORTANT",
            motif: "",
            duree_minutes: "",
            commentaire: "",
        },
        validationSchema: Yup.object({
            id_prestataire: Yup.string().required("Le prestataire est requis"),
            date_appel: Yup.string().required("La date est requise"),
            direction: Yup.string().oneOf(["ENTRANT", "SORTANT"]).required(),
            motif: Yup.string().min(2, "Au moins 2 caractères").required("Le motif est requis"),
            duree_minutes: Yup.number().integer().min(0).nullable().optional(),
            commentaire: Yup.string().nullable().optional(),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                const payload = {
                    ...values,
                    date_appel: new Date(values.date_appel).toISOString(),
                    duree_minutes: values.duree_minutes ? Number(values.duree_minutes) : null,
                    commentaire: values.commentaire || null,
                };

                const res = await apiClient("/api/appels", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || "Erreur lors de l'ajout");
                }

                const created: Appel = await res.json();
                toast.success("Appel ajouté avec succès");
                if (onAddAppel) onAddAppel(created);
                resetForm();
                onClose();
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erreur lors de l'ajout de l'appel");
            }
        },
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-[#d61353]">Ajouter un appel</h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-[#d61353]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="space-y-4">
                    {/* Prestataire */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">Prestataire *</label>
                        <select
                            name="id_prestataire"
                            value={formik.values.id_prestataire}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">Sélectionner un prestataire</option>
                            {prestataires.map((p) => (
                                <option key={p.id_prestataire} value={p.id_prestataire}>
                                    {p.nom} {p.prenom}
                                </option>
                            ))}
                        </select>
                        {formik.touched.id_prestataire && formik.errors.id_prestataire && (
                            <div className="text-red-500 text-sm mt-1">{formik.errors.id_prestataire}</div>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">Date et heure de l&apos;appel *</label>
                        <input
                            type="datetime-local"
                            name="date_appel"
                            value={formik.values.date_appel}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
                        />
                        {formik.touched.date_appel && formik.errors.date_appel && (
                            <div className="text-red-500 text-sm mt-1">{formik.errors.date_appel}</div>
                        )}
                    </div>

                    {/* Direction */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">Direction *</label>
                        <select
                            name="direction"
                            value={formik.values.direction}
                            onChange={formik.handleChange}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
                        >
                            <option value="SORTANT">Sortant</option>
                            <option value="ENTRANT">Entrant</option>
                        </select>
                    </div>

                    {/* Motif */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">Motif *</label>
                        <input
                            type="text"
                            name="motif"
                            value={formik.values.motif}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Raison de l'appel..."
                            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
                        />
                        {formik.touched.motif && formik.errors.motif && (
                            <div className="text-red-500 text-sm mt-1">{formik.errors.motif}</div>
                        )}
                    </div>

                    {/* Durée */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">Durée (minutes)</label>
                        <input
                            type="number"
                            name="duree_minutes"
                            value={formik.values.duree_minutes}
                            onChange={formik.handleChange}
                            min={0}
                            placeholder="Optionnel"
                            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    {/* Commentaire */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">Commentaire</label>
                        <textarea
                            name="commentaire"
                            value={formik.values.commentaire}
                            onChange={formik.handleChange}
                            placeholder="Notes supplémentaires..."
                            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white min-h-[80px]"
                        />
                    </div>

                    <div className="flex justify-between gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        >
                            Annuler
                        </button>
                        <Button
                            type="submit"
                            loading={formik.isSubmitting}
                            className="px-4 py-2 rounded bg-[#d61353] text-white hover:bg-[#b01044]"
                        >
                            Ajouter
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
