"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (isLoading) return; // on attend la fin du chargement

    if (!user) {
      toast.info("Veuillez vous connecter avant d'accéder à cette page.");
      const timeout = setTimeout(() => {
        router.replace("/");
      }, 800);

      return () => clearTimeout(timeout);
    }

    // On valide après sécurisation du rendu
    setVerified(true);
  }, [isLoading, user, router]);

  // En attente = on n'affiche rien (évite un rendu inutile)
  if (isLoading || !verified) {
    return null;
  }

  return <>{children}</>;
}
