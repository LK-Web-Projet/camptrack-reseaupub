"use client"

import { ArrowLeft, Users, User, Phone, Briefcase, Car, Palette, Fingerprint, ShieldCheck, Wrench, Calendar, Hash } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "react-toastify"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AddIncidentModal from "./AddIncidentModal"

// Interfaces (gardées telles quelles)
interface Service {
  id_service: string
  nom: string
  description?: string
}
interface Affectation {
  campagne: { id_campagne: string; nom_campagne: string; date_debut: string; date_fin: string; status: string }
  date_creation: string
  status?: string
}
interface Dommage {
  id_materiels_case: string; etat: string; description: string; montant_penalite: number; penalite_appliquer: boolean; date_creation: string; campagne?: { nom_campagne: string }
}
interface Prestataire {
  id_prestataire: string; nom: string; prenom: string; contact: string; disponible: boolean; type_panneau?: string | null; couleur?: string | null; marque?: string | null; modele?: string | null; plaque?: string | null; id_verification?: string | null; service?: Service; created_at?: string; updated_at?: string; affectations?: Affectation[]; dommages?: Dommage[]; _count?: { affectations: number; dommages: number }
}

// Composant pour afficher une information
const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <div className="text-gray-500 dark:text-gray-400 mt-1">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
      <p className="text-base font-semibold">{value || "-"}</p>
    </div>
  </div>
);

// Composant pour le badge de disponibilité
const AvailabilityBadge = ({ available }: { available: boolean }) => (
  <Badge variant={available ? "success" : "destructive"}>
    {available ? "Disponible" : "Non disponible"}
  </Badge>
);

export default function DetailPrestataire({ id }: { id: string }) {
  const { apiClient } = useAuth()
  const [prestataire, setPrestataire] = useState<Prestataire | null>(null)
  const [loading, setLoading] = useState(true)
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false)

  const fetchPrestataire = useCallback(async () => {
    if (!id) return;
    setLoading(true)
    try {
      const res = await apiClient(`/api/prestataires/${id}`)
      if (!res.ok) throw new Error("Erreur lors du chargement du prestataire")
      const data = await res.json()
      setPrestataire(data.prestataire)
    } catch (err) {
      console.error("Erreur fetch prestataire:", err)
      const msg = err instanceof Error ? err.message : "Erreur lors du chargement"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [id, apiClient]);

  useEffect(() => {
    fetchPrestataire()
  }, [fetchPrestataire])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
        <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">Chargement du prestataire...</p>
      </div>
    )
  }

  if (!prestataire) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Prestataire non trouvé.</p>
        <Link href="/dashboard/prestataires" className="mt-4 inline-block">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/prestataires">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Button>
        </Link>
        <div className="flex items-center gap-3 text-[#d61353]">
          <Users className="w-7 h-7" />
          <h1 className="text-3xl font-bold">{prestataire.nom} {prestataire.prenom}</h1>
        </div>
        <div />
      </div>

      {/* Carte Principale */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>Synthèse du Prestataire</CardTitle>
            <AvailabilityBadge available={prestataire.disponible} />
          </div>
          <CardDescription>Informations personnelles et matériel du prestataire.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem icon={<User size={20} />} label="Nom complet" value={`${prestataire.nom} ${prestataire.prenom}`} />
          <InfoItem icon={<Phone size={20} />} label="Contact" value={prestataire.contact} />
          <InfoItem icon={<Briefcase size={20} />} label="Service" value={prestataire.service?.nom} />
          <InfoItem icon={<Car size={20} />} label="Véhicule" value={`${prestataire.marque ?? ''} ${prestataire.modele ?? ''}`} />
          <InfoItem icon={<Palette size={20} />} label="Couleur" value={prestataire.couleur} />
          <InfoItem icon={<Fingerprint size={20} />} label="Plaque" value={prestataire.plaque} />
          <InfoItem icon={<ShieldCheck size={20} />} label="Type Panneau" value={prestataire.type_panneau} />
          <InfoItem icon={<Hash size={20} />} label="ID Vérification" value={prestataire.id_verification} />
          <InfoItem icon={<Calendar size={20} />} label="Date de création" value={prestataire.created_at ? new Date(prestataire.created_at).toLocaleDateString('fr-FR') : '-'} />
        </CardContent>
      </Card>

      {/* AFFECTATIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Affectations en Campagnes ({prestataire._count?.affectations ?? 0})</CardTitle>
          <CardDescription>Historique des campagnes auxquelles ce prestataire a été assigné.</CardDescription>
        </CardHeader>
        <CardContent>
          {prestataire.affectations && prestataire.affectations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campagne</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestataire.affectations.map((aff) => (
                  <TableRow key={aff.campagne.id_campagne}>
                    <TableCell className="font-medium">{aff.campagne.nom_campagne}</TableCell>
                    <TableCell>{new Date(aff.campagne.date_debut).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>{aff.campagne.date_fin ? new Date(aff.campagne.date_fin).toLocaleDateString("fr-FR") : "-"}</TableCell>
                    <TableCell><Badge variant="secondary">{aff.campagne.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-center text-gray-500 py-8">Aucune affectation à afficher.</p>
          )}
        </CardContent>
      </Card>

      {/* DOMMAGES */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dommages et Cas Matériels ({prestataire._count?.dommages ?? 0})</CardTitle>
            <CardDescription>Historique des dommages matériels enregistrés pour ce prestataire.</CardDescription>
          </div>
          <Button onClick={() => setIsIncidentModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Wrench className="w-4 h-4 mr-2" />
            Signaler un problème
          </Button>
        </CardHeader>
        <CardContent>
          {prestataire.dommages && prestataire.dommages.length > 0 ? (
            <div className="space-y-4">
              {prestataire.dommages.map((dmg) => (
                <div key={dmg.id_materiels_case} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{dmg.campagne?.nom_campagne ?? "Campagne non spécifiée"}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{dmg.description ?? "Pas de description"}</p>
                    <p className="text-xs text-gray-500 mt-1">Enregistré le: {new Date(dmg.date_creation).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={dmg.etat === 'grave' ? 'destructive' : 'warning'}>{dmg.etat}</Badge>
                    <p className="text-lg font-bold mt-1">{dmg.montant_penalite ? `${dmg.montant_penalite}FCFA` : ""}</p>
                    {dmg.penalite_appliquer && <p className="text-xs text-green-600">Pénalité appliquée</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center text-gray-500 py-8">Aucun dommage enregistré.</p>
          )}
        </CardContent>
      </Card>


      <AddIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        prestataireId={id}
        affectations={prestataire.affectations || []}
        onIncidentAdded={fetchPrestataire}
      />
    </div >
  )
}
