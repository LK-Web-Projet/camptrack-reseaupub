"use client"

import { useCallback, useEffect, useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { PlusCircle, X } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AddClientModal from "../clients/AddClient"

interface Client {
  id_client: string
  nom: string
  prenom: string
  entreprise?: string
}

interface Lieu {
  id_lieu: string
  nom: string
  ville?: string
}

interface Service {
  id_service: string
  nom: string
  description?: string
}

interface AddCampagneModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCampagne: () => void
}

export default function AddCampagneModal({ isOpen, onClose, onAddCampagne }: AddCampagneModalProps) {
  const { apiClient } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [lieux, setLieux] = useState<Lieu[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    try {
      const [clientRes, lieuRes, serviceRes] = await Promise.all([
        apiClient("/api/clients?limit=500"),
        apiClient("/api/lieux?limit=500"),
        apiClient("/api/services?limit=500"),
      ])

      if (clientRes.ok) {
        const data = await clientRes.json()
        setClients(data.clients || [])
      }
      if (lieuRes.ok) {
        const data = await lieuRes.json()
        setLieux(data.lieux || [])
      }
      if (serviceRes.ok) {
        const data = await serviceRes.json()
        setServices(data.services || [])
      }
    } catch (err) {
      console.error("Erreur chargement options:", err)
      toast.error("Erreur lors du chargement des options.")
    } finally {
      setLoading(false)
    }
  }, [apiClient])

  useEffect(() => {
    if (isOpen) {
      fetchOptions()
    }
  }, [isOpen, fetchOptions])

  const handleClientAdded = (newClient: Client) => {
    fetchOptions() // Re-fetch all options to get the latest client list
    formik.setFieldValue("id_client", newClient.id_client) // Set the new client as selected
    setIsAddClientOpen(false) // Close the add client modal
  }

  const formik = useFormik({
    initialValues: {
      nom_campagne: "",
      type_campagne: "",
      status: "PLANIFIEE",
      description: "",
      objectif: "",
      date_debut: "",
      date_fin: "",
      id_client: "",
      id_lieu: "",
      id_service: "",
      quantite_service: "",
      nbr_prestataire: "",
    },
    validationSchema: Yup.object({
      nom_campagne: Yup.string().required("Champ obligatoire"),
      type_campagne: Yup.string().required("Champ obligatoire"),
      status: Yup.string().required("Status obligatoire"),
      date_debut: Yup.string().required("Champ obligatoire"),
      date_fin: Yup.string().required("Champ obligatoire"),
      id_client: Yup.string().required("Client obligatoire"),
      id_lieu: Yup.string().required("Lieu obligatoire"),
      id_service: Yup.string().required("Service obligatoire"),
      quantite_service: Yup.number()
        .typeError("La quantité doit être un nombre")
        .positive("La quantité doit être positive"),
      nbr_prestataire: Yup.number().typeError("Le nombre doit être un nombre"),
    }),
    onSubmit: async (values) => {
      setSubmitting(true)
      try {
        const res = await apiClient("/api/campagnes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...values,
            quantite_service: values.quantite_service ? parseInt(values.quantite_service) : null,
            nbr_prestataire: values.nbr_prestataire ? parseInt(values.nbr_prestataire) : null,
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error || `Erreur ${res.status}`)
        }

        toast.success("Campagne créée avec succès")
        formik.resetForm()
        onAddCampagne()
        onClose()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors de la création"
        console.error("Erreur création campagne:", err)
        toast.error(message)
      } finally {
        setSubmitting(false)
      }
    },
  })

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-2xl shadow-xl relative border border-gray-200 dark:border-gray-700 max-h-screen overflow-y-auto">
          <Button
            variant="ghost"
            onClick={onClose}
            className="absolute top-4 right-4"
          >
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold mb-4 text-[#d61353]">Ajouter une campagne</h2>

          {loading ? (
            <p className="text-center text-gray-500">Chargement des options...</p>
          ) : (
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom_campagne">Nom de la campagne</Label>
                  <Input
                    id="nom_campagne"
                    name="nom_campagne"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.nom_campagne}
                  />
                  {formik.touched.nom_campagne && formik.errors.nom_campagne && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.nom_campagne}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type_campagne">Type de campagne</Label>
                  <Select
                    name="type_campagne"
                    onValueChange={(value) => formik.setFieldValue("type_campagne", value)}
                    value={formik.values.type_campagne}
                  >
                    <SelectTrigger onBlur={() => formik.setFieldTouched("type_campagne", true)}>
                      <SelectValue placeholder="-- Sélectionner --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASSE">MASSE</SelectItem>
                      <SelectItem value="PROXIMITE">PROXIMITE</SelectItem>
                    </SelectContent>
                  </Select>
                  {formik.touched.type_campagne && formik.errors.type_campagne && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.type_campagne}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_client">Client</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      name="id_client"
                      onValueChange={(value) => formik.setFieldValue("id_client", value)}
                      value={formik.values.id_client}
                    >
                      <SelectTrigger onBlur={() => formik.setFieldTouched("id_client", true)} className="flex-grow">
                        <SelectValue placeholder="-- Sélectionner un client --" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id_client} value={client.id_client}>
                            {client.nom} {client.prenom} {client.entreprise ? `(${client.entreprise})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsAddClientOpen(true)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  {formik.touched.id_client && formik.errors.id_client && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.id_client}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    name="status"
                    onValueChange={(value) => formik.setFieldValue("status", value)}
                    value={formik.values.status}
                  >
                    <SelectTrigger onBlur={() => formik.setFieldTouched("status", true)}>
                      <SelectValue placeholder="-- Sélectionner --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANIFIEE">PLANIFIEE</SelectItem>
                      <SelectItem value="EN_COURS">EN_COURS</SelectItem>
                      <SelectItem value="TERMINEE">TERMINEE</SelectItem>
                      <SelectItem value="ANNULEE">ANNULEE</SelectItem>
                    </SelectContent>
                  </Select>
                  {formik.touched.status && formik.errors.status && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.status}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_lieu">Lieu</Label>
                  <Select
                    name="id_lieu"
                    onValueChange={(value) => formik.setFieldValue("id_lieu", value)}
                    value={formik.values.id_lieu}
                  >
                    <SelectTrigger onBlur={() => formik.setFieldTouched("id_lieu", true)}>
                      <SelectValue placeholder="-- Sélectionner --" />
                    </SelectTrigger>
                    <SelectContent>
                      {lieux.map((lieu) => (
                        <SelectItem key={lieu.id_lieu} value={lieu.id_lieu}>
                          {lieu.nom} {lieu.ville ? `(${lieu.ville})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.id_lieu && formik.errors.id_lieu && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.id_lieu}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_service">Service</Label>
                  <Select
                    name="id_service"
                    onValueChange={(value) => formik.setFieldValue("id_service", value)}
                    value={formik.values.id_service}
                  >
                    <SelectTrigger onBlur={() => formik.setFieldTouched("id_service", true)}>
                      <SelectValue placeholder="-- Sélectionner --" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id_service} value={service.id_service}>
                          {service.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.id_service && formik.errors.id_service && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.id_service}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.description}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectif">Objectif</Label>
                <Textarea
                  id="objectif"
                  name="objectif"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.objectif}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_debut">Date début</Label>
                  <Input
                    id="date_debut"
                    type="date"
                    name="date_debut"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.date_debut}
                  />
                  {formik.touched.date_debut && formik.errors.date_debut && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.date_debut}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_fin">Date fin</Label>
                  <Input
                    id="date_fin"
                    type="date"
                    name="date_fin"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.date_fin}
                  />
                  {formik.touched.date_fin && formik.errors.date_fin && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.date_fin}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantite_service">Quantité de service</Label>
                  <Input
                    id="quantite_service"
                    type="number"
                    name="quantite_service"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.quantite_service}
                  />
                  {formik.touched.quantite_service && formik.errors.quantite_service && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.quantite_service}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nbr_prestataire">Nombre de prestataires</Label>
                  <Input
                    id="nbr_prestataire"
                    type="number"
                    name="nbr_prestataire"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.nbr_prestataire}
                  />
                  {formik.touched.nbr_prestataire && formik.errors.nbr_prestataire && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.nbr_prestataire}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" loading={submitting}>
                  Créer la campagne
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddClientOpen && (
        <AddClientModal
          isOpen={isAddClientOpen}
          onClose={() => setIsAddClientOpen(false)}
          onAddClient={handleClientAdded}
        />
      )}
    </>
  )
}
