"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteAppelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteAppelModal({ isOpen, onClose, onConfirm }: DeleteAppelModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-red-600">Supprimer l&apos;appel</h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-red-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl mb-6">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                        Êtes-vous sûr de vouloir supprimer cet appel ? Cette action est irréversible.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                        Annuler
                    </button>
                    <Button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                    >
                        Supprimer
                    </Button>
                </div>
            </div>
        </div>
    );
}
