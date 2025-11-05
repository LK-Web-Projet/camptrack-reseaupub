"use client";

import React from "react";
import { X, Trash2 } from "lucide-react";

type Service = {
  id_service: string;
  nom: string;
  description: string | null;
  created_at: string;
};

interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onConfirm: (serviceId: string) => void;
}

export default function DeleteServiceModal({ isOpen, onClose, service, onConfirm }: DeleteServiceModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Supprimer le service</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <p className="mb-6">Êtes-vous sûr de vouloir supprimer le service <strong>{service?.nom}</strong> ? Cette action est irréversible.</p>

       
          <div className="flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Annuler
          </button>
          <button
              onClick={() => {
              if (service) onConfirm(service.id_service);
              onClose();
            }}            className="px-4 py-2 rounded-md bg-[#d61353] hover:bg-[#b01044] text-white"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
