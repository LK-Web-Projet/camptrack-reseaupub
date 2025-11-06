"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus, Briefcase } from "lucide-react"
import AddServiceModal from "@/components/services/AddService"
import EditServiceModal from "@/components/services/EditService"
import DeleteServiceModal from "@/components/services/DeleteService"

interface Service {
  id_service: string
  nom: string
  description: string | null
  created_at: string
}

export default function ServiceTable() {
  const [services, setServices] = useState<Service[]>([
    {
      id_service: "s1",
      nom: "Distribution",
      description: "Distribution de flyers et prospectus",
      created_at: "2025-11-01",
    },
    {
      id_service: "s2",
      nom: "Affichage",
      description: "Affichage publicitaire sur tricycles",
      created_at: "2025-11-01",
    },
    {
      id_service: "s3",
      nom: "Animation",
      description: "Animation et promotion sur les lieux de vente",
      created_at: "2025-11-01",
    },
  ])

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)

  // ➕ Ajouter un service
  const handleAddService = (newService: Service) => {
    setServices((prev) => [...prev, newService])
  }

  // ✏️ Modifier un service
  const handleEditService = (updatedService: Service) => {
    setServices((prev) =>
      prev.map((s) => (s.id_service === updatedService.id_service ? updatedService : s))
    )
  }

  // 🗑️ Supprimer un service
  const confirmDeleteService = () => {
    if (serviceToDelete) {
      setServices((prev) => prev.filter((s) => s.id_service !== serviceToDelete.id_service))
      setServiceToDelete(null)
      setIsDeleteModalOpen(false)
    }
  }

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-[#d61353]">
          <Briefcase className="w-6 h-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Gestion des services</h1>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#d61353] text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-[#b01044] transition text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>Ajouter un service </span>
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Nom du service</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Description</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold">Date de création</th>
              <th className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {services.map((service) => (
              <tr key={service.id_service} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-3 md:px-6 py-3 text-xs md:text-sm font-medium">{service.nom}</td>
                <td className="px-3 md:px-6 py-3 text-xs md:text-sm">{service.description || "-"}</td>
                <td className="px-3 md:px-6 py-3 text-xs md:text-sm">
                  {new Date(service.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-3 md:px-6 py-3 text-xs md:text-sm text-center">
                  <div className="flex justify-center gap-3">
                     <button
  onClick={() => {
    setServiceToEdit(service) // 👈 On stocke l'utilisateur sélectionné
    setIsEditModalOpen(true)
  }}
  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 transition"
>
  <Pencil className="w-4 h-4" />
</button>

                      <button
                        onClick={() => {
                          setServiceToDelete(service)
                          setIsDeleteModalOpen(true)
                        }}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📦 MODALS */}
      <AddServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddService={handleAddService}
      />

      {serviceToEdit && (
        <EditServiceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          service={serviceToEdit}
          onEditService={handleEditService}
        />
      )}

      <DeleteServiceModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setServiceToDelete(null)
        }}
        onConfirm={confirmDeleteService}
        service={serviceToDelete}
      />
    </div>
  )
}
