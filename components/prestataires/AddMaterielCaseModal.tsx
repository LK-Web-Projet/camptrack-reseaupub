"use client";

import { useState, useEffect } from "react";
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
import { UploadCloud, AlertTriangle, Info, Camera, X, Image as ImageIcon, RotateCcw, Upload, Check } from "lucide-react";
import { useRef } from "react";

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
    const [etat, setEtat] = useState<"BON" | "MOYEN" | "MAUVAIS">("MAUVAIS");
    const [description, setDescription] = useState("");

    // Photo Capture State
    type CaptureMode = 'FILE' | 'CAMERA';
    const [captureMode, setCaptureMode] = useState<CaptureMode>('FILE');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nativeCameraInputRef = useRef<HTMLInputElement>(null);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            if (affectations.length > 0) {
                setSelectedCampagne(affectations[0].campagne.id_campagne);
            }
            setEtat("MAUVAIS");
            setDescription("");
            resetPhoto();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, affectations]);

    // --- Camera Logic ---
    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn("Camera API not available, falling back to native input");
            nativeCameraInputRef.current?.click();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraActive(true);
        } catch (err) {
            console.error("Impossible d'accéder à la caméra", err);
            toast.info("Caméra inapprochable, ouverture de l'appareil photo natif...");
            nativeCameraInputRef.current?.click();
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
                        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                        handleFileSelection(file);
                        stopCamera();
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    // --- File Handling ---
    const handleFileSelection = (file: File) => {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const resetPhoto = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        stopCamera();
        setCaptureMode('FILE');
    };

    const handleSubmit = async () => {
        if (!selectedCampagne) {
            toast.error("Veuillez sélectionner une campagne.");
            return;
        }
        // Description is optional or required depending on rules, but user strict check was here.
        // Keeping strict check as per original code.
        if (!description.trim()) {
            toast.error("Veuillez fournir une description.");
            return;
        }

        setLoading(true);
        try {
            let photoUrl: string | null = null;

            // 1. Upload Photo if exists
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const uploadRes = await apiClient("/api/materiels-cases/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error("Erreur lors de l'upload de l'image");
                }

                const uploadJson = await uploadRes.json();
                photoUrl = uploadJson.url;
            }

            // Payload
            const payload = {
                id_prestataire: prestataireId,
                id_campagne: selectedCampagne,
                nom_materiel: "Matériel Publicitaire", // Default as per modal logic
                etat,
                description,
                photo_url: photoUrl
            };

            const res = await apiClient("/api/materiels-cases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Erreur lors de la déclaration de l'incident");
            }

            toast.success("Incident déclaré avec succès.");
            onIncidentAdded();
            onClose();
        } catch (err) {
            console.error("Erreur incident:", err);
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
                        {/* Left Column: Form Details */}
                        <div className="space-y-4">
                            {/* Campagne */}
                            <div className="space-y-1">
                                <Label className="block text-sm font-medium text-gray-700">Campagne Concernée</Label>
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

                            {/* État */}
                            <div className="space-y-1">
                                <Label className="block text-sm font-medium text-gray-700">État du Matériel</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["BON", "MOYEN", "MAUVAIS"] as const).map((e) => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => setEtat(e)}
                                            className={`py-2 rounded-lg text-sm font-medium border transition ${etat === e
                                                ? (e === 'BON' ? 'bg-green-100 border-green-300 text-green-800 ring-2 ring-green-500' :
                                                    e === 'MOYEN' ? 'bg-yellow-100 border-yellow-300 text-yellow-800 ring-2 ring-yellow-500' :
                                                        'bg-red-100 border-red-300 text-red-800 ring-2 ring-red-500')
                                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <Label className="block text-sm font-medium text-gray-700">Description / Observations</Label>
                                <Textarea
                                    rows={4}
                                    placeholder="Détails sur l'incident ou l'état (ex: Déchirure, panne...)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full border rounded-lg p-2.5 resize-none focus:ring-2 focus:ring-black focus:border-black outline-none"
                                />
                            </div>

                            {/* Info message about automatic penalty calculation */}
                            <div className="flex items-start gap-2 border p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        Calcul automatique des pénalités
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Si l&apos;état est MAUVAIS, une pénalité sera automatiquement appliquée.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Photo Evidence */}
                        <div className="flex flex-col space-y-1">
                            <Label className="block text-sm font-medium text-gray-700">Preuve Photo (Recommandé)</Label>

                            <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col relative min-h-[350px]">

                                {!previewUrl && !isCameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                        <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                                        <p className="text-gray-500 text-sm mb-4">Ajoutez une photo pour prouver l&apos;état</p>

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('incident-file-upload')?.click()}
                                                className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                                            >
                                                <Upload size={16} />
                                                Importer
                                            </button>
                                            <input
                                                id="incident-file-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            <input
                                                ref={nativeCameraInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCaptureMode('CAMERA');
                                                    startCamera();
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-black text-white shadow-sm rounded-lg hover:bg-gray-800 text-sm font-medium transition"
                                            >
                                                <Camera size={16} />
                                                Photo
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Camera View */}
                                <div className={`flex-1 relative bg-black ${isCameraActive ? 'block' : 'hidden'}`}>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    <canvas ref={canvasRef} className="hidden" />

                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                        <button
                                            type="button"
                                            onClick={stopCamera}
                                            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30"
                                        >
                                            <X size={24} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            className="p-4 bg-white rounded-full text-black shadow-lg hover:scale-105 transition"
                                        >
                                            <Camera size={28} />
                                        </button>
                                    </div>
                                </div>

                                {/* Photo Preview */}
                                {previewUrl && !isCameraActive && (
                                    <div className="absolute inset-0 bg-black">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                resetPhoto();
                                                setCaptureMode('FILE');
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                                        >
                                            <RotateCcw size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-gray-50 flex justify-end gap-3 sm:justify-end">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="px-5 py-2.5 h-auto font-medium">
                        Annuler
                    </Button>
                    <Button
                        className="bg-[#d61353] hover:bg-[#b01044] px-5 py-2.5 h-auto font-medium shadow-sm"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Enregistrement..." : "Enregistrer la validation"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
