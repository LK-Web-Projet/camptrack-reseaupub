"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";

export type Lieu = {
  id_lieu: string;
  nom: string;
  ville: string;
  created_at: string;
};

interface AddLieuProps {
  isOpen: boolean;
  onClose: () => void;
  onLieuUpdated: () => void;
}

export default function AddLieu({ isOpen, onClose, onLieuUpdated }: AddLieuProps) {
  const { token } = useAuth();

  const formik = useFormik({
    initialValues: {
      nom: "",
      ville: "",
    },
    validationSchema: Yup.object({
      nom: Yup.string().required("Nom requis"),
      ville: Yup.string().required("Ville requise"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!token) {
        toast.error("Vous devez être connecté pour ajouter un lieu");
        return;
      }

      try {
        const res = await fetch("/api/lieux/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        });

        if (!res.ok) throw new Error("Erreur lors de l'ajout");

        const data = await res.json();
        toast.success(data.message || "Lieu ajouté avec succès");
                window.location.href = "/dashboard/lieux";  

        onLieuUpdated();
        resetForm();
        onClose();
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors de l'ajout du lieu");
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
          <h2 className="text-xl font-semibold text-[#d61353]">Ajouter un lieu</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-[#d61353]">
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
            <label className="block text-sm mb-1">Ville</label>
            <input
              type="text"
              name="ville"
              value={formik.values.ville}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
            />
            {formik.touched.ville && formik.errors.ville && (
              <div className="text-red-500 text-sm mt-1">{formik.errors.ville}</div>
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
              className="px-4 py-2 rounded bg-[#d61353] text-white hover:bg-[#b80d45] transition"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

