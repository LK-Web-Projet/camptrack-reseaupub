"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import AddClientModal from "@/components/clients/AddClient";
import EditClientModal from "@/components/clients/EditClient";
import DeleteClientModal from "@/components/clients/DeleteClient";
import { toast } from "react-toastify";
import { useAuth } from "@/app/context/AuthContext";

type Client = {
  id_client: string;
  nom: string;
  prenom: string;
  entreprise?: string | null;
  domaine_entreprise?: string | null;
  adresse?: string | null;
  contact?: string | null;
  mail?: string | null;
  type_client?: string | null;
  created_at: string;
  updated_at?: string | null;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

export default function ClientTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { apiClient } = useAuth()
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const res = await apiClient("/api/clients?page=1&limit=50");

        if (!res.ok) throw new Error("Erreur lors du chargement des clients");

        const data = await res.json();
        setClients(Array.isArray(data) ? data : data?.clients || []);
      } catch (e) {
        setError("Impossible de charger les clients");
        toast.error("Impossible de charger les clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [apiClient]);

   const handleAddClient = async (newUser: Client) => {
    try {
      const res = await apiClient("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })
      if (!res.ok) throw new Error("Erreur lors de l'ajout")
      const created = await res.json()
      setClients((prev) => [...prev, created])
      toast.success("Client ajouté avec succès")
    } catch {
      toast.error("Erreur lors de l'ajout du client")
    }
  }

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

 
 const handleEditClient = async (updatedClient: Client) => {
    try {
      const res = await apiClient(`/api/clients/${updatedClient.id_client}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedClient),
      })
      if (!res.ok) throw new Error("Erreur lors de la modification")
      const client = await res.json()
      setClients((prev) => prev.map((c) => (c.id_client === client.id_client ? client : c)))
      toast.success("Utilisateur modifié avec succès")
    } catch {
      toast.error("Erreur lors de la modification de l'utilisateur")
    }
  }


const confirmDeleteClient = async (client: Client) => {
    if (clientToDelete) {
      try {
    const res = await apiClient(`/api/clients/${client.id_client}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Erreur lors de la suppression")
        setClients((prev) => prev.filter((c) => c.id_client !== clientToDelete.id_client))
        toast.success("Client supprimé avec succès")


      } catch {
        toast.error("Erreur lors de la suppression de lu client")
      } finally {
        setClientToDelete(null)
        setIsDeleteOpen(false)
      }
    }
  }

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 text-[#d61353]">
          <User className="w-6 h-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Gestion des clients</h1>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-[#d61353] hover:bg-[#b01044] text-white px-4 py-2 rounded-lg shadow transition"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un client</span>
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
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun client trouvé</div>
        ) : (
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-left text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Entreprise / Adresse</th>
                <th className="px-6 py-3">Email / Contact</th>
                <th className="px-6 py-3">Domaine / Type</th>
                <th className="px-6 py-3">Date de création</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {clients.map((c, i) => (
                <tr
                  key={c.id_client}
                  className={`transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    i % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-950"
                  }`}
                >
                  <td className="px-6 py-4 font-medium">
                    {c.nom} {c.prenom}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium">{c.entreprise || "-"}</div>
                    <div className="text-xs text-gray-500">
                      {c.adresse || "-"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium">{c.mail || "-"}</div>
                    <div className="text-xs text-gray-500">
                      {c.contact || "-"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium">
                      {c.domaine_entreprise || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.type_client || "-"}
                    </div>
                  </td>

                  <td className="px-6 py-4">{formatDate(c.created_at)}</td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setClientToEdit(c);
                          setIsEditOpen(true);
                        }}
                        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setClientToDelete(c);
                          setIsDeleteOpen(true);
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
           )}
        </div>
        
     

      {/* Modals */}
      <AddClientModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddClient={(client) => {
          handleAddClient(client);
          setIsAddOpen(false);
        }}
      />

      {clientToEdit && (
        <EditClientModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          client={clientToEdit}
          onEditClient={(c) => {
            handleEditClient(c);
            setIsEditOpen(false);
            setClientToEdit(null);
          }}
        />
      )}

       <DeleteClientModal
              isOpen={isDeleteOpen}
              onClose={() => {
                setIsDeleteOpen(false)
                setClientToDelete(null)
              }}
              onConfirm={() => {
                if (clientToDelete) {
                  confirmDeleteClient(clientToDelete)
                }
              }}
            />
    </div>
  );
}
