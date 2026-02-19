import React from "react"
import { Button } from "@/components/ui/button"

interface DeletePhotoModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

const DeletePhotoModal: React.FC<DeletePhotoModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90%] max-w-xs p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-4 text-[#d61353]">Confirmer la suppression</h3>
                <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">Voulez-vous vraiment supprimer cette photo ? Cette action est irréversible.</p>
                <div className="flex justify-end gap-3">
                    <Button onClick={onClose} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Annuler</Button>
                    <Button onClick={onConfirm} className="bg-[#d61353] text-white hover:bg-[#b01044]">Supprimer</Button>
                </div>
            </div>
        </div>
    )
}

export default DeletePhotoModal
