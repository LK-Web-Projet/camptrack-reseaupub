"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"

type User = {
  email: string
  role: "ADMIN" | "STAFF"
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      // On suppose que l'API retourne un objet { user: { email, role }, token }
      setUser(data.user);
      // Stockage du token si besoin (localStorage, cookie, etc.)
      // localStorage.setItem('token', data.token);
      // Redirection selon le rôle
      if (data.user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (data.user.role === "STAFF") {
        router.push("/dashboard/staff");
      } else {
        router.push("/dashboard");
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
