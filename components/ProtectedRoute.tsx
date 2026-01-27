"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // on attend la fin du chargement

    if (!user) {
      toast.info("Veuillez vous connecter avant d'accéder à cette page.");
      const timeout = setTimeout(() => {
        router.replace("/");
      }, 800);

      return () => clearTimeout(timeout);
    }
  }, [isLoading, user, router]);

  // En attente = on n'affiche rien (évite un rendu inutile)
  if (isLoading || !user) {
    return null;
  }

  return <>{children}</>;
}
