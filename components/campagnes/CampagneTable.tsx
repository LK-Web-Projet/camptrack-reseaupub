"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil, Trash2, Plus, Megaphone, Eye } from "lucide-react"
import AddCampagneModal from "@/components/campagnes/AddCampagne"
import EditCampagneModal from "@/components/campagnes/EditCampagne"
import DeleteCampagneModal from "@/components/campagnes/DeleteCampagne"
import Link from "next/link"

import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"

interface Campagne {
  id_campagne: string
  nom_campagne: string
  type_campagne?: string
  status?: string
  date_debut?: string
  date_fin?: string
  service?: { nom?: string; id_service?: string }
  quantite_service?: number
  _count?: { affectations?: number }
}

export default function CampagneTable() {
  const { token } = useAuth()
  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [campagneToDelete, setCampagneToDelete] = useState<Campagne | null>(null)
  const [campagneToEdit, setCampagneToEdit] = useState<Campagne | null>(null)

  const fetchCampagnes = useCallback(async (page = 1, limit = 50) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      const res = await fetch(`/api/campagnes?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as Record<string, string>
        throw new Error(body.error || `Erreur ${res.status}`)
      }
      const data = await res.json()
      setCampagnes(data.campagnes || [])
    } catch (err: unknown) {
      console.error("Erreur fetch campagnes:", err)
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des campagnes"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchCampagnes()
  }, [fetchCampagnes])

  // handlers passed to modals: they simply refresh the list
  const handleAddCampagne = () => fetchCampagnes()
  const handleEditCampagne = () => fetchCampagnes()

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-[#d61353]">
          <Megaphone className="w-6 h-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Gestion des campagnes</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#d61353] text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-[#b01044] transition text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 cursor-pointer" />
          <span>Ajouter une campagne</span>
        </button>
      </div>

     
       <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
       {loading ? (
  <div className="flex flex-col items-center justify-center py-10">
    <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
    <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
      Chargement des campagnes...
    </p>
  </div>
)  : error ? (

          <div className="text-center text-red-500 py-8">{error}</div>
        ) : campagnes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucune campagne trouvé</div>
        ) : (
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Nom</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Type</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Status</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Date début</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Date fin</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Service</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Quantité</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {loading && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-sm text-gray-500">Chargement...</td>
              </tr>
            )}

            {!loading && campagnes.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-sm text-gray-500">Aucune campagne trouvée</td>
              </tr>
            )}

            {campagnes.map((campagne) => (
              <tr key={campagne.id_campagne} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{campagne.nom_campagne}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{campagne.type_campagne ?? '-'}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    campagne.status === "EN_COURS" ? "bg-blue-100 text-blue-800" :
                    campagne.status === "TERMINEE" ? "bg-green-100 text-green-800" :
                    campagne.status === "PLANIFIEE" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {campagne.status ?? '-'}
                  </span>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{campagne.date_debut ? new Date(campagne.date_debut).toLocaleDateString('fr-FR') : '-'}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{campagne.date_fin ? new Date(campagne.date_fin).toLocaleDateString('fr-FR') : '-'}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{campagne.service?.nom ?? '-'}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{campagne.quantite_service ?? campagne._count?.affectations ?? '-'}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-center">
                  <div className="flex justify-center gap-3">
                    <Link href={`/dashboard/campagnes/${campagne.id_campagne}`}>
                      <button className="p-2 rounded-lg cursor-pointer bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>

                    <button
                      onClick={() => { setCampagneToEdit(campagne); setIsEditModalOpen(true) }}
                      className="p-2 rounded-lg bg-blue-50 cursor-pointer dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => { setCampagneToDelete(campagne); setIsDeleteOpen(true) }}
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

      <AddCampagneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCampagne={handleAddCampagne}
      />

      {campagneToEdit && (
        <EditCampagneModal
          isOpen={isEditModalOpen}
          campagne={campagneToEdit}
          onClose={() => setIsEditModalOpen(false)}
          onEditCampagne={handleEditCampagne}
        />
      )}

      <DeleteCampagneModal
        isOpen={isDeleteOpen}
        campagne={campagneToDelete}
        onClose={() => { setIsDeleteOpen(false); setCampagneToDelete(null) }}
        onCampagneUpdated={() => { fetchCampagnes(); setIsDeleteOpen(false); setCampagneToDelete(null) }}
      />
    </div>
  )
}