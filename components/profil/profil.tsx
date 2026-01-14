"use client"

import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const { user, apiClient } = useAuth()
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  // Formulaire pour modifier l'email
  const formikEmail = useFormik({
    initialValues: {
      email: user?.email || "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      email: Yup.string().email("Email invalide").required("L'email est requis"),
    }),
    onSubmit: async (values) => {
      setLoadingEmail(true)
      try {
        const res = await apiClient(`/api/users/${user?.id_user}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email }),
        })

        if (!res.ok) throw new Error("Erreur lors de la mise à jour de l'email")

        toast.success("Email mis à jour avec succès")
      } catch (error) {
        console.error(error)
        toast.error("Impossible de mettre à jour l'email")
      } finally {
        setLoadingEmail(false)
      }
    },
  })

  // Formulaire pour modifier le mot de passe
  const formikPassword = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required("Mot de passe actuel requis"),
      newPassword: Yup.string().min(6, "Minimum 6 caractères").required("Nouveau mot de passe requis"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Les mots de passe ne correspondent pas")
        .required("Confirmation requise"),
    }),
    onSubmit: async (values, { resetForm }) => {
      setLoadingPassword(true)
      try {
        const res = await apiClient("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })

        if (!res.ok) throw new Error("Erreur lors du changement de mot de passe")

        toast.success("Mot de passe changé avec succès")
        resetForm()
      } catch (error) {
        console.error(error)
        toast.error("Impossible de changer le mot de passe")
      } finally {
        setLoadingPassword(false)
      }
    },
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-[#d61353]">Mon Profil</h1>

      {/* Section Informations */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Mes informations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={user?.nom || ""}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prénom</label>
            <input
              type="text"
              value={user?.prenom || ""}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rôle</label>
            <input
              type="text"
              value={user?.type_user || ""}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Modification Email */}
        <form onSubmit={formikEmail.handleSubmit} className="mt-6 border-t pt-4">
          <h3 className="text-md font-medium mb-3">Modifier mon email</h3>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formikEmail.values.email}
                onChange={formikEmail.handleChange}
                onBlur={formikEmail.handleBlur}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
              />
              {formikEmail.touched.email && formikEmail.errors.email && (
                <p className="text-red-500 text-xs mt-1">{formikEmail.errors.email}</p>
              )}
            </div>
            <Button
              type="submit"
              loading={loadingEmail}
              className="px-4 py-2 bg-[#d61353] hover:bg-[#b01044] text-white rounded-lg transition"
            >
              Mettre à jour l&apos;email
            </Button>
          </div>
        </form>
      </div>

      {/* Section Sécurité */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Sécurité</h2>
        <form onSubmit={formikPassword.handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe actuel</label>
            <input
              type="password"
              name="currentPassword"
              value={formikPassword.values.currentPassword}
              onChange={formikPassword.handleChange}
              onBlur={formikPassword.handleBlur}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
            />
            {formikPassword.touched.currentPassword && formikPassword.errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{formikPassword.errors.currentPassword}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              name="newPassword"
              value={formikPassword.values.newPassword}
              onChange={formikPassword.handleChange}
              onBlur={formikPassword.handleBlur}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
            />
            {formikPassword.touched.newPassword && formikPassword.errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{formikPassword.errors.newPassword}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              name="confirmPassword"
              value={formikPassword.values.confirmPassword}
              onChange={formikPassword.handleChange}
              onBlur={formikPassword.handleBlur}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
            />
            {formikPassword.touched.confirmPassword && formikPassword.errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{formikPassword.errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            loading={loadingPassword}
            className="w-full px-4 py-2 bg-[#d61353] hover:bg-[#b01044] text-white rounded-lg transition"
          >
            Changer le mot de passe
          </Button>
        </form>
      </div>
    </div>
  )
}
