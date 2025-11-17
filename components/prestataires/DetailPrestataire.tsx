"use client"

import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"

interface Service {
  id_service: string
  nom: string
  description?: string
}

interface Affectation {
  campagne: {
    id_campagne: string
    nom_campagne: string
    date_debut: string
    date_fin: string
    status: string
  }
  date_creation: string
  status?: string
}

interface Dommage {
  id_materiels_case: string
  etat: string
  description: string
  montant_penalite: number
  penalite_appliquer: boolean
  date_creation: string
  campagne?: {
    nom_campagne: string
  }
}

interface Prestataire {
  id_prestataire: string
  nom: string
  prenom: string
  contact: string
  disponible: boolean
  type_panneau?: string | null
  couleur?: string | null
  marque?: string | null
  modele?: string | null
  plaque?: string | null
  id_verification?: string | null
  service?: Service
  created_at?: string
  updated_at?: string
  affectations?: Affectation[]
  dommages?: Dommage[]
  _count?: {
    affectations: number
    dommages: number
  }
}

interface DetailPrestaireProps {
  id: string
}

export default function DetailPrestataire({ id }: DetailPrestaireProps) {
  const { token } = useAuth()
  const [prestataire, setPrestataire] = useState<Prestataire | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrestataire = async () => {
      if (!token) return
      setLoading(true)
      try {
        const res = await fetch(`/api/prestataires/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du prestataire")
        }
        const data = await res.json()
        setPrestataire(data.prestataire)
      } catch (err) {
        console.error("Erreur fetch prestataire:", err)
        const msg = err instanceof Error ? err.message : "Erreur lors du chargement"
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }

    if (id && token) {
      fetchPrestataire()
    }
  }, [id, token])

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center py-10">
    <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
    <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
      Chargement des détails du prestataire...
    </p>
  </div>
    )
  }

  if (!prestataire) {
    return (
      <div className="p-6">
        <Link href="/prestataires">
          <button className="flex items-center  gap-2 text-[#d61353] hover:text-[#b01044] mb-6">
            <ArrowLeft className="w-5 h-5 cursor-pointer"  />
            Retour
          </button>
        </Link>
        <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-900 rounded-lg shadow">
          <p className="text-gray-500">Prestataire non trouvé</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/prestataires">
          <button className="flex items-center gap-2 text-[#d61353] hover:text-[#b01044] transition">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
        </Link>
        <div className="flex items-center gap-2 text-[#d61353]">
          <Users className="w-6 h-6" />
          <h1 className="text-2xl font-bold">
            {prestataire.nom} {prestataire.prenom}
          </h1>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Informations personnelles */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold text-[#d61353] mb-4">Informations personnelles</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nom</label>
              <p className="text-base">{prestataire.nom}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Prénom</label>
              <p className="text-base">{prestataire.prenom}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact</label>
              <p className="text-base">{prestataire.contact}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Service</label>
              <p className="text-base">{prestataire.service?.nom ?? "-"}</p>
            </div>
          </div>
        </div>

        {/* Card 2: État et disponibilité */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold text-[#d61353] mb-4">État et disponibilité</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Disponibilité</label>
              <div className="mt-1">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    prestataire.disponible
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {prestataire.disponible ? "Disponible" : "Non disponible"}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type de panneau</label>
              <p className="text-base">{prestataire.type_panneau ?? "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">ID Vérification</label>
              <p className="text-base">{prestataire.id_verification ?? "-"}</p>
            </div>
          </div>
        </div>

        {/* Card 3: Matériel/Véhicule */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold text-[#d61353] mb-4">Matériel / Véhicule</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Marque</label>
              <p className="text-base">{prestataire.marque ?? "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Modèle</label>
              <p className="text-base">{prestataire.modele ?? "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Couleur</label>
              <p className="text-base">{prestataire.couleur ?? "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Plaque d&apos;immatriculation</label>
              <p className="text-base font-mono">{prestataire.plaque ?? "-"}</p>
            </div>
          </div>
        </div>

        {/* Card 4: Informations système */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold text-[#d61353] mb-4">Informations système</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">ID Prestataire</label>
              <p className="text-xs font-mono">{prestataire.id_prestataire}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">ID Service</label>
              <p className="text-xs font-mono">{prestataire.service?.id_service ?? "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date de création</label>
              <p className="text-sm">{prestataire.created_at ?? "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Dernière mise à jour</label>
              <p className="text-sm">{prestataire.updated_at ?? "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AFFECTATIONS SECTION */}
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="text-lg font-bold text-[#d61353] mb-4">Affectations en campagnes</h2>
        {prestataire.affectations && prestataire.affectations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Campagne</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Début</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Fin</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {prestataire.affectations.map((aff) => (
                    <tr key={aff.campagne.id_campagne} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2">{aff.campagne.nom_campagne}</td>
                      <td className="py-3 px-2">{new Date(aff.campagne.date_debut).toLocaleDateString("fr-FR")}</td>
                      <td className="py-3 px-2">{aff.campagne.date_fin ? new Date(aff.campagne.date_fin).toLocaleDateString("fr-FR") : "-"}</td>
                      <td className="py-3 px-2">  
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          aff.campagne.status === "actif" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {aff.campagne.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Aucune affectation</p>
        )}
      </div>

      {/* DOMMAGES SECTION */}
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="text-lg font-bold text-[#d61353] mb-4">Dommages et cas matériels</h2>
        {prestataire.dommages && prestataire.dommages.length > 0 ? (
          <div className="space-y-4">
            {prestataire.dommages.map((dmg) => (
                <div key={dmg.id_materiels_case} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Campagne</label>
                      <p className="text-base font-semibold">{dmg.campagne?.nom_campagne ?? "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">État</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block mt-1 ${
                      dmg.etat === "grave"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : dmg.etat === "moyen"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {dmg.etat}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                    <p className="text-base mt-1">{dmg.description ?? "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Montant estimé</label>
                    <p className="text-base font-semibold">{dmg.montant_penalite ? `${dmg.montant_penalite}€` : "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Pénalité appliquée</label>
                    <p className="text-base">{dmg.penalite_appliquer ? "✓ Oui" : "✗ Non"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</label>
                    <p className="text-sm">{new Date(dmg.date_creation).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Aucun dommage enregistré</p>
        )}
      </div>
    </div>
  )
}
