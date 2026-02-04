"use client"

import { useState, useRef } from "react"
import { X, UploadCloud, FileText, File as FileIcon } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"

interface QuickAddFileModalProps {
    isOpen: boolean
    onClose: () => void
    prestataireId: string
    onFilesAdded: () => void
}

export default function QuickAddFileModal({ isOpen, onClose, prestataireId, onFilesAdded }: QuickAddFileModalProps) {
    const { apiClient } = useAuth()
    const [submitting, setSubmitting] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (files.length === 0) return

        setSubmitting(true)
        try {
            // 1. Upload files first
            const uploadedFilesData: { url: string, nom: string, type: string }[] = []

            for (const file of files) {
                const formData = new FormData()
                formData.append("file", file)

                const uploadRes = await apiClient("/api/prestataires/upload", {
                    method: "POST",
                    body: formData,
                })

                if (!uploadRes.ok) {
                    throw new Error(`Erreur upload fichier: ${file.name}`)
                }

                const uploadJson = await uploadRes.json()
                uploadedFilesData.push({
                    url: uploadJson.url,
                    nom: file.name,
                    type: file.type
                })
            }

            // 2. Call the specific endpoint to associate files
            const res = await apiClient(`/api/prestataires/${prestataireId}/files`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files: uploadedFilesData })
            })

            if (!res.ok) {
                throw new Error("Erreur lors de l'ajout des fichiers")
            }

            toast.success("Fichiers ajoutés avec succès")
            onFilesAdded()

            // Cleanup
            setFiles([])
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
                    <h3 className="text-lg font-bold text-[#d61353]">Ajout rapide de documents</h3>
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
                                Sélectionner des documents
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index)}
                                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {files.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                                    <FileIcon className="w-8 h-8 mb-1 opacity-50" />
                                    <p className="text-xs">Aucun document sélectionné</p>
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
                            disabled={files.length === 0}
                            className="px-4 py-2 rounded-lg bg-[#d61353] hover:bg-[#b01044] text-white transition"
                        >
                            Ajouter les documents
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
