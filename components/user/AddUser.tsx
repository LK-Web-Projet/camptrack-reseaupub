"use client"

import { useFormik } from "formik"
import * as Yup from "yup"
import { X } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddUser: (user: any) => void
}

export default function AddUserModal({ isOpen, onClose, onAddUser }: AddUserModalProps) {
  const { apiClient } = useAuth()
  const formik = useFormik({
    initialValues: {
      nom: "",
      prenom: "",
      type_user: "",
      email: "",
      contact: "",
      password: "",
    },
    validationSchema: Yup.object({
      nom: Yup.string().required("Champ obligatoire"),
      prenom: Yup.string().required("Champ obligatoire"),
      type_user: Yup.string().required("Champ obligatoire"),
      email: Yup.string().email("Email invalide").required("Champ obligatoire"),
      contact: Yup.string().required("Champ obligatoire"),
      password: Yup.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").required("Champ obligatoire"),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const res = await apiClient("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Erreur lors de l'ajout");
        }

        const created = await res.json()
        onAddUser(created) // Callback pour mettre à jour la liste sans recharger
        toast.success("Utilisateur ajouté avec succès")

        resetForm()
        onClose()
      } catch (err) {
        console.error(err)
        toast.error(err instanceof Error ? err.message : "Erreur lors de l'ajout de l'utilisateur")
      } finally {
        setSubmitting(false)
      }
    },
  })

  if (!isOpen) return null

  const fields = ["nom", "prenom", "email", "contact", "password"] as const
  type FieldKey = typeof fields[number]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fond semi-transparent */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-md shadow-xl relative border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-[#d61353]">Ajouter un utilisateur</h2>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {fields.map((field: FieldKey) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {field === "password" ? "Mot de passe" : field.replace("_", " ")}
              </label>
              <input
                type={field === "password" ? "password" : "text"}
                name={field}
                value={formik.values[field]}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
              />
              {formik.touched[field] && formik.errors[field] && (
                <p className="text-red-500 text-sm mt-1">{formik.errors[field]}</p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1">Type d&apos;utilisateur</label>
            <select
              name="type_user"
              value={formik.values.type_user}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
            >
              <option value="">Sélectionner</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPERVISEUR_CAMPAGNE">SUPERVISEUR CAMPAGNE</option>
              <option value="CONTROLEUR">CONTROLEUR</option>
              <option value="OPERATIONNEL">OPERATIONNEL</option>
              <option value="EQUIPE">EQUIPE</option>
            </select>
            {formik.touched.type_user && formik.errors.type_user && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.type_user}</p>
            )}
          </div>

          <div className="flex justify-between gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800 transition-smooth"
            >
              Annuler
            </button>
            <Button
              type="submit"
              loading={formik.isSubmitting}
              className="px-4 py-2 rounded-md bg-[#d61353] text-white hover:bg-[#b01044] transition-smooth"
            >
              {formik.isSubmitting ? "Ajout..." : "Valider"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
