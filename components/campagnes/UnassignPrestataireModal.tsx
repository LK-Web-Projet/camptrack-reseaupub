"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface UnassignPrestataireModalProps {
  isOpen: boolean;
  onClose: () => void;
  prestataire: { id: string; nom: string; prenom: string } | null;
  onUnassigned: () => void;
  onUnassign: (id: string) => Promise<void>;
}

export default function UnassignPrestataireModal({
  isOpen,
  onClose,
  prestataire,
  onUnassigned,
  onUnassign,
}: UnassignPrestataireModalProps) {
  const [isUnassigning, setIsUnassigning] = useState(false);

  const handleUnassign = async () => {
    if (!prestataire) return;
    setIsUnassigning(true);
    try {
      await onUnassign(prestataire.id);
      onUnassigned();
      onClose();
    } catch (err) {
      // L'erreur sera gérée par le parent via toast
    } finally {
      setIsUnassigning(false);
    }
  };

  if (!isOpen || !prestataire) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-all duration-200"
        style={{ WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90%] max-w-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-600">Désassigner le prestataire</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-[#d61353] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="mb-6 text-center text-sm text-gray-700 dark:text-gray-300">
          Êtes-vous sûr de vouloir désassigner <strong>{prestataire.nom} {prestataire.prenom}</strong> <br />
          Cette action est irréversible.
        </p>
        <div className="flex justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isUnassigning}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleUnassign}
            disabled={isUnassigning}
            className="px-4 py-2 rounded-md bg-[#d61353] hover:bg-[#b01044] text-white disabled:opacity-50 transition"
          >
            {isUnassigning ? "Désassignation..." : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}
