"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Power, PowerOff, Bot, Search, Filter, Plus, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AgentModal } from "@/components/agent-modal"
import { useToast } from "@/components/ui/use-toast"

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([])
  const [users, setUsers] = useState([])
  const [whatsappConnections, setWhatsappConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    user: "all",
    type: "all",
    voice_enabled: "all",
    calendar_enabled: "all",
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Buscar agentes com informações do usuário
      const { data: agentsData, error: agentsError } = await supabase
        .from("ai_agents")
        .select(`
          *,
          user_profiles!ai_agents_user_id_fkey(id, email, full_name),
          whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(connection_name, status)
        `)
        .order("created_at", { ascending: false })

      if (agentsError) throw agentsError
      setAgents(agentsData || [])

      // Buscar usuários para o filtro
      const { data: usersData, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, email, full_name")
        .order("full_name")

      if (usersError) throw usersError
      setUsers(usersData || [])

      // Buscar conexões WhatsApp para o modal
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .order("connection_name")

      if (connectionsError) throw connectionsError
      setWhatsappConnections(connectionsData || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar dados dos agentes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredAgents = agents.filter((agent) => {
    if (!agent || !agent.user_profiles) return false

    const matchesSearch =
      agent.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      agent.user_profiles?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      agent.user_profiles?.full_name?.toLowerCase().includes(filters.search.toLowerCase())

    const matchesStatus = filters.status === "all" || agent.status === filters.status
    const matchesUser = filters.user === "all" || agent.user_id === filters.user
    const matchesType = filters.type === "all" || agent.type === filters.type
    const matchesVoice =
      filters.voice_enabled === "all" ||
      (filters.voice_enabled === "true" && agent.voice_response_enabled) ||
      (filters.voice_enabled === "false" && !agent.voice_response_enabled)
    const matchesCalendar =
      filters.calendar_enabled === "all" ||
      (filters.calendar_enabled === "true" && agent.calendar_integration) ||
      (filters.calendar_enabled === "false" && !agent.calendar_integration)

    return matchesSearch && matchesStatus && matchesUser && matchesType && matchesVoice && matchesCalendar
  })

  const handleCreateAgent = () => {
    setSelectedAgent(null)
    setShowAgentModal(true)
  }

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent)
    setShowAgentModal(true)
  }

  const handleDeleteAgent = async (agentId) => {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return

    try {
      // Buscar informações do agente antes de excluir
      const { data: agentData, error: fetchError } = await supabase
        .from("ai_agents")
        .select("evolution_bot_id, whatsapp_connection_id")
        .eq("id", agentId)
        .single()

      if (fetchError) {
        console.error("Erro ao buscar dados do agente:", fetchError)
      } else if (agentData?.evolution_bot_id) {
        // Buscar o instance_name da conexão WhatsApp
        const { data: whatsappConnection, error: whatsappError } = await supabase
          .from("whatsapp_connections")
          .select("instance_name")
          .eq("id", agentData.whatsapp_connection_id)
          .single()

        if (!whatsappError && whatsappConnection) {
          // Importar a função necessária
          const { deleteEvolutionBot } = await import("@/lib/evolution-api")

          // Excluir o bot na Evolution API
          try {
            await deleteEvolutionBot(whatsappConnection.instance_name, agentData.evolution_bot_id)
          } catch (error) {
            console.error("Erro ao excluir bot na Evolution API:", error)
          }
        }
      }

      // Excluir o agente do banco de dados
      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Agente excluído com sucesso",
      })

      // Recarregar dados
      fetchData()
    } catch (error) {
      console.error("Erro ao excluir agente:", error)
      toast({
        title: "Erro",
        description: "Falha ao excluir agente",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (agent) => {
    try {
      const newStatus = agent.status === "active" ? "inactive" : "active"

      const { error } = await supabase.from("ai_agents").update({ status: newStatus }).eq("id", agent.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Status do agente alterado para ${newStatus === "active" ? "ativo" : "inativo"}`,
      })

      // Recarregar dados
      fetchData()
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      toast({
        title: "Erro",
        description: "Falha ao alterar status do agente",
        variant: "destructive",
      })
    }
  }

  // Função para ser chamada quando o agente for salvo
  const handleAgentSaved = () => {
    toast({
      title: "Sucesso",
      description: selectedAgent ? "Agente atualizado com sucesso!" : "Agente criado com sucesso!",
    })

    // Recarregar os dados
    fetchData()

    // Fechar o modal
    setShowAgentModal(false)
    setSelectedAgent(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Agentes IA</h1>
          <p className="text-gray-600">Administre todos os agentes do sistema</p>
        </div>
        <Button onClick={handleCreateAgent} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Criar Agente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar agentes..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.user} onValueChange={(value) => setFilters({ ...filters, user: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Usuários</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="web">Web</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.voice_enabled}
              onValueChange={(value) => setFilters({ ...filters, voice_enabled: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Voz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Com Voz</SelectItem>
                <SelectItem value="false">Sem Voz</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.calendar_enabled}
              onValueChange={(value) => setFilters({ ...filters, calendar_enabled: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Calendário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Com Calendário</SelectItem>
                <SelectItem value="false">Sem Calendário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Agentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Agentes ({filteredAgents.length})</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              {agents.length} total
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-gray-600">
                      Tipo: {agent.type} | Função: {agent.main_function}
                    </div>
                    <div className="text-xs text-gray-500">
                      Proprietário: {agent.user_profiles?.full_name || agent.user_profiles?.email || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Conexão: {agent.whatsapp_connections?.connection_name || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={agent.status === "active" ? "default" : "secondary"}
                      className={
                        agent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }
                    >
                      {agent.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                    <div className="flex gap-1">
                      {agent.voice_response_enabled && (
                        <Badge variant="outline" className="text-xs">
                          Voz
                        </Badge>
                      )}
                      {agent.calendar_integration && (
                        <Badge variant="outline" className="text-xs">
                          Calendário
                        </Badge>
                      )}
                      {agent.is_default && (
                        <Badge variant="outline" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditAgent(agent)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(agent)}>
                      {agent.status === "active" ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDeleteAgent(agent.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredAgents.length === 0 && (
              <div className="text-center py-8 text-gray-500">Nenhum agente encontrado com os filtros aplicados.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Agente - CORRIGIDO COM onSave */}
      <AgentModal
        open={showAgentModal}
        onOpenChange={setShowAgentModal}
        agent={selectedAgent}
        onSave={handleAgentSaved} // ✅ Função correta passada aqui
        maxAgentsReached={false}
        isEditing={!!selectedAgent}
      />
    </div>
  )
}
