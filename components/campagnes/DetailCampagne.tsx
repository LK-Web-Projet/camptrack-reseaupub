"use client";

import {
  ArrowLeft,
  Megaphone,
  FileText,
  Calendar,
  User,
  Target,
  Info,
  Building,
  MapPin,
  ClipboardList,
  Users,
  Paperclip,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrestataireCampagne, PaiementPrestataire } from '../../app/generated/prisma/index';
import AddIncidentModal from "@/components/prestataires/AddIncidentModal";
import VerificationMaterielleModal from "./VerificationMaterielleModal";
import UpdateCampaignPhotoModal from "@/components/campagnes/UpdateCampaignPhotoModal";

// Interfaces (gardées telles quelles)
interface Client {
  id_client?: string;
  nom?: string;
  prenom?: string;
  entreprise?: string | null;
  contact?: string | null;
  mail?: string | null;
}
interface Lieu { id_lieu?: string; nom?: string; ville?: string; }
interface Service { id_service?: string; nom?: string; description?: string | null; }
interface Gestionnaire { id_user?: string; nom?: string; prenom?: string; email?: string; }
interface Affectation {
  prestataire: {
    id_prestataire: string;
    nom?: string;
    prenom?: string;
    contact?: string;
    service?: { nom?: string } | null;
  };
  paiement?: {
    paiement_base?: number;
    sanction_montant?: number;
    paiement_final?: number;
  } | null;
  date_creation?: string;
  status?: string;
  image_affiche?: string | null;
}
interface Fichier { id_fichier: string; nom_fichier?: string; url?: string; description?: string | null; type_fichier?: string | null; date_creation?: string; }
interface PrestataireListItem {
  id_prestataire: string;
  nom?: string;
  prenom?: string;
  contact?: string | null;
  service?: { nom?: string } | null;
  disponible?: boolean;
  affectations?: Array<{
    campagne: {
      id_campagne: string;
      nom_campagne?: string;
      date_fin?: string;
    }
  }>;
  lastCampDate?: string | null;
  lastCampName?: string | null;
}
interface Campagne {
  id_campagne: string; nom_campagne?: string; description?: string | null; objectif?: string | null; quantite_service?: number | null; nbr_prestataire?: number | null; type_campagne?: string | null; date_debut?: string | null; date_fin?: string | null; status?: string | null; date_creation?: string | null; updated_at?: string | null; client?: Client | null; lieu?: Lieu | null; service?: Service | null; gestionnaire?: Gestionnaire | null; affectations?: Affectation[] | null; fichiers?: Fichier[] | null; _count?: { affectations?: number; fichiers?: number; dommages?: number };
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

// Mapping des status et couleurs de badge
const statusMap: { [key: string]: { label: string; color: "default" | "destructive" | "outline" | "secondary" | "warning" | "success" } } = {
  PLANIFIEE: { label: "Planifiée", color: "secondary" },
  EN_COURS: { label: "En cours", color: "warning" },
  TERMINEE: { label: "Terminée", color: "success" },
  ANNULEE: { label: "Annulée", color: "destructive" },
};

export default function DetailCampagne({ id }: { id: string }) {
  const { apiClient } = useAuth();
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [loading, setLoading] = useState(true);

  // Assign prestataire states
  const [prestataires, setPrestataires] = useState<PrestataireListItem[]>([]);
  const [selectedPrestataire, setSelectedPrestataire] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Upload fichier states
  const [fileType, setFileType] = useState("");
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Incident modal states
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedPrestataireForIncident, setSelectedPrestataireForIncident] = useState<{
    id: string;
    nom: string;
    prenom: string;
  } | null>(null);

  // Verification Materielle states
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedPrestataireForVerification, setSelectedPrestataireForVerification] = useState<string | undefined>(undefined);



  /* State: Update Campaign Photo */
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPrestataireForPhoto, setSelectedPrestataireForPhoto] = useState<{ id: string, photo_url: string | null } | null>(null);

  const fileTypes = ["RAPPORT_JOURNALIER", "RAPPORT_FINAL", "PIGE"];

  const fetchCampagne = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient(`/api/campagnes/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setCampagne(data.campagne ?? null);
    } catch (err) {
      console.error("Erreur fetch campagne:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [id, apiClient]);

  useEffect(() => {
    fetchCampagne();
  }, [fetchCampagne]);

  const fetchPrestataires = useCallback(async () => {
    try {
      const res = await apiClient(`/api/prestataires?page=1&limit=50&disponible=true`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();

      // Récupérer la dernière campagne (la plus récente) pour chaque prestataire
      const prestatairesWithLastCamp = data.prestataires.map((p: any) => {
        // Trier les affectations par date de fin décroissante pour obtenir la plus récente
        const sortedAffectations = p.affectations?.sort((a: any, b: any) =>
          new Date(b.campagne.date_fin).getTime() - new Date(a.campagne.date_fin).getTime()
        );
        const lastCamp = sortedAffectations?.[0]; // Prendre la plus récente
        return {
          ...p,
          lastCampDate: lastCamp?.campagne?.date_fin || null,
          lastCampName: lastCamp?.campagne?.nom_campagne || null
        };
      });

      // Trier les prestataires par date de fin de dernière campagne en ordre croissant (A-Z)
      const sortedPrestataires = prestatairesWithLastCamp.sort((a: any, b: any) => {
        // Les prestataires sans campagne viennent en premier
        if (!a.lastCampDate && !b.lastCampDate) return 0;
        if (!a.lastCampDate) return -1;
        if (!b.lastCampDate) return 1;
        return new Date(a.lastCampDate).getTime() - new Date(b.lastCampDate).getTime();
      });

      setPrestataires(sortedPrestataires);
    } catch (err) {
      console.error("Erreur fetch prestataires:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors du chargement des prestataires");
    }
  }, [apiClient]);

  const handleFileUpload = async () => {
    if (!fileUpload || !fileType) {
      toast.error("Veuillez sélectionner un fichier et un type");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", fileUpload);
      formData.append("type_fichier", fileType);

      const res = await apiClient(`/api/campagnes/${id}/fichiers`, { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erreur upload fichier");

      toast.success("Fichier téléchargé avec succès");
      setCampagne(prev => prev ? { ...prev, fichiers: [body.fichier, ...(prev.fichiers || [])] } : null);
      setFileUpload(null); setFileType(""); setIsUploadDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur upload");
    }
  };

  const handleAssign = async () => {
    if (!selectedPrestataire) {
      toast.error("Veuillez sélectionner un prestataire");
      return;
    }
    try {
      const res = await apiClient(`/api/campagnes/${id}/prestataires`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_prestataire: selectedPrestataire }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);

      toast.success(body.message || "Prestataire affecté avec succès");
      setCampagne(prev => {
        if (!prev) return prev;
        const updatedAffectations = [body.affectation, ...(prev.affectations || [])];
        return {
          ...prev,
          affectations: updatedAffectations,
          _count: { ...prev._count, affectations: updatedAffectations.length }
        };
      });
      setSelectedPrestataire(null);
      setIsAssignDialogOpen(false);
    } catch (err) {
      console.error("Erreur assign prestataire:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'affectation");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
      <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">Chargement...</p>
    </div>
  );

  if (!campagne) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Campagne non trouvée.</p>
      <Link href="/dashboard/campagnes" className="mt-4 inline-block">
        <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
      </Link>
    </div>
  );

  const currentStatus = statusMap[campagne.status || ""] || { label: campagne.status, color: "default" };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/campagnes">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Button>
        </Link>
        <div className="flex items-center gap-3 text-[#d61353]">
          <Megaphone className="w-7 h-7" />
          <h1 className="text-3xl font-bold">{campagne.nom_campagne}</h1>
        </div>
        <div />
      </div>

      {/* Carte Principale */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Synthèse de la Campagne</CardTitle>
              <CardDescription>
                {campagne.description || "Aucune description"}
              </CardDescription>
            </div>
            <Badge variant={currentStatus.color}>{currentStatus.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem
            icon={<Calendar size={20} />}
            label="Période"
            value={`${campagne.date_debut
              ? new Date(campagne.date_debut).toLocaleDateString("fr-FR")
              : "-"
              } au ${campagne.date_fin
                ? new Date(campagne.date_fin).toLocaleDateString("fr-FR")
                : "-"
              }`}
          />
          <InfoItem
            icon={<User size={20} />}
            label="Client"
            value={`${campagne.client?.nom ?? ""} ${campagne.client?.prenom ?? ""
              } (${campagne.client?.entreprise ?? "N/A"})`}
          />
          <InfoItem
            icon={<MapPin size={20} />}
            label="Lieu"
            value={`${campagne.lieu?.nom ?? "-"} (${campagne.lieu?.ville ?? "N/A"
              })`}
          />
          <InfoItem
            icon={<ClipboardList size={20} />}
            label="Service"
            value={campagne.service?.nom ?? "-"}
          />
          <InfoItem
            icon={<Target size={20} />}
            label="Objectif"
            value={campagne.objectif}
          />
          <InfoItem
            icon={<Info size={20} />}
            label="Type"
            value={campagne.type_campagne}
          />
          <InfoItem
            icon={<Users size={20} />}
            label="Prestataires"
            value={`${campagne._count?.affectations ?? 0} / ${campagne.nbr_prestataire ?? "N/A"
              }`}
          />
          <InfoItem
            icon={<Paperclip size={20} />}
            label="Fichiers"
            value={campagne._count?.fichiers ?? 0}
          />
          <InfoItem
            icon={<User size={20} />}
            label="Gestionnaire"
            value={
              campagne.gestionnaire
                ? `${campagne.gestionnaire.nom} ${campagne.gestionnaire.prenom}`
                : "-"
            }
          />
        </CardContent>
      </Card>

      {/* Section Fichiers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fichiers de la Campagne</CardTitle>
            <CardDescription>
              Consultez et ajoutez des rapports et autres documents.
            </CardDescription>
          </div>
          <Dialog
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Fichier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau fichier</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fileType">Type de fichier</Label>
                  <Select onValueChange={setFileType} value={fileType}>
                    <SelectTrigger id="fileType">
                      <SelectValue placeholder="-- Sélectionner un type --" />
                    </SelectTrigger>
                    <SelectContent>
                      {fileTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileUpload">Fichier</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleFileUpload}>Uploader</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {campagne.fichiers && campagne.fichiers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du fichier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campagne.fichiers.map((f) => (
                  <TableRow key={f.id_fichier}>
                    <TableCell className="font-medium">
                      {f.nom_fichier ?? "Fichier"}
                    </TableCell>
                    <TableCell>{f.type_fichier}</TableCell>
                    <TableCell>
                      {f.date_creation
                        ? new Date(f.date_creation).toLocaleDateString("fr-FR")
                        : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-center text-gray-500 py-8">
              Aucun fichier associé.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section Prestataires */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Prestataires Assignés</CardTitle>
            <CardDescription>
              Gérez les prestataires affectés à cette campagne.
            </CardDescription>
          </div>
          <Dialog
            open={isAssignDialogOpen}
            onOpenChange={setIsAssignDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  if (!prestataires.length) fetchPrestataires();
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Assigner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner un nouveau prestataire</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="prestataire">Choisir un prestataire</Label>
                <Select onValueChange={setSelectedPrestataire}>
                  <SelectTrigger id="prestataire">
                    <SelectValue placeholder="-- Sélectionner --" />
                  </SelectTrigger>
                  <SelectContent>
                    {prestataires.map((p) => (
                      <SelectItem
                        key={p.id_prestataire}
                        value={p.id_prestataire}
                      >
                        {p.nom} {p.prenom}
                        {p.service?.nom ? ` — ${p.service.nom}` : ""}
                        {p.lastCampDate ? ` — Dernière campagne: ${new Date(p.lastCampDate).toLocaleDateString("fr-FR")}` : " — Aucune campagne"}
                        {` — Disponible: ${p.disponible ? "Oui" : "Non"}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAssignDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleAssign}>Assigner</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {campagne.affectations && campagne.affectations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestataire</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Date d'assignation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Montant Initial</TableHead>
                  <TableHead>Pénalité</TableHead>
                  <TableHead>Montant payé</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campagne.affectations.map((a, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {a.prestataire?.nom ?? "-"} {a.prestataire?.prenom ?? ""}
                    </TableCell>
                    <TableCell>
                      {a.image_affiche ? (
                        <div className="h-10 w-10 relative rounded overflow-hidden border bg-gray-100">
                          <img
                            src={a.image_affiche}
                            alt="Affiche"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                          <span className="text-[10px]">N/A</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.date_creation
                        ? new Date(a.date_creation).toLocaleDateString("fr-FR")
                        : "-"}
                    </TableCell>
                    <TableCell>{a.status ?? "-"}</TableCell>
                    <TableCell>
                      {a.paiement?.paiement_base ?? "-"}
                    </TableCell>
                    <TableCell>
                      {a.paiement?.sanction_montant ?? "-"}
                    </TableCell>
                    <TableCell>
                      {a.paiement?.paiement_final ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/prestataires/${a.prestataire?.id_prestataire}`}
                      >
                        <Button variant="outline" size="sm">
                          Voir
                        </Button>

                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPrestataireForPhoto({
                            id: a.prestataire.id_prestataire,
                            photo_url: a.image_affiche || null
                          });
                          setIsPhotoModalOpen(true);
                        }}
                      >
                        Photo Affiche
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPrestataireForIncident({
                            id: a.prestataire.id_prestataire,
                            nom: a.prestataire.nom || "",
                            prenom: a.prestataire.prenom || ""
                          });
                          setIsIncidentModalOpen(true);
                        }}
                      >
                        Verification / Incident
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-center text-gray-500 py-8">
              Aucun prestataire assigné.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modal d'incident */}
      {
        selectedPrestataireForIncident && (
          <AddIncidentModal
            isOpen={isIncidentModalOpen}
            onClose={() => {
              setIsIncidentModalOpen(false);
              setSelectedPrestataireForIncident(null);
            }}
            prestataireId={selectedPrestataireForIncident.id}
            affectations={[
              {
                campagne: {
                  id_campagne: campagne?.id_campagne || "",
                  nom_campagne: campagne?.nom_campagne || ""
                }
              }
            ]}
            onIncidentAdded={() => {
              // Recharger les données de la campagne pour mettre à jour les paiements
              fetchCampagne();
              toast.success("Incident enregistré avec succès");
            }}
          />
        )

      }

      {/* Campaign Photo Modal */}
      {selectedPrestataireForPhoto && (
        <UpdateCampaignPhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          campagneId={id}
          prestataireId={selectedPrestataireForPhoto.id}
          initialPhotoUrl={selectedPrestataireForPhoto.photo_url}
          onPhotoUpdated={() => {
            fetchCampagne();
          }}
        />
      )}


    </div >
  );
}
