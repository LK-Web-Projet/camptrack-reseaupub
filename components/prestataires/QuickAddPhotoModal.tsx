"use client"

import { useState, useRef } from "react"
import { X, UploadCloud, Image as ImageIcon } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"

interface QuickAddPhotoModalProps {
    isOpen: boolean
    onClose: () => void
    prestataireId: string
    onPhotosAdded: () => void
}

export default function QuickAddPhotoModal({ isOpen, onClose, prestataireId, onPhotosAdded }: QuickAddPhotoModalProps) {
    const { apiClient } = useAuth()
    const [submitting, setSubmitting] = useState(false)
    const [photos, setPhotos] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setPhotos(prev => [...prev, ...newFiles])

            const newPreviews = newFiles.map(file => URL.createObjectURL(file))
            setPreviews(prev => [...prev, ...newPreviews])
        }
    }

    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index])
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (photos.length === 0) return

        setSubmitting(true)
        try {
            // 1. Upload photos first
            const uploadedUrls: string[] = []

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
                uploadedUrls.push(uploadJson.url)
            }

            // 2. Call the specific endpoint to associate photos
            const res = await apiClient(`/api/prestataires/${prestataireId}/photos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photos: uploadedUrls })
            })

            if (!res.ok) {
                throw new Error("Erreur lors de l'ajout des photos")
            }

            toast.success("Photos ajoutées avec succès")
            onPhotosAdded()

            // Cleanup
            setPhotos([])
            previews.forEach(url => URL.revokeObjectURL(url))
            setPreviews([])
            onClose()

        } catch (err: unknown) {
            console.error(err)
            toast.error("Une erreur est survenue")
        } finally {
            setSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90%] max-w-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#d61353]">Ajout rapide de photos</h3>
                    <button onClick={onClose} className="text-gray-600 hover:text-[#d61353] transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 p-4 mb-6">
                        <div className="flex justify-center gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                            >
                                <UploadCloud size={16} />
                                Sélectionner des photos
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

                        <div className="flex flex-wrap gap-2 justify-center max-h-[200px] overflow-y-auto">
                            {previews.map((url, index) => (
                                <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                    <img src={url} alt={`Aperçu ${index}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePhoto(index)}
                                        className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {previews.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-4 text-center text-gray-400">
                                    <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                                    <p className="text-xs">Aucune photo sélectionnée</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition"
                        >
                            Annuler
                        </button>
                        <Button
                            type="submit"
                            loading={submitting}
                            disabled={photos.length === 0}
                            className="px-4 py-2 rounded-lg bg-[#d61353] hover:bg-[#b01044] text-white transition"
                        >
                            Ajouter les photos
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
