"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { X, UploadCloud, Image as ImageIcon, Trash2, Undo2, FileText, File as FileIcon, Camera, RotateCcw } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"

interface Service {
  id_service: string
  nom: string
}

interface PrestatairePhoto {
  id_photo: string
  url: string
}

interface PrestataireFichier {
  id_fichier: string
  url: string
  nom: string
  type?: string
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
  photos?: PrestatairePhoto[]
  fichiers?: PrestataireFichier[]
}

interface EditPrestaireModalProps {
  isOpen: boolean
  onClose: () => void
  prestataire: Prestataire | null
  services: Service[]
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
  contrat_valide: Yup.boolean(),
  equipe_gps: Yup.boolean(),
})

export default function EditPrestaireModal({ isOpen, onClose, prestataire, services, onEditPrestataire }: EditPrestaireModalProps) {
  const { apiClient } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  // Photo states
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([])
  const [existingPhotos, setExistingPhotos] = useState<PrestatairePhoto[]>([])
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([])
  
  // Camera states
  const [captureMode, setCaptureMode] = useState<'FILE' | 'CAMERA'>('FILE')
  const [isCameraActive, setIsCameraActive] = useState(false)
  
  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nativeCameraInputRef = useRef<HTMLInputElement>(null)

  // File states
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [existingFiles, setExistingFiles] = useState<PrestataireFichier[]>([])
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([])
  const documentInputRef = useRef<HTMLInputElement>(null)

  // --- Camera Logic ---
  const startCamera = async () => {
    // Fallback to native input if mediaDevices not available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Camera API not available, falling back to native input")
      nativeCameraInputRef.current?.click()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCameraActive(true)
    } catch (err) {
      console.error("Camera error or permission denied:", err)
      // Fallback to native camera input
      toast.info("Caméra inapprochable, ouverture de l'appareil photo natif...")
      nativeCameraInputRef.current?.click()
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
    setCaptureMode('FILE')
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" })
            handleAddNewPhoto(file)
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }

  // Cleanup camera on unmount or modal close
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
    }
    return () => stopCamera()
  }, [isOpen])

  // Initialisation des photos existantes
  useEffect(() => {
    // Photos
    if (prestataire?.photos) {
      setExistingPhotos(prestataire.photos)
    } else {
      setExistingPhotos([])
    }
    setNewPhotos([])
    setNewPhotoPreviews(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    })
    setDeletedPhotoIds([])

    // Documents
    if (prestataire?.fichiers) {
      setExistingFiles(prestataire.fichiers)
    } else {
      setExistingFiles([])
    }
    setNewFiles([])
    setDeletedFileIds([])
  }, [prestataire, isOpen])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      newPhotoPreviews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [newPhotoPreviews])

  // Trouver l'ID du service
  const initialServiceId = useMemo(() => {
    if (prestataire?.service?.id_service) return prestataire.service.id_service
    if (prestataire?.service?.nom && services.length > 0) {
      const found = services.find((s) => s.nom === prestataire.service?.nom)
      return found ? found.id_service : ""
    }
    return ""
  }, [prestataire, services])

  // --- Photo Handling ---
  const handleAddNewPhoto = (file: File) => {
    setNewPhotos(prev => [...prev, file])
    setNewPhotoPreviews(prev => [...prev, URL.createObjectURL(file)])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => handleAddNewPhoto(file))
    }
  }

  const handleRemoveNewPhoto = (indexToRemove: number) => {
    setNewPhotos(prev => prev.filter((_, index) => index !== indexToRemove))
    setNewPhotoPreviews(prev => {
      URL.revokeObjectURL(prev[indexToRemove])
      return prev.filter((_, index) => index !== indexToRemove)
    })
  }

  const handleMarkPhotoForDeletion = (id: string) => {
    if (!deletedPhotoIds.includes(id)) {
      setDeletedPhotoIds(prev => [...prev, id])
    }
  }

  const handleUndoDeletion = (id: string) => {
    setDeletedPhotoIds(prev => prev.filter(photoId => photoId !== id))
  }

  // --- Document Handling ---
  const handleAddNewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(prev => [...prev, ...Array.from(e.target.files || [])])
    }
  }

  const handleRemoveNewFile = (indexToRemove: number) => {
    setNewFiles(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleMarkFileForDeletion = (id: string) => {
    if (!deletedFileIds.includes(id)) {
      setDeletedFileIds(prev => [...prev, id])
    }
  }

  const handleUndoFileDeletion = (id: string) => {
    setDeletedFileIds(prev => prev.filter(fileId => fileId !== id))
  }

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

        // 1. Upload new photos
        const addedPhotoUrls: string[] = []
        for (const photoFile of newPhotos) {
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
          addedPhotoUrls.push(uploadJson.url)
        }

        // 1.5. Upload new files
        const addedFilesData: { url: string, nom: string, type: string }[] = []
        for (const docFile of newFiles) {
          const formData = new FormData()
          formData.append("file", docFile)

          const uploadRes = await apiClient("/api/prestataires/upload", {
            method: "POST",
            body: formData,
          })

          if (!uploadRes.ok) throw new Error(`Erreur upload fichier: ${docFile.name}`)

          const uploadJson = await uploadRes.json()
          addedFilesData.push({
            url: uploadJson.url,
            nom: docFile.name,
            type: docFile.type
          })
        }

        // 2. Update Prestataire
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
          addedPhotos: addedPhotoUrls, // URLs of newly uploaded photos
          deletedPhotoIds: deletedPhotoIds, // IDs of photos to delete
          addedFiles: addedFilesData,
          deletedFileIds: deletedFileIds
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
        onClose()
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
          <h3 className="text-lg font-bold text-[#d61353]">Modifier les informations du prestataire</h3>
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

          {/* === PHOTOS === */}
          <h4 className="text-sm font-semibold text-[#d61353] mb-3 border-b pb-2">Photos</h4>
          <div className="mb-6">
            <div className="flex flex-col space-y-4">
              {/* Existing Photos */}
              {existingPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {existingPhotos.map((photo) => {
                    const isDeleted = deletedPhotoIds.includes(photo.id_photo);
                    return (
                      <div key={photo.id_photo} className={`relative w-24 h-24 rounded-lg overflow-hidden border ${isDeleted ? 'opacity-50 grayscale' : ''}`}>
                        <img src={photo.url} alt="Photo existante" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1">
                          {isDeleted ? (
                            <button
                              type="button"
                              onClick={() => handleUndoDeletion(photo.id_photo)}
                              className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600"
                              title="Annuler suppression"
                            >
                              <Undo2 size={12} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkPhotoForDeletion(photo.id_photo)}
                              className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              title="Supprimer"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Photos */}
              <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
                <div className="flex justify-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setCaptureMode('FILE');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 border shadow-sm rounded-lg text-sm font-medium transition ${captureMode === 'FILE' ? 'bg-white border-gray-300 text-black' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'}`}
                  >
                    <UploadCloud size={16} />
                    Ajouter des nouvelles photos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCaptureMode('CAMERA');
                      startCamera();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 border shadow-sm rounded-lg text-sm font-medium transition ${captureMode === 'CAMERA' ? 'bg-black text-white' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'}`}
                  >
                    <Camera size={16} />
                    Caméra
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Mode Importation de fichiers */}
                {captureMode === 'FILE' && !isCameraActive && (
                  <>
                    {/* Previews of new photos */}
                    <div className="flex flex-wrap gap-2 justify-center max-h-[200px] overflow-y-auto">
                      {newPhotoPreviews.map((url, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                          <img src={url} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewPhoto(index)}
                            className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {newPhotoPreviews.length === 0 && existingPhotos.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-4 text-center text-gray-400">
                          <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                          <p className="text-xs">Aucune photo</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Mode Caméra */}
                {captureMode === 'CAMERA' && (
                  <div className="min-h-[300px] relative bg-gray-900 rounded-lg overflow-hidden">
                    {/* Camera Active */}
                    {isCameraActive && (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30"
                          >
                            <X size={24} />
                          </button>
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="p-4 bg-white rounded-full text-black shadow-lg hover:scale-105 transition"
                          >
                            <Camera size={28} />
                          </button>
                        </div>
                      </>
                    )}

                    {/* Camera Inactive - Show button to start or previews */}
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        {newPhotoPreviews.length === 0 ? (
                          <>
                            <Camera className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500 text-sm mb-4 text-center">
                              Appuyez sur le bouton Caméra pour démarrer
                            </p>
                            <button
                              type="button"
                              onClick={startCamera}
                              className="flex items-center gap-2 px-4 py-2 bg-black text-white shadow-sm rounded-lg hover:bg-gray-800 text-sm font-medium transition"
                            >
                              <Camera size={16} />
                              Démarrer la caméra
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center w-full mb-3 px-2">
                              <p className="text-sm font-medium text-white">Photos capturées</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPhotos([])
                                  setNewPhotoPreviews(prev => {
                                    prev.forEach(url => URL.revokeObjectURL(url))
                                    return []
                                  })
                                }}
                                className="p-1 text-gray-300 hover:text-white transition"
                              >
                                <RotateCcw size={18} />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center max-h-[250px] overflow-y-auto w-full">
                              {newPhotoPreviews.map((url, index) => (
                                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/20">
                                  <img src={url} alt={`Capture ${index + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveNewPhoto(index)}
                                    className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* === DOCUMENTS === */}
          <h4 className="text-sm font-semibold text-[#d61353] mb-3 border-b pb-2">Documents Administratifs</h4>
          <div className="mb-6">
            <div className="space-y-3">
              {/* Documents existants */}
              {existingFiles.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {existingFiles.map((file) => {
                    const isDeleted = deletedFileIds.includes(file.id_fichier)
                    return (
                      <div key={file.id_fichier} className={`flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800 ${isDeleted ? 'opacity-50 bg-gray-50' : ''}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className={`text-sm font-medium truncate hover:underline ${isDeleted ? 'line-through text-gray-500 pointer-events-none' : 'text-blue-600'}`}>
                              {file.nom}
                            </a>
                            <p className="text-xs text-gray-500">{file.type || 'Document'}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {isDeleted ? (
                            <button
                              type="button"
                              onClick={() => handleUndoFileDeletion(file.id_fichier)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Annuler suppression"
                            >
                              <Undo2 size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkFileForDeletion(file.id_fichier)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Nouveaux documents */}
              {newFiles.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {newFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-green-200 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-green-100">
                          <FileIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB • Nouveau</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(index)}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-white rounded-lg transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton d'ajout */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => documentInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition w-full justify-center border-dashed"
                >
                  <UploadCloud size={16} />
                  Ajouter un document (PDF, Word, Excel...)
                </button>
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  className="hidden"
                  onChange={handleAddNewFile}
                />
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