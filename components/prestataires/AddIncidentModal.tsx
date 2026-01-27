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
import { UploadCloud, AlertTriangle, Camera, X, Image as ImageIcon, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
// import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import AddTypeIncidentDialog from "@/components/types-incident/AddTypeIncidentDialog"; // Import the dialog

interface TypeIncident {
    id_type_incident: string;
    nom: string;
    description: string | null; // Keep it nullable to match dialog
}

interface AddIncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    prestataireId: string;
    onIncidentAdded: () => void;
}

export default function AddIncidentModal({
    isOpen,
    onClose,
    prestataireId,
    onIncidentAdded
}: AddIncidentModalProps) {
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(false);
    const [typesIncident, setTypesIncident] = useState<TypeIncident[]>([]);

    // Form states
    const [selectedTypeIncident, setSelectedTypeIncident] = useState<string>("");
    const [dateIncident, setDateIncident] = useState<Date | undefined>(new Date());
    const [commentaire, setCommentaire] = useState("");
    const [photos, setPhotos] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // State for the "Add New Type" dialog
    const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false);

    // Camera/File input refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const fetchTypesIncident = async () => {
        try {
            const res = await apiClient("/api/types-incidents");
            if (res.ok) {
                const data = await res.json();
                setTypesIncident(data);
            } else {
                toast.error("Échec du chargement des types d'incident.");
            }
        } catch (error) {
            console.error("Error fetching incident types:", error);
            toast.error("Erreur lors du chargement des types d'incident.");
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTypesIncident();

            // Reset form
            setSelectedTypeIncident("");
            setDateIncident(new Date());
            setCommentaire("");
            setPhotos([]);
            setPreviewUrls([]);
            stopCamera();
        }
        return () => {
            stopCamera();
            previewUrls.forEach(url => URL.revokeObjectURL(url)); // Clean up URLs
        };
    }, [isOpen]);

    // Callback for when a new type is successfully added
    const handleTypeAdded = (newType: TypeIncident) => {
        // 1. Add the new type to the existing list
        setTypesIncident(prev => [...prev, newType]);
        // 2. Automatically select the new type
        setSelectedTypeIncident(newType.id_type_incident);
        // 3. Close the dialog
        setIsAddTypeDialogOpen(false);
    };


    // --- Camera Logic ---
    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.warn("Caméra non disponible, veuillez utiliser l'importation de fichiers.");
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
            toast.error("Erreur d'accès à la caméra.");
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
                        const newFile = new File([blob], `incident-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
                        handleAddPhoto(newFile);
                        stopCamera();
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    // --- Photo File Handling ---
    const handleAddPhoto = (file: File) => {
        setPhotos(prev => [...prev, file]);
        setPreviewUrls(prev => [...prev, URL.createObjectURL(file)]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => handleAddPhoto(file));
        }
    };

    const handleRemovePhoto = (indexToRemove: number) => {
        setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
        setPreviewUrls(prev => {
            URL.revokeObjectURL(prev[indexToRemove]); // Clean up removed URL
            return prev.filter((_, index) => index !== indexToRemove);
        });
    };

    // Simplified handleSubmit
    const handleSubmit = async () => {
        if (!selectedTypeIncident) {
            toast.error("Veuillez sélectionner ou créer un type d'incident.");
            return;
        }
        if (!dateIncident) {
            toast.error("Veuillez spécifier la date de l'incident.");
            return;
        }

        setLoading(true);
        try {
            const uploadedPhotoUrls: string[] = [];

            // Upload each photo individually
            for (const photoFile of photos) {
                const formData = new FormData();
                formData.append("file", photoFile);

                const uploadRes = await apiClient("/api/incidents/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error(`Erreur lors de l'upload de l'image ${photoFile.name}`);
                }

                const uploadJson = await uploadRes.json();
                uploadedPhotoUrls.push(uploadJson.url);
            }

            // Payload for incident creation
            const payload = {
                id_prestataire: prestataireId,
                id_type_incident: selectedTypeIncident,
                date_incident: dateIncident.toISOString(), // ISO string for backend
                commentaire,
                photos: uploadedPhotoUrls,
            };

            const res = await apiClient("/api/incidents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || "Erreur lors de la déclaration de l'incident");
            }

            toast.success("Incident déclaré avec succès.");
            onIncidentAdded();
            onClose();
        } catch (err) {
            console.error("Erreur incident:", err);
            toast.error(err instanceof Error ? err.message : "Erreur inconnue lors de la déclaration de l'incident.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-4xl bg-white p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b bg-gray-50 flex flex-row items-center justify-between space-y-0">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                            <AlertTriangle className="w-5 h-5 text-[#d61353]" />
                            Déclarer un Nouvel Incident
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 overflow-y-auto max-h-[80vh]">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Left Column: Form Details */}
                            <div className="space-y-4">
                                {/* Type Incident */}
                                <div className="space-y-1">
                                    <Label className="block text-sm font-medium text-gray-700">Type d&apos;Incident</Label>
                                    <Select
                                        value={selectedTypeIncident}
                                        onValueChange={(value) => {
                                            if (value === "__NEW__") {
                                                setIsAddTypeDialogOpen(true);
                                            } else {
                                                setSelectedTypeIncident(value);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full border rounded-lg p-2.5 bg-white">
                                            <SelectValue placeholder="Sélectionner un type d'incident" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__NEW__" className="font-bold text-blue-600">
                                                <PlusCircle className="mr-2 h-4 w-4 inline" /> Nouveau type d&apos;incident
                                            </SelectItem>
                                            {typesIncident.length > 0 && (
                                                <>
                                                    <Separator />
                                                    {typesIncident.map((type) => (
                                                        <SelectItem key={type.id_type_incident} value={type.id_type_incident}>
                                                            {type.nom}
                                                        </SelectItem>
                                                    ))}
                                                </>
                                            )}
                                            {typesIncident.length === 0 && (
                                                <SelectItem value="none" disabled>Aucun type existant</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date Incident */}
                                <div className="space-y-1">
                                    <Label className="block text-sm font-medium text-gray-700">Date de l&apos;Incident</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !dateIncident && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateIncident ? format(dateIncident, "PPP") : <span>Choisir une date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={dateIncident}
                                                onSelect={setDateIncident}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Commentaire */}
                                <div className="space-y-1">
                                    <Label className="block text-sm font-medium text-gray-700">Commentaire</Label>
                                    <Textarea
                                        rows={4}
                                        placeholder="Détails supplémentaires sur l'incident..."
                                        value={commentaire}
                                        onChange={(e) => setCommentaire(e.target.value)}
                                        className="w-full border rounded-lg p-2.5 resize-none focus:ring-2 focus:ring-black focus:border-black outline-none"
                                    />
                                </div>
                            </div>

                            {/* Right Column: Photo Evidence */}
                            <div className="flex flex-col space-y-1">
                                <Label className="block text-sm font-medium text-gray-700">Preuves Photos (Optionnel)</Label>

                                <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col relative min-h-[350px] p-2">
                                    {/* Photo input/capture controls */}
                                    <div className="flex justify-center gap-3 p-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                                        >
                                            <UploadCloud size={16} />
                                            Importer
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple // Allow multiple file selection
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="flex items-center gap-2 px-4 py-2 bg-black text-white shadow-sm rounded-lg hover:bg-gray-800 text-sm font-medium transition"
                                        >
                                            <Camera size={16} />
                                            Prendre photo
                                        </button>
                                    </div>

                                    {/* Camera View */}
                                    <div className={`flex-1 relative bg-black ${isCameraActive ? 'block' : 'hidden'} my-2 rounded-lg overflow-hidden`}>
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

                                    {/* Photo Previews */}
                                    <div className="flex flex-wrap gap-2 mt-2 max-h-[200px] overflow-y-auto">
                                        {previewUrls.map((url, index) => (
                                            <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                                <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhoto(index)}
                                                    className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {previewUrls.length === 0 && !isCameraActive && (
                                            <div className="flex flex-col items-center justify-center flex-grow p-4 text-center text-gray-500">
                                                <ImageIcon className="w-10 h-10 mb-2" />
                                                <p className="text-sm">Aucune photo ajoutée</p>
                                            </div>
                                        )}
                                    </div>
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
                            {loading ? "Déclaration en cours..." : "Déclarer l'Incident"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* The dialog for adding a new type */}
            <AddTypeIncidentDialog
                isOpen={isAddTypeDialogOpen}
                onClose={() => setIsAddTypeDialogOpen(false)}
                onTypeAdded={handleTypeAdded}
            />
        </>
    );
}