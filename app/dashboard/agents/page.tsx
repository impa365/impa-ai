"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import AgentModal, { type Agent } from "@/components/agent-modal" // Import Agent type
import { AgentDuplicateDialog } from "@/components/agent-duplicate-dialog"
import {
  AlertCircle,
  Bot,
  Copy,
  Edit,
  Loader2,
  MessageSquare,
  Mic,
  Plus,
  Trash2,
  Calendar,
  Eye,
  Zap,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/auth"
import { checkUserCanCreateAgent } from "@/lib/agent-limits" // Importar a função correta
import { deleteEvolutionBot } from "@/lib/evolution-api"

// Remover a definição local de Agent, pois será importada do agent-modal

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
    limit: number // Renomeado de maxAllowed para limit para consistência
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

        const limitCheckResult = await checkUserCanCreateAgent(currentUser.id)
        setLimitInfo({
          ...limitCheckResult,
          message: !limitCheckResult.canCreate
            ? `Você atingiu o limite de ${limitCheckResult.limit} agentes.`
            : undefined,
        })

        const { data: agentsData, error } = await supabase
          .from("ai_agents")
          .select(`
            *,
            whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(
              connection_name,
              status,
              instance_name
            )
          `)
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })

        if (error) throw error
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

  // Remover a função local checkAgentLimit, pois usaremos a de lib/agent-limits.ts

  const handleCreateAgent = () => {
    if (limitInfo && !limitInfo.canCreate) {
      toast({
        title: "Limite Atingido",
        description: limitInfo.message || "Você não pode criar mais agentes.",
        variant: "destructive",
      })
      return
    }
    setSelectedAgent(null)
    setIsModalOpen(true)
  }

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsModalOpen(true)
  }

  const handleDuplicateAgent = (agent: Agent) => {
    if (limitInfo && !limitInfo.canCreate) {
      toast({
        title: "Limite Atingido",
        description: limitInfo.message || "Você não pode duplicar agentes se o limite for atingido.",
        variant: "destructive",
      })
      return
    }
    setSelectedAgent(agent)
    setIsDuplicateDialogOpen(true)
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.")) {
      return
    }
    setIsDeleting(agentId)
    try {
      const agentToDelete = agents.find((agent) => agent.id === agentId)

      if (agentToDelete?.evolution_bot_id && agentToDelete.whatsapp_connection_id) {
        const { data: conn } = await supabase
          .from("whatsapp_connections")
          .select("instance_name")
          .eq("id", agentToDelete.whatsapp_connection_id)
          .single()
        if (conn?.instance_name) {
          await deleteEvolutionBot(conn.instance_name, agentToDelete.evolution_bot_id)
        }
      }

      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)
      if (error) throw error

      setAgents(agents.filter((agent) => agent.id !== agentId))
      toast({
        title: "Agente excluído",
        description: "O agente foi excluído com sucesso",
      })

      if (userId) {
        const limitCheckResult = await checkUserCanCreateAgent(userId)
        setLimitInfo({
          ...limitCheckResult,
          message: !limitCheckResult.canCreate
            ? `Você atingiu o limite de ${limitCheckResult.limit} agentes.`
            : undefined,
        })
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
    // Modificado para não receber agent e isNew, pois o modal não os envia mais diretamente
    setIsModalOpen(false)
    setLoading(true) // Recarregar agentes
    try {
      if (userId) {
        const { data: agentsData, error } = await supabase
          .from("ai_agents")
          .select(`
            *,
            whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(
              connection_name,
              status,
              instance_name
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        if (error) throw error
        setAgents(agentsData || [])

        const limitCheckResult = await checkUserCanCreateAgent(userId)
        setLimitInfo({
          ...limitCheckResult,
          message: !limitCheckResult.canCreate
            ? `Você atingiu o limite de ${limitCheckResult.limit} agentes.`
            : undefined,
        })
      }
    } catch (error) {
      console.error("Erro ao recarregar agentes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível recarregar os agentes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAgentDuplicated = async () => {
    // Modificado
    setIsDuplicateDialogOpen(false)
    setLoading(true) // Recarregar agentes
    try {
      if (userId) {
        const { data: agentsData, error } = await supabase
          .from("ai_agents")
          .select(`
            *,
            whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(
              connection_name,
              status,
              instance_name
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        if (error) throw error
        setAgents(agentsData || [])

        const limitCheckResult = await checkUserCanCreateAgent(userId)
        setLimitInfo({
          ...limitCheckResult,
          message: !limitCheckResult.canCreate
            ? `Você atingiu o limite de ${limitCheckResult.limit} agentes.`
            : undefined,
        })
      }
    } catch (error) {
      console.error("Erro ao recarregar agentes após duplicar:", error)
      toast({
        title: "Erro",
        description: "Não foi possível recarregar os agentes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getAgentTypeIcon = (agent: Agent) => {
    if (agent.model_config.voice_output_enabled) return <Mic className="h-5 w-5 text-blue-500" />
    if (agent.model_config.tools_config?.cal_com?.enabled) return <Calendar className="h-5 w-5 text-green-500" />
    return <MessageSquare className="h-5 w-5 text-gray-500" />
  }

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "secondary"
  }

  const getStatusBadgeClasses = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-700 border-gray-300"
  }

  const renderAgentCards = (filteredAgents: Agent[]) => {
    if (filteredAgents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg shadow-sm">
          <Bot className="h-16 w-16 text-gray-400 mb-6" />
          <h3 className="text-xl font-semibold text-gray-700">Nenhum agente encontrado</h3>
          <p className="text-md text-gray-500 mt-2">
            Crie seu primeiro agente para começar a automatizar suas conversas!
          </p>
          <Button onClick={handleCreateAgent} className="mt-6" disabled={limitInfo && !limitInfo.canCreate}>
            <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Agente
          </Button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card
            key={agent.id}
            className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between"
          >
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getAgentTypeIcon(agent)}
                  <CardTitle className="text-xl font-semibold text-gray-800">{agent.name}</CardTitle>
                </div>
                <Badge
                  variant={getStatusBadgeVariant(agent.is_active)}
                  className={`px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClasses(agent.is_active)}`}
                >
                  {agent.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <CardDescription className="text-sm text-gray-600 line-clamp-2 h-10">
                {agent.description || "Sem descrição fornecida."}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4 px-5 space-y-3 text-sm flex-grow">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Modelo:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {agent.model_name}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Conexão:</span>
                <span className="text-gray-700 truncate max-w-[150px]">
                  {agent.whatsapp_connections?.connection_name || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Palavra-chave:</span>
                <Badge variant="secondary" className="text-xs">
                  {agent.model_config.activation_keyword || "Nenhuma"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Criado em:</span>
                <span className="text-gray-700">{new Date(agent.created_at!).toLocaleDateString()}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-3 pb-4 px-5 bg-gray-50/50 border-t">
              <div className="flex w-full justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" /> Ver Detalhes
                </Button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditAgent(agent)} title="Editar">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDuplicateAgent(agent)}
                    disabled={limitInfo && !limitInfo.canCreate}
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4 text-purple-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAgent(agent.id)}
                    disabled={isDeleting === agent.id}
                    title="Excluir"
                  >
                    {isDeleting === agent.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-600" />
                    )}
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <Card key={i} className="overflow-hidden shadow-lg">
          <CardHeader className="pb-3 border-b bg-gray-50/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent className="py-4 px-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
          <CardFooter className="pt-3 pb-4 px-5 bg-gray-50/50 border-t">
            <div className="flex w-full justify-between items-center">
              <Skeleton className="h-9 w-32" />
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardFooter>
        </Card>
      ))
  }

  const filterAgentsByType = (typeKeyword: string) => {
    if (typeKeyword === "all") return agents
    return agents.filter((agent) => {
      if (typeKeyword === "voice") return agent.model_config.voice_output_enabled
      if (typeKeyword === "calendar") return agent.model_config.tools_config?.cal_com?.enabled
      if (typeKeyword === "chat")
        return !agent.model_config.voice_output_enabled && !agent.model_config.tools_config?.cal_com?.enabled
      return false
    })
  }

  const allAgents = filterAgentsByType("all")
  const chatAgents = filterAgentsByType("chat")
  const voiceAgents = filterAgentsByType("voice")
  const calendarAgents = filterAgentsByType("calendar")

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">Meus Agentes de IA</h1>
          <p className="text-md text-gray-600 mt-1">Gerencie, crie e configure seus assistentes virtuais.</p>
        </div>
        <Button
          onClick={handleCreateAgent}
          disabled={limitInfo && !limitInfo.canCreate}
          size="lg"
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Criar Novo Agente
        </Button>
      </header>

      {limitInfo && (
        <Alert variant={limitInfo.canCreate ? "default" : "destructive"} className="shadow-sm">
          {limitInfo.canCreate ? <Zap className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{limitInfo.canCreate ? "Recursos Disponíveis" : "Limite de Agentes Atingido"}</AlertTitle>
          <AlertDescription>
            {limitInfo.message || `Você utilizou ${limitInfo.currentCount} de ${limitInfo.limit} agentes disponíveis.`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="bg-white p-1 rounded-lg shadow-sm">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 border-b-0 p-1 bg-gray-100 rounded-md">
          <TabsTrigger value="all" className="text-sm">
            Todos ({allAgents.length})
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-sm">
            Chat ({chatAgents.length})
          </TabsTrigger>
          <TabsTrigger value="voice" className="text-sm">
            Voz ({voiceAgents.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-sm">
            Calendário ({calendarAgents.length})
          </TabsTrigger>
        </TabsList>

        <div className="px-1 py-2">
          <TabsContent value="all" className="mt-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{renderSkeletons()}</div>
            ) : (
              renderAgentCards(allAgents)
            )}
          </TabsContent>
          <TabsContent value="chat" className="mt-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{renderSkeletons()}</div>
            ) : (
              renderAgentCards(chatAgents)
            )}
          </TabsContent>
          <TabsContent value="voice" className="mt-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{renderSkeletons()}</div>
            ) : (
              renderAgentCards(voiceAgents)
            )}
          </TabsContent>
          <TabsContent value="calendar" className="mt-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{renderSkeletons()}</div>
            ) : (
              renderAgentCards(calendarAgents)
            )}
          </TabsContent>
        </div>
      </Tabs>

      {isModalOpen && (
        <AgentModal
          open={isModalOpen} // Corrigido de isOpen para open
          onOpenChange={setIsModalOpen}
          agent={selectedAgent}
          onSave={handleAgentSaved}
          isEditing={!!selectedAgent}
          maxAgentsReached={limitInfo ? !limitInfo.canCreate : false}
        />
      )}

      {isDuplicateDialogOpen &&
        selectedAgent && ( // Garantir que selectedAgent não é null
          <AgentDuplicateDialog
            open={isDuplicateDialogOpen} // Corrigido de isOpen para open
            onOpenChange={setIsDuplicateDialogOpen}
            agent={selectedAgent}
            onSuccess={handleAgentDuplicated} // Corrigido de onDuplicate para onSuccess
          />
        )}
    </div>
  )
}
