import AppelTable from "@/components/appels/AppelTable";
import { Suspense } from "react";

export const metadata = {
    title: "Gestion des appels | CampTrack",
    description: "Historique et gestion des appels aux prestataires",
};

export default function AppelsPage() {
    return (
        <Suspense fallback={<div className="p-6 text-gray-500">Chargement...</div>}>
            <AppelTable />
        </Suspense>
    );
}
