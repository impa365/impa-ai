"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Building2,
  Users,
  Server,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    if (currentUser.role !== "super_admin") {
      router.push("/dashboard")
      return
    }
    setUser(currentUser)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    document.cookie = "impaai_user_client=; max-age=0; path=/"
    router.push("/")
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/super-admin",
      icon: LayoutDashboard,
      current: pathname === "/super-admin",
    },
    {
      name: "Empresas",
      href: "/super-admin/empresas",
      icon: Building2,
      current: pathname === "/super-admin/empresas",
    },
    {
      name: "Usuários",
      href: "/super-admin/usuarios",
      icon: Users,
      current: pathname === "/super-admin/usuarios",
    },
    {
      name: "Servidores",
      href: "/super-admin/servidores",
      icon: Server,
      current: pathname === "/super-admin/servidores",
    },
  ]

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SA</span>
          </div>
          <span className="font-semibold text-gray-900">Super Admin</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">SA</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Super Admin</h1>
                <p className="text-xs text-gray-500">ImpaAI Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href)
                    setSidebarOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${
                      item.current
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </button>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.full_name?.charAt(0) || "S"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => router.push("/admin")}
            >
              <Settings className="w-4 h-4" />
              Painel Admin
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
