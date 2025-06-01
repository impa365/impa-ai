"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Bot, Loader2, AlertCircle, Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AgentModal } from "@/components/agent-modal"

interface Agent {
  id: string
  name: string
  description?: string
  prompt?: string
  model?: string
  temperature?: number
  max_tokens?: number
  type?: string
  voice_provider?: string
  voice_api_key?: string
  voice_voice_id?: string
  calendar_provider?: string
  calendar_api_key?: string
  calendar_calendar_id?: string
  whatsapp_connection_id?: string
  user_id: string
  created_at: string
  updated_at: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [agentsLimit, setAgentsLimit] = useState(5)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    initializePage()
  }, [])

  const initializePage = async () => {
    try {
      setLoading(true)
      setError("")

      // Verificar usuário autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Erro de autenticação:", userError)
        router.push("/")
        return
      }

      if (!user) {
        router.push("/")
        return
      }

      setCurrentUser(user)

      // Buscar agentes do usuário
      console.log("Buscando agentes para o usuário:", user.id)

      const { data: agentsData, error: agentsError } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (agentsError) {
        console.error("Erro ao buscar agentes:", agentsError)
        throw new Error(`Erro ao buscar agentes: ${agentsError.message}`)
      }

      console.log("Agentes encontrados:", agentsData)
      setAgents(agentsData || [])

      // Buscar limite de agentes (com fallback)
      try {
        const { data: settingsData } = await supabase
          .from("user_settings")
          .select("agents_limit")
          .eq("user_id", user.id)
          .single()

        if (settingsData?.agents_limit) {
          setAgentsLimit(settingsData.agents_limit)
        } else {
          // Tentar buscar limite padrão do sistema
          const { data: systemSettings } = await supabase
            .from("system_settings")
            .select("setting_value")
            .eq("setting_key", "default_agents_limit")
            .single()

          const defaultLimit = systemSettings?.setting_value ? Number.parseInt(systemSettings.setting_value) : 5
          setAgentsLimit(defaultLimit)
        }
      } catch (settingsError) {
        console.warn("Erro ao buscar configurações, usando limite padrão:", settingsError)
        setAgentsLimit(5)
      }
    } catch (err: any) {
      console.error("Erro ao inicializar página:", err)
      setError(err.message || "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = () => {
    if (agents.length >= agentsLimit) {
      setError(`Você atingiu o limite de ${agentsLimit} agentes.`)
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
      setError("")
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
    setError("")
  }

  const getAgentTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      chat: "Chat",
      voice: "Voz",
      calendar: "Calendário",
    }
    return type ? types[type] || type : "Chat"
  }

  const canCreateAgent = agents.length < agentsLimit

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-muted-foreground">Carregando seus agentes...</p>
      </div>
    )
  }

  if (error && !agents.length) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={initializePage}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
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

      {!canCreateAgent && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Você atingiu o limite de {agentsLimit} agentes. Entre em contato com o administrador para aumentar seu
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

      <div className="mb-4 text-sm text-gray-600">
        Agentes: {agents.length} de {agentsLimit} utilizados
      </div>

      {agents.length === 0 ? (
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
                  {getAgentTypeLabel(agent.type)} • Modelo: {agent.model || "GPT-4"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {agent.description || agent.prompt?.substring(0, 150) || "Sem descrição"}
                  {(agent.description || agent.prompt) && (agent.description || agent.prompt || "").length > 150
                    ? "..."
                    : ""}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Criado em {new Date(agent.created_at).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditAgent(agent)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="text-red-600 hover:text-red-700"
                  >
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

      <AgentModal isOpen={modalOpen} onOpenChange={setModalOpen} agent={selectedAgent} onSave={handleAgentSaved} />
    </div>
  )
}
