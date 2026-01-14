"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

export default function DeleteUserModal({ isOpen, onClose, onConfirm }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fond semi-transparent */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modale compacte et centrée */}
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90%] max-w-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-red-600 text-center">
          Supprimer l&apos;utilisateur
        </h3>
        <p className="mb-6 text-center text-sm text-gray-700 dark:text-gray-300">
          Voulez-vous vraiment supprimer cet utilisateur ?<br />
          Cliquez sur <span className="font-semibold text-red-600">Valider</span> pour confirmer.
        </p>
        <div className="flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Annuler
          </button>
          <Button
            onClick={handleConfirm}
            loading={loading}
            className="px-4 py-2 rounded-md bg-[#d61353] hover:bg-[#b01044] text-white"
          >
            Valider
          </Button>
        </div>
      </div>
    </div>
  )
}
