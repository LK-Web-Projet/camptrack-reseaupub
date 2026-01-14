"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

export type Client = {
  id_client: string;
  nom: string;
  prenom: string;
  entreprise?: string | null;
  domaine_entreprise?: string | null;
  adresse?: string | null;
  contact?: string | null;
  mail?: string | null;
  type_client?: string | null;
  created_at: string;
  updated_at?: string | null;
};

interface AddClientProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient?: (client: Client) => void; // Make this optional
}

export default function AddClientModal({ isOpen, onClose, onAddClient }: AddClientProps) {
  const { apiClient } = useAuth();

  const formik = useFormik({
    initialValues: {
      nom: "",
      prenom: "",
      entreprise: "",
      domaine_entreprise: "",
      adresse: "",
      contact: "",
      mail: "",
      type_client: "EXTERNE",
    },
    validationSchema: Yup.object({
      nom: Yup.string().nullable(),
      prenom: Yup.string().nullable(),
      entreprise: Yup.string().required("Entreprise requise"),
      mail: Yup.string().email("Email invalide").nullable(),
      contact: Yup.string().nullable(),
      type_client: Yup.string().required("Type requis"),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const res = await apiClient("/api/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Erreur lors de l'ajout");
        }

        const createdClient: Client = await res.json();
        toast.success("Client ajouté avec succès");

        if (onAddClient) {
          onAddClient(createdClient);
        }

        resetForm();
        onClose();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Erreur lors de l'ajout du client");
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fond semi-transparent */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#d61353]">Ajouter un client</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-[#d61353]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className="block text-sm mb-1">Prénom</label>
              <input
                type="text"
                name="prenom"
                value={formik.values.prenom}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
              {formik.touched.prenom && formik.errors.prenom && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.prenom}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Entreprise</label>
              <input
                type="text"
                name="entreprise"
                value={formik.values.entreprise}
                onChange={formik.handleChange}
                className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Domaine</label>
              <input
                type="text"
                name="domaine_entreprise"
                value={formik.values.domaine_entreprise}
                onChange={formik.handleChange}
                className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Adresse</label>
            <input
              type="text"
              name="adresse"
              value={formik.values.adresse}
              onChange={formik.handleChange}
              className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                name="mail"
                value={formik.values.mail}
                onChange={formik.handleChange}
                className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
              {formik.touched.mail && formik.errors.mail && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.mail}</div>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Contact</label>
              <input
                type="text"
                name="contact"
                value={formik.values.contact}
                onChange={formik.handleChange}
                className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              name="type_client"
              value={formik.values.type_client}
              onChange={formik.handleChange}
              className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
            >
              <option value="EXTERNE">EXTERNE</option>
              <option value="INTERNE">INTERNE</option>
            </select>
            {formik.touched.type_client && formik.errors.type_client && (
              <div className="text-red-500 text-sm mt-1">{formik.errors.type_client}</div>
            )}
          </div>

          <div className="flex justify-between gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700"
            >
              Annuler
            </button>
            <Button
              type="submit"
              loading={formik.isSubmitting}
              className="px-4 py-2 rounded bg-[#d61353] text-white"
            >
              Ajouter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
