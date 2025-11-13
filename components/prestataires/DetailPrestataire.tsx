"use client"

import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"

interface Prestataire {
  id_prestataire: string
  id_service: string
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
  service?: { nom?: string }
  created_at?: string
  updated_at?: string
}

interface DetailPrestaireProps {
  id: string
}

export default function DetailPrestataire({ id }: DetailPrestaireProps) {
  const [prestataire, setPrestataire] = useState<Prestataire | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock data - In production, this will be fetched from API
  const mockPrestataires = useMemo(
    () => ({
      "1": {
        id_prestataire: "1",
        id_service: "1",
        nom: "Dupont",
        prenom: "Jean",
        contact: "06 12 34 56 78",
        disponible: true,
        type_panneau: "PETIT",
        couleur: "Blanc",
        marque: "Toyota",
        modele: "Hiace",
        plaque: "AB-123-CD",
        id_verification: "VER-001",
        service: { nom: "Aérienne" },
        created_at: "2025-01-15",
        updated_at: "2025-11-12",
      },
      "2": {
        id_prestataire: "2",
        id_service: "2",
        nom: "Martin",
        prenom: "Marie",
        contact: "07 23 45 67 89",
        disponible: true,
        type_panneau: "GRAND",
        couleur: "Noir",
        marque: "Mercedes",
        modele: "Sprinter",
        plaque: "EF-456-GH",
        id_verification: "VER-002",
        service: { nom: "Affiches" },
        created_at: "2025-02-20",
        updated_at: "2025-11-12",
      },
      "3": {
        id_prestataire: "3",
        id_service: "1",
        nom: "Bernard",
        prenom: "Pierre",
        contact: "06 98 76 54 32",
        disponible: false,
        type_panneau: "PETIT",
        couleur: "Bleu",
        marque: "Ford",
        modele: "Transit",
        plaque: "IJ-789-KL",
        id_verification: "VER-003",
        service: { nom: "Aérienne" },
        created_at: "2025-03-10",
        updated_at: "2025-11-12",
      },
    }),
    []
  )

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const data = mockPrestataires[id as keyof typeof mockPrestataires]
      if (data) {
        setPrestataire(data)
      }
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [id, mockPrestataires])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Chargement...</p>
        </div>
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
              <p className="text-xs font-mono">{prestataire.id_service}</p>
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
    </div>
  )
}
