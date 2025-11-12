"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, MapPin } from "lucide-react";
import AddLieuModal from "./AddLieu";
import EditLieuModal from "./EditLieu";
import DeleteLieuModal from "./DeleteLieu";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";

export type Lieu = {
  id_lieu: string;
  nom: string;
  ville: string;
  created_at: string;
  _count?: { campagnes: number };
};

export default function LieuTable() {
  const { token } = useAuth();

  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [lieuToEdit, setLieuToEdit] = useState<Lieu | null>(null);
  const [lieuToDelete, setLieuToDelete] = useState<Lieu | null>(null);

  // ✅ Recharger les lieux
  const fetchLieux = async () => {
    if (!token) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/lieux/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erreur API");

      const data = await res.json();
      setLieux(data.lieux || []);

    } catch (error) {
      console.error("Erreur API :", error);
      toast.error("Impossible de charger les lieux");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLieux();
  }, [token]);

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-[#d61353]">
          <MapPin className="w-6 h-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Gestion des lieux</h1>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#d61353] text-white px-4 py-2 rounded-lg hover:bg-[#b01044] transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter un lieu
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
       {loading ? (
  <div className="flex flex-col items-center justify-center py-10">
    <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
    <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
      Chargement des lieux...
    </p>
  </div>
)  : error ? (

          <div className="text-center text-red-500 py-8">{error}</div>
        ) : lieux.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun lieu trouvé</div>
        ) : (
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-6 py-3 text-sm font-semibold">Nom du lieu</th>
                <th className="px-6 py-3 text-sm font-semibold">Ville</th>
                <th className="px-6 py-3 text-sm font-semibold">Campagnes</th>
                <th className="px-6 py-3 text-sm font-semibold">Créé le</th>
                <th className="px-6 py-3 text-sm font-semibold text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {lieux.map((lieu) => (
                <tr key={lieu.id_lieu}>
                  <td className="px-6 py-3">{lieu.nom}</td>
                  <td className="px-6 py-3">{lieu.ville}</td>
                  <td className="px-6 py-3 text-center">{lieu._count?.campagnes || 0}</td>
                  <td className="px-6 py-3">
                    {new Date(lieu.created_at).toLocaleDateString("fr-FR")}
                  </td>

                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setLieuToEdit(lieu);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setLieuToDelete(lieu);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {lieux.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    Aucun lieu trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
              )}
        </div>
  

      {/* MODALS */}
      <AddLieuModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLieuUpdated={fetchLieux}
      />

      {lieuToEdit && (
        <EditLieuModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setLieuToEdit(null);
          }}
          lieu={lieuToEdit}
          onLieuUpdated={fetchLieux}
        />
      )}

      {lieuToDelete && (
        <DeleteLieuModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setLieuToDelete(null);
          }}
          lieu={lieuToDelete}
          onLieuUpdated={fetchLieux}
        />
      )}
    </div>
  );
}
