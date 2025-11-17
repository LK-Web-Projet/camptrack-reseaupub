"use client"

import { useState, useEffect, useCallback } from "react"
import { Pencil, Trash2, Plus, Users, Eye } from "lucide-react"
import AddPrestaireModal from "@/components/prestataires/AddPrestataire"
import EditPrestaireModal from "@/components/prestataires/EditPrestataire"
import DeletePrestaireModal from "@/components/prestataires/DeletePrestataire"
import Link from "next/link"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"

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
  service?: { nom?: string }
  disponible: boolean
}

export default function PrestataireTable() {
  const { token } = useAuth()
  const [prestataires, setPrestataires] = useState<Prestataire[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrestataires = useCallback(async (page = 1, limit = 500) => {
    if (!token) return
      setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      const res = await fetch(`/api/prestataires?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as Record<string, unknown>
        const errMsg = typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`
        throw new Error(errMsg)
      }
      const data = await res.json()
      setPrestataires(data.prestataires || [])
    } catch (err: unknown) {
      console.error("Erreur fetch prestataires:", err)
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des prestataires"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchPrestataires()
  }, [fetchPrestataires])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [prestaireToDelete, setPrestaireToDelete] = useState<Prestataire | null>(null)
  const [prestaireToEdit, setPrestaireToEdit] = useState<Prestataire | null>(null)

  // Handlers
  const handleAddPrestataire = (newPrestataire: Prestataire) => {
    setPrestataires((prev) => [...prev, newPrestataire])
    setIsModalOpen(false)
  }

  const handleEditPrestataire = (updatedPrestataire: Prestataire) => {
    setPrestataires((prev) => prev.map((p) => (p.id_prestataire === updatedPrestataire.id_prestataire ? updatedPrestataire : p)))
    setIsEditModalOpen(false)
  }

  const handleDeletePrestataire = () => {
    if (prestaireToDelete) {
      setPrestataires((prev) => prev.filter((p) => p.id_prestataire !== prestaireToDelete.id_prestataire))
      setIsDeleteOpen(false)
      setPrestaireToDelete(null)
    }
  }

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-[#d61353]">
          <Users className="w-6 h-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Gestion des prestataires</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#d61353] text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-[#b01044] transition text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 cursor-pointer" />
          <span>Ajouter un prestataire</span>
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
       {loading ? (
  <div className="flex flex-col items-center justify-center py-10">
    <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
    <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
      Chargement des prestataires...
    </p>
  </div>
)  : error ? (

          <div className="text-center text-red-500 py-8">{error}</div>
        ) : prestataires.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun prestataire  trouvé</div>
        ) : (
        <table className="min-w-full border-collapse">
          <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Nom</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Prénom</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Contact</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Service</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Modèle</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Disponibilité</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {loading && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-sm text-gray-500">Chargement...</td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-sm text-red-500">{error}</td>
              </tr>
            )}

            {!loading && prestataires.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-sm text-gray-500">Aucun prestataire trouvé</td>
              </tr>
            )}

            {prestataires.map((prestataire) => (
              <tr key={prestataire.id_prestataire} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{prestataire.nom}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{prestataire.prenom}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{prestataire.contact ?? "-"}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{prestataire.service?.nom ?? "-"}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{prestataire.modele ?? "-"}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      prestataire.disponible
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {prestataire.disponible ? "Oui" : "Non"}
                  </span>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-center">
                  <div className="flex justify-center gap-3">
                     <Link href={`/prestataires/${prestataire.id_prestataire}`}>
                      <button className="p-2 rounded-lg cursor-pointer bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => {
                        setPrestaireToEdit(prestataire)
                        setIsEditModalOpen(true)
                      }}
                      className="p-2 rounded-lg bg-blue-50 cursor-pointer dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setPrestaireToDelete(prestataire)
                        setIsDeleteOpen(true)
                      }}
                      className="p-2 rounded-lg cursor-pointer bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

      {/* Modals */}
      <AddPrestaireModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddPrestataire={handleAddPrestataire}
      />

      {prestaireToEdit && (
        <EditPrestaireModal
          isOpen={isEditModalOpen}
          prestataire={prestaireToEdit}
          onClose={() => setIsEditModalOpen(false)}
          onEditPrestataire={handleEditPrestataire}
        />
      )}

      <DeletePrestaireModal
        isOpen={isDeleteOpen}
        prestataire={prestaireToDelete}
        onClose={() => {
          setIsDeleteOpen(false)
          setPrestaireToDelete(null)
        }}
        onConfirm={handleDeletePrestataire}
      />
    </div>
  )
}
