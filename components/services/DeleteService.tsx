"use client";

import { X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { useState } from "react";

export type Service = {
  id_service: string;
  nom: string;
  description: string | null;
  created_at: string;
};

interface DeleteServiceProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onServiceUpdated: () => void;
}

export default function DeleteService({ isOpen, onClose, service, onServiceUpdated }: DeleteServiceProps) {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!token || !service) {
      toast.error("Vous devez être connecté pour supprimer un service");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/services/${service.id_service}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de la suppression");
      }

      const data = await res.json();
      toast.success(data.message || "Service supprimé avec succès");
      onServiceUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression du service");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90%] max-w-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-600">Supprimer le service</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-[#d61353] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-6 text-center text-sm text-gray-700 dark:text-gray-300">
          Êtes-vous sûr de vouloir supprimer le service <strong>{service.nom}</strong> ?<br />
          Cette action est irréversible.
        </p>

        <div className="flex justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md bg-[#d61353] hover:bg-[#b01044] text-white disabled:opacity-50 transition"
          >
            {isDeleting ? "Suppression..." : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}
