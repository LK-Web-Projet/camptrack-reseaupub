"use client";

import {
  ArrowLeft,
  Megaphone,
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
  Search,
  RefreshCw,
  Link as LinkIcon,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RenewCampaignModal from "@/components/campagnes/RenewCampaignModal";
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
import AddMaterielCaseModal from "@/components/prestataires/AddMaterielCaseModal";
import UpdateCampaignPhotoModal from "@/components/campagnes/UpdateCampaignPhotoModal";
import QuickAddPrestataireModal from "./QuickAddPrestataireModal";
import UnassignPrestataireModal from "@/components/campagnes/UnassignPrestataireModal";
import DownloadReportButton from "@/components/reports/DownloadReportButton";
import DownloadPhotosButton from "@/components/reports/DownloadPhotosButton";

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
  paiement?: Array<{
    id_paiement?: string;
    paiement_base?: number;
    sanction_montant?: number;
    paiement_final?: number;
    date_paiement?: string | null;
    statut_paiement?: boolean;
    transactions?: Array<{ montant: number }>;
  }> | null;
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
  plaque?: string | null;
  id_verification?: string | null;
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
  id_campagne_parent?: string | null;
  campagne_parent?: { id_campagne: string; nom_campagne: string } | null;
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
const statusMap: { [key: string]: { label: string; color: "default" | "destructive" | "outline" | "secondary" } } = {
  PLANIFIEE: { label: "Planifiée", color: "secondary" },
  EN_COURS: { label: "En cours", color: "secondary" }, // Modifié pour correspondre aux types valides
  TERMINEE: { label: "Terminée", color: "default" },    // Modifié pour correspondre aux types valides
  ANNULEE: { label: "Annulée", color: "destructive" },
};

export default function DetailCampagne({ id }: { id: string }) {
  const { apiClient } = useAuth();
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [unassignLoading, setUnassignLoading] = useState(false);
  const [selectedPrestataireToUnassign, setSelectedPrestataireToUnassign] = useState<{ id: string; nom: string; prenom: string } | null>(null);

  const [isAssigning, setIsAssigning] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);


  // Assign prestataire states
  const [prestataires, setPrestataires] = useState<PrestataireListItem[]>([]);
  const [selectedPrestataires, setSelectedPrestataires] = useState<string[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentsSearchQuery, setAssignmentsSearchQuery] = useState("");


  /* State: Update Campaign Photo */
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPrestataireForPhoto, setSelectedPrestataireForPhoto] = useState<{ id: string, photo_url: string | null } | null>(null);

  /* State: Lightbox */
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);


  // Upload fichier states
  const [fileType, setFileType] = useState("");
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);



  // Vérification matériel modal states
  const [isMaterielCaseModalOpen, setIsMaterielCaseModalOpen] = useState(false);
  const [selectedPrestataireForMateriel, setSelectedPrestataireForMateriel] = useState<{
    id: string;
    nom: string;
    prenom: string;
  } | null>(null);

  // Verification Materielle states


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
    if (!campagne?.service?.id_service) return;
    try {
      const res = await apiClient(`/api/prestataires?disponible=true&limit=-1&serviceId=${campagne.service.id_service}`);
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
          id_verification: p.id_verification,
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
  }, [apiClient, campagne]);

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
    if (selectedPrestataires.length === 0) {
      toast.error("Veuillez sélectionner au moins un prestataire");
      return;
    }


    setIsAssigning(true);

    try {
      const res = await apiClient(`/api/campagnes/${id}/prestataires`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_prestataires: selectedPrestataires
        })
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);

      toast.success(body.message || "Prestataire affecté avec succès");

      // Recharger les données de la campagne pour afficher les prestataires assignés
      await fetchCampagne();
      setSelectedPrestataires([]);
      setIsAssignDialogOpen(false);
      setSearchQuery("");


    } catch (err) {
      console.error("Erreur assign prestataire:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'affectation");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleQuickAddSuccess = (newPrestataire: any) => {
    // 1. Add to local list (prepend)
    const newPrestItem: PrestataireListItem = {
      id_prestataire: newPrestataire.id_prestataire,
      nom: newPrestataire.nom,
      prenom: newPrestataire.prenom,
      contact: newPrestataire.contact,
      service: newPrestataire.service ? { nom: newPrestataire.service.nom } : null,
      disponible: true, // Newly created is available
      plaque: newPrestataire.plaque,
      id_verification: newPrestataire.id_verification,
      lastCampDate: null,
      lastCampName: null,
    };
    setPrestataires([newPrestItem, ...prestataires]);

    // 2. Auto-select it
    setSelectedPrestataires((prev) => [...prev, newPrestItem.id_prestataire]);

    // 3. Close modal
    setIsQuickAddOpen(false);
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

  // --- Search Logic ---
  const normalizeString = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizePlaque = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

  const filteredPrestataires = prestataires.filter(p => {
    const search = normalizeString(searchQuery);
    const searchPlaque = normalizePlaque(searchQuery);

    const matchName = normalizeString(p.nom || "").includes(search);
    const matchPrenom = normalizeString(p.prenom || "").includes(search);
    const matchService = normalizeString(p.service?.nom || "").includes(search);

    // Recherche intelligente sur la plaque : on compare les versions "nettoyées" (sans tirets/espaces)
    const matchPlaque = p.plaque && normalizePlaque(p.plaque).includes(searchPlaque);

    const valVerif = String(p.id_verification || "");
    const matchVerification =
      normalizeString(valVerif).includes(search) ||
      normalizePlaque(valVerif).includes(searchPlaque);

    return matchName || matchPrenom || matchService || matchPlaque || matchVerification;
  });

  const filteredAssignments = campagne.affectations?.filter(a => {
    if (!a.prestataire) return false;
    const search = normalizeString(assignmentsSearchQuery);
    return (
      normalizeString(a.prestataire.nom || "").includes(search) ||
      normalizeString(a.prestataire.prenom || "").includes(search)
    );
  }) || [];

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
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">{campagne.nom_campagne}</h1>
            {campagne.id_campagne_parent && campagne.campagne_parent && (
              <Link href={`/dashboard/campagnes/${campagne.id_campagne_parent}`} className="text-sm text-gray-500 hover:text-[#d61353] flex items-center gap-1 mt-1 transition-colors">
                <LinkIcon className="w-3 h-3" />
                Renouvellement de {campagne.campagne_parent.nom_campagne}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DownloadPhotosButton
            campagneNom={campagne.nom_campagne || "campagne"}
            affectations={campagne.affectations || []}
          />
          <DownloadReportButton
            campagneId={id}
            campagneName={campagne.nom_campagne || "campagne"}
            apiClient={apiClient}
          />
          {campagne.status === "TERMINEE" && (
            <Button onClick={() => setIsRenewModalOpen(true)} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              <RefreshCw className="w-4 h-4" />
              Renouveler
            </Button>
          )}
        </div>
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

      {/* Section Album Photos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Album Photos</CardTitle>
            <CardDescription>
              Preuves visuelles des affichages réalisés par les prestataires.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {campagne.affectations && campagne.affectations.filter(a => !!a.image_affiche).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {campagne.affectations
                .filter(a => !!a.image_affiche)
                .map((a, idx) => (
                  <div key={idx} className="flex flex-col border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden group bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all">
                    <button
                      type="button"
                      onClick={() => setLightboxUrl(a.image_affiche!)}
                      className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden cursor-zoom-in"
                    >
                      <img
                        src={a.image_affiche!}
                        alt={`Affiche de ${a.prestataire?.nom} ${a.prestataire?.prenom}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Search className="w-8 h-8 text-white drop-shadow-md" />
                      </div>
                    </button>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {a.prestataire?.nom ?? "-"} {a.prestataire?.prenom ?? ""}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1.5">
                        <Calendar className="w-3 h-3" />
                        {a.date_creation ? new Date(a.date_creation).toLocaleDateString("fr-FR") : "-"}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
              <Camera className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune photo d'affichage pour cette campagne.
              </p>
            </div>
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

            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
              <QuickAddPrestataireModal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                onSuccess={handleQuickAddSuccess}
                defaultServiceId={campagne.service?.id_service}
                defaultServiceName={campagne.service?.nom}
              />
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center">
                  <span>Assigner un nouveau prestataire</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs bg-[#d61353]/10 text-[#d61353] hover:bg-[#d61353]/20"
                    onClick={() => setIsQuickAddOpen(true)}
                  >
                    <PlusCircle className="mr-1 h-3 w-3" /> Nouveau Prestataire
                  </Button>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                <Label className="mb-4 block">Sélectionner un prestataire disponible</Label>

                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Rechercher par nom, service, plaque ou verification..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {prestataires.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun prestataire disponible</p>
                ) : filteredPrestataires.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun résultat trouvé pour &quot;{searchQuery}&quot;</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPrestataires.map((p) => (
                      <div
                        key={p.id_prestataire}
                        onClick={() => {
                          setSelectedPrestataires(prev =>
                            prev.includes(p.id_prestataire)
                              ? prev.filter(id => id !== p.id_prestataire)
                              : [...prev, p.id_prestataire]
                          );
                        }}

                        className={`relative border rounded-lg p-4 cursor-pointer transition-all
${selectedPrestataires.includes(p.id_prestataire)
                            ? "border-[#d61353] bg-[#d61353]/5 shadow-md"
                            : "border-gray-200 hover:border-[#d61353]/50"
                          }`}

                      >
                        {/* Checkbox */}
                        <div className="absolute top-3 right-3">
                          <div
                            className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${selectedPrestataires.includes(p.id_prestataire)

                              ? "border-[#d61353] bg-[#d61353]"
                              : "border-gray-300"
                              }`}
                          >
                            {selectedPrestataires.includes(p.id_prestataire) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Contenu de la carte */}
                        <div className="pr-8">
                          <h3 className="font-semibold text-lg mb-2">
                            {p.nom} {p.prenom}
                          </h3>

                          <div className="space-y-1.5 text-sm">
                            {/* Service */}
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {p.service?.nom || "Service non défini"}
                              </span>
                            </div>

                            {/* Dernière campagne */}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {p.lastCampDate
                                  ? `Dernière campagne: ${new Date(p.lastCampDate).toLocaleDateString("fr-FR")}`
                                  : "Aucune campagne"}
                              </span>
                            </div>

                            {/* Plaque (si présente) */}
                            {p.plaque && (
                              <div className="flex items-center gap-2">
                                <div className="text-gray-400 font-mono text-xs border px-1 rounded bg-gray-50">
                                  {p.plaque}
                                </div>
                                {normalizePlaque(searchQuery).length > 2 && normalizePlaque(p.plaque).includes(normalizePlaque(searchQuery)) && (
                                  <span className="text-xs text-green-600 font-medium">✨ Correspondance plaque</span>
                                )}
                              </div>
                            )}

                            {/* Disponibilité */}
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${p.disponible ? "bg-green-500" : "bg-red-500"}`} />
                              <span className="text-gray-600">
                                {p.disponible ? "Disponible" : "Non disponible"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPrestataires([]);
                    setIsAssignDialogOpen(false);
                    setSearchQuery("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={selectedPrestataires.length === 0 || isAssigning}
                  className="flex items-center gap-2"
                >
                  {isAssigning && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {isAssigning ? "Assignation..." : "Assigner"}
                </Button>

              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher affectation..."
                value={assignmentsSearchQuery}
                onChange={(e) => setAssignmentsSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {filteredAssignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestataire</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Date d&apos;assignation</TableHead>
                  <TableHead>Date de fin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Montant à Payer</TableHead>
                  <TableHead>Pénalité</TableHead>
                  <TableHead>Montant Payé</TableHead>
                  <TableHead>Reste à Payer</TableHead>
                  <TableHead className="hidden md:table-cell">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((a, idx) => {
                  if (!a) return null;

                  // Calculs pour les paiements
                  const paiementBase = a.paiement?.[0]?.paiement_base ?? 0;
                  const penalite = a.paiement?.[0]?.sanction_montant ?? 0;
                  const montantAPayer = a.paiement?.[0]?.paiement_final ?? 0;

                  // Calcul du total payé via les transactions
                  const totalPaye = a.paiement?.[0]?.transactions?.reduce((sum, t) => sum + t.montant, 0) ?? 0;

                  // Calcul du reste
                  const resteAPayer = Math.max(0, montantAPayer - totalPaye);

                  // Format money helper
                  const formatMoney = (amount: number) => {
                    return new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                      minimumFractionDigits: 0,
                    }).format(amount);
                  };

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-between gap-2">
                          {/* Nom du prestataire */}
                          <span className="truncate">
                            {a.prestataire?.nom ?? "-"} {a.prestataire?.prenom ?? ""}
                          </span>

                          {/* Actions MOBILE */}
                          {a.prestataire && (
                            <div className="flex gap-1 md:hidden">
                              {/* Bouton Photo : masqué si image_affiche existe déjà */}
                              {!a.image_affiche && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedPrestataireForPhoto({
                                      id: a.prestataire.id_prestataire,
                                      photo_url: a.image_affiche || null
                                    });
                                    setIsPhotoModalOpen(true);
                                  }}
                                >
                                  📷
                                </Button>
                              )}

                              {/* Bouton Vérification matériel : masqué si un paiement existe */}
                              {(!a.paiement || a.paiement.length === 0) && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedPrestataireForMateriel({
                                      id: a.prestataire.id_prestataire,
                                      nom: a.prestataire.nom || "",
                                      prenom: a.prestataire.prenom || ""
                                    });
                                    setIsMaterielCaseModalOpen(true);
                                  }}
                                >
                                  🔧
                                </Button>
                              )}

                              <Link href={`/prestataires/${a.prestataire.id_prestataire}`}>
                                <Button variant="outline" size="icon">
                                  👁
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </TableCell>


                      <TableCell>
                        {a.image_affiche ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(a.image_affiche!)}
                            className="group relative h-10 w-10 rounded overflow-hidden border bg-gray-100 block cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#d61353]"
                            title="Voir en grand"
                          >
                            <img src={a.image_affiche} alt="Affiche" className="h-full w-full object-cover transition-opacity group-hover:opacity-70" />
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                              🔍
                            </span>
                          </button>
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                            <span className="text-[10px]">N/A</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {a.date_creation ? new Date(a.date_creation).toLocaleDateString("fr-FR") : "-"}
                      </TableCell>

                      <TableCell>
                        {a.date_fin ? new Date(a.date_fin).toLocaleDateString("fr-FR") : "-"}
                      </TableCell>

                      <TableCell>{a.status ?? "-"}</TableCell>

                      {/* Colonnes Financières */}
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {a.paiement && a.paiement.length > 0 ? formatMoney(montantAPayer) : "-"}
                      </TableCell>
                      <TableCell className="text-red-500">{a.paiement && a.paiement.length > 0 ? `-${formatMoney(penalite)}` : "-"}</TableCell>
                      <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                        {a.paiement && a.paiement.length > 0 ? formatMoney(totalPaye) : "-"}
                      </TableCell>
                      <TableCell className={`font-bold ${a.paiement && a.paiement.length > 0 ? (resteAPayer > 0 ? "text-[#d61353]" : "text-green-600") : ""}`}>
                        {a.paiement && a.paiement.length > 0 ? formatMoney(resteAPayer) : "-"}
                      </TableCell>

                      <TableCell className="max-md:hidden">
                        {a.prestataire && (
                          <div className="flex flex-row gap-2 flex-wrap">
                            {/* Bouton Photo : masqué si une photo existe déjà */}
                            {!a.image_affiche && (
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
                                Photo
                              </Button>
                            )}
                            {/* Bouton Vérification : masqué si un paiement existe */}
                            {(!a.paiement || a.paiement.length === 0) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPrestataireForMateriel({
                                    id: a.prestataire.id_prestataire,
                                    nom: a.prestataire.nom || "",
                                    prenom: a.prestataire.prenom || ""
                                  });
                                  setIsMaterielCaseModalOpen(true);
                                }}
                              >
                                Vérification
                              </Button>
                            )}
                            <Link href={`/prestataires/${a.prestataire.id_prestataire}`}>
                              <Button variant="outline" size="sm">Voir</Button>
                            </Link>
                            {/* Bouton Désassigner : visible seulement si < 24h, pas de photo, pas de paiement */}
                            {(() => {
                              const heuresDepuisAssign = a.date_creation
                                ? (Date.now() - new Date(a.date_creation).getTime()) / (1000 * 60 * 60)
                                : Infinity;
                              const peutDesassigner =
                                heuresDepuisAssign <= 24 &&
                                !a.image_affiche &&
                                (!a.paiement || a.paiement.length === 0);
                              return peutDesassigner ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPrestataireToUnassign({
                                      id: a.prestataire.id_prestataire,
                                      nom: a.prestataire.nom || "",
                                      prenom: a.prestataire.prenom || ""
                                    });
                                    setIsUnassignModalOpen(true);
                                  }}
                                >
                                  Désassigner
                                </Button>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-center text-gray-500 py-8">
              Aucun prestataire assigné.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modal Vérification Matériel */}
      {
        selectedPrestataireForMateriel && (
          <AddMaterielCaseModal
            isOpen={isMaterielCaseModalOpen}
            onClose={() => {
              setIsMaterielCaseModalOpen(false);
              setSelectedPrestataireForMateriel(null);
            }}
            prestataireId={selectedPrestataireForMateriel.id}
            affectations={[
              {
                campagne: {
                  id_campagne: campagne?.id_campagne || "",
                  nom_campagne: campagne?.nom_campagne || ""
                }
              }
            ]}
            onIncidentAdded={() => {
              fetchCampagne();
              toast.success("Vérification matériel enregistrée avec succès");
            }}
          />
        )
      }



      {/* Campaign Photo Modal */}
      {
        selectedPrestataireForPhoto && (
          <UpdateCampaignPhotoModal
            isOpen={isPhotoModalOpen}
            onClose={() => setIsPhotoModalOpen(false)}
            campagneId={id}
            prestataireId={selectedPrestataireForPhoto.id}
            initialPhotoUrl={selectedPrestataireForPhoto.photo_url}
            onPhotoUpdated={() => {
              fetchCampagne();
              toast.success("Photo de la campagne mise à jour avec succès");
            }}
          />
        )
      }

      {/* Modal Désassignation */}
      <UnassignPrestataireModal
        isOpen={isUnassignModalOpen}
        onClose={() => {
          setIsUnassignModalOpen(false);
          setSelectedPrestataireToUnassign(null);
        }}
        prestataire={selectedPrestataireToUnassign}
        onUnassigned={() => {
          setIsUnassignModalOpen(false);
          setSelectedPrestataireToUnassign(null);
          fetchCampagne();
        }}
        onUnassign={async (prestataireId) => {
          try {
            const res = await apiClient(`/api/campagnes/${id}/prestataires/${prestataireId}`, {
              method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur lors de la désassignation');
            toast.success('Prestataire désassigné avec succès');
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erreur lors de la désassignation');
            throw error;
          }
        }}
      />

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de l'image"
          tabIndex={-1}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 text-white text-3xl font-bold leading-none hover:text-gray-300 transition-colors"
              aria-label="Fermer"
            >
              &times;
            </button>
            <img
              src={lightboxUrl}
              alt="Aperçu"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
          </div>
        </div>
      )}

      {
        isRenewModalOpen && campagne && (
          <RenewCampaignModal
            isOpen={isRenewModalOpen}
            onClose={() => setIsRenewModalOpen(false)}
            campagneId={campagne.id_campagne}
            nomCampagne={campagne.nom_campagne || ""}
            prestataires={campagne.affectations?.map((a) => ({
              id_prestataire: a.prestataire.id_prestataire,
              nom: a.prestataire.nom || "",
              prenom: a.prestataire.prenom || "",
              contact: a.prestataire.contact || "",
              disponible: true,
            })) || []}
          />
        )
      }
    </div>
  );
}
