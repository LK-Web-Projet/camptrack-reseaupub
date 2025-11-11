"use client";

import { X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { useState } from "react";

export type Lieu = {
  id_lieu: string;
  nom: string;
  ville: string;
  created_at: string;
};

interface DeleteLieuProps {
  isOpen: boolean;
  onClose: () => void;
  lieu: Lieu | null;
  onLieuUpdated: () => void;
}

export default function DeleteLieu({ isOpen, onClose, lieu, onLieuUpdated }: DeleteLieuProps) {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!token || !lieu) {
      toast.error("Vous devez être connecté pour supprimer un lieu");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/lieux/${lieu.id_lieu}`, {
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
      toast.success(data.message || "Lieu supprimé avec succès");
                      window.location.href = "/dashboard/lieux";  

      onLieuUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression du lieu");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !lieu) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90%] max-w-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-600">Supprimer le lieu</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-[#d61353] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-6 text-center text-sm text-gray-700 dark:text-gray-300">
          Êtes-vous sûr de vouloir supprimer le lieu <strong>{lieu.nom}</strong> ?<br />
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
