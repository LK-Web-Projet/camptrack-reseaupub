"use client"

import { useState, useEffect, useMemo } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { X } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"

interface Service {
  id_service: string
  nom: string
}

interface Prestataire {
  id_prestataire: string
  nom: string
  prenom: string
  contact?: string
  modele?: string
  type_panneau?: string
  couleur?: string
  marque?: string
  plaque?: string
  id_verification?: string
  contrat_valide?: boolean
  equipe_gps?: boolean
  service?: { id_service?: string; nom?: string }
  disponible: boolean
}

interface EditPrestaireModalProps {
  isOpen: boolean
  onClose: () => void
  prestataire: Prestataire | null
  services: Service[] // Add services prop
  onEditPrestataire: (prestataire: Prestataire) => void
}

const validationSchema = Yup.object().shape({
  nom: Yup.string().required("Le nom est requis"),
  prenom: Yup.string().required("Le prénom est requis"),
  contact: Yup.string().required("Le contact est requis"),
  id_service: Yup.string().required("Le service est requis"),
  disponible: Yup.boolean(),
  type_panneau: Yup.string(),
  couleur: Yup.string(),
  marque: Yup.string(),
  modele: Yup.string(),
  plaque: Yup.string(),
  plaque: Yup.string(),
  // id_verification removed/ignored on edit
  contrat_valide: Yup.boolean(),
  equipe_gps: Yup.boolean(),
})

export default function EditPrestaireModal({ isOpen, onClose, prestataire, services, onEditPrestataire }: EditPrestaireModalProps) {
  const { apiClient } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  // Removed internal services state and fetching logic


  // Trouver l'ID du service correspondant au nom du service du prestataire
  const initialServiceId = useMemo(() => {
    console.log("Debug - Prestataire:", prestataire);
    console.log("Debug - Services:", services);

    if (prestataire?.service?.id_service) return prestataire.service.id_service

    if (prestataire?.service?.nom && services.length > 0) {
      const found = services.find((s) => s.nom === prestataire.service?.nom)
      console.log("Debug - Found Service:", found);
      return found ? found.id_service : ""
    }
    return ""
  }, [prestataire, services])

  console.log("Debug - InitialServiceId:", initialServiceId);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      nom: prestataire?.nom || "",
      prenom: prestataire?.prenom || "",
      contact: prestataire?.contact || "",
      id_service: initialServiceId,
      disponible: prestataire?.disponible ?? true,
      type_panneau: prestataire?.type_panneau || "",
      couleur: prestataire?.couleur || "",
      marque: prestataire?.marque || "",
      modele: prestataire?.modele || "",
      plaque: prestataire?.plaque || "",
      id_verification: prestataire?.id_verification || "",
      contrat_valide: prestataire?.contrat_valide ?? false,
      equipe_gps: prestataire?.equipe_gps ?? false,
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true)
      try {
        if (!prestataire) throw new Error("Prestataire introuvable")

        const body = {
          id_service: values.id_service,
          nom: values.nom,
          prenom: values.prenom,
          contact: values.contact,
          disponible: values.disponible,
          type_panneau: values.type_panneau || null,
          couleur: values.couleur || null,
          marque: values.marque || null,
          modele: values.modele || null,
          plaque: values.plaque || null,
          // id_verification not updated
          contrat_valide: values.contrat_valide,
          equipe_gps: values.equipe_gps,
        }

        const res = await apiClient(`/api/prestataires/${prestataire.id_prestataire}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as Record<string, unknown>
          const msg = typeof err?.error === "string" ? err.error : "Erreur lors de la mise à jour"
          throw new Error(msg)
        }

        const data = await res.json()
        const updated: Prestataire = data.prestataire
        toast.success(data.message || "Prestataire mis à jour")
        onEditPrestataire(updated)
      } catch (err: unknown) {
        console.error(err)
        const msg = err instanceof Error ? err.message : "Erreur lors de la mise à jour"
        toast.error(msg)
      } finally {
        setSubmitting(false)
      }
    },
  })

  if (!isOpen || !prestataire) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90%] max-w-2xl p-6 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#d61353]">Modifier les informations du  prestataire</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-[#d61353] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit}>
          {/* === INFORMATIONS PERSONNELLES === */}
          <h4 className="text-sm font-semibold text-[#d61353] mb-3 border-b pb-2">Informations personnelles</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom *</label>
              <input
                type="text"
                name="nom"
                value={formik.values.nom}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${formik.touched.nom && formik.errors.nom
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
                  }`}
                placeholder="Ex: Dupont"
              />
              {formik.touched.nom && formik.errors.nom && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.nom}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prénom *</label>
              <input
                type="text"
                name="prenom"
                value={formik.values.prenom}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${formik.touched.prenom && formik.errors.prenom
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
                  }`}
                placeholder="Ex: Jean"
              />
              {formik.touched.prenom && formik.errors.prenom && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.prenom}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Service *</label>
              <select
                name="id_service"
                value={formik.values.id_service}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${formik.touched.id_service && formik.errors.id_service
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
                  }`}
              >
                <option value="">-- Sélectionner un service --</option>
                {services.map((service) => (
                  <option key={service.id_service} value={service.id_service}>
                    {service.nom}
                  </option>
                ))}
              </select>
              {formik.touched.id_service && formik.errors.id_service && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.id_service}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact *</label>
              <input
                type="text"
                name="contact"
                value={formik.values.contact}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${formik.touched.contact && formik.errors.contact
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
                  }`}
                placeholder="Ex: 06 12 34 56 78"
              />
              {formik.touched.contact && formik.errors.contact && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.contact}</p>
              )}
            </div>
          </div>

          {/* === VÉHICULE === */}
          <h4 className="text-sm font-semibold text-[#d61353] mb-3 border-b pb-2">Informations véhicule</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type de panneau</label>
              <select
                name="type_panneau"
                value={formik.values.type_panneau}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 border-gray-300 dark:border-gray-600"
              >
                <option value="">--Sélectionner--</option>
                <option value="PETIT">PETIT</option>
                <option value="GRAND">GRAND</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Marque</label>
              <input
                type="text"
                name="marque"
                value={formik.values.marque}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 border-gray-300 dark:border-gray-600"
                placeholder="Ex: Toyota"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Modèle</label>
              <input
                type="text"
                name="modele"
                value={formik.values.modele}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 border-gray-300 dark:border-gray-600"
                placeholder="Ex: Hiace"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Couleur</label>
              <input
                type="text"
                name="couleur"
                value={formik.values.couleur}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 border-gray-300 dark:border-gray-600"
                placeholder="Ex: Blanc"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Plaque (immatriculation)</label>
              <input
                type="text"
                name="plaque"
                value={formik.values.plaque}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 border-gray-300 dark:border-gray-600"
                placeholder="Ex: AB-123-CD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ID Vérification (Auto)</label>
              <input
                type="text"
                name="id_verification"
                value={formik.values.id_verification}
                readOnly
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 cursor-not-allowed"
                placeholder="Généré automatiquement"
              />
            </div>
          </div>

          {/* === DISPONIBILITÉ === */}
          <h4 className="text-sm font-semibold text-[#d61353] mb-3 border-b pb-2">Statut</h4>

          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="disponible"
                checked={formik.values.disponible}
                onChange={formik.handleChange}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Disponible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="contrat_valide"
                checked={!!formik.values.contrat_valide}
                onChange={(e) => formik.setFieldValue('contrat_valide', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Contrat Validé</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="equipe_gps"
                checked={!!formik.values.equipe_gps}
                onChange={(e) => formik.setFieldValue('equipe_gps', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Équipé GPS</span>
            </label>
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50 transition"
            >
              Annuler
            </button>
            <Button
              type="submit"
              loading={submitting}
              className="px-4 py-2 rounded-lg bg-[#d61353] hover:bg-[#b01044] text-white disabled:opacity-50 transition"
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
