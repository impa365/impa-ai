"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit2, Copy, CheckCircle2 } from "lucide-react"

interface Trigger {
  id: string
  name: string
  conditions: string[]
  actions: string[]
  enabled: boolean
  lastExecution?: string
}

export function TriggersBuilder() {
  const [triggers, setTriggers] = useState<Trigger[]>([
    {
      id: "1",
      name: "Lembrete 1 hora antes",
      conditions: ["Tipo: Reunião", "Status: Confirmado", "Horário: -1h"],
      actions: ["Enviar Webhook", "Enviar Email", "Enviar Push"],
      enabled: true,
      lastExecution: "Há 2 minutos",
    },
    {
      id: "2",
      name: "Lembrete 15 minutos antes",
      conditions: ["Tipo: Qualquer", "Status: Ativo", "Horário: -15m"],
      actions: ["Enviar Webhook", "Notificação SMS"],
      enabled: true,
      lastExecution: "Há 5 minutos",
    },
  ])

  const [showNew, setShowNew] = useState(false)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gatilhos</h2>
          <p className="text-muted-foreground mt-2">Crie regras automáticas para enviar lembretes</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" />
          Novo Gatilho
        </Button>
      </div>

      <div className="space-y-4">
        {triggers.map((trigger) => (
          <Card key={trigger.id} className="p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{trigger.name}</h3>
                  {trigger.enabled && (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Ativo
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Última execução: {trigger.lastExecution}</p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Condições</p>
                <div className="space-y-2">
                  {trigger.conditions.map((condition, idx) => (
                    <div key={idx} className="text-sm bg-card border border-border rounded px-3 py-2">
                      {condition}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Ações</p>
                <div className="space-y-2">
                  {trigger.actions.map((action, idx) => (
                    <div
                      key={idx}
                      className="text-sm bg-primary/10 border border-primary/20 text-primary rounded px-3 py-2"
                    >
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* New Trigger Modal Form */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">Criar Novo Gatilho</h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Nome do Gatilho</label>
                <input
                  type="text"
                  placeholder="ex: Lembrete 30 minutos antes"
                  className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Adicionar Condições</label>
                <div className="space-y-2">
                  {["Tipo de Agendamento", "Status", "Horário Relativo", "Participantes", "Duração", "Localização"].map(
                    (condition) => (
                      <label
                        key={condition}
                        className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <input type="checkbox" className="w-4 h-4 rounded" />
                        <span className="text-sm text-foreground">{condition}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Selecionar Ações</label>
                <div className="space-y-2">
                  {[
                    "Enviar Webhook",
                    "Enviar Email",
                    "Enviar SMS",
                    "Notificação Push",
                    "Registrar em Log",
                    "Executar Script",
                  ].map((action) => (
                    <label
                      key={action}
                      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <input type="checkbox" className="w-4 h-4 rounded" />
                      <span className="text-sm text-foreground">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowNew(false)}>
                Cancelar
              </Button>
              <Button className="bg-primary hover:bg-primary/90">Criar Gatilho</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
