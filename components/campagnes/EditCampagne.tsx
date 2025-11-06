"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { X } from "lucide-react";

interface Campagne {
  id_campagne: string;
  nom_campagne: string;
  type_campagne: string;
  status: string;
  date_debut: string;
  date_fin: string;
  services: string[];
  quantite_service: number;
}

interface EditCampagneModalProps {
  isOpen: boolean;
  campagne: Campagne;
  onClose: () => void;
  onEditCampagne: (updatedCampagne: Campagne) => void;
}

export default function EditCampagneModal({ isOpen, campagne, onClose, onEditCampagne }: EditCampagneModalProps) {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      nom_campagne: campagne.nom_campagne || "",
      type_campagne: campagne.type_campagne || "",
      status: campagne.status || "PLANIFIEE",
      date_debut: campagne.date_debut ? campagne.date_debut.slice(0,10) : "",
      date_fin: campagne.date_fin ? campagne.date_fin.slice(0,10) : "",
      services: campagne.services ? campagne.services.join(", ") : "",
      quantite_service: campagne.quantite_service || "",
    },
    validationSchema: Yup.object({
      nom_campagne: Yup.string().required("Champ obligatoire"),
      type_campagne: Yup.string().required("Champ obligatoire"),
      status: Yup.string().required("Champ obligatoire"),
      date_debut: Yup.string().required("Champ obligatoire"),
      date_fin: Yup.string().required("Champ obligatoire"),
      services: Yup.string().required("Champ obligatoire"),
      quantite_service: Yup.number().typeError("La quantité doit être un nombre").required("Champ obligatoire").positive("La quantité doit être positive"),
    }),
    onSubmit: (values) => {
      const updatedCampagne = {
        ...campagne,
        ...values,
        services: values.services.split(",").map((s: string) => s.trim()).filter(Boolean),
      };
      onEditCampagne(updatedCampagne);
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-md shadow-xl relative border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-[#d61353]">Modifier les informations de la  campagne</h2>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom de la campagne</label>
            <input
              type="text"
              name="nom_campagne"
              value={formik.values.nom_campagne}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
            />
            {formik.touched.nom_campagne && formik.errors.nom_campagne && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.nom_campagne}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type de campagne</label>
            <input
              type="text"
              name="type_campagne"
              value={formik.values.type_campagne}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
            />
            {formik.touched.type_campagne && formik.errors.type_campagne && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.type_campagne}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <input
              type="text"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
            />
            {formik.touched.status && formik.errors.status && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.status}</p>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Date début</label>
              <input
                type="date"
                name="date_debut"
                value={formik.values.date_debut}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
              />
              {formik.touched.date_debut && formik.errors.date_debut && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.date_debut}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Date fin</label>
              <input
                type="date"
                name="date_fin"
                value={formik.values.date_fin}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
              />
              {formik.touched.date_fin && formik.errors.date_fin && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.date_fin}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Services (séparés par une virgule)</label>
            <input
              type="text"
              name="services"
              value={formik.values.services}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
              placeholder="ex: Distribution, Affichage"
            />
            {formik.touched.services && formik.errors.services && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.services}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantité de service</label>
            <input
              type="number"
              name="quantite_service"
              value={formik.values.quantite_service}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
            />
            {formik.touched.quantite_service && formik.errors.quantite_service && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.quantite_service}</p>
            )}
          </div>
          <div className="flex justify-between gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800 transition-smooth"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#d61353] text-white hover:bg-[#b01044] transition-smooth"
            >
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
