"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import AddCampagneModal from "@/components/campagnes/AddCampagne"
import EditCampagneModal from "@/components/campagnes/EditCampagne"
import DeleteCampagneModal from "@/components/campagnes/DeleteCampagne"

interface Campagne {
  id_campagne: string;
  nom_campagne: string;
  type_campagne: "MASSE" | "PROXIMITE";
  status: "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
  services: string[];
  date_debut: string;
  date_fin: string;
}

export default function CampagneTable() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([
    {
      id_campagne: "c1",
      nom_campagne: "Campagne Été 2025",
      type_campagne: "MASSE",
      status: "EN_COURS",
      services: ["Distribution", "Affichage"],
      date_debut: "2025-06-01",
      date_fin: "2025-08-31"
    },
    {
      id_campagne: "c2",
      nom_campagne: "Promotion Quartier Nord",
      type_campagne: "PROXIMITE",
      status: "PLANIFIEE",
      services: ["Distribution"],
      date_debut: "2025-12-01",
      date_fin: "2025-12-31"
    },
    {
      id_campagne: "c3",
      nom_campagne: "Événement Centre-ville",
      type_campagne: "MASSE",
      status: "TERMINEE",
      services: ["Affichage", "Animation"],
      date_debut: "2025-05-01",
      date_fin: "2025-05-15"
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [campagneToDelete, setCampagneToDelete] = useState<Campagne | null>(null)
  const [campagneToEdit, setCampagneToEdit] = useState<Campagne | null>(null)

  const handleAddCampagne = (newCampagne: Campagne) => {
    setCampagnes((prev) => [...prev, newCampagne])
  }

  const handleEditCampagne = (updatedCampagne: Campagne) => {
    setCampagnes((prev) =>
      prev.map((campagne) => (campagne.id_campagne === updatedCampagne.id_campagne ? updatedCampagne : campagne))
    )
  }

  const confirmDeleteCampagne = () => {
    if (campagneToDelete) {
      setCampagnes((prev) => prev.filter((c) => c.id_campagne !== campagneToDelete.id_campagne))
      setCampagneToDelete(null)
      setIsDeleteOpen(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="md:flex items-center justify-between mb-6 text-black dark:text-white bg-white dark:bg-black p-4 rounded-lg shadow">
        <h1 className="text-xl md:text-2xl font-semibold text-[#d61353]">Liste des campagnes</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#d61353] text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-[#b01044] transition text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 cursor-pointer" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Nom</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Type</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Status</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Date début</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Date fin</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Services</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {campagnes.map((campagne) => (
              <tr key={campagne.id_campagne} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{campagne.nom_campagne}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{campagne.type_campagne}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    campagne.status === "EN_COURS" ? "bg-blue-100 text-blue-800" :
                    campagne.status === "TERMINEE" ? "bg-green-100 text-green-800" :
                    campagne.status === "PLANIFIEE" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {campagne.status}
                  </span>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{new Date(campagne.date_debut).toLocaleDateString('fr-FR')}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{new Date(campagne.date_fin).toLocaleDateString('fr-FR')}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                  <div className="flex flex-wrap gap-1">
                    {campagne.services.map((service, index) => (
                      <span key={index} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                        {service}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-center">
                  <div className="flex justify-center gap-2">
                    <Pencil
                      className="w-4 h-4 md:w-5 md:h-5 cursor-pointer text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setCampagneToEdit(campagne);
                        setIsEditModalOpen(true);
                      }}
                    />
                    <Trash2
                      className="w-4 h-4 md:w-5 md:h-5 cursor-pointer text-red-600 hover:text-red-800"
                      onClick={() => {
                        setCampagneToDelete(campagne)
                        setIsDeleteOpen(true)
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        onClose={() => {
          setIsDeleteOpen(false)
          setCampagneToDelete(null)
        }}
        onConfirm={confirmDeleteCampagne}
      />
    </div>
  )
}