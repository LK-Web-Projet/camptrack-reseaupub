"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Camera, Upload, X, Check, Image as ImageIcon, Plus } from "lucide-react";

interface Props {
  campagneId: string;
  initialPrestataireId?: string;
  onClose: () => void;
}

type Mode = 'LIST' | 'CREATE';

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

  // Photo State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputMoreRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    loadPrestataires();
    return () => { stopCamera(); };
  }, [campagneId, apiClient]);

  // Attacher le stream au video dès que la caméra devient active
  // Le <video> est toujours dans le DOM, donc videoRef est disponible
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => { });
    }
  }, [isCameraActive]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await apiClient(`/api/campagnes/${campagneId}/materiels-cases`);
      const json = await res.json();
      if (!res.ok) { console.error("Erreur API :", json); return; }
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
      if (res.ok) { setPrestataires(json.affectations || []); }
    } catch (err) {
      console.error("Erreur chargement prestataires :", err);
    }
  }

  // ─── Camera Logic ───────────────────────────────────────────────────────────

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      // useEffect va attacher le stream au video après le re-render
      setIsCameraActive(true);
    } catch (err) {
      console.error("Impossible d'accéder à la caméra", err);
      cameraInputRef.current?.click();
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
            const timestamp = Date.now();
            const file = new File([blob], `capture-${timestamp}.jpg`, { type: "image/jpeg" });
            addFile(file);
            // La caméra reste active → l'utilisateur peut continuer à capturer
          }
        }, 'image/jpeg', 0.85);
      }
    }
  };

  // ─── File Handling ───────────────────────────────────────────────────────────

  const addFile = (file: File) => {
    setSelectedFiles(prev => [...prev, file]);
    const url = URL.createObjectURL(file);
    setPreviewUrls(prev => [...prev, url]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => addFile(file));
      // Reset l'input pour pouvoir resélectionner les mêmes fichiers
      e.target.value = "";
    }
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllPhotos = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    stopCamera();
  };

  // ─── Submission ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrestataire || !nomMateriel) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setSubmitting(true);
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
          if (!uploadRes.ok) throw new Error("Erreur lors de l'upload d'une image");
          const uploadJson = await uploadRes.json();
          uploadedUrls.push(uploadJson.url);
        }
      }

      // 2. Créer l'enregistrement
      const payload = {
        id_campagne: campagneId,
        id_prestataire: selectedPrestataire,
        nom_materiel: nomMateriel,
        etat,
        description: description || null,
        photo_url: uploadedUrls[0] || null,
        preuve_media: uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null
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

      // Succès → retour liste
      resetForm();
      setMode('LIST');
      loadData();

    } catch (err) {
      console.error("Erreur soumission:", err);
      alert("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPrestataire(initialPrestataireId || "");
    setNomMateriel("");
    setEtat("BON");
    setDescription("");
    clearAllPhotos();
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
                        <p className="text-xs text-blue-600 font-semibold uppercase">Total</p>
                        <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                      </div>
                      <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 min-w-[100px]">
                        <p className="text-xs text-red-600 font-semibold uppercase">Mauvais</p>
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
                  materiels.map((item, index) => {
                    let photos: string[] = [];
                    if (item.preuve_media) {
                      try { photos = JSON.parse(item.preuve_media); } catch { if (item.photo_url) photos = [item.photo_url]; }
                    } else if (item.photo_url) {
                      photos = [item.photo_url];
                    }

                    return (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition bg-white flex flex-col md:flex-row gap-4">
                        {/* Thumbnail principal */}
                        <div className="w-full md:w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border">
                          {photos.length > 0 ? (
                            <div className="relative w-full h-full group">
                              <img src={photos[0]} alt="Preuve" className="w-full h-full object-cover" />
                              {photos.length > 1 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">+{photos.length - 1}</span>
                                </div>
                              )}
                            </div>
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

                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                              {item.description}
                            </p>
                          )}

                          {/* Strip de toutes les photos */}
                          {photos.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                              {photos.map((url, i) => (
                                <img
                                  key={i}
                                  src={url}
                                  alt="Preuve"
                                  className="w-16 h-16 object-cover rounded border hover:scale-105 transition cursor-pointer flex-shrink-0"
                                  onClick={() => window.open(url, '_blank')}
                                />
                              ))}
                            </div>
                          )}

                          {item.penalite_appliquer && (
                            <p className="text-xs text-red-600 font-medium mt-2">
                              Pénalité appliquée : {item.montant_penalite?.toLocaleString()} FCFA
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            // ─── CREATE FORM ────────────────────────────────────────────────
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">

                {/* Colonne gauche : Détails */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prestataire <span className="text-red-500">*</span></label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Matériel <span className="text-red-500">*</span></label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">État constaté <span className="text-red-500">*</span></label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observations <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-black focus:border-black outline-none resize-none"
                      placeholder="Détails supplémentaires sur l'état du matériel..."
                    />
                  </div>
                </div>

                {/* Colonne droite : Photos */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Preuves Photo
                      {selectedFiles.length > 0 && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                          {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </label>
                    {selectedFiles.length > 0 && !isCameraActive && (
                      <button
                        type="button"
                        onClick={clearAllPhotos}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition"
                      >
                        Tout effacer
                      </button>
                    )}
                  </div>

                  {/* Zone principale */}
                  <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden flex flex-col relative min-h-[300px]">

                    {/* ── État : Aucune photo + Caméra inactive → Écran d'accueil ── */}
                    {!selectedFiles.length && !isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-400 text-sm mb-5">Ajoutez des photos pour valider l&apos;état du matériel</p>

                        <div className="flex gap-3">
                          {/* Bouton Importer */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                          >
                            <Upload size={16} />
                            Importer
                          </button>

                          {/* Bouton Caméra */}
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
                        className="w-full h-full object-cover flex-1"
                        style={{ minHeight: '220px' }}
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Compteur de photos prises */}
                      {selectedFiles.length > 0 && (
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
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
                        {/* Bouton déclencheur */}
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="w-16 h-16 bg-white rounded-full shadow-xl hover:scale-105 transition flex items-center justify-center border-4 border-gray-200"
                          title="Prendre une photo"
                        >
                          <div className="w-11 h-11 bg-white rounded-full border-2 border-gray-300" />
                        </button>
                        {/* Placeholder visuel symétrique */}
                        <div className="w-10 h-10" />
                      </div>
                    </div>

                    {/* ── État : Photos existantes (caméra inactive) ── */}
                    {selectedFiles.length > 0 && !isCameraActive && (
                      <div className="flex-1 p-3 bg-white overflow-y-auto">
                        <div className="grid grid-cols-3 gap-2">
                          {previewUrls.map((url, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 group">
                              <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                              {/* Numéro de photo */}
                              <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                                #{index + 1}
                              </span>
                            </div>
                          ))}

                          {/* Bouton Ajouter (import) */}
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

                        {/* Barre d'actions sous la grille */}
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
                  {/* Input caméra native (fallback mobile) */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => { setMode('LIST'); resetForm(); }}
                  className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Enregistrement...
                    </span>
                  ) : (
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
