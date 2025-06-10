"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Bot, MessageSquare, Settings, Home, LogOut, Shield, Menu, X } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { useTheme } from "@/components/theme-provider"
import { DynamicTitle } from "@/components/dynamic-title"
import { getAppVersion } from "@/lib/app-version"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [appVersion, setAppVersion] = useState("1.0.0")
  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/")
      return
    }
    setUser(currentUser)
    setLoading(false)

    // Carregar versão da aplicação
    getAppVersion().then(setAppVersion)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  const menuItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Gerenciar Usuários" },
    { href: "/admin/agents", icon: Bot, label: "Agentes IA" },
    { href: "/admin/whatsapp", icon: MessageSquare, label: "Conexões WhatsApp" },
    { href: "/admin/administration", icon: Shield, label: "Administração Avançada" },
    { href: "/admin/settings", icon: Settings, label: "Configurações" },
  ]

  return (
    <>
      <DynamicTitle suffix="Admin Panel" />
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <span className="text-sm font-bold">{theme.logoIcon}</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{theme.systemName}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 space-y-2">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Olá, {user?.full_name || "Administrador"}</p>
              </div>

              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{theme.systemName} Admin</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">v{appVersion}</div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between h-16 px-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Painel de Administração</h2>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">{children}</main>
        </div>
      </div>
    </>
  )
}
