"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { toast, ToastContainer } from "react-toastify"
import { Pencil, Trash2, Plus, User } from "lucide-react"
import AddUserModal from "@/components/user/AddUser"
import EditUserModal from "@/components/user/EditUser"
import DeleteUserModal from "@/components/user/DeleteUser"
import { Paginate } from "../Paginate"

import {useSearchParams } from "next/navigation";

interface User {
  id_user: string
  nom: string
  prenom: string
  type_user: "ADMIN" | "SUPERVISEUR_CAMPAGNE" | "CONTROLEUR" | "OPERATIONNEL" | "EQUIPE"
  email: string
  contact: string
  created_at: string
}

export default function TableUser() {
  const { token } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [totalPages, setTotalPages] = useState(1);

  
    const searchParam = useSearchParams();
    const page = parseInt(searchParam?.get("page") || "1");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
    const res = await fetch("/api/users?page="+page+"&limit=1", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error("Erreur lors du chargement des utilisateurs")
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : data?.users || [])
        setTotalPages(data?.pagination.totalPages || 1);
      } catch (e) {
        setError("Impossible de charger les utilisateurs")
        toast.error("Impossible de charger les utilisateurs")
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchUsers()
  }, [token])

  const handleAddUser = async (newUser: User) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newUser),
      })
      if (!res.ok) throw new Error("Erreur lors de l'ajout")
      const created = await res.json()
      setUsers((prev) => [...prev, created])
      toast.success("Utilisateur ajouté avec succès")
    } catch {
      toast.error("Erreur lors de l'ajout de l'utilisateur")
    }
  }

  const handleEditUser = async (updatedUser: User) => {
    try {
      const res = await fetch(`/api/users/${updatedUser.id_user}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedUser),
      })
      if (!res.ok) throw new Error("Erreur lors de la modification")
      const user = await res.json()
      setUsers((prev) => prev.map((u) => (u.id_user === user.id_user ? user : u)))
      toast.success("Utilisateur modifié avec succès")
    } catch {
      toast.error("Erreur lors de la modification de l'utilisateur")
    }
  }

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        const res = await fetch(`/api/users/${userToDelete.id_user}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error("Erreur lors de la suppression")
        setUsers((prev) => prev.filter((u) => u.id_user !== userToDelete.id_user))
        toast.success("Utilisateur supprimé avec succès")
      } catch {
        toast.error("Erreur lors de la suppression de l'utilisateur")
      } finally {
        setUserToDelete(null)
        setIsDeleteOpen(false)
      }
    }
  }

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-[#d61353]">
          <User className="w-6 h-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Gestion des utilisateurs</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#d61353] hover:bg-[#b01044] text-white px-4 py-2 rounded-lg shadow transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un utilisateur</span>
        </button>
      </div>

      <ToastContainer />

      {/* TABLE */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
       {loading ? (
  <div className="flex flex-col items-center justify-center py-10">
    <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
    <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
      Chargement des utilisateurs...
    </p>
  </div>
)  : error ? (

          <div className="text-center text-red-500 py-8">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun utilisateur trouvé</div>
        ) : (
          <div>
            <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-left text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
                <th className="px-6 py-3">Nom & Prénom</th>
                <th className="px-6 py-3">Type d&apos;utilisateur</th>
                <th className="px-6 py-3">Email & Contact</th>
                <th className="px-6 py-3">Date de création</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user, index) => (
                <tr
                  key={user.id_user}
                  className={`transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-950"
                  }`}
                >
                  <td className="px-6 py-4 font-medium">
                    {user.nom} {user.prenom}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
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
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{user.email}</span>
                      <span className="text-xs text-gray-500">{user.contact}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                     <button
  onClick={() => {
    setUserToEdit(user) // 👈 On stocke l'utilisateur sélectionné
    setIsEditModalOpen(true)
  }}
  className="p-2 rounded-lg  cursor-pointer  bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 transition"
>
  <Pencil className="w-4 h-4" />
</button>

                      <button
                        onClick={() => {
                          setUserToDelete(user)
                          setIsDeleteOpen(true)
                        }}
                        className="p-2  cursor-pointer  rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
            { totalPages === 1 ? ''
            :<Paginate pages ={totalPages} currentPage={page} path="/dashboard/admin" />
            }
          </div>

        )}
      </div>

      {/* MODALS */}
      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddUser={handleAddUser}
      />
    <EditUserModal
  isOpen={isEditModalOpen}
  onClose={() => {
    setIsEditModalOpen(false)
    setUserToEdit(null)
  }}
  onEditUser={handleEditUser}
  user={userToEdit} 
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
