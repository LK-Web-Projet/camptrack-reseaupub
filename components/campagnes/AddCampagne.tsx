"use client"

import { useFormik } from "formik"
import * as Yup from "yup"
import { X } from "lucide-react"

interface AddCampagneModalProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddCampagne: (campagne: any) => void
}

export default function AddCampagneModal({ isOpen, onClose, onAddCampagne }: AddCampagneModalProps) {
  const formik = useFormik({
    initialValues: {
      nom_campagne: "",
      type_campagne: "",
      status: "PLANIFIEE",
      date_debut: "",
      date_fin: "",
      Id_service: "",
      quantite_service: "",
    },
    validationSchema: Yup.object({
      nom_campagne: Yup.string().required("Champ obligatoire"),
      type_campagne: Yup.string().required("Champ obligatoire"),
      status: Yup.string().required("Champ obligatoire"),
      date_debut: Yup.string().required("Champ obligatoire"),
      date_fin: Yup.string().required("Champ obligatoire"),
      Id_service: Yup.string().required("Champ obligatoire"),
      quantite_service: Yup.number().typeError("La quantité doit être un nombre").required("Champ obligatoire").positive("La quantité doit être positive"),
    }),
    onSubmit: (values) => {
      const newCampagne = {
        ...values,
        id_campagne: `c${Date.now()}`,
        date_creation: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      onAddCampagne(newCampagne)
      onClose()
    },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-md shadow-xl relative border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-[#d61353]">Ajouter une campagne</h2>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom de la campagne</label>
            <input
              type="text"
              name="nom_campagne"
              onChange={formik.handleChange}
              value={formik.values.nom_campagne}
              className="w-full border rounded px-3 py-2"
            />
            {formik.touched.nom_campagne && formik.errors.nom_campagne && (
              <div className="text-red-500 text-xs">{formik.errors.nom_campagne}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type de campagne</label>
            <input
              type="text"
              name="type_campagne"
              onChange={formik.handleChange}
              value={formik.values.type_campagne}
              className="w-full border rounded px-3 py-2"
            />
            {formik.touched.type_campagne && formik.errors.type_campagne && (
              <div className="text-red-500 text-xs">{formik.errors.type_campagne}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <input
              type="text"
              name="status"
              onChange={formik.handleChange}
              value={formik.values.status}
              className="w-full border rounded px-3 py-2"
            />
            {formik.touched.status && formik.errors.status && (
              <div className="text-red-500 text-xs">{formik.errors.status}</div>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Date début</label>
              <input
                type="date"
                name="date_debut"
                onChange={formik.handleChange}
                value={formik.values.date_debut}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.date_debut && formik.errors.date_debut && (
                <div className="text-red-500 text-xs">{formik.errors.date_debut}</div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Date fin</label>
              <input
                type="date"
                name="date_fin"
                onChange={formik.handleChange}
                value={formik.values.date_fin}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.date_fin && formik.errors.date_fin && (
                <div className="text-red-500 text-xs">{formik.errors.date_fin}</div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Service</label>
            <input
              type="text"
              name="Id_service"
              onChange={formik.handleChange}
              value={formik.values.Id_service}
              className="w-full border rounded px-3 py-2"
            />
            {formik.touched.Id_service && formik.errors.Id_service && (
              <div className="text-red-500 text-xs">{formik.errors.Id_service}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantité de service</label>
            <input
              type="number"
              name="quantite_service"
              onChange={formik.handleChange}
              value={formik.values.quantite_service}
              className="w-full border rounded px-3 py-2"
            />
            {formik.touched.quantite_service && formik.errors.quantite_service && (
              <div className="text-red-500 text-xs">{formik.errors.quantite_service}</div>
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
