"use client";

import { useState, useRef, useEffect } from "react";
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
import { Camera, Upload, X, Image as ImageIcon, RotateCcw, Save } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    campagneId: string;
    prestataireId: string;
    initialPhotoUrl?: string | null;
    onPhotoUpdated: () => void;
}

type CaptureMode = 'FILE' | 'CAMERA';

export default function UpdateCampaignPhotoModal({
    isOpen,
    onClose,
    campagneId,
    prestataireId,
    initialPhotoUrl,
    onPhotoUpdated
}: Props) {
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(false);

    // Photo State
    const [captureMode, setCaptureMode] = useState<CaptureMode>('FILE');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhotoUrl || null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Camera Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (isOpen) {
            setPreviewUrl(initialPhotoUrl || null);
            setSelectedFile(null);
            setCaptureMode('FILE');
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, initialPhotoUrl]);

    // --- Camera Logic ---
    const startCamera = async () => {
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
            console.error("Camera error:", err);
            toast.error("Impossible d'accéder à la caméra.");
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

    // --- File Logic ---
    const handleFileSelection = (file: File) => {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const resetPhoto = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        stopCamera();
        setCaptureMode('FILE');
    };

    // --- Submit ---
    const handleSubmit = async () => {
        if (!selectedFile && !previewUrl) {
            toast.warning("Aucune photo sélectionnée.");
            return;
        }

        setLoading(true);
        try {
            let finalPhotoUrl = previewUrl;

            // 1. Upload if new file
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const uploadRes = await apiClient("/api/campagnes/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Erreur upload photo");
                const uploadJson = await uploadRes.json();
                finalPhotoUrl = uploadJson.url;
            }

            // 2. Update Assignment
            const res = await apiClient(`/api/campagnes/${campagneId}/prestataires/${prestataireId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_affiche: finalPhotoUrl
                })
            });

            if (!res.ok) throw new Error("Erreur mise à jour campagne");

            toast.success("Photo enregistrée avec succès !");
            onPhotoUpdated();
            onClose();

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Photo de campagne
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Label>Photo du panneau installé</Label>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden flex flex-col relative min-h-[300px]">
                        {!previewUrl && !isCameraActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('campagne-photo-upload')?.click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                                    >
                                        <Upload size={16} />
                                        Importer
                                    </button>
                                    <input
                                        id="campagne-photo-upload"
                                        type="file"
                                        accept="image/*"
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
                                        Camera
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Camera */}
                        <div className={`flex-1 relative bg-black ${isCameraActive ? 'block' : 'hidden'}`}>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                <button type="button" onClick={stopCamera} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30">
                                    <X size={24} />
                                </button>
                                <button type="button" onClick={capturePhoto} className="p-4 bg-white rounded-full text-black shadow-lg hover:scale-105 transition">
                                    <Camera size={28} />
                                </button>
                            </div>
                        </div>

                        {/* Preview */}
                        {previewUrl && !isCameraActive && (
                            <div className="absolute inset-0 bg-black">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                <button
                                    type="button"
                                    onClick={resetPhoto}
                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? "Enregistrement..." : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Enregistrer
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
