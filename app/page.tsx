"use client"
import { useState, useEffect } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton"
import { Logo } from "@/components/ui/logo"
import { Eye, EyeOff } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  // ✅ Afficher un toast si redirection avec authError=true
  useEffect(() => {
    if (searchParams.get("authError")) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
    }
  }, [searchParams])

  const formik = useFormik<{ email: string; password: string }>({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Adresse email invalide")
        .required("L’email est obligatoire"),
      password: Yup.string()
        .min(6, "Le mot de passe doit contenir au moins 6 caractères")
        .required("Le mot de passe est obligatoire"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        const success = await login(values.email, values.password)
        if (success) {
          toast.success("Connexion réussie.Bienvenue sur CampTrack !")
        } else {
          toast.error("Identifiants incorrects")
        }
      } catch {
        toast.error("Erreur lors de la connexion")
      } finally {
        setIsLoading(false)
      }
    },

  })

  return (
    <div className="flex min-h-screen">
      <ToastContainer />
      {/* Partie gauche : présentation */}
      <div className="hidden md:flex flex-1 w-1/2 flex-col justify-center items-center bg-black text-white p-12">
        <Logo />
        <h1 className="text-3xl font-bold mb-4">Bienvenue sur CampTrack</h1>
        <p className="text-lg max-w-sm font-semibold">
          La plateforme intelligente pour la <strong>gestion des campagnes tricycles</strong> de
          Réseau Pub. Connectez-vous pour accéder à votre espace.
        </p>
      </div>

      {/* Partie droite : formulaire */}
      <div className="md:w-1/2 w-full flex flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <div className="absolute top-4 right-4 cursor-pointer">
          <ThemeToggleButton />
        </div>
        <form
          onSubmit={formik.handleSubmit}
          className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-[80%] max-w-md border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-2xl font-semibold mb-6 text-center text-[#d61353]">
            Connexion
          </h2>

          {/* Champ email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block mb-2 text-sm bg-transparent font-medium text-gray-700 dark:text-gray-300"
            >
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              {...formik.getFieldProps("email")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 
                ${formik.touched.email && formik.errors.email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#d61353]"
                }`}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
            )}
          </div>

          {/* Champ mot de passe */}
          <div className="mb-6 relative">
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Mot de passe
            </label>
            <div className="flex justify-between items-center">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                {...formik.getFieldProps("password")}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 
                  ${formik.touched.password && formik.errors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#d61353]"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-700 dark:text-gray-700 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
              )}
            </div>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 bg-[#d61353] hover:bg-[#b01045] text-white font-semibold py-2 rounded-lg transition duration-200
    ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
  `}
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Se connecter"
            )}
          </button>

        </form>
      </div>
    </div>
  )
}
