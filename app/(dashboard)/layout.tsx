"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import DashboardHeader from "@/components/ui/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);


  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className={`transition-all duration-300 shrink-0 ${isSidebarOpen ? "w-64" : "w-16"}`}>
          <AppSidebar isOpen={isSidebarOpen}/>
        </div>

        {/* Zone principale : prend tout l'espace restant */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header (doit être full width du container) */}
          <div className="w-full">
            <DashboardHeader onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}/>
          </div>

          {/* Contenu principal : flex-1, w-full, min-w-0 pour éviter contraintes */}
          <main className="flex-1 w-full min-w-0 overflow-y-auto bg-transparent">
            {/* Important : éviter d'utiliser 'container' ou 'max-w-*' ici */}
            <div className="w-full h-full">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
