"use client";

import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { X } from "lucide-react";

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
  onAddClient: (client: Client) => void;
}

const Schema = Yup.object().shape({
  nom: Yup.string().required("Nom requis"),
  prenom: Yup.string().required("Prénom requis"),
  mail: Yup.string().email("Email invalide").nullable(),
  contact: Yup.string().nullable(),
  type_client: Yup.string().required("Type requis"),
});

export default function AddClientModal({ isOpen, onClose, onAddClient }: AddClientProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#d61353]">Ajouter un client</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-[#d61353]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <Formik
          initialValues={{
            nom: "",
            prenom: "",
            entreprise: "",
            domaine_entreprise: "",
            adresse: "",
            contact: "",
            mail: "",
            type_client: "CLIENT",
          }}
          validationSchema={Schema}
          onSubmit={(values, { setSubmitting, resetForm }) => {
            setSubmitting(true);
            const now = new Date().toISOString().slice(0, 10);
            const newClient: Client = {
              id_client: `c_${Date.now()}`,
              nom: values.nom.trim(),
              prenom: values.prenom.trim(),
              entreprise: values.entreprise?.trim() || null,
              domaine_entreprise: values.domaine_entreprise?.trim() || null,
              adresse: values.adresse?.trim() || null,
              contact: values.contact?.trim() || null,
              mail: values.mail?.trim() || null,
              type_client: values.type_client,
              created_at: now,
              updated_at: now,
            };
            onAddClient(newClient);
            resetForm();
            setSubmitting(false);
            onClose();
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Nom</label>
                  <Field name="nom" className="w-full px-3 py-2 border rounded" />
                  {errors.nom && touched.nom && <div className="text-red-500 text-sm mt-1">{errors.nom}</div>}
                </div>

                <div>
                  <label className="block text-sm mb-1">Prénom</label>
                  <Field name="prenom" className="w-full px-3 py-2 border rounded" />
                  {errors.prenom && touched.prenom && <div className="text-red-500 text-sm mt-1">{errors.prenom}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Entreprise</label>
                  <Field name="entreprise" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Domaine</label>
                  <Field name="domaine_entreprise" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Adresse</label>
                <Field name="adresse" className="w-full px-3 py-2 border rounded" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <Field name="mail" className="w-full px-3 py-2 border rounded" />
                  {errors.mail && touched.mail && <div className="text-red-500 text-sm mt-1">{errors.mail}</div>}
                </div>
                <div>
                  <label className="block text-sm mb-1">Contact</label>
                  <Field name="contact" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Type</label>
                <Field as="select" name="type_client" className="w-full px-3 py-2 border rounded">
                  <option value="CLIENT">CLIENT</option>
                  <option value="PROSPECT">PROSPECT</option>
                  <option value="PARTENAIRE">PARTENAIRE</option>
                </Field>
                {errors.type_client && touched.type_client && <div className="text-red-500 text-sm mt-1">{errors.type_client}</div>}
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
