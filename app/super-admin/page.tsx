"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Smartphone, Bot, Plus, Settings, Activity, TrendingUp } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import CompanyManagementPanel from "@/components/company-management-panel"
import { publicApi } from "@/lib/api-client"

interface DashboardStats {
  totalCompanies: number
  activeCompanies: number
  totalUsers: number
  totalConnections: number
  totalAgents: number
  totalInstances: number
}

export default function SuperAdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    totalUsers: 0,
    totalConnections: 0,
    totalAgents: 0,
    totalInstances: 0,
  })
  const [loading, setLoading] = useState(true)
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
    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const result = await publicApi.getSuperAdminDashboard()
      
      if (result.error) {
        console.error("Erro ao carregar dashboard:", result.error)
        return
      }

      setStats(result.data)
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Painel Super Admin
              </h1>
              <p className="text-gray-600">
                Gerenciamento global do sistema ImpaAI
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => router.push("/admin")}
              >
                <Settings className="w-4 h-4" />
                Painel Admin
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Total de Empresas
              </CardTitle>
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {stats.totalCompanies}
              </div>
              <div className="text-sm text-blue-600 mt-2">
                {stats.activeCompanies} ativas
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Total de Usuários
              </CardTitle>
              <div className="p-2 bg-green-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-green-600 mt-2">
                Em todas as empresas
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                Conexões WhatsApp
              </CardTitle>
              <div className="p-2 bg-purple-600 rounded-lg">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {stats.totalConnections}
              </div>
              <div className="text-sm text-purple-600 mt-2">
                Conexões ativas
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">
                Agentes IA
              </CardTitle>
              <div className="p-2 bg-orange-600 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {stats.totalAgents}
              </div>
              <div className="text-sm text-orange-600 mt-2">
                Agentes configurados
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-700">
                Instâncias
              </CardTitle>
              <div className="p-2 bg-pink-600 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-900">
                {stats.totalInstances}
              </div>
              <div className="text-sm text-pink-600 mt-2">
                Instâncias ativas
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">
                Crescimento
              </CardTitle>
              <div className="p-2 bg-indigo-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-900">+12%</div>
              <div className="text-sm text-indigo-600 mt-2">
                Últimos 30 dias
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Management Panel */}
        <CompanyManagementPanel onCompanyUpdate={loadDashboardData} />
      </div>
    </div>
  )
}
