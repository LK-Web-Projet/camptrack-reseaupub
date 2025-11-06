"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import AddClientModal from "@/components/clients/AddClient";
import EditClientModal from "@/components/clients/EditClient";
import DeleteClientModal from "@/components/clients/DeleteClient";

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
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export default function ClientTable() {
  // données fictives initiales
  const [clients, setClients] = useState<Client[]>([
    {
      id_client: "c_1",
      nom: "Doe",
      prenom: "John",
      entreprise: "Acme Corp",
      domaine_entreprise: "Distribution",
      adresse: "12 rue de Test, Cotonou",
      contact: "+229 90 00 00 01",
      mail: "john.doe@acme.com",
      type_client: "PROSPECT",
      created_at: "2023-12-02",
      updated_at: "2024-01-05",
    },
    {
      id_client: "c_2",
      nom: "Traoré",
      prenom: "Aïcha",
      entreprise: "Boutique Aïcha",
      domaine_entreprise: "Commerce",
      adresse: "Quartier X, Porto-Novo",
      contact: "+229 90 00 00 02",
      mail: "aicha@boutique.com",
      type_client: "CLIENT",
      created_at: "2024-06-10",
      updated_at: "2024-06-12",
    },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // handlers
  const handleAddClient = (newClient: Client) => {
    setClients((prev) => [...prev, newClient]);
  };

  const handleEditClient = (updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id_client === updated.id_client ? updated : c)));
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id_client !== id));
  };

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      {/* Header */}
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

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Entreprise / Adresse</th>
              <th className="px-6 py-3">Email / Contact</th>
              <th className="px-6 py-3">Domaine / Type</th>
              <th className="px-6 py-3">Créé</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {clients.map((c, i) => (
              <tr
                key={c.id_client}
                className={`transition hover:bg-gray-50 dark:hover:bg-gray-800 ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-950"}`}
              >
                <td className="px-6 py-4 font-medium">
                  <div>{c.nom} {c.prenom}</div>
                </td>

                <td className="px-6 py-4">
                  <div className="font-medium">{c.entreprise || "-"}</div>
                  <div className="text-xs text-gray-500">{c.adresse || "-"}</div>
                </td>

                <td className="px-6 py-4">
                  <div className="font-medium">{c.mail || "-"}</div>
                  <div className="text-xs text-gray-500">{c.contact || "-"}</div>
                </td>

                <td className="px-6 py-4">
                  <div className="font-medium">{c.domaine_entreprise || "-"}</div>
                  <div className="text-xs text-gray-500">{c.type_client || "-"}</div>
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
          setIsDeleteOpen(false);
          setClientToDelete(null);
        }}
        client={clientToDelete}
        onDeleteClient={(id) => {
          handleDeleteClient(id);
          setIsDeleteOpen(false);
          setClientToDelete(null);
        }}
      />
    </div>
  );
}
