"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, RefreshCw } from "lucide-react"

export function Integration() {
  const [isConnected, setIsConnected] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSyncing(false)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Integração Cal.com</h2>
        <p className="text-muted-foreground mt-2">Conecte e sincronize seus agendamentos</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Connection Status */}
        <Card className="p-6 border-2 border-emerald-200 bg-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Conectado</p>
                <p className="text-sm text-emerald-700">API Key válida e sincronização ativa</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
              className="border-emerald-200 hover:bg-emerald-100 bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
            </Button>
          </div>
        </Card>

        {/* API Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Detalhes da API</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">URL da API</label>
              <div className="mt-2 p-3 bg-card border border-border rounded-lg font-mono text-sm text-foreground break-all">
                https://api.cal.com/v2/
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Endpoints Disponíveis</label>
              <div className="mt-2 space-y-2">
                {[
                  "/bookings - Listar todos os agendamentos",
                  "/bookings/{id} - Obter agendamento específico",
                  "/event-types - Listar tipos de eventos",
                  "/schedules - Gerenciar horários",
                  "/teams - Gerenciar equipes",
                ].map((endpoint, idx) => (
                  <div key={idx} className="p-3 bg-card border border-border rounded-lg flex items-start gap-3">
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground mt-0.5">
                      GET
                    </span>
                    <span className="text-sm text-foreground">{endpoint}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Estatísticas</label>
              <div className="mt-2 grid grid-cols-3 gap-4">
                <div className="p-4 bg-card border border-border rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">247</p>
                  <p className="text-xs text-muted-foreground mt-1">Agendamentos</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">12</p>
                  <p className="text-xs text-muted-foreground mt-1">Tipos de Evento</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">5</p>
                  <p className="text-xs text-muted-foreground mt-1">Equipes</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Last Sync */}
        <Card className="p-6 bg-card/50">
          <p className="text-sm text-muted-foreground">
            Última sincronização: <span className="font-semibold text-foreground">Há 5 minutos</span>
          </p>
        </Card>
      </div>
    </div>
  )
}
