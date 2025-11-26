"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import DashboardHeader from "@/components/ui/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
          {/* Sidebar */}
          <div className={`transition-all duration-300 shrink-0 hidden md:block ${isSidebarOpen ? "w-64" : "w-16"}`}>
            <AppSidebar isOpen={isSidebarOpen} />
          </div>

          {/* Main section */}
          <div className="flex-1 min-w-0 flex flex-col w-full">
            <div className="w-full">
              <DashboardHeader onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
            </div>

            <main className="flex-1 w-full min-w-0 overflow-y-auto bg-transparent">
              <div className="w-full h-full">{children}</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
