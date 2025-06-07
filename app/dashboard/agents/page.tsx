"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { AgentModal } from "@/components/agent-modal"
import { AgentDuplicateDialog } from "@/components/agent-duplicate-dialog"
import { AlertCircle, Bot, Copy, Edit, Loader2, Plus, Trash2 } from "lucide-react"
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
  is_default: boolean
  is_active: boolean
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
        const { data: agentsData, error } = await db
          .agents()
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
      const { data: userSettings, error: userError } = await db
        .userSettings()
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
        const { data: systemSettings } = await db
          .systemSettings()
          .select("setting_value")
          .eq("setting_key", "default_agents_limit")
          .single()

        if (systemSettings?.setting_value) {
          maxAllowed = Number.parseInt(systemSettings.setting_value)
        }
      }

      // Contar agentes atuais
      const { count, error: countError } = await db
        .agents()
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
      const { data: agentData, error: fetchError } = await db
        .agents()
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
        const { data: whatsappConnection, error: whatsappError } = await db
          .whatsappConnections()
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
      const { error } = await db.agents().delete().eq("id", agentId)

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

  const handleAgentSaved = async () => {
    // Recarregar a lista de agentes
    const currentUser = getCurrentUser()
    if (currentUser) {
      const { data: agentsData, error } = await db
        .agents()
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })

      if (!error) {
        setAgents(agentsData || [])
      }

      // Atualizar limite de agentes
      const limitCheck = await checkAgentLimit(currentUser.id)
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

  const renderAgentCards = (agents: Agent[]) => {
    if (agents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhum agente encontrado</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Crie seu primeiro agente para começar a usar a plataforma
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Bot className="h-5 w-5 text-primary" />
                  {agent.name}
                </CardTitle>
                {agent.is_default && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Padrão</span>
                )}
              </div>
              {agent.description && (
                <CardDescription className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                  {agent.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Modelo:</span>
                  <span>{agent.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <span className={agent.is_active ? "text-green-600" : "text-red-600"}>
                    {agent.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Criado:</span>
                  <span>{new Date(agent.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/agents/${agent.id}`)}>
                Ver detalhes
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEditAgent(agent)} title="Editar agente">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDuplicateAgent(agent)}
                  disabled={limitInfo && !limitInfo.canCreate}
                  title="Duplicar agente"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteAgent(agent.id)}
                  disabled={isDeleting === agent.id}
                  title="Excluir agente"
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Meus Agentes</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie seus agentes de IA e suas configurações</p>
        </div>
        <Button
          onClick={handleCreateAgent}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={limitInfo && !limitInfo.canCreate}
        >
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
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Agentes: {limitInfo.currentCount} de {limitInfo.maxAllowed} utilizados
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{renderSkeletons()}</div>
        ) : (
          renderAgentCards(agents)
        )}
      </div>

      <AgentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        agent={selectedAgent}
        onSave={handleAgentSaved}
        maxAgentsReached={limitInfo ? !limitInfo.canCreate : false}
        isEditing={!!selectedAgent}
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
