"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/app/context/AuthContext";

interface Props {
  campagneId: string;
  onClose: () => void;
}

export default function VerificationMaterielleModal({
  campagneId,
  onClose,
}: Props) {
  const { apiClient } = useAuth();
  const [loading, setLoading] = useState(true);
  const [materiels, setMateriels] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [campagneInfo, setCampagneInfo] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
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

    loadData();
  }, [campagneId, apiClient]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl p-6 rounded-xl relative">

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-4">
          Vérification du matériel – {campagneInfo?.nom_campagne}
        </h2>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">En bon état</p>
              <p className="text-xl font-bold">{stats.etat_bon}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">État moyen</p>
              <p className="text-xl font-bold">{stats.etat_moyen}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Mauvais état</p>
              <p className="text-xl font-bold">{stats.etat_mauvais}</p>
            </div>
          </div>
        )}

        {/* Liste des matériels */}
        <div className="max-h-[300px] overflow-y-auto border rounded-lg p-3">
          {materiels.length === 0 ? (
            <p className="text-gray-500 text-center">Aucun matériel trouvé.</p>
          ) : (
            materiels.map((item, index) => (
              <div
                key={index}
                className="border-b py-2 flex justify-between items-start"
              >
                <div>
                  <p className="font-semibold">
                    {item.prestataire?.nom} {item.prestataire?.prenom}
                  </p>
                  <p className="text-sm text-gray-600">
                    État : <b>{item.etat}</b>
                  </p>
                  <p className="text-sm text-gray-600">
                    Panneau : {item.prestataire?.type_panneau} • Plaque :{" "}
                    {item.prestataire?.plaque}
                  </p>
                </div>

                <p className="text-sm font-medium">
                  {new Date(item.date_creation).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
