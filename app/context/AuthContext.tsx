"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"

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
  token: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const router = useRouter()

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
      // Stocke tout dans le localStorage
      setUser(data.user)
      setToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      // Redirection selon le rôle
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

  const logout = () => {
    setUser(null)
    setToken(null)
    setRefreshToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
