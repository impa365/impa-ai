"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Copy, Trash2, Play, CheckCircle2 } from "lucide-react"

interface Webhook {
  id: string
  url: string
  events: string[]
  enabled: boolean
  lastTrigger?: string
  successRate: number
}

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: "1",
      url: "https://api.example.com/reminders",
      events: ["reminder.sent", "reminder.failed"],
      enabled: true,
      lastTrigger: "Há 2 minutos",
      successRate: 99.8,
    },
    {
      id: "2",
      url: "https://notifications.example.com/webhook",
      events: ["reminder.sent"],
      enabled: true,
      lastTrigger: "Há 5 minutos",
      successRate: 100,
    },
  ])

  const [showNew, setShowNew] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const handleTest = async (id: string) => {
    setTestingId(id)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setTestingId(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Webhooks</h2>
          <p className="text-muted-foreground mt-2">Gerencie seus endpoints de webhook</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" />
          Novo Webhook
        </Button>
      </div>

      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id} className="p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <p className="font-mono text-sm bg-card border border-border px-3 py-1 rounded flex-1 break-all text-muted-foreground">
                    {webhook.url}
                  </p>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {webhook.successRate}% de sucesso
                  </span>
                  <span>Último: {webhook.lastTrigger}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest(webhook.id)}
                  disabled={testingId === webhook.id}
                >
                  <Play className={`w-4 h-4 ${testingId === webhook.id ? "animate-spin" : ""}`} />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="px-2 py-1 bg-card border border-border rounded">
                {webhook.enabled ? "✓ Ativo" : "✗ Inativo"}
              </span>
              {webhook.events.map((event) => (
                <span key={event} className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary rounded">
                  {event}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">Novo Webhook</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">URL do Webhook</label>
                <input
                  type="url"
                  placeholder="https://api.example.com/webhook"
                  className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Eventos</label>
                <div className="space-y-2">
                  {["reminder.sent", "reminder.failed", "reminder.delayed", "reminder.acknowledged"].map((event) => (
                    <label key={event} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" />
                      <span className="text-sm text-foreground">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowNew(false)}>
                Cancelar
              </Button>
              <Button className="bg-primary hover:bg-primary/90">Criar Webhook</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
