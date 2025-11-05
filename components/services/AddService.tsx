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

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddService: (service: Service) => void;
}

const AddSchema = Yup.object().shape({
  nom: Yup.string().required("Le nom est obligatoire"),
  description: Yup.string().nullable(),
});

export default function AddServiceModal({ isOpen, onClose, onAddService }: AddServiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Ajouter un service</h3>
          <button onClick={onClose} aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <Formik
          initialValues={{ nom: "", description: "" }}
          validationSchema={AddSchema}
          onSubmit={(values, { setSubmitting, resetForm }) => {
            setSubmitting(true);
            const newService: Service = {
              id_service: `s_${Date.now()}`,
              nom: values.nom.trim(),
              description: values.description?.trim() || null,
              created_at: new Date().toISOString().slice(0, 10),
            };
            onAddService(newService);
            resetForm();
            setSubmitting(false);
            onClose();
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nom</label>
                <Field name="nom" className="w-full px-3 py-2 border rounded" />
                {errors.nom && touched.nom && <div className="text-red-500 text-sm mt-1">{errors.nom}</div>}
              </div>

              <div>
                <label className="block text-sm mb-1">Description</label>
                <Field as="textarea" name="description" rows={3} className="w-full px-3 py-2 border rounded" />
                {errors.description && touched.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-[#d61353] text-white">
                  {isSubmitting ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
