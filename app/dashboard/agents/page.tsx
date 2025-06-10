"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Plus, Search, Edit, Trash2, Eye, AlertTriangle, Loader2 } from "lucide-react"
import { AgentModal, type Agent } from "@/components/agent-modal"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { deleteEvolutionBot } from "@/lib/evolution-api"

// Limites padrão caso não estejam definidos no banco
const DEFAULT_LIMITS = {
  max_agents: 5,
  max_whatsapp_connections: 3,
  max_integrations: 2,
}

export default function UserAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [maxAgentsReached, setMaxAgentsReached] = useState(false)
  const [userLimits, setUserLimits] = useState<any>(DEFAULT_LIMITS)
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }
    if (user.role === "admin") {
      router.push("/admin/agents")
      return
    }
    setCurrentUser(user)
    loadUserLimits(user.id)
    loadAgents(user.id)
  }, [router])

  useEffect(() => {
    const filtered = agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.main_function?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredAgents(filtered)
  }, [agents, searchTerm])

  const loadUserLimits = async (userId: string) => {
    try {
      console.log("🔍 Carregando limites do usuário:", userId)

      // Primeiro, tentar buscar com as colunas de limite
      const { data, error } = await supabase
        .from("user_profiles")
        .select("max_agents, max_whatsapp_connections, max_integrations, role")
        .eq("id", userId)
        .single()

      if (error) {
        console.warn("⚠️ Erro ao carregar limites do usuário:", error.message)

        // Se der erro, usar limites padrão baseados no role do usuário
        const { data: userData, error: userError } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", userId)
          .single()

        if (!userError && userData) {
          const limits =
            userData.role === "admin"
              ? { max_agents: 999, max_whatsapp_connections: 999, max_integrations: 999 }
              : DEFAULT_LIMITS

          console.log("📊 Usando limites padrão:", limits)
          setUserLimits(limits)
        } else {
          console.log("📊 Usando limites padrão globais:", DEFAULT_LIMITS)
          setUserLimits(DEFAULT_LIMITS)
        }
        return
      }

      // Se conseguiu buscar os dados, usar os valores do banco ou padrão
      const limits = {
        max_agents: data?.max_agents || DEFAULT_LIMITS.max_agents,
        max_whatsapp_connections: data?.max_whatsapp_connections || DEFAULT_LIMITS.max_whatsapp_connections,
        max_integrations: data?.max_integrations || DEFAULT_LIMITS.max_integrations,
      }

      console.log("📊 Limites carregados:", limits)
      setUserLimits(limits)
    } catch (error) {
      console.error("❌ Erro ao carregar limites:", error)
      console.log("📊 Usando limites padrão por erro:", DEFAULT_LIMITS)
      setUserLimits(DEFAULT_LIMITS)
    }
  }

  const loadAgents = async (userId: string) => {
    setLoading(true)
    try {
      console.log("🤖 Carregando agentes do usuário:", userId)

      const { data, error } = await supabase
        .from("ai_agents")
        .select(`
          *,
          whatsapp_connections!inner(
            id,
            connection_name,
            phone_number,
            instance_name
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erro ao carregar agentes:", error)
        toast({
          title: "Erro",
          description: "Falha ao carregar agentes",
          variant: "destructive",
        })
        return
      }

      console.log("✅ Agentes carregados:", data?.length || 0)
      setAgents(data || [])

      // Verificar se atingiu o limite máximo
      const currentCount = data?.length || 0
      const maxAllowed = userLimits?.max_agents || DEFAULT_LIMITS.max_agents
      setMaxAgentsReached(currentCount >= maxAllowed)

      console.log(`📊 Agentes: ${currentCount}/${maxAllowed} (limite atingido: ${currentCount >= maxAllowed})`)
    } catch (error) {
      console.error("❌ Erro ao carregar agentes:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar agentes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = () => {
    const currentCount = agents.length
    const maxAllowed = userLimits?.max_agents || DEFAULT_LIMITS.max_agents

    if (currentCount >= maxAllowed) {
      toast({
        title: "Limite atingido",
        description: `Você atingiu o limite máximo de ${maxAllowed} agentes.`,
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

  const handleDeleteAgent = async (agent: Agent) => {
    if (!confirm(`Tem certeza que deseja excluir o agente "${agent.name}"?`)) {
      return
    }

    setDeletingAgentId(agent.id)
    try {
      console.log("🗑️ Iniciando exclusão do agente:", agent.name)

      // Se o agente tem um bot na Evolution API, deletar primeiro
      if (agent.evolution_bot_id && agent.whatsapp_connection_id) {
        const { data: connection } = await supabase
          .from("whatsapp_connections")
          .select("instance_name")
          .eq("id", agent.whatsapp_connection_id)
          .single()

        if (connection?.instance_name) {
          console.log("🗑️ Deletando bot da Evolution API...")
          const evolutionDeleteSuccess = await deleteEvolutionBot(connection.instance_name, agent.evolution_bot_id)

          if (!evolutionDeleteSuccess) {
            console.warn("⚠️ Falha ao deletar bot da Evolution API, continuando com exclusão local")
          }
        }
      }

      // Deletar agente do banco de dados
      const { error } = await supabase.from("ai_agents").delete().eq("id", agent.id).eq("user_id", currentUser.id) // Garantir que só pode deletar seus próprios agentes

      if (error) {
        console.error("❌ Erro ao deletar agente:", error)
        throw error
      }

      console.log("✅ Agente excluído com sucesso")
      toast({
        title: "Sucesso",
        description: "Agente excluído com sucesso!",
      })

      // Recarregar lista
      if (currentUser?.id) {
        loadAgents(currentUser.id)
      }
    } catch (error: any) {
      console.error("❌ Erro ao deletar agente:", error)
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir agente",
        variant: "destructive",
      })
    } finally {
      setDeletingAgentId(null)
    }
  }

  const handleAgentSaved = () => {
    console.log("✅ Agente salvo com sucesso")
    toast({
      title: "Sucesso",
      description: selectedAgent ? "Agente atualizado com sucesso!" : "Agente criado com sucesso!",
    })

    // Recarregar dados
    if (currentUser?.id) {
      loadAgents(currentUser.id)
      loadUserLimits(currentUser.id)
    }

    // Fechar modal e limpar seleção
    setIsModalOpen(false)
    setSelectedAgent(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getFunctionBadge = (mainFunction: string) => {
    const functionMap: Record<string, { label: string; color: string }> = {
      atendimento: { label: "Atendimento", color: "bg-blue-100 text-blue-800" },
      vendas: { label: "Vendas", color: "bg-green-100 text-green-800" },
      agendamento: { label: "Agendamento", color: "bg-purple-100 text-purple-800" },
      suporte: { label: "Suporte", color: "bg-orange-100 text-orange-800" },
      qualificacao: { label: "Qualificação", color: "bg-yellow-100 text-yellow-800" },
    }

    const config = functionMap[mainFunction] || { label: mainFunction, color: "bg-gray-100 text-gray-800" }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando agentes...</p>
        </div>
      </div>
    )
  }

  const currentCount = agents.length
  const maxAllowed = userLimits?.max_agents || DEFAULT_LIMITS.max_agents

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meus Agentes de IA</h1>
          <p className="text-gray-600">Gerencie seus agentes de inteligência artificial para WhatsApp</p>
          <p className="text-sm text-gray-500 mt-1">
            {currentCount} de {maxAllowed} agentes utilizados
          </p>
        </div>
        <Button
          onClick={handleCreateAgent}
          disabled={maxAgentsReached}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Novo Agente
        </Button>
      </div>

      {maxAgentsReached && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você atingiu o limite máximo de {maxAllowed} agentes. Para criar mais agentes, entre em contato com o
            suporte.
          </AlertDescription>
        </Alert>
      )}

      {/* Barra de Pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Pesquisar agentes por nome, descrição ou função..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Agentes */}
      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {agents.length === 0 ? "Nenhum agente criado" : "Nenhum agente encontrado"}
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {agents.length === 0
                ? "Crie seu primeiro agente de IA para começar a automatizar conversas no WhatsApp."
                : "Tente ajustar os termos de pesquisa para encontrar o agente desejado."}
            </p>
            {agents.length === 0 && !maxAgentsReached && (
              <Button onClick={handleCreateAgent} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4" />
                Criar Primeiro Agente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                  </div>
                  {getStatusBadge(agent.status || "inactive")}
                </div>
                {agent.description && <p className="text-sm text-gray-600 mt-2">{agent.description}</p>}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Função:</span>
                    {getFunctionBadge(agent.main_function || "atendimento")}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tom de Voz:</span>
                    <span className="capitalize">{agent.voice_tone || "Humanizado"}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">WhatsApp:</span>
                    <span className="text-xs">
                      {(agent as any).whatsapp_connections?.connection_name || "Não conectado"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Palavra-chave:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {agent.model_config?.activation_keyword || "Não definida"}
                    </code>
                  </div>

                  {agent.evolution_bot_id && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Evolution Bot:</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">Sincronizado</Badge>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleEditAgent(agent)} className="flex-1 gap-2">
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent)}
                    disabled={deletingAgentId === agent.id}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingAgentId === agent.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <AgentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        agent={selectedAgent}
        onSave={handleAgentSaved}
        maxAgentsReached={maxAgentsReached}
        isEditing={!!selectedAgent}
      />
    </div>
  )
}
