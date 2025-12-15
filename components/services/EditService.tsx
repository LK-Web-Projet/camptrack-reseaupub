"use client";

import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";

export type Service = {
  id_service: string;
  nom: string;
  description: string | null;
  created_at: string;
};

interface EditServiceProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onServiceUpdated: () => void;
}

export default function EditService({ isOpen, onClose, service, onServiceUpdated }: EditServiceProps) {
  const { apiClient } = useAuth();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      nom: service?.nom || "",
      description: service?.description || "",
    },
    validationSchema: Yup.object({
      nom: Yup.string().required("Le nom est obligatoire"),
      description: Yup.string().nullable(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      if (!service) {
        toast.error("Aucun service sélectionné.");
        setSubmitting(false);
        return;
      }

      try {
        const res = await apiClient(`/api/services/${service.id_service}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!res.ok) throw new Error("Erreur lors de la modification");

        const data = await res.json();
        toast.success(data.message || "Service modifié avec succès");
        onServiceUpdated();
        onClose();
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors de la modification du service");
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#d61353]">Modifier les informations du service service</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-[#d61353] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nom</label>
            <input
              type="text"
              name="nom"
              value={formik.values.nom}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
            />
            {formik.touched.nom && formik.errors.nom && (
              <div className="text-red-500 text-sm mt-1">{formik.errors.nom}</div>
            )}
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              rows={3}
              className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
            />
            {formik.touched.description && formik.errors.description && (
              <div className="text-red-500 text-sm mt-1">{formik.errors.description}</div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="px-4 py-2 rounded bg-[#d61353] text-white hover:bg-[#b80d45] transition disabled:opacity-50"
            >
              {formik.isSubmitting ? "Modification..." : "Valider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
