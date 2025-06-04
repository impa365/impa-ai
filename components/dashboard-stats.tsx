"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, MessageSquare, Smartphone, TrendingUp, Plus, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface DashboardStats {
  totalAgents: number
  activeAgents: number
  totalConnections: number
  activeConnections: number
  totalMessages: number
  todayMessages: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalConnections: 0,
    activeConnections: 0,
    totalMessages: 0,
    todayMessages: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) return

      // Buscar estatísticas dos agentes
      const { data: agents } = await supabase.from("ai_agents").select("status").eq("user_id", currentUser.id)

      // Buscar estatísticas das conexões WhatsApp
      const { data: connections } = await supabase
        .from("whatsapp_connections")
        .select("status")
        .eq("user_id", currentUser.id)

      // Simular estatísticas de mensagens (você pode implementar uma tabela de logs depois)
      const totalMessages = Math.floor(Math.random() * 1000) + 50
      const todayMessages = Math.floor(Math.random() * 50) + 5

      setStats({
        totalAgents: agents?.length || 0,
        activeAgents: agents?.filter((a) => a.status === "active").length || 0,
        totalConnections: connections?.length || 0,
        activeConnections: connections?.filter((c) => c.status === "connected").length || 0,
        totalMessages,
        todayMessages,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Agentes de IA",
      value: stats.totalAgents,
      description: `${stats.activeAgents} ativos`,
      icon: <Bot className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      action: () => router.push("/dashboard/agents"),
    },
    {
      title: "Conexões WhatsApp",
      value: stats.totalConnections,
      description: `${stats.activeConnections} conectadas`,
      icon: <Smartphone className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
      action: () => router.push("/dashboard/whatsapp"),
    },
    {
      title: "Mensagens Hoje",
      value: stats.todayMessages,
      description: `${stats.totalMessages} total`,
      icon: <MessageSquare className="w-5 h-5" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      action: () => router.push("/dashboard/agents"),
    },
    {
      title: "Performance",
      value: "98%",
      description: "Taxa de resposta",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      action: () => router.push("/dashboard/agents"),
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={card.action}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <div className={card.color}>{card.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ações Rápidas */}
      {stats.totalAgents === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-8 text-center">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum agente criado ainda</h3>
            <p className="text-gray-600 mb-6">Crie seu primeiro agente de IA para começar a automatizar seu WhatsApp</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/dashboard/whatsapp")} variant="outline">
                <Smartphone className="w-4 h-4 mr-2" />
                Conectar WhatsApp
              </Button>
              <Button onClick={() => router.push("/dashboard/agents")} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Agente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos Passos */}
      {stats.totalAgents > 0 && stats.totalConnections > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Próximos Passos
            </CardTitle>
            <CardDescription>Sugestões para otimizar sua experiência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Configurar respostas por voz</p>
                <p className="text-sm text-blue-700">Adicione áudio às respostas da sua IA</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/agents")}>
                Configurar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-900">Integrar com calendário</p>
                <p className="text-sm text-green-700">Permita agendamentos automáticos</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/agents")}>
                Integrar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
