"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"

type User = {
  email: string
  role: "ADMIN" | "STAFF"
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  const login = (email: string, password: string) => {
    // fake login
    if (email === "admin@system.com" && password === "admin123") {
      setUser({ email, role: "ADMIN" })
      router.push("/dashboard/admin")
      return true
    } else if (email === "jean@mail.com" && password === "jean123") {
      setUser({ email, role: "STAFF" })
      router.push("/dashboard/staff")
      return true
    } else {
      return false
    }
  }

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
