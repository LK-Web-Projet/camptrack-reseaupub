"use client"

import { useState, useRef, useEffect } from "react"
import { useCallback } from "react"
import DeletePhotoModal from "./DeletePhotoModal"
import { X, UploadCloud, Image as ImageIcon, Camera, RotateCcw } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"

interface QuickAddPhotoModalProps {
    isOpen: boolean
    onClose: () => void
    prestataireId: string
    onPhotosAdded: () => void
}

type CaptureMode = 'FILE' | 'CAMERA';

export default function QuickAddPhotoModal({ isOpen, onClose, prestataireId, onPhotosAdded }: QuickAddPhotoModalProps) {
    const { apiClient } = useAuth()
    const [submitting, setSubmitting] = useState(false)
    const [photos, setPhotos] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    // Ajout : photos existantes
    const [existingPhotos, setExistingPhotos] = useState<Array<{ id: string, url: string }>>([])
    const [loadingExisting, setLoadingExisting] = useState(false)
    // Modal suppression
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [photoToDelete, setPhotoToDelete] = useState<string | null>(null)

    // Charger les photos existantes du prestataire
    useEffect(() => {
        if (isOpen && prestataireId) {
            setLoadingExisting(true);
            apiClient(`/api/prestataires/${prestataireId}/photos`, {
                method: "GET"
            })
                .then(async (res: Response) => {
                    if (!res.ok) throw new Error("Erreur lors du chargement des photos existantes");
                    const data = await res.json();
                    setExistingPhotos(Array.isArray(data) ? data : []);
                })
                .catch(() => {
                    toast.error("Erreur chargement photos existantes");
                })
                .finally(() => setLoadingExisting(false));
        }
    }, [isOpen, prestataireId, apiClient]);

    // Ouvre le modal de suppression
    const openDeleteModal = (photoId: string) => {
        setPhotoToDelete(photoId);
        setDeleteModalOpen(true);
    };

    // Ferme le modal
    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setPhotoToDelete(null);
    };

    // Confirme la suppression
    const confirmDeletePhoto = useCallback(async () => {
        if (!prestataireId || !photoToDelete) return;
        setLoadingExisting(true);
        try {
            const res = await apiClient(`/api/prestataires/${prestataireId}/photos/${photoToDelete}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Erreur suppression photo");
            toast.success("Photo supprimée");
            setExistingPhotos(prev => prev.filter(p => p.id !== photoToDelete));
        } catch (err) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setLoadingExisting(false);
            closeDeleteModal();
        }
    }, [prestataireId, photoToDelete, apiClient]);

    // ...existing code...
    
    // Photo State
    const [captureMode, setCaptureMode] = useState<CaptureMode>('FILE')
    const [isCameraActive, setIsCameraActive] = useState(false)

    // Camera Refs
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const nativeCameraInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Cleanup camera on unmount or modal close
    useEffect(() => {
        if (!isOpen) {
            stopCamera()
        }
        return () => stopCamera()
    }, [isOpen])

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            previews.forEach(url => URL.revokeObjectURL(url))
        }
    }, [previews])

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
                        handleFileSelection(file)
                        // Keep camera active for multiple captures
                    }
                }, 'image/jpeg', 0.8)
            }
        }
    }

    // --- File Logic ---
    const handleFileSelection = (file: File) => {
        setPhotos(prev => [...prev, file])
        const url = URL.createObjectURL(file)
        setPreviews(prev => [...prev, url])
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            newFiles.forEach(handleFileSelection)
        }
    }

    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index])
            return prev.filter((_, i) => i !== index)
        })
    }

    const resetPhotos = () => {
        setPhotos([])
        previews.forEach(url => URL.revokeObjectURL(url))
        setPreviews([])
        stopCamera()
    }

    // --- Submit ---
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
            resetPhotos()
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
                    <button 
                        onClick={onClose} 
                        className="text-gray-600 hover:text-[#d61353] transition"
                        type="button"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {/* Affichage des photos existantes */}
                <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2">Photos existantes</h4>
                    {loadingExisting ? (
                        <div className="text-gray-500 text-xs">Chargement...</div>
                    ) : existingPhotos.length === 0 ? (
                        <div className="text-gray-400 text-xs">Aucune photo enregistrée</div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {existingPhotos.map(photo => (
                                <div key={photo.id} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                    <img src={photo.url} alt="Photo existante" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => openDeleteModal(photo.id)}
                                        className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                        disabled={loadingExisting}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal de suppression */}
                <DeletePhotoModal
                    isOpen={deleteModalOpen}
                    onClose={closeDeleteModal}
                    onConfirm={confirmDeletePhoto}
                />

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-2">
                        {/* Mode Selection */}
                        <div className="flex gap-3 mb-2">
                            <button
                                type="button"
                                onClick={() => {
                                    stopCamera()
                                    setCaptureMode('FILE')
                                }}
                                className={`flex items-center gap-2 px-4 py-2 border shadow-sm rounded-lg text-sm font-medium transition ${captureMode === 'FILE' ? 'bg-white border-gray-300 text-black' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'}`}
                            >
                                <UploadCloud size={16} />
                                Importer
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCaptureMode('CAMERA')
                                    startCamera()
                                }}
                                className={`flex items-center gap-2 px-4 py-2 border shadow-sm rounded-lg text-sm font-medium transition ${captureMode === 'CAMERA' ? 'bg-black text-white' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'}`}
                            >
                                <Camera size={16} />
                                Caméra
                            </button>
                        </div>

                        {/* Hidden Inputs */}
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

                        {/* File Import Mode */}
                        {captureMode === 'FILE' && !isCameraActive && (
                            <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
                                <div className="flex justify-center gap-3 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                                    >
                                        <UploadCloud size={16} />
                                        Sélectionner des photos
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 justify-center max-h-50 overflow-y-auto">
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
                                        <div className="flex flex-col items-center justify-center py-4 text-center text-gray-400 w-full">
                                            <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                                            <p className="text-xs">Aucune photo sélectionnée</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Camera Mode */}
                        {captureMode === 'CAMERA' && (
                            <div className="border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col relative min-h-75">
                                {/* Camera Active */}
                                {isCameraActive && (
                                    <div className="flex-1 relative bg-black">
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
                                    </div>
                                )}

                                {/* Camera Inactive but in Camera Mode - Show previews */}
                                {!isCameraActive && previews.length > 0 && (
                                    <div className="absolute inset-0 bg-white p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-sm font-medium">Photos capturées</p>
                                            <button
                                                type="button"
                                                onClick={resetPhotos}
                                                className="p-1 text-gray-600 hover:text-[#d61353] transition"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-center max-h-62.5 overflow-y-auto">
                                            {previews.map((url, index) => (
                                                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                                    <img src={url} alt={`Capture ${index}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePhoto(index)}
                                                        className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Camera Inactive and No Previews */}
                                {!isCameraActive && previews.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                        <Camera className="w-12 h-12 text-gray-300 mb-3" />
                                        <p className="text-gray-500 text-sm mb-4">Appuyez sur le bouton Caméra pour démarrer</p>
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="flex items-center gap-2 px-4 py-2 bg-black text-white shadow-sm rounded-lg hover:bg-gray-800 text-sm font-medium transition"
                                        >
                                            <Camera size={16} />
                                            Démarrer la caméra
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-500">
                            {photos.length} photo{photos.length !== 1 ? 's' : ''} sélectionnée{photos.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex gap-3">
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
                    </div>
                </form>
            </div>
        </div>
    )
}