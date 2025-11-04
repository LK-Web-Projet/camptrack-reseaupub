"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import AddUserModal from "@/components/user/AddUser" 
import EditUserModal from "@/components/user/EditUser" 
import DeleteUserModal from "@/components/user/DeleteUser"


interface User {
  id_user: string
  nom: string
  prenom: string
//   nom_utilisateur: string
  type_user: "ADMIN" | "SUPERVISEUR_CAMPAGNE" | "CONTROLEUR" | "OPERATIONNEL" | "EQUIPE"
  email: string
  contact: string
  created_at: string
}

export default function TableUser() {
  const [users, setUsers] = useState<User[]>([
    {
      id_user: "u1",
      nom: "Kouassi",
      prenom: "Jean",
      type_user: "ADMIN",
      email: "jean.kouassi@example.com",
      contact: "650123456",
      created_at: "2025-11-01",
    },
    {
      id_user: "u2",
      nom: "Soglo",
      prenom: "Amira",
      type_user: "SUPERVISEUR_CAMPAGNE",
      email: "amira.soglo@example.com",
      contact: "970123789",
      created_at: "2025-10-28",
    },
    {
      id_user: "u3",
      nom: "Mensah",
      prenom: "Eric",
      type_user: "OPERATIONNEL",
      email: "eric.mensah@example.com",
      contact: "660223344",
      created_at: "2025-10-15",
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
const [userToDelete, setUserToDelete] = useState<User | null>(null)


  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser])
  }
  const handleEditUser = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((user) => (user.id_user === updatedUser.id_user ? updatedUser : user))
    )
  }
const confirmDeleteUser = () => {
  if (userToDelete) {
    setUsers((prev) => prev.filter((u) => u.id_user !== userToDelete.id_user))
    setUserToDelete(null)
    setIsDeleteOpen(false)
  }
}

  return (
    <div className="p-6">
      {/* Header */}
      <div className="md:flex items-center justify-between mb-6 text-black dark:text-white bg-white dark:bg-black p-4 rounded-lg shadow">
        <h1 className="text-2xl font-semibold text-[#d61353]">Liste des utilisateurs</h1>
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
            <tr>
              <th className="px-6 py-3 text-sm font-semibold">Nom</th>
              <th className="px-6 py-3 text-sm font-semibold">Prénom</th>
              <th className="px-6 py-3 text-sm font-semibold">Nom utilisateur</th>
              <th className="px-6 py-3 text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-sm font-semibold">Contact</th>
              <th className="px-6 py-3 text-sm font-semibold">Date de création</th>
              <th className="px-6 py-3 text-sm font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id_user} className="border-t transition">
                <td className="px-6 py-3 text-sm">{user.nom}</td>
                <td className="px-6 py-3 text-sm">{user.prenom}</td>
                <td className="px-6 py-3 text-sm">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      user.type_user === "ADMIN"
                        ? "bg-pink-100 text-pink-700"
                        : user.type_user === "SUPERVISEUR_CAMPAGNE"
                        ? "bg-blue-100 text-blue-700"
                        : user.type_user === "CONTROLEUR"
                        ? "bg-yellow-100 text-yellow-700"
                        : user.type_user === "OPERATIONNEL"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.type_user.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">{user.email}</td>
                <td className="px-6 py-3 text-sm">{user.contact}</td>
                <td className="px-6 py-3 text-sm">
                  {new Date(user.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      <Pencil className="w-4 h-4" />
                    </button>
                   <button
  className="text-red-600 hover:text-red-800 cursor-pointer"
  onClick={() => {
    setUserToDelete(user)
    setIsDeleteOpen(true)
  }}
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

      {/* Modal d'ajout */}
      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddUser={handleAddUser}
      />
      
        <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEditUser={handleEditUser}
        />
        <DeleteUserModal
  isOpen={isDeleteOpen}
  onClose={() => {
    setIsDeleteOpen(false)
    setUserToDelete(null)
  }}
  onConfirm={confirmDeleteUser}
/>

    </div>
  )
}
