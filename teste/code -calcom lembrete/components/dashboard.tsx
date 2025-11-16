"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Webhook, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"

export function Dashboard() {
  const stats = [
    {
      label: "Agendamentos",
      value: "247",
      change: "+12%",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Webhooks Ativos",
      value: "12",
      change: "+3 semana",
      icon: Webhook,
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Lembretes Enviados",
      value: "1,247",
      change: "+847",
      icon: Clock,
      color: "from-orange-500 to-red-500",
    },
    {
      label: "Taxa de Sucesso",
      value: "99.8%",
      change: "+0.2%",
      icon: CheckCircle2,
      color: "from-emerald-500 to-teal-500",
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-2">Visão geral do seu sistema de lembretes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="p-6 hover:border-primary/50 transition-colors group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} opacity-20 flex items-center justify-center group-hover:opacity-30 transition-opacity`}
                >
                  <Icon className="w-6 h-6 text-foreground/70" />
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Atividade Recente</h3>

          <div className="space-y-4">
            {[
              { title: "Reunião com Cliente", time: "10:30 - Hoje", status: "enviado" },
              { title: "Revisão de Projeto", time: "14:00 - Hoje", status: "pendente" },
              { title: "Stand-up da Equipe", time: "09:00 - Hoje", status: "enviado" },
              { title: "Apresentação Q4", time: "16:00 - Amanhã", status: "agendado" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.time}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    item.status === "enviado"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.status === "pendente"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {item.status === "enviado" ? "✓ Enviado" : item.status === "pendente" ? "⏱ Pendente" : "⏰ Agendado"}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Alertas</h3>

          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900 text-sm">Taxa de erro elevada</p>
                <p className="text-xs text-yellow-700 mt-1">3 webhooks falharam nas últimas 24h</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900 text-sm">Sincronização completa</p>
                <p className="text-xs text-blue-700 mt-1">Últimas 4 horas - 100% de sucesso</p>
              </div>
            </div>
          </div>

          <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
            Ver Todos os Alertas
          </Button>
        </Card>
      </div>
    </div>
  )
}
