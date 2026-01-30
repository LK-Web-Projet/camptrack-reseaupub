"use client"

import { useState, useEffect } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { X, Loader2 } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Service {
    id_service: string
    nom: string
}

interface QuickAddPrestataireModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (newPrestataire: any) => void
}

const validationSchema = Yup.object().shape({
    nom: Yup.string().required("Le nom est requis"),
    prenom: Yup.string().required("Le prénom est requis"),
    contact: Yup.string().required("Le contact est requis"),
    id_service: Yup.string().required("Le service est requis"),
    // id_verification removed
    type_panneau: Yup.string().optional(),
    plaque: Yup.string().optional(),
})

export default function QuickAddPrestataireModal({ isOpen, onClose, onSuccess, defaultServiceId, defaultServiceName }: QuickAddPrestataireModalProps & { defaultServiceId?: string, defaultServiceName?: string }) {
    const { apiClient } = useAuth()
    const [services, setServices] = useState<Service[]>([])
    const [loadingServices, setLoadingServices] = useState(false)

    // Fetch services when modal opens
    useEffect(() => {
        if (isOpen && services.length === 0 && !defaultServiceId) {
            const fetchServices = async () => {
                setLoadingServices(true)
                try {
                    const res = await apiClient("/api/services?page=1&limit=100")
                    if (res.ok) {
                        const data = await res.json()
                        setServices(data.services || [])
                    }
                } catch (err) {
                    console.error("Erreur services:", err)
                } finally {
                    setLoadingServices(false)
                }
            }
            fetchServices()
        }
    }, [isOpen, apiClient, services.length, defaultServiceId])

    const formik = useFormik({
        initialValues: {
            nom: "",
            prenom: "",
            contact: "",
            id_service: defaultServiceId || "",
            // id_verification removed
            type_panneau: "",
            plaque: "",
            disponible: true, // Default
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                const body = {
                    ...values,
                    type_panneau: values.type_panneau || "",
                    plaque: values.plaque || "",
                    // Mandatory fields for backend that we are omitting in quick form
                    couleur: "",
                    marque: "",
                    modele: "",
                    contrat_valide: false, // Default for quick add
                    equipe_gps: false,    // Default for quick add
                }

                const res = await apiClient("/api/prestataires", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                })

                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || "Erreur lors de la création")
                }

                const data = await res.json()
                toast.success("Prestataire ajouté rapidement !")
                onSuccess(data.prestataire)
                resetForm()
                onClose()
            } catch (err: any) {
                toast.error(err.message || "Erreur création prestataire")
            } finally {
                setSubmitting(false)
            }
        },
    })

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-[#d61353] flex items-center gap-2">
                        ⚡ Ajout Rapide Prestataire
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="space-y-4 py-2">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nom">Nom *</Label>
                            <Input
                                id="nom"
                                placeholder="Nom"
                                {...formik.getFieldProps("nom")}
                                className={formik.touched.nom && formik.errors.nom ? "border-red-500" : ""}
                            />
                            {formik.touched.nom && formik.errors.nom && (
                                <p className="text-red-500 text-xs">{formik.errors.nom}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="prenom">Prénom *</Label>
                            <Input
                                id="prenom"
                                placeholder="Prénom"
                                {...formik.getFieldProps("prenom")}
                                className={formik.touched.prenom && formik.errors.prenom ? "border-red-500" : ""}
                            />
                            {formik.touched.prenom && formik.errors.prenom && (
                                <p className="text-red-500 text-xs">{formik.errors.prenom}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="id_service">Service *</Label>
                            {defaultServiceId ? (
                                <Input
                                    value={defaultServiceName || "Service imposé"}
                                    disabled
                                    className="bg-gray-100 text-gray-500"
                                />
                            ) : (
                                <Select
                                    value={formik.values.id_service}
                                    onValueChange={(val) => formik.setFieldValue("id_service", val)}
                                >
                                    <SelectTrigger className={formik.touched.id_service && formik.errors.id_service ? "border-red-500" : ""}>
                                        <SelectValue placeholder={loadingServices ? "Chargement..." : "Sélectionner un service"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {services.map((s) => (
                                            <SelectItem key={s.id_service} value={s.id_service}>{s.nom}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {formik.touched.id_service && formik.errors.id_service && (
                                <p className="text-red-500 text-xs">{formik.errors.id_service}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type_panneau">Type Panneau *</Label>
                            <Select
                                value={formik.values.type_panneau}
                                onValueChange={(val) => formik.setFieldValue("type_panneau", val)}
                            >
                                <SelectTrigger className={formik.touched.type_panneau && formik.errors.type_panneau ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Choisir" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PETIT">PETIT</SelectItem>
                                    <SelectItem value="GRAND">GRAND</SelectItem>
                                </SelectContent>
                            </Select>
                            {formik.touched.type_panneau && formik.errors.type_panneau && (
                                <p className="text-red-500 text-xs">{formik.errors.type_panneau}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact">Contact *</Label>
                        <Input
                            id="contact"
                            placeholder="Téléphone / Email"
                            {...formik.getFieldProps("contact")}
                            className={formik.touched.contact && formik.errors.contact ? "border-red-500" : ""}
                        />
                        {formik.touched.contact && formik.errors.contact && (
                            <p className="text-red-500 text-xs">{formik.errors.contact}</p>
                        )}
                    </div>



                    <div className="space-y-2">
                        <Label htmlFor="plaque">Plaque (Immatriculation)</Label>
                        <Input
                            id="plaque"
                            placeholder="Ex: AB-123-CD"
                            {...formik.getFieldProps("plaque")}
                        />
                    </div>

                    {/* id_verification input removed */}

                    <DialogFooter className="gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#d61353] hover:bg-[#b01044]"
                            disabled={formik.isSubmitting}
                        >
                            {formik.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer Prestataire
                        </Button>
                    </DialogFooter>

                </form>
            </DialogContent>
        </Dialog>
    )
}
