"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { AgentModal } from "@/components/agent-modal"
import { AgentDuplicateDialog } from "@/components/agent-duplicate-dialog"
import { AlertCircle, Bot, Copy, Edit, Loader2, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCurrentUser } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import type { Agent as ModalAgentType } from "@/components/agent-modal" // Import Agent type from modal

// ... other imports

// Update the Agent type to include necessary fields for display and editing
type Agent = Omit<ModalAgentType, "prompt" | "model"> & {
  // Omit potentially conflicting old fields
  // Fields from ModalAgentType are implicitly included
  // Add any page-specific display fields if necessary
  whatsapp_connection_name?: string
  // Ensure all fields fetched from Supabase are here, especially those needed by the modal
  // The ModalAgentType should be the source of truth for agent structure
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
        const currentUser = getCurrentUser()
        if (!currentUser) {
          router.push("/")
          return
        }
        setUserId(currentUser.id)

        const limitCheck = await checkAgentLimit(currentUser.id)
        setLimitInfo(limitCheck)

        // Fetch agents with all necessary fields, especially model_config
        const { data: agentsData, error: agentsError } = await supabase
          .from("ai_agents")
          .select("*, model_config") // Ensure model_config is explicitly selected
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })

        if (agentsError) {
          throw agentsError
        }

        let enrichedAgents: Agent[] = []
        if (agentsData) {
          // Fetch WhatsApp connection names
          const connectionIds = agentsData
            .map((agent) => agent.whatsapp_connection_id)
            .filter((id): id is string => id !== null)

          const connectionsMap = new Map<string, string>()
          if (connectionIds.length > 0) {
            const { data: connectionsData, error: connectionsError } = await supabase
              .from("whatsapp_connections")
              .select("id, connection_name")
              .in("id", connectionIds)

            if (connectionsError) {
              console.error("Erro ao buscar nomes das conexões WhatsApp:", connectionsError)
            } else if (connectionsData) {
              connectionsData.forEach((conn) => connectionsMap.set(conn.id, conn.connection_name))
            }
          }

          enrichedAgents = agentsData.map((agent) => ({
            ...agent,
            // Ensure model_config is properly parsed if it's a string,
            // though Supabase client should handle JSONB correctly.
            // If agent.model_config is a string, parse it:
            // model_config: typeof agent.model_config === 'string' ? JSON.parse(agent.model_config) : agent.model_config,
            whatsapp_connection_name: agent.whatsapp_connection_id
              ? connectionsMap.get(agent.whatsapp_connection_id)
              : undefined,
          }))
        }
        // @ts-ignore // Supabase data might not perfectly match Agent type initially
        setAgents(enrichedAgents)
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

  const renderAgentCards = (agentsToRender: Agent[]) => {
    if (agentsToRender.length === 0 && !loading) {
      // Added !loading to prevent flash of "No agents"
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center col-span-full">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum agente encontrado</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Crie seu primeiro agente para começar a usar a plataforma.
          </p>
        </div>
      )
    }

    return (
      <>
        {agentsToRender.map((agent) => (
          <Card key={agent.id} className="overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary flex-shrink-0" />
                  <CardTitle className="text-lg leading-tight">{agent.name}</CardTitle>
                </div>
                {agent.is_default && <Badge variant="secondary">Padrão</Badge>}
              </div>
              {agent.description && (
                <CardDescription className="line-clamp-2 text-sm pt-1">{agent.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pb-3 space-y-1.5 text-sm flex-grow">
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Modelo:</span>
                <span>{agent.model_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Status:</span>
                <Badge variant={agent.is_active ? "default" : "outline"}>{agent.is_active ? "Ativo" : "Inativo"}</Badge>
              </div>
              {agent.whatsapp_connection_id && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">Conexão:</span>
                  <span>{agent.whatsapp_connection_name || agent.whatsapp_connection_id}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-3 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/agents/${agent.id}`)}>
                Ver detalhes
              </Button>
              <div className="flex gap-1">
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
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {loading ? renderSkeletons() : renderAgentCards(agents)}
      </div>

      <AgentModal
        open={isModalOpen} // Changed from isOpen to open to match modal prop
        onOpenChange={setIsModalOpen}
        agent={selectedAgent}
        onSave={handleAgentSaved}
        isEditing={!!selectedAgent} // Explicitly pass isEditing
      />

      <AgentDuplicateDialog
        isOpen={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        agent={selectedAgent}
        onDuplicate={handleAgentDuplicated}
      />
    </div>
  )
}
