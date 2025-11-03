// "use client"

// import { useFormik } from "formik"
// import * as Yup from "yup"
// import { X } from "lucide-react"

// interface User {
//   id_user: string
//   nom: string
//   prenom: string
//   nom_utilisateur: string
//   type_user: string
//   email: string
//   contact: string
//   created_at: string
// }

// interface EditUserModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onEditUser: (user: any) => void
// }

// export default function EditUserModal({ isOpen, onClose, onEditUser }: EditUserModalProps) {
//   const formik = useFormik({
//     initialValues: {
//       nom: "",
//       prenom: "",
//       type_user: "",
//       email: "",
//       contact: "",
//     },
//     validationSchema: Yup.object({
//       nom: Yup.string().required("Champ obligatoire"),
//       prenom: Yup.string().required("Champ obligatoire"),
//       type_user: Yup.string().required("Champ obligatoire"),
//       email: Yup.string().email("Email invalide").required("Champ obligatoire"),
//       contact: Yup.string().required("Champ obligatoire"),
//     }),
//     onSubmit: (values) => {
//       const newUser = {
//         ...values,
//         id_user: `u${Date.now()}`,
//         created_at: new Date().toISOString().split("T")[0],
//       }
//       onEditUser(newUser)
//       onClose()
//     },
//   })

//   if (!isOpen) return null


//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-md shadow-xl relative border border-gray-200 dark:border-gray-700">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
//         >
//           <X className="w-5 h-5" />
//         </button>
//         <h2 className="text-xl font-semibold mb-4 text-[#d61353]">Modifier l'utilisateur</h2>
//         <form onSubmit={formik.handleSubmit} className="space-y-4">
//           {["nom", "prenom", "email", "contact"].map((field) => (
//             <div key={field}>
//               <label className="block text-sm font-medium mb-1 capitalize">
//                 {field.replace("_", " ")}
//               </label>
//               <input
//                 type="text"
//                 name={field}
//                 value={formik.values[field]}
//                 onChange={formik.handleChange}
//                 onBlur={formik.handleBlur}
//                 className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
//               />
//               {formik.touched[field] && formik.errors[field] && (
//                 <p className="text-red-500 text-sm mt-1">{formik.errors[field]}</p>
//               )}
//             </div>
//           ))}

//           <div>
//             <label className="block text-sm font-medium mb-1">Type d'utilisateur</label>
//             <select
//               name="type_user"
//               value={formik.values.type_user}
//               onChange={formik.handleChange}
//               onBlur={formik.handleBlur}
//               className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
//             >
//               <option value="">Sélectionner</option>
//               <option value="ADMIN">ADMIN</option>
//               <option value="SUPERVISEUR_CAMPAGNE">SUPERVISEUR CAMPAGNE</option>
//               <option value="CONTROLEUR">CONTROLEUR</option>
//               <option value="OPERATIONNEL">OPERATIONNEL</option>
//               <option value="EQUIPE">EQUIPE</option>
//             </select>
//             {formik.touched.type_user && formik.errors.type_user && (
//               <p className="text-red-500 text-sm mt-1">{formik.errors.type_user}</p>
//             )}
//           </div>

//           <div className="flex justify-end gap-4 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800"
//             >
//               Annuler
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 rounded-md bg-[#d61353] text-white hover:bg-[#b01044]"
//             >
//               Valider
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   )
// }

"use client"

import { useFormik } from "formik"
import * as Yup from "yup"
import { X } from "lucide-react"

interface User {
  id_user: string
  nom: string
  prenom: string
  type_user: string
  email: string
  contact: string
  created_at: string
}

 interface EditUserModalProps {
   isOpen: boolean
   onClose: () => void
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
onEditUser: (user: any) => void
 }

export default function EditUserModal({ isOpen, onClose, onEditUser }: EditUserModalProps) {
  const formik = useFormik({
    initialValues: {
      nom: "",
      prenom: "",
      nom_utilisateur: "",
      type_user: "",
      email: "",
      contact: "",
    },
    validationSchema: Yup.object({
      nom: Yup.string().required("Champ obligatoire"),
      prenom: Yup.string().required("Champ obligatoire"),
      type_user: Yup.string().required("Champ obligatoire"),
      email: Yup.string().email("Email invalide").required("Champ obligatoire"),
      contact: Yup.string().required("Champ obligatoire"),
    }),
    onSubmit: (values) => {
      const newUser = {
        ...values,
        id_user: `u${Date.now()}`,
        created_at: new Date().toISOString().split("T")[0],
      }
      onEditUser(newUser)
      onClose()
    },
  })

  if (!isOpen) return null

  const fields = ["nom", "prenom",  "email", "contact"] as const
  type FieldKey = typeof fields[number]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-md shadow-xl relative border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-[#d61353]">Modifier l&apos;utilisateur</h2>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {fields.map((field: FieldKey) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {field.replace("_", " ")}
              </label>
              <input
                type="text"
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
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#d61353] text-white hover:bg-[#b01044] transition-smooth"
            >
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
