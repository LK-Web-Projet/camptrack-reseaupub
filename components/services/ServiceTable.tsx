"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"

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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)

  const handleAddService = (newService: Service) => {
    setServices((prev) => [...prev, newService])
  }

  const handleEditService = (updatedService: Service) => {
    setServices((prev) =>
      prev.map((service) => (service.id_service === updatedService.id_service ? updatedService : service))
    )
  }

  const confirmDeleteService = () => {
    if (serviceToDelete) {
      setServices((prev) => prev.filter((s) => s.id_service !== serviceToDelete.id_service))
      setServiceToDelete(null)
      setIsDeleteOpen(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="md:flex  items-center justify-between mb-6 text-black dark:text-white bg-white dark:bg-black p-4 rounded-lg shadow">
        <h1 className="text-2xl font-semibold text-[#d61353]">Liste des services</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#d61353] text-white px-4 py-2 rounded-lg hover:bg-[#b01044] transition"
        >
          <Plus className="w-5 h-5 cursor-pointer" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-6 py-3 text-sm font-semibold">Nom du service</th>
              <th className="px-6 py-3 text-sm font-semibold">Description</th>
              <th className="px-6 py-3 text-sm font-semibold">Date de création</th>
              <th className="px-6 py-3 text-sm font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {services.map((service) => (
              <tr key={service.id_service} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 text-sm font-medium">{service.nom}</td>
                <td className="px-6 py-4 text-sm">{service.description || "-"}</td>
                <td className="px-6 py-4 text-sm">
                  {new Date(service.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <div className="flex justify-center gap-2">
                    <Pencil
                      className="w-5 h-5 cursor-pointer text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setIsEditModalOpen(true)
                      }}
                    />
                    <Trash2
                      className="w-5 h-5 cursor-pointer text-red-600 hover:text-red-800"
                      onClick={() => {
                        setServiceToDelete(service)
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

      {/* Les modals seront ajoutés plus tard */}
    </div>
  )
}
