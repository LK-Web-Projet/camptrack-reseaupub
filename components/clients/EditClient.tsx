"use client";

import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { X } from "lucide-react";
import { Client } from "./AddClient";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";

interface EditClientProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEditClient: (client: Client) => void;
}

const Schema = Yup.object().shape({
  nom: Yup.string().nullable(),
  prenom: Yup.string().nullable(),
  entreprise: Yup.string().required("Entreprise requise"),
  mail: Yup.string().email("Email invalide").nullable(),
  type_client: Yup.string().required("Type requis"),
});

export default function EditClientModal({ isOpen, onClose, client, onEditClient }: EditClientProps) {
  const { apiClient } = useAuth();

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#d61353]">Modifier les informations du client</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-[#d61353] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <Formik
          enableReinitialize
          initialValues={{
            nom: client.nom || "",
            prenom: client.prenom || "",
            entreprise: client.entreprise || "",
            adresse: client.adresse || "",
            domaine_entreprise: client.domaine_entreprise || "",
            contact: client.contact || "",
            mail: client.mail || "",
            type_client: client.type_client || "CLIENT",
          }}
          validationSchema={Schema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const res = await apiClient(`/api/clients/${client.id_client}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
              });

              if (!res.ok) throw new Error("Erreur lors de la modification");

              const updatedClient: Client = await res.json();
              onEditClient(updatedClient);
              toast.success("Informations du client modifiées avec succès");
              onClose();
            } catch (err) {
              console.error(err);
              toast.error("Erreur lors de la modification du client");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, setFieldValue, errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              {/* Nom + Prénom */}
              <div>
                <label className="block text-sm mb-1">Nom et Prénom</label>
                <Field
                  name="nom_prenom"
                  value={`${values.nom} ${values.prenom}`}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const [nom, ...prenomParts] = e.target.value.split(" ");
                    setFieldValue("nom", nom || "");
                    setFieldValue("prenom", prenomParts.join(" ") || "");
                  }}
                  className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
                />
                {(touched.nom || touched.prenom) && (errors.nom || errors.prenom) && (
                  <p className="text-red-500 text-sm mt-1">{errors.nom || errors.prenom}</p>
                )}
              </div>

              {/* Entreprise + Adresse */}
              <div>
                <label className="block text-sm mb-1">Entreprise et Adresse</label>
                <Field
                  name="entreprise_adresse"
                  value={`${values.entreprise || ""} ${values.adresse || ""}`}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const [entreprise, ...adresseParts] = e.target.value.split(" ");
                    setFieldValue("entreprise", entreprise || "");
                    setFieldValue("adresse", adresseParts.join(" ") || "");
                  }}
                  className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Domaine */}
              <div>
                <label className="block text-sm mb-1">Domaine</label>
                <Field name="domaine_entreprise" className="w-full px-3 py-2 border rounded" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm mb-1">Email</label>
                <Field name="mail" type="email" className="w-full px-3 py-2 border rounded" />
                {touched.mail && errors.mail && <p className="text-red-500 text-sm mt-1">{errors.mail}</p>}
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm mb-1">Contact</label>
                <Field name="contact" className="w-full px-3 py-2 border rounded" />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm mb-1">Type</label>
                <Field as="select" name="type_client" className="w-full px-3 py-2 border rounded">
                  <option value="CLIENT">CLIENT</option>
                  <option value="PROSPECT">PROSPECT</option>
                  <option value="PARTENAIRE">PARTENAIRE</option>
                </Field>
                {touched.type_client && errors.type_client && <p className="text-red-500 text-sm mt-1">{errors.type_client}</p>}
              </div>

              {/* Boutons */}
              <div className="flex justify-between gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md bg-[#d61353] text-white hover:bg-[#b01044] transition-smooth"
                >
                  {isSubmitting ? "Modification..." : "Valider"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
