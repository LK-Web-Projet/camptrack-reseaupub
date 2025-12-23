"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Camera, Upload, X, Check, Image as ImageIcon, RotateCcw } from "lucide-react";

interface Props {
  campagneId: string;
  initialPrestataireId?: string;
  onClose: () => void;
}

type Mode = 'LIST' | 'CREATE';
type CaptureMode = 'FILE' | 'CAMERA';

export default function VerificationMaterielleModal({
  campagneId,
  initialPrestataireId,
  onClose,
}: Props) {
  const { apiClient } = useAuth();
  const [mode, setMode] = useState<Mode>(initialPrestataireId ? 'CREATE' : 'LIST');
  const [loading, setLoading] = useState(true);

  // Data State
  const [materiels, setMateriels] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [campagneInfo, setCampagneInfo] = useState<any>(null);
  const [prestataires, setPrestataires] = useState<any[]>([]);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [selectedPrestataire, setSelectedPrestataire] = useState(initialPrestataireId || "");
  const [nomMateriel, setNomMateriel] = useState("");
  const [etat, setEtat] = useState<"BON" | "MOYEN" | "MAUVAIS">("BON");
  const [description, setDescription] = useState("");

  // Photo Capture State
  const [captureMode, setCaptureMode] = useState<CaptureMode>('FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadData();
    loadPrestataires();

    return () => {
      stopCamera();
    };
  }, [campagneId, apiClient]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await apiClient(`/api/campagnes/${campagneId}/materiels-cases`);
      const json = await res.json();

      if (!res.ok) {
        console.error("Erreur API :", json);
        return;
      }

      setMateriels(json.materiels_cases);
      setStats(json.statistiques);
      setCampagneInfo(json.campagne);
    } catch (err) {
      console.error("Erreur réseau :", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPrestataires() {
    try {
      const res = await apiClient(`/api/campagnes/${campagneId}/prestataires`);
      const json = await res.json();
      if (res.ok) {
        setPrestataires(json.affectations || []);
      }
    } catch (err) {
      console.error("Erreur chargement prestataires :", err);
    }
  }

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
      console.error("Impossible d'accéder à la caméra", err);
      alert("Impossible d'accéder à la caméra. Veuillez vérifier les autorisations.");
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

  const handleResetPhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (captureMode === 'CAMERA') {
      startCamera();
    }
  };

  // --- Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrestataire || !nomMateriel) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setSubmitting(true);
      let photoUrl = "";

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

      // 2. Create Record
      const payload = {
        id_campagne: campagneId,
        id_prestataire: selectedPrestataire,
        nom_materiel: nomMateriel,
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
        const err = await res.json();
        console.error(err);
        alert(`Erreur: ${err.message || "Impossible d'enregistrer"}`);
        return;
      }

      // Success
      setMode('LIST');
      resetForm();
      loadData(); // Refresh list

    } catch (err) {
      console.error("Erreur soumission:", err);
      alert("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPrestataire("");
    setNomMateriel("");
    setEtat("BON");
    setDescription("");
    setSelectedFile(null);
    setPreviewUrl(null);
    stopCamera();
  };

  if (loading && mode === 'LIST' && materiels.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl flex flex-col relative overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {mode === 'LIST'
              ? `Vérification du matériel – ${campagneInfo?.nom_campagne || ''}`
              : "Nouvelle Vérification"
            }
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {mode === 'LIST' ? (
            <>
              {/* Stats & Actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  {stats && (
                    <>
                      <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 min-w-[100px]">
                        <p className="text-xs text-uppercase text-blue-600 font-semibold">Total</p>
                        <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                      </div>
                      <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 min-w-[100px]">
                        <p className="text-xs text-uppercase text-red-600 font-semibold">Mauvais</p>
                        <p className="text-2xl font-bold text-red-800">{stats.etat_mauvais}</p>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setMode('CREATE')}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-sm whitespace-nowrap"
                >
                  + Nouvelle Vérification
                </button>
              </div>

              {/* List */}
              <div className="space-y-3">
                {materiels.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">Aucun matériel vérifié pour le moment.</p>
                  </div>
                ) : (
                  materiels.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition bg-white flex flex-col md:flex-row gap-4">
                      {/* Image Thumbnail */}
                      <div className="w-full md:w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border">
                        {item.photo_url ? (
                          <img src={item.photo_url} alt="Preuve" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.nom_materiel}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.prestataire?.nom} {item.prestataire?.prenom}
                              <span className="mx-2">•</span>
                              {item.prestataire?.plaque || 'Sans plaque'}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.etat === 'BON' ? 'bg-green-100 text-green-700' :
                            item.etat === 'MOYEN' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                            {item.etat}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                          {item.description || "Aucune observation."}
                        </p>
                        {item.penalite_appliquer && (
                          <p className="text-xs text-red-600 font-medium mt-1">
                            Pénalité: {item.montant_penalite.toLocaleString()} FCFA
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            // --- CREATE FORM ---
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column: Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prestataire</label>
                    <select
                      required
                      value={selectedPrestataire}
                      onChange={(e) => setSelectedPrestataire(e.target.value)}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
                    >
                      <option value="">Sélectionner un prestataire</option>
                      {prestataires?.map((p: any) => (
                        <option key={p.prestataire.id_prestataire} value={p.prestataire.id_prestataire}>
                          {p.prestataire.nom} {p.prestataire.prenom} ({p.prestataire.plaque || 'Sans plaque'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Matériel</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Panneau Publicitaire G12"
                      value={nomMateriel}
                      onChange={(e) => setNomMateriel(e.target.value)}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-black focus:border-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">État constaté</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['BON', 'MOYEN', 'MAUVAIS'] as const).map((e) => (
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-black focus:border-black outline-none resize-none"
                      placeholder="Détails supplémentaires..."
                    />
                  </div>
                </div>

                {/* Right Column: Photo Evidence */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preuve Photo</label>

                  <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden flex flex-col relative min-h-[300px]">

                    {!previewUrl && !isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm mb-4">Ajoutez une photo pour valider l'état</p>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                          >
                            <Upload size={16} />
                            Importer
                          </button>
                          <input
                            id="file-upload"
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
                            Prendre Photo
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
                          onClick={handleResetPhoto}
                          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                        >
                          <RotateCcw size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LIST');
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enregistrement...' : (
                    <>
                      <Check size={18} />
                      Valider la vérification
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
