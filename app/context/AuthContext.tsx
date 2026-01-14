"use client"

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"

type User = {
  id_user: string
  nom: string
  prenom: string
  nom_utilisateur: string
  type_user: string
  email: string
  contact: string
  created_at?: string
  updated_at?: string
  is_active?: boolean
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkSession: () => Promise<string | null> // Modified to return token or null
  apiClient: (url: string, options?: RequestInit) => Promise<Response> // Added apiClient
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Fonction pour vérifier la session (Silent Refresh)
  const checkSession = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pas de body nécessaire, le cookie est envoyé automatiquement
      });

      if (res.ok) {
        const data = await res.json();
        // On stocke le token en mémoire pour les appels API
        setToken(data.accessToken);

        // On décode le token pour avoir les infos user minimales
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));

        setUser({
          id_user: payload.userId,
          email: payload.email,
          type_user: payload.role,
          nom: "", // Manquant dans le token
          prenom: "", // Manquant dans le token
          nom_utilisateur: "",
          contact: ""
        });
        return data.accessToken; // Return the new token
      } else {
        setUser(null);
        setToken(null);
        return null;
      }
    } catch {
      setUser(null);
      setToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialisation : Tenter de restaurer la session au chargement
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        return false
      }

      const data = await res.json()
      // L'endpoint login renvoie { success, user, accessToken, refreshToken }
      setUser(data.user)
      setToken(data.accessToken)

      // Redirection
      if (data.user.type_user === "ADMIN") {
        router.push("/dashboard/admin")
      } else {
        router.push("/") // Ou dashboard standard
      }
      return true
    } catch (e) {
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (e) {
      console.error("Logout error", e)
    } finally {
      setUser(null)
      setToken(null)
      router.push("/")
    }
  }

  // Client API qui injecte le token et gère le refresh automatique
  const apiClient = useCallback(async (url: string, options: RequestInit = {}) => {
    const currentToken = token;

    const headers = new Headers(options.headers || {});
    if (currentToken) {
      headers.set("Authorization", `Bearer ${currentToken}`);
    }

    let response = await fetch(url, { ...options, headers });

    // Si 401 Unauthorized, on tente un refresh
    if (response.status === 401) {
      const newToken = await checkSession(); // checkSession now returns the new token or null
      if (newToken) {
        // Retry avec le nouveau token
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(url, { ...options, headers });
      } else {
        // Refresh raté -> Logout
        logout();
        throw new Error("Session expirée ou rafraîchissement impossible.");
      }
    }

    return response;
  }, [token, logout, checkSession]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkSession, apiClient }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
