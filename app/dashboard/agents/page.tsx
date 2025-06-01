"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Bot, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { AgentModal } from "@/components/agent-modal"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { checkUserCanCreateAgent } from "@/lib/agent-limits"

interface Agent {
  id: string
  name: string
  model_config: {
    tone?: string
    function?: string
    model?: string
    prompt?: string
  }
  created_at: string
  updated_at: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [agentLimit, setAgentLimit] = useState({ canCreate: true, currentCount: 0, limit: 0 })
  const router = useRouter()
  const user = getCurrentUser()

  useEffect(() => {
    if (!user) return

    const fetchAgents = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("ai_agents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setAgents(data || [])

        // Verificar limites de agentes
        const limitInfo = await checkUserCanCreateAgent(user.id)
        setAgentLimit(limitInfo)
      } catch (err: any) {
        console.error("Erro ao carregar agentes:", err)
        setError(err.message || "Erro ao carregar agentes")
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [user])

  const handleAgentCreated = (newAgent: any) => {
    setAgents((prev) => [newAgent, ...prev])
    setAgentLimit((prev) => ({
      ...prev,
      currentCount: prev.currentCount + 1,
      canCreate: prev.currentCount + 1 < prev.limit,
    }))
  }

  const getToneLabel = (tone?: string) => {
    const tones: Record<string, string> = {
      professional: "Profissional",
      friendly: "Amigável",
      casual: "Casual",
      formal: "Formal",
      technical: "Técnico",
    }
    return tone ? tones[tone] || tone : "Padrão"
  }

  const getFunctionLabel = (func?: string) => {
    const functions: Record<string, string> = {
      sales: "Vendas",
      support: "Suporte",
      marketing: "Marketing",
      general: "Geral",
      customer_service: "Atendimento ao Cliente",
    }
    return func ? functions[func] || func : "Geral"
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-muted-foreground">Carregando seus agentes...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Agentes IA</h1>
          <p className="text-muted-foreground">Gerencie seus assistentes virtuais inteligentes</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2" disabled={!agentLimit.canCreate}>
          <Plus className="h-4 w-4" />
          Criar Agente
        </Button>
      </div>

      {!agentLimit.canCreate && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Você atingiu o limite de {agentLimit.limit} agentes. Entre em contato com o administrador para aumentar seu
            limite.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {agents.length === 0 && !error ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum agente criado</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crie seu primeiro agente IA para automatizar atendimentos, vendas ou suporte no WhatsApp.
          </p>
          <Button onClick={() => setModalOpen(true)} disabled={!agentLimit.canCreate}>
            Criar meu primeiro agente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-500" />
                  {agent.name}
                </CardTitle>
                <CardDescription>
                  {getFunctionLabel(agent.model_config?.function)} • {getToneLabel(agent.model_config?.tone)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {agent.model_config?.prompt?.substring(0, 150)}
                  {agent.model_config?.prompt && agent.model_config.prompt.length > 150 ? "..." : ""}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/agents/${agent.id}`)}>
                  Gerenciar
                </Button>
                <span className="text-xs text-gray-500">Modelo: {agent.model_config?.model || "GPT-4"}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AgentModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={handleAgentCreated} />

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Você está utilizando {agentLimit.currentCount} de {agentLimit.limit} agentes disponíveis.
        </p>
      </div>
    </div>
  )
}
