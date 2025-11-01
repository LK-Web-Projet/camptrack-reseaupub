"use client";

import { useState } from "react";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/common/NotificationDropdown";

export default function DashboardHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const user = {
    name: "Elcy Codjia",
    avatar: "/images/avatar.png",
  };

  return (
    <header className="flex items-center justify-between px-8 py-3 bg-white dark:bg-gray-800 border-b w-full shadow-sm">
      {/* ---- SECTION GAUCHE ---- */}
      <div className="flex items-center gap-6">
        {/* Bouton hamburger pour sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <span className="block w-5 h-0.5 bg-gray-800 dark:bg-white mb-1"></span>
          <span className="block w-5 h-0.5 bg-gray-800 dark:bg-white mb-1"></span>
          <span className="block w-5 h-0.5 bg-gray-800 dark:bg-white"></span>
        </button>

        {/* Logo ou titre */}
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Tableau de bord
        </h1>
      </div>

      {/* ---- SECTION CENTRALE ---- */}
      <div className="flex-1 flex justify-center">
        {/* (tu peux ajouter ici un champ de recherche ou autre plus tard) */}
      </div>

      {/* ---- SECTION DROITE ---- */}
      <div className="flex items-center gap-8 relative">
        {/* Thème */}
        <ThemeToggleButton />

        {/* Notifications */}
        <NotificationDropdown />

        {/* Utilisateur */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-gray-300 dark:border-gray-600"
            />
            <span className="font-medium hidden sm:block">{user.name}</span>
          </button>

          {/* Dropdown utilisateur */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              <ul className="py-2">
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                    Mon profil
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-red-500">
                    Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
