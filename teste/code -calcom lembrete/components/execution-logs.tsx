"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, Download, Filter, CheckCircle2, AlertCircle, Clock } from "lucide-react"

interface Log {
  id: string
  trigger: string
  status: "success" | "failed" | "pending"
  timestamp: string
  details: string
}

export function ExecutionLogs() {
  const [logs] = useState<Log[]>([
    {
      id: "1",
      trigger: "Lembrete 1 hora antes",
      status: "success",
      timestamp: "2024-01-15 10:32:45",
      details: "Webhook enviado com sucesso para https://api.example.com/reminders",
    },
    {
      id: "2",
      trigger: "Lembrete 15 minutos antes",
      status: "success",
      timestamp: "2024-01-15 10:28:12",
      details: "Email enviado para 3 participantes",
    },
    {
      id: "3",
      trigger: "Lembrete 1 hora antes",
      status: "failed",
      timestamp: "2024-01-15 10:15:33",
      details: "Erro de conexão: Timeout na requisição para o webhook",
    },
    {
      id: "4",
      trigger: "Lembrete 15 minutos antes",
      status: "pending",
      timestamp: "2024-01-15 10:05:20",
      details: "Agendado para próxima execução",
    },
  ])

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-emerald-100 text-emerald-700"
      case "failed":
        return "bg-red-100 text-red-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4" />
      case "failed":
        return <AlertCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Execuções</h2>
          <p className="text-muted-foreground mt-2">Histórico de lembretes enviados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filtrar
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <Card
            key={log.id}
            className="hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}
                >
                  {getStatusIcon(log.status)}
                  {log.status.toUpperCase()}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-foreground">{log.trigger}</p>
                  <p className="text-xs text-muted-foreground mt-1">{log.timestamp}</p>
                </div>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === log.id ? "rotate-180" : ""}`}
              />
            </div>

            {expandedId === log.id && (
              <div className="p-4 bg-card border-t border-border">
                <p className="text-sm text-foreground bg-card border border-border rounded p-3 font-mono">
                  {log.details}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
