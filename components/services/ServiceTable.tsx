"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Briefcase } from "lucide-react";
import AddService from "@/components/services/AddService";
import EditService from "@/components/services/EditService";
import DeleteService from "@/components/services/DeleteService";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";

interface Service {
  id_service: string;
  nom: string;
  description: string | null;
  created_at: string;
  _count?: { campagnes: number; prestataires: number };
}

export default function ServiceTable() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
const { token } = useAuth()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
const fetchServices = async () => {
    if (!token) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/services/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erreur API");

      const data = await res.json();
      setServices(data.services || []);

    } catch (error) {
      console.error("Erreur API :", error);
      toast.error("Impossible de charger les lieux");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [token]);

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
          <span>Ajouter un service</span>
        </button>
      </div>

     
       <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
       {loading ? (
  <div className="flex flex-col items-center justify-center py-10">
    <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
    <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
      Chargement des clients...
    </p>
  </div>
)  : error ? (

          <div className="text-center text-red-500 py-8">{error}</div>
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun service trouvé</div>
        ) : (
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
              {services.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    Aucun service trouvé.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
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
                            setServiceToEdit(service);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 cursor-pointer rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setServiceToDelete(service);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 cursor-pointer rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
             )}
        </div>
   

      {/* MODALS */}
      <AddService
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onServiceUpdated={fetchServices}
      />

      {serviceToEdit && (
        <EditService
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setServiceToEdit(null);
          }}
          service={serviceToEdit}
          onServiceUpdated={fetchServices}
        />
      )}

      {serviceToDelete && (
        <DeleteService
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setServiceToDelete(null);
          }}
          service={serviceToDelete}
          onServiceUpdated={fetchServices}
        />
      )}
    </div>
  );
}
