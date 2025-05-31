"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface AgentStatsProps {
  agentId: string
}

export default function AgentStats({ agentId }: AgentStatsProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalInteractions: 0,
    averageResponseTime: 0,
    successRate: 0,
    dailyInteractions: [],
    interactionTypes: [],
    topQuestions: [],
  })

  useEffect(() => {
    fetchStats()
  }, [agentId])

  const fetchStats = async () => {
    setLoading(true)
    try {
      // Em um ambiente real, você buscaria esses dados do banco
      // Por enquanto, vamos simular alguns dados para demonstração

      // Simulação de dados diários
      const dailyData = []
      const now = new Date()
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        dailyData.push({
          date: date.toISOString().split("T")[0],
          interactions: Math.floor(Math.random() * 50) + 10,
          successfulInteractions: Math.floor(Math.random() * 40) + 5,
        })
      }

      // Simulação de tipos de interação
      const interactionTypes = [
        { name: "Perguntas", value: 65 },
        { name: "Comandos", value: 15 },
        { name: "Agendamentos", value: 10 },
        { name: "Outros", value: 10 },
      ]

      // Simulação de perguntas mais frequentes
      const topQuestions = [
        { question: "Como posso agendar uma consulta?", count: 42 },
        { question: "Quais são os horários de atendimento?", count: 38 },
        { question: "Qual o endereço da loja?", count: 27 },
        { question: "Como faço para cancelar um pedido?", count: 23 },
        { question: "Quais formas de pagamento são aceitas?", count: 19 },
      ]

      setStats({
        totalInteractions: 1247,
        averageResponseTime: 1.8,
        successRate: 92,
        dailyInteractions: dailyData,
        interactionTypes,
        topQuestions,
      })
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Interações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInteractions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime}s</div>
            <p className="text-xs text-muted-foreground">-0.3s em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">+2% em relação ao mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily">Interações Diárias</TabsTrigger>
          <TabsTrigger value="types">Tipos de Interação</TabsTrigger>
          <TabsTrigger value="questions">Perguntas Frequentes</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Interações Diárias</CardTitle>
              <CardDescription>Número de interações nos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.dailyInteractions}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="interactions"
                      name="Total de Interações"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="successfulInteractions"
                      name="Interações com Sucesso"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="types" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Interação</CardTitle>
              <CardDescription>Distribuição dos tipos de interação com o agente</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.interactionTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.interactionTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="questions" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Mais Frequentes</CardTitle>
              <CardDescription>Top 5 perguntas mais feitas ao agente</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.topQuestions}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="question" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Quantidade" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
