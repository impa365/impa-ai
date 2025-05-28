"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, MessageSquare, Download, Settings, Home, Bot, Cog, LogOut } from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import { useTheme } from "@/components/theme-provider"

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
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
    setLoading(false)
  }, [router])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  // Atualizar o sidebarItems para incluir Configurações
  const sidebarItems = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: Bot, label: "Agentes IA" },
    { icon: Cog, label: "Configurações" },
  ]

  const conversionChannels = [
    { name: "Agente Vendas", value: 35, percentage: 35.0, color: "bg-blue-500" },
    { name: "Agente Suporte", value: 28, percentage: 28.0, color: "bg-green-500" },
    { name: "Agente Marketing", value: 22, percentage: 22.0, color: "bg-purple-500" },
    { name: "Agente Geral", value: 15, percentage: 15.0, color: "bg-orange-500" },
  ]

  const agentMessages = [
    { name: "Processadas", value: 2847, percentage: 83.1, color: "bg-green-500" },
    { name: "Em Fila", value: 423, percentage: 12.3, color: "bg-orange-500" },
    { name: "Com Erro", value: 156, percentage: 4.6, color: "bg-red-500" },
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
            <span className="font-semibold text-lg">{theme?.systemName}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Olá, {user?.email}</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {/* Adicionar onClick handler para navegar para configurações */}
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.label === "Configurações" ? "/dashboard/settings" : "#"}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.active ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </a>
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
            <div>{theme?.systemName} Platform</div>
            <div>v1.0.0</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard do Usuário</h1>
              <p className="text-gray-600">Centro de controle dos seus agentes de IA</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar Relatório
              </Button>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Settings className="w-4 h-4" />
                Otimizar Agentes
              </Button>
            </div>
          </div>

          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Agentes Ativos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Agentes Ativos</CardTitle>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <div className="flex items-center gap-1 text-sm">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    +100%
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-2">Seus agentes pessoais</div>
              </CardContent>
            </Card>

            {/* ROI Total */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">ROI Total</CardTitle>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 12.5k</div>
                <div className="flex items-center gap-1 text-sm">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    +25%
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-2">Meta: R$ 15k</div>
              </CardContent>
            </Card>

            {/* Conversões */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Conversões</CardTitle>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">18.2%</div>
                <div className="text-xs text-gray-500 mb-3">Taxa de conversão</div>
              </CardContent>
            </Card>

            {/* Mensagens */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Mensagens</CardTitle>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">1,234</div>
                <div className="text-xs text-gray-500 mb-3">Processadas hoje</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance por Agente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Performance por Agente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionChannels.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                        <span className="text-sm font-medium">{channel.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{channel.value}</div>
                        <div className="text-xs text-gray-500">{channel.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status das Mensagens */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Status das Mensagens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentMessages.map((message, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${message.color}`}></div>
                        <span className="text-sm font-medium">{message.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{message.value.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{message.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
