"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { AlertTriangle, Info, Camera, X, Image as ImageIcon, Upload, Check } from "lucide-react";

const INCIDENT_CASES = [
    { id: "tout_bon", label: "TOUT BON (État Bon)", baseEtat: "BON", color: "bg-green-100 text-green-800 border-green-300" },
    { id: "panneau_casse", label: "Panneau Cassé (État Mauvais)", baseEtat: "MAUVAIS", color: "bg-red-100 text-red-800 border-red-300" },
    { id: "cadran_casse", label: "Cadran Cassé (État Moyen)", baseEtat: "MOYEN", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    { id: "affiche_dechiree", label: "Affiche Déchirée ou Manquante (État Moyen)", baseEtat: "MOYEN", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    { id: "materiel_sale", label: "Matériel Sale / Poussiéreux (État Moyen)", baseEtat: "MOYEN", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    { id: "fixation_defaillante", label: "Fixation Défaillante (État Moyen)", baseEtat: "MOYEN", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
] as const;

interface Affectation {
    campagne: {
        id_campagne: string;
        nom_campagne: string;
    };
}

interface AddMaterielCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    prestataireId: string;
    affectations: Affectation[];
    onIncidentAdded: () => void;
}

export default function AddMaterielCaseModal({
    isOpen,
    onClose,
    prestataireId,
    affectations,
    onIncidentAdded
}: AddMaterielCaseModalProps) {
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form states
    const [selectedCampagne, setSelectedCampagne] = useState<string>("");
    const [etat, setEtat] = useState<"BON" | "MOYEN" | "MAUVAIS">("BON");
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    const [description, setDescription] = useState("");

    // Calcul automatique de l'état selon les cas sélectionnés
    useEffect(() => {
        if (selectedCases.length === 0) return;

        let maxGravite = 1; // 1: BON, 2: MOYEN, 3: MAUVAIS

        selectedCases.forEach(caseId => {
            const cas = INCIDENT_CASES.find(c => c.id === caseId);
            if (cas) {
                if (cas.baseEtat === "MAUVAIS") maxGravite = Math.max(maxGravite, 3);
                if (cas.baseEtat === "MOYEN") maxGravite = Math.max(maxGravite, 2);
            }
        });

        if (maxGravite === 3) setEtat("MAUVAIS");
        else if (maxGravite === 2) setEtat("MOYEN");
        else setEtat("BON");
    }, [selectedCases]);

    // Photo state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileInputMoreRef = useRef<HTMLInputElement>(null);
    const cameraFallbackRef = useRef<HTMLInputElement>(null);

    // Attacher le stream au video dès que la caméra devient active
    // (le <video> est toujours dans le DOM, donc videoRef est toujours disponible)
    useEffect(() => {
        if (isCameraActive && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => { });
        }
    }, [isCameraActive]);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            if (affectations.length > 0) {
                setSelectedCampagne(affectations[0].campagne.id_campagne);
            }
            setEtat("BON");
            setSelectedCases(["tout_bon"]); // Défaut
            setDescription("");
            clearPhotos();
        }
        return () => { stopCamera(); };
    }, [isOpen, affectations]);

    // ─── Camera Logic ─────────────────────────────────────────────────────────

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            cameraFallbackRef.current?.click();
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            streamRef.current = stream;
            // On set isCameraActive → useEffect va attacher le stream au video
            setIsCameraActive(true);
        } catch (err) {
            console.error("Impossible d'accéder à la caméra", err);
            toast.info("Caméra non disponible, ouverture de l'appareil photo natif...");
            cameraFallbackRef.current?.click();
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
                        addFile(file);
                        // La caméra reste ouverte pour capturer d'autres photos
                    }
                }, 'image/jpeg', 0.85);
            }
        }
    };

    // ─── File Handling ─────────────────────────────────────────────────────────

    const addFile = (file: File) => {
        setSelectedFiles(prev => [...prev, file]);
        const url = URL.createObjectURL(file);
        setPreviewUrls(prev => [...prev, url]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            Array.from(e.target.files).forEach(file => addFile(file));
            e.target.value = ""; // Reset pour permettre de re-sélectionner les mêmes fichiers
        }
    };

    const removePhoto = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const clearPhotos = () => {
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setPreviewUrls([]);
        stopCamera();
    };

    // ─── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!selectedCampagne) {
            toast.error("Veuillez sélectionner une campagne.");
            return;
        }

        setLoading(true);
        try {
            const uploadedUrls: string[] = [];

            // 1. Upload toutes les photos
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append("file", file);
                    const uploadRes = await apiClient("/api/materiels-cases/upload", {
                        method: "POST",
                        body: formData,
                    });
                    if (!uploadRes.ok) {
                        throw new Error("Erreur lors de l'upload d'une ou plusieurs images");
                    }
                    const uploadJson = await uploadRes.json();
                    uploadedUrls.push(uploadJson.url);
                }
            }

            // 2. Format final description
            const casesTextArray = selectedCases.map(id => INCIDENT_CASES.find(c => c.id === id)?.label.split(" (")[0]).filter(Boolean);
            const casesStr = casesTextArray.join(", ");
            const finalDescription = [casesStr, description.trim()].filter(Boolean).join(" - Observations: ");

            // 3. Créer l'enregistrement
            const payload = {
                id_prestataire: prestataireId,
                id_campagne: selectedCampagne,
                nom_materiel: "Matériel Publicitaire",
                etat,
                description: finalDescription || null,
                photo_url: uploadedUrls[0] || null,
                preuve_media: uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null
            };

            const res = await apiClient("/api/materiels-cases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || body.error || "Erreur lors de l'enregistrement");
            }

            toast.success("Vérification enregistrée avec succès.");
            onIncidentAdded();
            onClose();
        } catch (err) {
            console.error("Erreur:", err);
            toast.error(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl bg-white p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b bg-gray-50 flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                        <AlertTriangle className="w-5 h-5 text-[#d61353]" />
                        Déclaration Matériel Endommagé
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    <div className="grid md:grid-cols-2 gap-6">

                        {/* ── Colonne gauche : Formulaire ── */}
                        <div className="space-y-4">
                            {/* Campagne */}
                            <div className="space-y-1">
                                <Label className="block text-sm font-medium text-gray-700">
                                    Campagne Concernée <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedCampagne} onValueChange={setSelectedCampagne}>
                                    <SelectTrigger className="w-full border rounded-lg p-2.5 bg-white">
                                        <SelectValue placeholder="Sélectionner une campagne" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {affectations.length === 0 ? (
                                            <SelectItem value="none" disabled>Aucune campagne active</SelectItem>
                                        ) : (
                                            affectations.map((aff) => (
                                                <SelectItem key={aff.campagne.id_campagne} value={aff.campagne.id_campagne}>
                                                    {aff.campagne.nom_campagne}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Sélection des cas */}
                            <div className="space-y-2">
                                <Label className="block text-sm font-medium text-gray-700">
                                    Constat sur le matériel <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {INCIDENT_CASES.map((cas) => {
                                        const isSelected = selectedCases.includes(cas.id);
                                        return (
                                            <button
                                                key={cas.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCases(prev => {
                                                        // Règle: Si on clique sur "TOUT BON", on force la sélection unique à "TOUT BON"
                                                        if (cas.id === "tout_bon") return ["tout_bon"];

                                                        // Sinon (clic sur un cas négatif)
                                                        const noToutBon = prev.filter(id => id !== "tout_bon");
                                                        if (noToutBon.includes(cas.id)) {
                                                            const newCases = noToutBon.filter(id => id !== cas.id);
                                                            return newCases.length === 0 ? ["tout_bon"] : newCases;
                                                        } else {
                                                            return [...noToutBon, cas.id];
                                                        }
                                                    });
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${isSelected ? cas.color + ' ring-2 ring-offset-1' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {isSelected && <Check size={14} />}
                                                {cas.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* État (ReadOnly) */}
                            <div className="space-y-1">
                                <Label className="block text-sm font-medium text-gray-700">
                                    État Calculé (Automatique)
                                </Label>
                                <div className="grid grid-cols-3 gap-2 opacity-80 cursor-not-allowed">
                                    {(["BON", "MOYEN", "MAUVAIS"] as const).map((e) => (
                                        <div
                                            key={e}
                                            className={`py-2 text-center rounded-lg text-sm font-medium border ${etat === e
                                                ? (e === 'BON' ? 'bg-green-100 border-green-300 text-green-800 ring-2 ring-green-500' :
                                                    e === 'MOYEN' ? 'bg-yellow-100 border-yellow-300 text-yellow-800 ring-2 ring-yellow-500' :
                                                        'bg-red-100 border-red-300 text-red-800 ring-2 ring-red-500')
                                                : 'bg-white border-gray-300 text-gray-400'
                                                }`}
                                        >
                                            {e}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <Label className="block text-sm font-medium text-gray-700">
                                    Description / Observations{" "}
                                    <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
                                </Label>
                                <Textarea
                                    rows={4}
                                    placeholder="Détails sur l'incident (ex: Déchirure, panne, déformation...)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full border rounded-lg p-2.5 resize-none focus:ring-2 focus:ring-black focus:border-black outline-none"
                                />
                            </div>

                            {/* Info pénalité */}
                            <div className="flex items-start gap-2 border p-3 rounded-lg bg-blue-50 border-blue-200">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium text-blue-900">
                                        Calcul automatique des pénalités
                                    </p>
                                    <p className="text-xs text-blue-700">
                                        Si l&apos;état est MAUVAIS, une pénalité sera automatiquement appliquée selon le type de client.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Colonne droite : Photos ── */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <Label className="block text-sm font-medium text-gray-700">
                                    Preuves Photo
                                    {selectedFiles.length > 0 && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                            {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </Label>
                                {selectedFiles.length > 0 && !isCameraActive && (
                                    <button
                                        type="button"
                                        onClick={clearPhotos}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium transition"
                                    >
                                        Tout effacer
                                    </button>
                                )}
                            </div>

                            {/* Zone principale de photos */}
                            <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden flex flex-col relative min-h-[350px]">

                                {/* ── État vide : Aucune photo, caméra inactive ── */}
                                {!selectedFiles.length && !isCameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                        <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                                        <p className="text-gray-400 text-sm mb-5">
                                            Ajoutez des photos pour prouver l&apos;état du matériel
                                        </p>
                                        <div className="flex gap-3">
                                            {/* Importer */}
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                                            >
                                                <Upload size={16} />
                                                Importer
                                            </button>
                                            {/* Caméra */}
                                            <button
                                                type="button"
                                                onClick={startCamera}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-black text-white shadow-sm rounded-lg hover:bg-gray-800 text-sm font-medium transition"
                                            >
                                                <Camera size={16} />
                                                Caméra
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── Vue caméra : toujours dans le DOM, visible/cachée via CSS ── */}
                                <div className={`relative bg-black flex flex-col ${isCameraActive ? 'flex-1' : 'hidden'}`}>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full flex-1 object-cover"
                                        style={{ minHeight: '220px' }}
                                    />
                                    <canvas ref={canvasRef} className="hidden" />

                                    {/* Compteur de photos prises */}
                                    {selectedFiles.length > 0 && (
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
                                            {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} prise{selectedFiles.length > 1 ? 's' : ''}
                                        </div>
                                    )}

                                    {/* Contrôles caméra */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-center items-center gap-6">
                                        <button
                                            type="button"
                                            onClick={stopCamera}
                                            className="p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition"
                                            title="Fermer la caméra"
                                        >
                                            <X size={20} />
                                        </button>
                                        {/* Bouton déclencheur style appareil photo */}
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            className="w-16 h-16 bg-white rounded-full shadow-xl hover:scale-105 transition flex items-center justify-center border-4 border-gray-200"
                                            title="Prendre une photo"
                                        >
                                            <div className="w-11 h-11 bg-white rounded-full border-2 border-gray-400" />
                                        </button>
                                        {/* Espace symétrique */}
                                        <div className="w-10 h-10" />
                                    </div>
                                </div>

                                {/* ── Grille de photos ── */}
                                {selectedFiles.length > 0 && !isCameraActive && (
                                    <div className="flex-1 p-3 bg-white overflow-y-auto">
                                        <div className="grid grid-cols-3 gap-2">
                                            {previewUrls.map((url, index) => (
                                                <div
                                                    key={index}
                                                    className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 group"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Photo ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Bouton supprimer */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(index)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                    {/* Numéro */}
                                                    <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                            ))}

                                            {/* Bouton ajouter (import fichier) */}
                                            {selectedFiles.length < 10 && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputMoreRef.current?.click()}
                                                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg aspect-square hover:bg-gray-50 hover:border-gray-400 transition group"
                                                    title="Importer des photos"
                                                >
                                                    <Upload size={18} className="text-gray-400 group-hover:text-gray-600 mb-1 transition" />
                                                    <span className="text-[10px] text-gray-400 group-hover:text-gray-600">Importer</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Barre d'actions */}
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={startCamera}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition"
                                            >
                                                <Camera size={15} />
                                                Prendre une photo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Inputs cachés */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <input
                                ref={fileInputMoreRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {/* Fallback caméra native (mobile) */}
                            <input
                                ref={cameraFallbackRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-gray-50 flex justify-end gap-3 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 h-auto font-medium"
                    >
                        Annuler
                    </Button>
                    <Button
                        className="bg-[#d61353] hover:bg-[#b01044] px-5 py-2.5 h-auto font-medium shadow-sm flex items-center gap-2"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Enregistrement...
                            </span>
                        ) : "Enregistrer la vérification"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
