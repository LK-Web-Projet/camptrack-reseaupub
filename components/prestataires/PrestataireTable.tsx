"use client"

import { useState, useEffect, useCallback } from "react"
import { Pencil, Trash2, Plus, Users, Eye, Search, Filter } from "lucide-react"
import AddPrestaireModal from "@/components/prestataires/AddPrestataire"
import EditPrestaireModal from "@/components/prestataires/EditPrestataire"
import DeletePrestaireModal from "@/components/prestataires/DeletePrestataire"
import Link from "next/link"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"
import { Paginate } from "../Paginate";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input"

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

interface Campagne {
  id_campagne: string
  nom_campagne: string
}

export default function PrestataireTable() {
  const { apiClient } = useAuth()
  const [prestataires, setPrestataires] = useState<Prestataire[]>([])
  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  
  // Filtres
  const [selectedCampagne, setSelectedCampagne] = useState<string>("")
  const [dateDebut, setDateDebut] = useState<string>("")
  const [dateFin, setDateFin] = useState<string>("")

  const searchParam = useSearchParams();
  const page = parseInt(searchParam?.get("page") || "1");
  const [totalPages, setTotalPages] = useState(1);

  // Charger les campagnes au montage
  useEffect(() => {
    const fetchCampagnes = async () => {
      try {
        const res = await apiClient(`/api/campagnes?limit=500`)
        if (res.ok) {
          const data = await res.json()
          setCampagnes(data.campagnes || [])
        }
      } catch (err) {
        console.error("Erreur campagnes:", err)
      }
    }
    fetchCampagnes()
  }, [apiClient])

  const fetchPrestataires = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ 
        page: String(page), 
        limit: '7',
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCampagne && { campagne: selectedCampagne }),
        ...(dateDebut && { dateDebut }),
        ...(dateFin && { dateFin })
      })
      const res = await apiClient(`/api/prestataires?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as Record<string, unknown>
        const errMsg = typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`
        throw new Error(errMsg)
      }
      const data = await res.json()
      setPrestataires(data.prestataires || [])
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch (err: unknown) {
      console.error("Erreur fetch prestataires:", err)
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des prestataires"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [apiClient, page, searchQuery, selectedCampagne, dateDebut, dateFin])

  useEffect(() => {
    fetchPrestataires()
  }, [fetchPrestataires])

  // Recherche améliorée - local filtering (pour démo)
  const filteredPrestataires = prestataires.filter((p) => {
    const search = searchQuery.toLowerCase()
    return (
      p.nom.toLowerCase().includes(search) ||
      p.prenom.toLowerCase().includes(search) ||
      (p.contact || "").toLowerCase().includes(search) ||
      (p.service?.nom || "").toLowerCase().includes(search) ||
      (p.type_panneau || "").toLowerCase().includes(search) ||
      (p.modele || "").toLowerCase().includes(search) ||
      (p.marque || "").toLowerCase().includes(search) ||
      (p.plaque || "").toLowerCase().includes(search) ||
      (p.couleur || "").toLowerCase().includes(search) ||
      (p.id_verification || "").toLowerCase().includes(search)
    )
  })

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

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedCampagne("")
    setDateDebut("")
    setDateFin("")
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
      <div className="w-full  flex flex-row justify-between lg:items-center lg:justify-end gap-4 mb-4">
      <div className="flex justify-end mb-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-[200px] bg-white dark:bg-gray-800"
          />
        </div>
      </div>

      {/* Bouton Afficher/Masquer les filtres */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition"
        >
          <Filter className="w-4 h-4" />
          <span>{showFilters ? "Masquer les filtres" : "Afficher les filtres"}</span>
        </button>
      </div>
      </div>

      {/* Section Filtres */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Select Campagne */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campagne
              </label>
              <select
                value={selectedCampagne}
                onChange={(e) => setSelectedCampagne(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d61353]"
              >
                <option value="">-- Toutes les campagnes --</option>
                {campagnes.map((campagne) => (
                  <option key={campagne.id_campagne} value={campagne.id_campagne}>
                    {campagne.nom_campagne}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Date Début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date début
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d61353]"
              />
            </div>

            {/* Input Date Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date fin
              </label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d61353]"
              />
            </div>
          </div>

          {/* Bouton Réinitialiser */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedCampagne("")
                setDateDebut("")
                setDateFin("")
              }}
              className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
              Chargement des prestataires...
            </p>
          </div>
        ) : error ? (

          <div className="text-center text-red-500 py-8">{error}</div>
        ) : prestataires.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun prestataire  trouvé</div>
        ) : (
          <div>
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

                {!loading && filteredPrestataires.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-sm text-gray-500">Aucun prestataire trouvé</td>
                  </tr>
                )}

                {filteredPrestataires.map((prestataire) => (
                  <tr key={prestataire.id_prestataire} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{prestataire.nom}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{prestataire.prenom}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{prestataire.contact ?? "-"}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{prestataire.service?.nom ?? "-"}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{prestataire.modele ?? "-"}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${prestataire.disponible
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
            {totalPages > 1 && <Paginate pages={totalPages} currentPage={page} />}
          </div>
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
