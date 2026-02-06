"use client"

import { useState, useEffect, useRef } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { X, UploadCloud, Camera, Image as ImageIcon } from "lucide-react"
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
  service?: { nom?: string }
  disponible: boolean
  photos?: { url: string }[]
  etat_vehicule?: number
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
  disponible: Yup.boolean(),
  type_panneau: Yup.string(),
  couleur: Yup.string(),
  marque: Yup.string(),
  modele: Yup.string(),
  plaque: Yup.string(),
  contrat_valide: Yup.boolean(),
  equipe_gps: Yup.boolean(),
  etat_vehicule: Yup.number().nullable(),
})

export default function AddPrestaireModal({ isOpen, onClose, onAddPrestataire }: AddPrestaireModalProps) {
  const { apiClient } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<Service[]>([])

  // Photo states
  const [photos, setPhotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charger les services au montage ou quand le modal s'ouvre
  useEffect(() => {
    const fetchServices = async () => {
      if (services.length > 0) return
      try {
        const res = await apiClient("/api/services?page=1&limit=100")
        if (!res.ok) throw new Error("Erreur lors du chargement des services")
        const data = await res.json()
        setServices(data.services || [])
      } catch (err) {
        console.error("Erreur services:", err)
        toast.error("Impossible de charger les services")
      }
    }

    if (isOpen) {
      fetchServices()
      // Reset photos on open
      setPhotos([])
      setPreviewUrls(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      })
    }
  }, [isOpen, apiClient, services.length])

  // --- Photo Handling ---
  const handleAddPhoto = (file: File) => {
    setPhotos(prev => [...prev, file])
    setPreviewUrls(prev => [...prev, URL.createObjectURL(file)])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => handleAddPhoto(file))
    }
  }

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos(prev => prev.filter((_, index) => index !== indexToRemove))
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[indexToRemove])
      return prev.filter((_, index) => index !== indexToRemove)
    })
  }

  const formik = useFormik({
    initialValues: {
      nom: "",
      prenom: "",
      contact: "",
      id_service: "",
      disponible: true,
      type_panneau: "",
      couleur: "",
      marque: "",
      modele: "",
      plaque: "",
      contrat_valide: false,
      equipe_gps: false,
      etat_vehicule: 0,
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true)
      try {
        // 1. Upload photos first
        const uploadedPhotoUrls: string[] = []
        for (const photoFile of photos) {
          const formData = new FormData()
          formData.append("file", photoFile)

          const uploadRes = await apiClient("/api/prestataires/upload", {
            method: "POST",
            body: formData,
          })

          if (!uploadRes.ok) {
            throw new Error(`Erreur upload photo: ${photoFile.name}`)
          }

          const uploadJson = await uploadRes.json()
          uploadedPhotoUrls.push(uploadJson.url)
        }

        // 2. Create Prestataire
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
          contrat_valide: values.contrat_valide,
          equipe_gps: values.equipe_gps,
          etat_vehicule: values.etat_vehicule || null,
          photos: uploadedPhotoUrls // Attach photo URLs
        }

        const res = await apiClient("/api/prestataires?page=1&limit=50", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        onClose()
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
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">État général du véhicule (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => formik.setFieldValue("etat_vehicule", star)}
                  className={`text-2xl transition-colors ${(formik.values.etat_vehicule || 0) >= star
                      ? "text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                    }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* === PHOTOS === */}
          <h4 className="text-sm font-semibold text-[#d61353] mb-3 border-b pb-2">Photos (Optionnel)</h4>
          <div className="mb-6">
            <div className="flex flex-col space-y-2">
              <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
                <div className="flex justify-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                  >
                    <UploadCloud size={16} />
                    Ajouter des photos
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Previews */}
                <div className="flex flex-wrap gap-2 justify-center max-h-[200px] overflow-y-auto">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <img src={url} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {previewUrls.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-4 text-center text-gray-400">
                      <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                      <p className="text-xs">Aucune photo sélectionnée</p>
                    </div>
                  )}
                </div>
              </div>
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
            <Button
              type="submit"
              loading={submitting}
              className="px-4 py-2 rounded-lg bg-[#d61353] hover:bg-[#b01044] text-white disabled:opacity-50 transition"
            >
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
