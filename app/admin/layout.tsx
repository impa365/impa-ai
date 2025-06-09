"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Users, Bot, Smartphone, Shield, Cog, LogOut } from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import { useTheme } from "@/components/theme-provider"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { theme } = useTheme()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    if (currentUser.role !== "admin") {
      router.push("/dashboard")
      return
    }
    setUser(currentUser)
    setLoading(false)
  }, [router])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const sidebarItems = [
    { icon: Home, label: "Dashboard", href: "/admin", active: pathname === "/admin" },
    { icon: Users, label: "Gerenciar Usuários", href: "/admin/users", active: pathname === "/admin/users" },
    { icon: Bot, label: "Agentes IA", href: "/admin/agents", active: pathname === "/admin/agents" },
    {
      icon: Smartphone,
      label: "Conexões WhatsApp",
      href: "/admin/whatsapp",
      active: pathname === "/admin/whatsapp",
    },
    {
      icon: Shield,
      label: "Administração",
      href: "/admin/administration",
      active: pathname === "/admin/administration",
    },
    { icon: Cog, label: "Configurações", href: "/admin/settings", active: pathname === "/admin/settings" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <span className="text-white">{theme.logoIcon}</span>
            </div>
            <span className="font-semibold text-lg text-gray-900">Admin Panel</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Olá, {user?.full_name}</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${
                    item.active ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100" : ""
                  }`}
                  onClick={() => router.push(item.href)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
          <div className="text-xs text-gray-500 mt-2">
            <div>{theme.systemName} Admin</div>
            <div>v1.0.0</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      </div>
    </div>
  )
}
