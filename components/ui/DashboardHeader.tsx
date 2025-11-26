"use client";

import { useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/common/NotificationDropdown";
import Link from "next/link";
async function logoutUser() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    document.cookie = "accessToken=; Max-Age=0; path=/;";
    document.cookie = "refreshToken=; Max-Age=0; path=/;";

    window.location.href = "/";

  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
  }
}


export default function DashboardHeader({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const user = {
    name: "",
    avatar: "/images/avatar.png",
  };

  return (
    <header className="flex items-center justify-between px-8 py-3 bg-white dark:bg-gray-800 border-b w-full shadow-sm">
      <div className="flex items-center gap-6">
        <button
          onClick={() => {
            if (isMobile) {
              setOpenMobile(!openMobile);
            } else {
              onToggleSidebar();
            }
          }}
          className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
          aria-label="Toggle Sidebar"
        >
          <svg
            width="16"
            height="12"
            viewBox="0 0 16 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 md:block hidden">
          Tableau de bord
        </h1>
      </div>

      <div className="flex-1 flex justify-center">
      </div>

      <div className="flex items-center gap-8 relative">
        <ThemeToggleButton />

        <NotificationDropdown />

        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-gray-300 dark:border-gray-600"
            />
            <span className="font-medium hidden sm:block">{user.name}</span>
          </button>

          {isUserMenuOpen && (
           <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
  <ul className="py-2">
    <li>
      <Link
        href="/dashboard/profil"
        className="w-full block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
      >
        Mon profil
      </Link>
    </li>

    <li>
     <button
          onClick={logoutUser}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-red-500"
        >
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
