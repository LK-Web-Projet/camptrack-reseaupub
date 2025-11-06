"use client";

import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { X } from "lucide-react";

type Service = {
  id_service: string;
  nom: string;
  description: string | null;
  created_at: string;
};

export interface EditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onEditService: (service: Service) => void;
}

const EditSchema = Yup.object().shape({
  nom: Yup.string().required("Le nom est obligatoire"),
  description: Yup.string().nullable(),
  prix_unitaire: Yup.number()
  .typeError("Le prix doit être un nombre")
  .required("Le prix est obligatoire")
  .positive("Le prix doit être positif")

});

export default function EditServiceModal({
  isOpen,
  onClose,
  service,
  onEditService,
}: EditServiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fond semi-transparent */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      
      {/* Contenu du modal */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold mb-4 text-[#d61353]">Modifier les informations du service</h2>

          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-gray-600 hover:text-[#d61353] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <Formik
          enableReinitialize
          initialValues={{
            nom: service?.nom ?? "",
            description: service?.description ?? "",
             prix_unitaire: "" ,
              // prix_unitaire: service?. ""  // ← nouveau champ

          }}
          validationSchema={EditSchema}
          onSubmit={(values, { setSubmitting }) => {
            setSubmitting(true);
            if (!service) return;
            const updated: Service = {
              ...service,
              nom: values.nom.trim(),
              description: values.description?.trim() || null,
            };
            onEditService(updated);
            setSubmitting(false);
            onClose();
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Nom
                </label>
                <Field
                  name="nom"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d61353]"
                />
                {errors.nom && touched.nom && (
                  <div className="text-red-500 text-sm mt-1">{errors.nom}</div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <Field
                  as="textarea"
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d61353]"
                />
                {errors.description && touched.description && (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </div>
                )}
              </div>
                <div>
  <label className="block text-sm mb-1">Prix unitaire</label>
  <Field 
    name="prix_unitaire" 
    type="number"
    className="w-full px-3 py-2 border rounded" 
  />
  {errors.prix_unitaire && touched.prix_unitaire && (
    <div className="text-red-500 text-sm mt-1">{errors.prix_unitaire}</div>
  )}
</div>

              {/* Boutons */}
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
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
