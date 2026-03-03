"use client";

import { useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";

interface EndAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    campagneId: string;
    prestataireId: string;
    prestataireName: string;
}

export default function EndAssignmentModal({
    isOpen,
    onClose,
    onSuccess,
    campagneId,
    prestataireId,
    prestataireName,
}: EndAssignmentModalProps) {
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await apiClient(
                `/api/campagnes/${campagneId}/desinstallation`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id_prestataire: prestataireId }),
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de la fin de mission");
            }

            toast.success(`Fin de mission enregistrée pour ${prestataireName}`);
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#d61353]" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Fin de Mission
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        Vous êtes sur le point d&apos;enregistrer la désinstallation pour{" "}
                        <strong>{prestataireName}</strong>. Cette action confirmera la fin
                        de leur mission et marquera la désinstallation comme effectuée.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-[#d61353] hover:bg-[#b01044] text-white transition text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        )}
                        {loading ? "Enregistrement..." : "Confirmer la fin de mission"}
                    </button>
                </div>
            </div>
        </div>
    );
}
