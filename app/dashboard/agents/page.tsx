"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Bot, Loader2, AlertCircle, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { AgentModal } from "@/components/agent-modal"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface UserSettings {
  agents_limit: number
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const router = useRouter()
  const user = getCurrentUser()

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    fetchData()
  }, [user, router])

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Buscar agentes do usuário
      const { data: agentsData, error: agentsError } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (agentsError) throw agentsError

      setAgents(agentsData || [])

      // Buscar configurações do usuário
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("agents_limit")
        .eq("user_id", user.id)
        .single()

      if (settingsError && settingsError.code !== "PGRST116") {
        throw settingsError
      }

      // Se não encontrou configurações, criar com valores padrão
      if (!settingsData) {
        const { data: defaultLimit } = await supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "default_agents_limit")
          .single()

        const limit = defaultLimit?.setting_value ? Number.parseInt(defaultLimit.setting_value) : 5

        const { data: newSettings, error: createError } = await supabase
          .from("user_settings")
          .insert([
            {
              user_id: user.id,
              agents_limit: limit,
              whatsapp_connections_limit: 3,
            },
          ])
          .select("agents_limit")
          .single()

        if (createError) throw createError

        setUserSettings({ agents_limit: limit })
      } else {
        setUserSettings(settingsData)
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err)
      setError(err.message || "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = () => {
    if (!userSettings) return

    if (agents.length >= userSettings.agents_limit) {
      setError(`Você atingiu o limite de ${userSettings.agents_limit} agentes.`)
      return
    }

    setSelectedAgent(null)
    setModalOpen(true)
  }

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setModalOpen(true)
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return

    try {
      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)

      if (error) throw error

      setAgents((prev) => prev.filter((agent) => agent.id !== agentId))
    } catch (err: any) {
      console.error("Erro ao excluir agente:", err)
      setError(err.message || "Erro ao excluir agente")
    }
  }

  const handleAgentSaved = (agent: Agent, isNew: boolean) => {
    if (isNew) {
      setAgents((prev) => [agent, ...prev])
    } else {
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? agent : a)))
    }
    setModalOpen(false)
    setSelectedAgent(null)
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

  const canCreateAgent = userSettings ? agents.length < userSettings.agents_limit : false

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
        <Button onClick={handleCreateAgent} className="gap-2" disabled={!canCreateAgent}>
          <Plus className="h-4 w-4" />
          Criar Agente
        </Button>
      </div>

      {!canCreateAgent && userSettings && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Você atingiu o limite de {userSettings.agents_limit} agentes. Entre em contato com o administrador para
            aumentar seu limite.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {userSettings && (
        <div className="mb-4 text-sm text-gray-600">
          Agentes: {agents.length} de {userSettings.agents_limit} utilizados
        </div>
      )}

      {agents.length === 0 && !error ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum agente criado</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crie seu primeiro agente IA para automatizar atendimentos, vendas ou suporte no WhatsApp.
          </p>
          <Button onClick={handleCreateAgent} disabled={!canCreateAgent}>
            Criar meu primeiro agente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
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
              <CardFooter className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditAgent(agent)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteAgent(agent.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/agents/${agent.id}`)}>
                  Ver detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AgentModal open={modalOpen} onOpenChange={setModalOpen} agent={selectedAgent} onSuccess={handleAgentSaved} />
    </div>
  )
}
