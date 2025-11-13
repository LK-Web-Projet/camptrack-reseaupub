"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"

interface Prestataire {
  id_prestataire: string
  nom: string
  prenom: string
}

interface DeleteProps {
  isOpen: boolean
  onClose: () => void
  prestataire: Prestataire | null
  onConfirm: () => void
}

export default function DeletePrestataire({ isOpen, onClose, prestataire, onConfirm }: DeleteProps) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)

  if (!isOpen || !prestataire) return null

  const handleDelete = async () => {
    setLoading(true)
    try {
      if (!token) throw new Error("Vous devez être connecté")

      const res = await fetch(`/api/prestataires/${prestataire.id_prestataire}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json().catch(() => ({})) as any

      if (!res.ok) {
        const msg = data?.error || data?.message || "Erreur lors de la suppression"
        throw new Error(msg)
      }

      toast.success(data.message || "Prestataire supprimé")
      onConfirm()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90%] max-w-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#d61353]">Supprimer le prestataire</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-[#d61353] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-6">Êtes-vous sûr de vouloir supprimer ce prestataire ? Cette action est irréversible.</p>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">
            Annuler
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  )
}
