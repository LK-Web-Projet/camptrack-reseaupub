"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import StatsCards from "@/components/dashboard/StatsCards";
import PrestatairesStats from "@/components/dashboard/PrestatairesStats";
import CampagnesStatus from "@/components/dashboard/CampagnesStatus";

export interface DashboardStats {
    counts: {
        users: number;
        clients: number;
        campagnes: number;
        prestataires: number;
        lieux: number;
        services: number;
    };
    campagnes: {
        parStatus: Record<string, number>;
    };
    prestataires: {
        total: number;
        disponibles: number;
        indisponibles: number;
    };
}

export default function DashboardPage() {
    const { apiClient } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        apiClient("/api/statistiques")
            .then((res) => res.json())
            .then(setStats)
            .catch(() => toast.error("Erreur chargement dashboard"));
    }, [apiClient]);

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
                <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
                    Chargement du tableau de bord...
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 text-black dark:text-white bg-white dark:bg-gray-900">
            {/* HERO */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#d61353]">
                    Bienvenue Admin
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                    Voici un aperçu global de la plateforme
                </p>
            </div>


            <StatsCards counts={stats.counts} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PrestatairesStats prestataires={stats.prestataires} />
                <CampagnesStatus parStatus={stats.campagnes.parStatus} />
            </div>
        </div>
    );
}
