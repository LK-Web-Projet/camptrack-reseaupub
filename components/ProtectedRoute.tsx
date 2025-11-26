"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (user === null) {
      toast.info("Veuillez vous connecter avant d'accéder à cette page.");

      setTimeout(() => {
        router.replace("/");
      }, 900);

      return;
    }

    setVerified(true);
  }, [user, router]);

  if (!verified) return (
    <>
      {/* On affiche juste le container + rien d'autre */}
      <ToastContainer />
    </>
  );

  return (
    <>
      <ToastContainer />
      {children}
    </>
  );
}
