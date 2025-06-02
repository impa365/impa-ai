"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { AgentModal } from "@/components/agent-modal"
import { AgentDuplicateDialog } from "@/components/agent-duplicate-dialog"
import { AlertCircle, Bot, Copy, Edit, Loader2, MessageSquare, Mic, Plus, Trash2, Calendar } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCurrentUser } from "@/lib/auth"

type Agent = {
  id: string
  name: string
  description: string
  prompt: string
  model: string
  temperature: number
  max_tokens: number
  whatsapp_connection_id: string | null
  user_id: string
  created_at: string
  type: string
  voice_provider: string | null
  voice_api_key: string | null
  voice_voice_id: string | null
  calendar_provider: string | null
  calendar_api_key: string | null
  calendar_calendar_id: string | null
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [limitInfo, setLimitInfo] = useState<{
    canCreate: boolean
    currentCount: number
    maxAllowed: number
    message?: string
  } | null>(null)

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchUserAndAgents = async () => {
      try {
        // Buscar o usuário atual
        const currentUser = getCurrentUser()

        if (!currentUser) {
          router.push("/")
          return
        }

        setUserId(currentUser.id)

        // Verificar limite de agentes
        const limitCheck = await checkAgentLimit(currentUser.id)
        setLimitInfo(limitCheck)

        // Buscar agentes do usuário
        const { data: agentsData, error } = await supabase
          .from("ai_agents")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setAgents(agentsData || [])
      } catch (error) {
        console.error("Erro ao buscar agentes:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus agentes",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndAgents()
  }, [router, toast])

  const checkAgentLimit = async (userId: string) => {
    try {
      // Buscar configurações do usuário
      const { data: userSettings, error: userError } = await supabase
        .from("user_settings")
        .select("agents_limit")
        .eq("user_id", userId)
        .single()

      let maxAllowed = 5 // padrão

      if (userError && userError.code !== "PGRST116") {
        console.warn("Erro ao buscar configurações do usuário:", userError)
      } else if (userSettings?.agents_limit) {
        maxAllowed = userSettings.agents_limit
      } else {
        // Buscar limite padrão do sistema
        const { data: systemSettings } = await supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "default_agents_limit")
          .single()

        if (systemSettings?.setting_value) {
          maxAllowed = Number.parseInt(systemSettings.setting_value)
        }
      }

      // Contar agentes atuais
      const { count, error: countError } = await supabase
        .from("ai_agents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      if (countError) {
        throw countError
      }

      const currentCount = count || 0
      const canCreate = currentCount < maxAllowed

      return {
        canCreate,
        currentCount,
        maxAllowed,
        message: canCreate ? undefined : `Você atingiu o limite de ${maxAllowed} agentes.`,
      }
    } catch (error) {
      console.error("Erro ao verificar limite de agentes:", error)
      return {
        canCreate: true,
        currentCount: 0,
        maxAllowed: 5,
      }
    }
  }

  const handleCreateAgent = () => {
    setSelectedAgent(null)
    setIsModalOpen(true)
  }

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsModalOpen(true)
  }

  const handleDuplicateAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsDuplicateDialogOpen(true)
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente?")) {
      return
    }

    setIsDeleting(agentId)

    try {
      // Buscar informações do agente antes de excluir
      const { data: agentData, error: fetchError } = await supabase
        .from("ai_agents")
        .select("evolution_bot_id, whatsapp_connection_id")
        .eq("id", agentId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Se o agente tem um bot na Evolution API, excluí-lo
      if (agentData.evolution_bot_id && agentData.whatsapp_connection_id) {
        // Importar a função necessária
        const { deleteEvolutionBot } = await import("@/lib/evolution-api")

        // Buscar o instance_name da conexão WhatsApp
        const { data: whatsappConnection, error: whatsappError } = await supabase
          .from("whatsapp_connections")
          .select("instance_name")
          .eq("id", agentData.whatsapp_connection_id)
          .single()

        if (!whatsappError && whatsappConnection) {
          // Excluir o bot na Evolution API
          deleteEvolutionBot(whatsappConnection.instance_name, agentData.evolution_bot_id).catch((error) =>
            console.error("Erro ao excluir bot na Evolution API:", error),
          )
        }
      }

      // Excluir o agente do banco de dados
      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)

      if (error) {
        throw error
      }

      setAgents(agents.filter((agent) => agent.id !== agentId))

      toast({
        title: "Agente excluído",
        description: "O agente foi excluído com sucesso",
      })

      // Atualizar limite de agentes
      if (userId) {
        const limitCheck = await checkAgentLimit(userId)
        setLimitInfo(limitCheck)
      }
    } catch (error) {
      console.error("Erro ao excluir agente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agente",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleAgentSaved = async (agent: Agent, isNew: boolean) => {
    if (isNew) {
      setAgents([agent, ...agents])
    } else {
      setAgents(agents.map((a) => (a.id === agent.id ? agent : a)))
    }

    // Atualizar limite de agentes
    if (userId) {
      const limitCheck = await checkAgentLimit(userId)
      setLimitInfo(limitCheck)
    }

    setIsModalOpen(false)
  }

  const handleAgentDuplicated = async (newAgent: Agent) => {
    setAgents([newAgent, ...agents])
    setIsDuplicateDialogOpen(false)

    // Atualizar limite de agentes
    if (userId) {
      const limitCheck = await checkAgentLimit(userId)
      setLimitInfo(limitCheck)
    }
  }

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case "voice":
        return <Mic className="h-4 w-4" />
      case "calendar":
        return <Calendar className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const renderAgentCards = (agents: Agent[]) => {
    if (agents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum agente encontrado</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Crie seu primeiro agente para começar a usar a plataforma
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAgentTypeIcon(agent.type)}
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                </div>
              </div>
              <CardDescription className="line-clamp-2">{agent.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Modelo:</span> {agent.model}
                </div>
                {agent.type === "voice" && agent.voice_provider && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Provedor de voz:</span> {agent.voice_provider}
                  </div>
                )}
                {agent.type === "calendar" && agent.calendar_provider && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Provedor de calendário:</span> {agent.calendar_provider}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/agents/${agent.id}`)}>
                Ver detalhes
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEditAgent(agent)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDuplicateAgent(agent)}
                  disabled={limitInfo && !limitInfo.canCreate}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteAgent(agent.id)}
                  disabled={isDeleting === agent.id}
                >
                  {isDeleting === agent.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  const renderSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="pb-2">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
          <CardFooter className="pt-2 flex justify-between">
            <Skeleton className="h-9 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </CardFooter>
        </Card>
      ))
  }

  const chatAgents = agents.filter((agent) => agent.type === "chat")
  const voiceAgents = agents.filter((agent) => agent.type === "voice")
  const calendarAgents = agents.filter((agent) => agent.type === "calendar")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Agentes</h1>
          <p className="text-muted-foreground">Gerencie seus agentes de IA e suas configurações</p>
        </div>
        <Button onClick={handleCreateAgent} disabled={limitInfo && !limitInfo.canCreate}>
          <Plus className="mr-2 h-4 w-4" /> Criar Agente
        </Button>
      </div>

      {limitInfo && !limitInfo.canCreate && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limite atingido</AlertTitle>
          <AlertDescription>{limitInfo.message}</AlertDescription>
        </Alert>
      )}

      {limitInfo && (
        <div className="text-sm text-muted-foreground">
          Agentes: {limitInfo.currentCount} de {limitInfo.maxAllowed} utilizados
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({agents.length})</TabsTrigger>
          <TabsTrigger value="chat">Chat ({chatAgents.length})</TabsTrigger>
          <TabsTrigger value="voice">Voz ({voiceAgents.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendário ({calendarAgents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{renderSkeletons()}</div>
          ) : (
            renderAgentCards(agents)
          )}
        </TabsContent>
        <TabsContent value="chat" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{renderSkeletons()}</div>
          ) : (
            renderAgentCards(chatAgents)
          )}
        </TabsContent>
        <TabsContent value="voice" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{renderSkeletons()}</div>
          ) : (
            renderAgentCards(voiceAgents)
          )}
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{renderSkeletons()}</div>
          ) : (
            renderAgentCards(calendarAgents)
          )}
        </TabsContent>
      </Tabs>

      <AgentModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} agent={selectedAgent} onSave={handleAgentSaved} />

      <AgentDuplicateDialog
        isOpen={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        agent={selectedAgent}
        onDuplicate={handleAgentDuplicated}
      />
    </div>
  )
}
