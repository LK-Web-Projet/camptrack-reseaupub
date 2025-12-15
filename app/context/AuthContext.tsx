"use client"

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode, JwtPayload } from "jwt-decode";

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

// Étendre le type pour inclure la nouvelle fonction apiClient
type AuthContextType = {
  user: User | null
  token: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  apiClient: (url: string, options?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const router = useRouter()

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setRefreshToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    router.push("/")
  }, [router])

  // Restaure l'état depuis le localStorage au chargement
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("accessToken")
    const storedRefresh = localStorage.getItem("refreshToken")
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
      setRefreshToken(storedRefresh || null)
    }
  }, [])

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
      setUser(data.user)
      setToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      
      if (data.user.type_user === "ADMIN") {
        router.push("/dashboard/admin")
      } else {
        router.push("/")
      }
      return true
    } catch (e) {
      return false
    }
  }

  const refreshAuthToken = useCallback(async (currentRefreshToken: string) => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!res.ok) {
        throw new Error("Refresh failed");
      }

      const data = await res.json();
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken;
    } catch (error) {
      logout();
      return null;
    }
  }, [logout]);
  
  const apiClient = useCallback(async (url: string, options: RequestInit = {}) => {
    let currentToken = token;
  
    if (currentToken) {
      const decodedToken = jwtDecode<JwtPayload>(currentToken);
      // Refresh 60 seconds before expiry
      const isExpired = decodedToken.exp! * 1000 < Date.now() + 60000;
  
      if (isExpired) {
        if (refreshToken) {
          const newAccessToken = await refreshAuthToken(refreshToken);
          if (newAccessToken) {
            currentToken = newAccessToken;
          } else {
            // Refresh failed, logout was called, stop the request
            throw new Error("Session expired. Please log in again.");
          }
        } else {
          logout();
          throw new Error("Session expired. Please log in again.");
        }
      }
    }
  
    const headers = new Headers(options.headers || {});
    if (currentToken) {
      headers.set("Authorization", `Bearer ${currentToken}`);
    }
  
    const response = await fetch(url, { ...options, headers });
  
    if (response.status === 401) {
      // If we get a 401 even after a potential refresh, it's a definitive logout.
      logout();
      throw new Error("Unauthorized");
    }
  
    return response;
  }, [token, refreshToken, logout, refreshAuthToken]);
  

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, logout, apiClient }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
