"use client";

import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [initialEmail, setInitialEmail] = useState("");

  useEffect(() => {
    if (user?.email) {
      setInitialEmail(user.email);
    }

    const fetchMe = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user?.email) {
          setInitialEmail(data.user.email);
        }
      } catch (err) {
        console.error("Erreur fetch /api/users/me", err);
      }
    };

    fetchMe();
  }, [user, token]);

  // Schéma Yup pour email
  const profileSchema = Yup.object({
    email: Yup.string()
      .email("Email invalide")
      .required("L'email est requis"),
  });

  // Schéma Yup pour mot de passe
  const passwordSchema = Yup.object({
    oldPassword: Yup.string()
      .min(6, "Min. 6 caractères")
      .required("Ancien mot de passe requis"),
    newPassword: Yup.string()
      .min(6, "Min. 6 caractères")
      .required("Nouveau mot de passe requis"),
    confirmPassword: Yup.string()
      .oneOf(
        [Yup.ref("newPassword")],
        "Les mots de passe doivent correspondre"
      )
      .required("Confirmez le nouveau mot de passe"),
  });

  const handleProfileSubmit = async (
    values: Record<string, string>,
    helpers: { setSubmitting: (value: boolean) => void }
  ): Promise<void> => {
    if (!token) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      logout();
      return;
    }
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Erreur lors de la mise à jour du profil");
        helpers.setSubmitting(false);
        return;
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      toast.success("Email mis à jour avec succès");
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau");
    } finally {
      helpers.setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (
    values: Record<string, string>,
    helpers: { setSubmitting: (value: boolean) => void }
  ): Promise<void> => {
    if (!token) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      logout();
      return;
    }

    try {
      // Call the users/{id}/password route with PUT
      const userId = user?.id_user;
      const res = await fetch(`/api/users/${userId}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Erreur lors du changement de mot de passe");
        helpers.setSubmitting(false);
        return;
      }

      toast.success("Mot de passe changé. Vous allez être déconnecté(e).");
      setTimeout(() => {
        logout();
        router.push("/");
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau");
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <div
      className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg shadow-md"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>

      {/* FORMULAIRE EMAIL */}
      <Formik
        enableReinitialize
        initialValues={{
          email: initialEmail,
        }}
        validationSchema={profileSchema}
        onSubmit={handleProfileSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Adresse Email</h2>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Field
                  type="email"
                  name="email"
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {isSubmitting ? "Mise à jour..." : "Mettre à jour l'email"}
              </button>
            </div>
          </Form>
        )}
      </Formik>

      {/* FORMULAIRE MOT DE PASSE */}
      <Formik
        initialValues={{
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        }}
        validationSchema={passwordSchema}
        onSubmit={handlePasswordSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Mot de passe</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ancien mot de passe
                  </label>
                  <Field
                    type="password"
                    name="oldPassword"
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                  <ErrorMessage
                    name="oldPassword"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nouveau mot de passe
                  </label>
                  <Field
                    type="password"
                    name="newPassword"
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                  <ErrorMessage
                    name="newPassword"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Confirmer mot de passe
                  </label>
                  <Field
                    type="password"
                    name="confirmPassword"
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Mise à jour..." : "Changer le mot de passe"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
