"use client"

import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { X } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"

interface Prestataire {
  id_prestataire: string
  nom: string
  prenom: string
  contact?: string
  modele?: string
  service?: { nom?: string }
  disponible: boolean
}

interface AddPrestaireModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPrestataire: (prestataire: Prestataire) => void
}

// Validation schema
const validationSchema = Yup.object().shape({
  nom: Yup.string().required("Le nom est requis"),
  prenom: Yup.string().required("Le prénom est requis"),
  contact: Yup.string().required("Le contact est requis"),
  id_service: Yup.string().required("Le service est requis"),
  modele: Yup.string(),
  disponible: Yup.boolean(),
})

export default function AddPrestaireModal({ isOpen, onClose, onAddPrestataire }: AddPrestaireModalProps) {
  const { token } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const formik = useFormik({
    initialValues: {
      nom: "",
      prenom: "",
      contact: "",
      id_service: "",
      modele: "",
      disponible: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true)
      try {
        if (!token) throw new Error("Vous devez être connecté")

        const body = {
          id_service: values.id_service,
          nom: values.nom,
          prenom: values.prenom,
          contact: values.contact,
          disponible: values.disponible,
          modele: values.modele || null,
        }

        const res = await fetch("/api/prestataires", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as Record<string, unknown>
          const msg = typeof err?.error === "string" ? err.error : "Erreur lors de la création"
          throw new Error(msg)
        }

        const data = await res.json()
        const created: Prestataire = data.prestataire
        toast.success(data.message || "Prestataire créé")
        onAddPrestataire(created)
        formik.resetForm()
      } catch (err: unknown) {
        console.error(err)
        const msg = err instanceof Error ? err.message : "Erreur lors de la création"
        toast.error(msg)
      } finally {
        setSubmitting(false)
      }
    },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90%] max-w-2xl p-6 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#d61353]">Ajouter un prestataire</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-[#d61353] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit}>
          {/* Row 1: Nom | Prénom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom *</label>
              <input
                type="text"
                name="nom"
                value={formik.values.nom}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${
                  formik.touched.nom && formik.errors.nom
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
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${
                  formik.touched.prenom && formik.errors.prenom
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

          {/* Row 2: Service | Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Service *</label>
              <input
                type="text"
                name="id_service"
                value={formik.values.id_service}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="ID service (ex: 1)"
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${
                  formik.touched.id_service && formik.errors.id_service
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
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
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${
                  formik.touched.contact && formik.errors.contact
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

          {/* Row 3: Modèle | Disponibilité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Modèle</label>
              <input
                type="text"
                name="modele"
                value={formik.values.modele}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700`}
                placeholder="Ex: Hiace"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="disponible"
                  checked={formik.values.disponible}
                  onChange={formik.handleChange}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">Disponible</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#d61353] hover:bg-[#b01044] text-white disabled:opacity-50 transition"
            >
              {submitting ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
