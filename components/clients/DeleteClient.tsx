"use client";

import React from "react";
import { X } from "lucide-react";
import { Client } from "./AddClient";

interface DeleteProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onDeleteClient: (id_client: string) => void;
}

export default function DeleteClientModal({ isOpen, onClose, client, onDeleteClient }: DeleteProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 text-center">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-600">Supprimer le client</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-4">Êtes-vous sûr de vouloir supprimer <strong>{client?.nom} {client?.prenom}</strong> ? Cette action est irréversible.</p>

        <div className="flex justify-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Annuler</button>
          <button
            onClick={() => client && onDeleteClient(client.id_client)}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
