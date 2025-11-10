"use client";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";

export default function DetailCampagnePage() {
  const { id } = useParams();

  // ✅ Données MOCKÉES pour l’instant (front only)
  const campagne = {
    id_campagne: id,
    nom_campagne: "Campagne Affichage 2025",
    description: "Grande campagne publicitaire sur plusieurs zones.",
    objectif: "Atteindre 1M de vues",
    type_campagne: "Marketing digital",
    date_debut: "2025-01-15",
    date_fin: "2025-02-15",
    date_creation: "2024-12-01",
    status: "PLANIFIEE",
    updated_at: "2025-01-10",

    // ✅ Infos relations mockées
    client: {
      nom: "Client Example",
      email: "client@example.com",
      contact: "+229 98 98 98 98",
    },
    lieu: {
      nom: "Cotonou Akpakpa",
      ville: "Cotonou",
    },
    gestionnaire: {
      nom: "John Doe",
      email: "john@gestion.com",
    },
    service: {
      nom_service: "Distribution flyers",
      quantite: 5000,
      prix_unitaire: 50,
    },
  };

  return (
    <div className="p-6">
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-[#d61353]">
      Détails de la campagne
    </h1>

    <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#d61353] text-white hover:bg-[#b01044] transition">
      <Plus className="w-4 h-4" />
      Ajouter une liste de prestataires
    </button>
  </div>

      {/* ✅ Informations principales */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Informations générales</h2>

       <div className="space-y-4 text-sm">

  {/* ✅ Informations principales */}
  <div className="space-y-2">
    <p><strong>ID :</strong> {campagne.id_campagne}</p>
    <p><strong>Nom :</strong> {campagne.nom_campagne}</p>
    <p><strong>Description :</strong> {campagne.description}</p>
    <p><strong>Objectif :</strong> {campagne.objectif}</p>
    <p><strong>Type :</strong> {campagne.type_campagne}</p>
    <p><strong>Date début :</strong> {campagne.date_debut}</p>
    <p><strong>Date fin :</strong> {campagne.date_fin}</p>
    <p><strong>Status :</strong> {campagne.status}</p>
  </div>
    <h3 className="text-md font-bold mb-2">Fichiers:</h3>
    <input
      type="file"
      accept=".pdf,.doc,.docx,image/*"
      multiple
      className="block w-full text-sm text-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer p-2"
    />

   


</div>

      </div>
   

      {/* ✅ Client */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Client</h2>
        <p><strong>Nom :</strong> {campagne.client.nom}</p>
        <p><strong>Email :</strong> {campagne.client.email}</p>
        <p><strong>Contact :</strong> {campagne.client.contact}</p>
      </div>

      {/* ✅ Lieu */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Lieu</h2>
        <p><strong>Lieu :</strong> {campagne.lieu.nom}</p>
        <p><strong>Ville :</strong> {campagne.lieu.ville}</p>
      </div>

      {/* ✅ Gestionnaire */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Gestionnaire</h2>
        <p><strong>Nom :</strong> {campagne.gestionnaire.nom}</p>
        <p><strong>Email :</strong> {campagne.gestionnaire.email}</p>
      </div>

      {/* ✅ Service */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Service</h2>
        <p><strong>Service :</strong> {campagne.service.nom_service}</p>
        <p><strong>Quantité :</strong> {campagne.service.quantite}</p>
        <p><strong>Prix unitaire :</strong> {campagne.service.prix_unitaire} FCFA</p>
      </div>
    </div>
  );
}
