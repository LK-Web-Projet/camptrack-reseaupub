"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import DashboardHeader from "@/components/ui/DashboardHeader"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AppSidebar className={`${isSidebarOpen ? "w-64" : "w-16"} transition-all duration-300`} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header prend toute la largeur restante */}
        <DashboardHeader onToggleSidebar={handleToggleSidebar} />

        {/* Contenu principal */}
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
