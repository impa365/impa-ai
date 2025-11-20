"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Bot, Cog, LogOut, Smartphone, Sparkles, ChevronRight } from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import { useTheme } from "@/components/theme-provider"
import { DynamicTitle } from "@/components/dynamic-title"
import { getAppVersion } from "@/lib/app-version"
import { publicApi } from "@/lib/api-client"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [appVersion, setAppVersion] = useState("1.0.0")
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [permissions, setPermissions] = useState({
    can_access_agents: true,
    can_access_connections: true,
    hide_agents_menu: false,
    hide_connections_menu: false,
  })
  const router = useRouter()
  const pathname = usePathname()
  const { theme } = useTheme()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    if (currentUser.role === "admin") {
      router.push("/admin")
      return
    }
    setUser(currentUser)

    // Carregar permissões do usuário
    const loadPermissions = async () => {
      try {
        const response = await publicApi.getCurrentUser()
        if (response.data?.user) {
          const userData = response.data.user
          setPermissions({
            can_access_agents: userData.can_access_agents !== false,
            can_access_connections: userData.can_access_connections !== false,
            hide_agents_menu: userData.hide_agents_menu === true,
            hide_connections_menu: userData.hide_connections_menu === true,
          })
        }
      } catch (error) {
        console.error("Erro ao carregar permissões:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()

    // Carregar versão da aplicação
    getAppVersion().then(setAppVersion)
  }, [router])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const sidebarItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard", visible: true },
    { 
      icon: Bot, 
      label: "Agentes IA", 
      href: "/dashboard/agents", 
      active: pathname === "/dashboard/agents",
      visible: !permissions.hide_agents_menu
    },
    { 
      icon: Smartphone, 
      label: "WhatsApp", 
      href: "/dashboard/whatsapp", 
      active: pathname === "/dashboard/whatsapp",
      visible: !permissions.hide_connections_menu
    },
    { 
      icon: Cog, 
      label: "Configurações", 
      href: "/dashboard/settings", 
      active: pathname === "/dashboard/settings",
      visible: true,
      submenu: [
        { icon: Sparkles, label: "API Keys LLM", href: "/dashboard/settings/apikeysllm", active: pathname === "/dashboard/settings/apikeysllm" }
      ]
    },
  ].filter(item => item.visible)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <DynamicTitle suffix="Dashboard" />
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: theme?.primaryColor || "#2563eb" }}
              >
                {theme?.logoIcon === "🤖" ? (
                  <Bot className="w-5 h-5" />
                ) : (
                  <span className="text-lg">{theme?.logoIcon || "🤖"}</span>
                )}
              </div>
              <span className="font-semibold text-lg">{theme?.systemName || "Sistema AI"}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Olá, {user?.email}</p>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item, index) => (
                <li 
                  key={index}
                  onMouseEnter={() => item.submenu && setExpandedMenu(item.href)}
                  onMouseLeave={() => item.submenu && setExpandedMenu(null)}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 ${
                      item.active ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    {item.submenu && (
                      <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${
                        expandedMenu === item.href || pathname.startsWith(item.href) ? 'rotate-90' : ''
                      }`} />
                    )}
                  </Button>
                  
                  {/* Submenu */}
                  {item.submenu && (expandedMenu === item.href || pathname.startsWith(item.href)) && (
                    <ul className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                      {item.submenu.map((subItem: any, subIndex: number) => (
                        <li key={subIndex}>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start gap-2 text-sm ${
                              subItem.active
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                            onClick={() => router.push(subItem.href)}
                          >
                            <subItem.icon className="w-4 h-4" />
                            {subItem.label}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <Button variant="ghost" className="w-full justify-start gap-2 text-gray-600" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
            <div className="text-xs text-gray-500 mt-2">
              <div>{theme?.systemName || "Sistema AI"} Platform</div>
              <div>v{appVersion}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </>
  )
}
