"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Edit, Trash2, Power, PowerOff, Search, Plus, AlertCircle, Loader2, Info } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import AgentModal from "@/components/agent-modal"

export default function DashboardAgentsPage() {
  const { toast } = useToast()
  const [agents, setAgents] = useState([])
  const [filteredAgents, setFilteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [connections, setConnections] = useState([])
  const [userId, setUserId] = useState(null)
  const [userLimits, setUserLimits] = useState(null)

  // Modais
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchAgents()
      fetchConnections()
      fetchUserLimits()
    }
  }, [userId])

  useEffect(() => {
    applyFilters()
  }, [agents, searchTerm, statusFilter])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from("user_profiles").select("id").eq("email", user.email).single()

      if (data) {
        setUserId(data.id)
      }
    }
  }

  const fetchAgents = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/agents?userId=${userId}`)
      const data = await response.json()

      if (data.agents) {
        setAgents(data.agents)
        setFilteredAgents(data.agents)
      }
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

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "connected")
        .order("connection_name")

      if (error) throw error
      setConnections(data || [])
    } catch (error) {
      console.error("Erro ao buscar conexões:", error)
    }
  }

  const fetchUserLimits = async () => {
    try {
      // Buscar limites do usuário
      const { data: userSettings } = await supabase
        .from("user_agent_settings")
        .select("*")
        .eq("user_id", userId)
        .single()

      // Se não encontrou, buscar configurações globais
      if (!userSettings) {
        const { data: globalSettings } = await supabase
          .from("global_agent_settings")
          .select("setting_value")
          .eq("setting_key", "default_max_agents")
          .single()

        setUserLimits({
          max_agents: globalSettings ? Number.parseInt(globalSettings.setting_value) : 3,
        })
      } else {
        setUserLimits(userSettings)
      }
    } catch (error) {
      console.error("Erro ao buscar limites:", error)
      setUserLimits({ max_agents: 3 }) // Valor padrão
    }
  }

  const applyFilters = () => {
    let result = [...agents]

    // Aplicar filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (agent) => agent.name.toLowerCase().includes(term) || agent.description?.toLowerCase().includes(term),
      )
    }

    // Aplicar filtro de status
    if (statusFilter !== "all") {
      result = result.filter((agent) => agent.status === statusFilter)
    }

    setFilteredAgents(result)
  }

  const handleCreateAgent = () => {
    setSelectedAgent(null)
    setShowAgentModal(true)
  }

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent)
    setShowAgentModal(true)
  }

  const handleInfoAgent = (agent) => {
    setSelectedAgent(agent)
    setShowInfoModal(true)
  }

  const handleDeleteClick = (agent) => {
    setSelectedAgent(agent)
    setShowDeleteModal(true)
  }

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return

    try {
      setActionLoading(true)

      const response = await fetch(`/api/agents?agentId=${selectedAgent.id}&userId=${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao excluir agente")
      }

      // Atualizar localmente
      setAgents(agents.filter((a) => a.id !== selectedAgent.id))
      setShowDeleteModal(false)
      setSelectedAgent(null)

      toast({
        title: "Sucesso",
        description: "Agente excluído com sucesso",
      })
    } catch (error) {
      console.error("Erro ao excluir agente:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o agente",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (agent) => {
    try {
      setActionLoading(true)

      const response = await fetch(`/api/agents/${agent.id}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status: agent.status === "active" ? "inactive" : "active",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao alterar status do agente")
      }

      const result = await response.json()

      // Atualizar localmente
      setAgents(agents.map((a) => (a.id === agent.id ? { ...a, status: result.status } : a)))

      toast({
        title: "Sucesso",
        description: `Agente ${result.status === "active" ? "ativado" : "desativado"} com sucesso`,
      })
    } catch (error) {
      console.error("Erro ao alterar status do agente:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar o status do agente",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            Ativo
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Inativo
          </Badge>
        )
      case "training":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            Treinando
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
            Erro
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </Badge>
        )
    }
  }

  const getFunctionLabel = (func) => {
    const functions = {
      atendimento: "Atendimento ao Cliente",
      vendas: "Vendas",
      agendamento: "Agendamento",
      suporte: "Suporte Técnico",
      qualificacao: "Qualificação de Leads",
    }
    return functions[func] || func
  }

  const canCreateAgent = () => {
    if (!userLimits) return false
    return agents.length < userLimits.max_agents
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Meus Agentes IA</h1>
          <p className="text-muted-foreground">
            Crie e gerencie seus assistentes virtuais inteligentes
            {userLimits && (
              <span>
                {" "}
                ({agents.length}/{userLimits.max_agents})
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={handleCreateAgent}
          disabled={!canCreateAgent() || connections.length === 0}
          className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Agente
        </Button>
      </div>

      {connections.length === 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-foreground">
            Você precisa ter pelo menos uma conexão WhatsApp ativa para criar agentes.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="search" className="text-foreground">
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nome ou descrição"
              className="pl-8 text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="statusFilter" className="text-foreground">
            Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="statusFilter" className="text-foreground">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="training">Treinando</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">Nenhum agente encontrado</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {agents.length === 0
                ? "Você ainda não criou nenhum agente IA. Crie seu primeiro agente para automatizar atendimentos no WhatsApp."
                : "Nenhum agente corresponde aos filtros selecionados."}
            </p>
            {agents.length === 0 && canCreateAgent() && connections.length > 0 && (
              <Button
                onClick={handleCreateAgent}
                className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Meu Primeiro Agente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                    </div>
                    <CardTitle className="text-lg text-foreground">{agent.name}</CardTitle>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>
                <CardDescription className="text-muted-foreground">
                  {getFunctionLabel(agent.main_function)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {agent.description || "Sem descrição"}
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                  Conexão: {agent.whatsapp_connections?.connection_name || "N/A"}
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {agent.transcribe_audio && (
                    <Badge variant="outline" className="text-xs">
                      Áudio
                    </Badge>
                  )}
                  {agent.understand_images && (
                    <Badge variant="outline" className="text-xs">
                      Imagens
                    </Badge>
                  )}
                  {agent.voice_response && (
                    <Badge variant="outline" className="text-xs">
                      Voz
                    </Badge>
                  )}
                  {agent.calendar_integration && (
                    <Badge variant="outline" className="text-xs">
                      Agenda
                    </Badge>
                  )}
                  {agent.is_default && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
                      Padrão
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInfoAgent(agent)}
                      className="text-foreground"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAgent(agent)}
                      className="text-foreground"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(agent)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant={agent.status === "active" ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleStatus(agent)}
                    disabled={actionLoading}
                    className={agent.status === "active" ? "" : "bg-blue-600 hover:bg-blue-700"}
                  >
                    {agent.status === "active" ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-1" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Informações do Agente */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Bot className="w-5 h-5" />
              {selectedAgent?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">Detalhes do agente IA</DialogDescription>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Status</h3>
                  <div>{getStatusBadge(selectedAgent.status)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Função</h3>
                  <div className="text-muted-foreground">{getFunctionLabel(selectedAgent.main_function)}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Descrição</h3>
                <div className="text-muted-foreground">{selectedAgent.description || "Sem descrição"}</div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Conexão WhatsApp</h3>
                <div className="text-muted-foreground">
                  {selectedAgent.whatsapp_connections?.connection_name || "N/A"}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Prompt de Treinamento</h3>
                <div className="text-muted-foreground p-3 bg-gray-50 dark:bg-gray-900 rounded-md max-h-40 overflow-y-auto">
                  {selectedAgent.prompt}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Tom de Voz</h3>
                  <div className="text-muted-foreground capitalize">{selectedAgent.tone}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Temperatura</h3>
                  <div className="text-muted-foreground">{selectedAgent.temperature}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Recursos Habilitados</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.transcribe_audio && <Badge variant="outline">Transcrição de Áudio</Badge>}
                  {selectedAgent.understand_images && <Badge variant="outline">Entendimento de Imagens</Badge>}
                  {selectedAgent.voice_response && (
                    <Badge variant="outline">Resposta por Voz ({selectedAgent.voice_provider})</Badge>
                  )}
                  {selectedAgent.calendar_integration && <Badge variant="outline">Integração de Agenda</Badge>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Gatilho</h3>
                <div className="text-muted-foreground">
                  {selectedAgent.trigger_type === "all" ? (
                    "Todas as mensagens"
                  ) : (
                    <>
                      Palavra-chave: <span className="font-medium">{selectedAgent.trigger_value}</span> (
                      {selectedAgent.trigger_operator})
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInfoModal(false)} className="text-foreground">
              Fechar
            </Button>
            <Button
              onClick={() => {
                setShowInfoModal(false)
                handleEditAgent(selectedAgent)
              }}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Agente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir o agente{" "}
              <span className="font-medium text-foreground">{selectedAgent?.name}</span>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
              className="text-foreground"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgent} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir Agente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação/Edição de Agente */}
      <AgentModal
        open={showAgentModal}
        onOpenChange={setShowAgentModal}
        agent={selectedAgent}
        userId={userId}
        onSuccess={fetchAgents}
      />
    </div>
  )
}
