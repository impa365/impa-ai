"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Power, PowerOff, Bot, Settings, MessageSquare } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import AgentModal from "@/components/agent-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Agent {
  id: string
  name: string
  identity_description: string
  voice_tone: string
  main_function: string
  status: string
  is_default: boolean
  whatsapp_connection_id: string
  evolution_bot_id: string
  created_at: string
  whatsapp_connections?: {
    connection_name: string
    status: string
  }
}

interface UserAgentSettings {
  agents_limit: number
  transcribe_audio_enabled: boolean
  understand_images_enabled: boolean
  voice_response_enabled: boolean
  calendar_integration_enabled: boolean
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [userSettings, setUserSettings] = useState<UserAgentSettings | null>(null)
  const [whatsappConnections, setWhatsappConnections] = useState([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    if (currentUser) {
      fetchAgents()
      fetchUserSettings()
      fetchWhatsAppConnections()
    }
  }, [])

  const fetchAgents = async () => {
    try {
      const currentUser = getCurrentUser()
      const { data, error } = await supabase
        .from("ai_agents")
        .select(`
          *,
          whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(
            connection_name,
            status
          )
        `)
        .eq("user_id", currentUser?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      if (data) setAgents(data)
    } catch (error) {
      console.error("Erro ao buscar agentes:", error)
      setMessage("Erro ao carregar agentes")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserSettings = async () => {
    try {
      const currentUser = getCurrentUser()
      let { data, error } = await supabase
        .from("user_agent_settings")
        .select("*")
        .eq("user_id", currentUser?.id)
        .single()

      if (error && error.code === "PGRST116") {
        // Criar configurações padrão se não existir
        const { data: newSettings, error: insertError } = await supabase
          .from("user_agent_settings")
          .insert([
            {
              user_id: currentUser?.id,
              agents_limit: 1,
              transcribe_audio_enabled: true,
              understand_images_enabled: true,
              voice_response_enabled: false,
              calendar_integration_enabled: false,
            },
          ])
          .select()
          .single()

        if (insertError) throw insertError
        data = newSettings
      } else if (error) {
        throw error
      }

      if (data) setUserSettings(data)
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
    }
  }

  const fetchWhatsAppConnections = async () => {
    try {
      const currentUser = getCurrentUser()
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", currentUser?.id)
        .eq("status", "connected")

      if (error) throw error
      if (data) setWhatsappConnections(data)
    } catch (error) {
      console.error("Erro ao buscar conexões WhatsApp:", error)
    }
  }

  const handleCreateAgent = () => {
    if (!userSettings) return

    if (agents.length >= userSettings.agents_limit) {
      setMessage(
        `Você atingiu o limite de ${userSettings.agents_limit} agente(s). Entre em contato com o administrador para aumentar seu limite.`,
      )
      setTimeout(() => setMessage(""), 5000)
      return
    }

    if (whatsappConnections.length === 0) {
      setMessage("Você precisa ter pelo menos uma conexão WhatsApp ativa para criar um agente.")
      setTimeout(() => setMessage(""), 5000)
      return
    }

    setSelectedAgent(null)
    setAgentModalOpen(true)
  }

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setAgentModalOpen(true)
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)

      if (error) throw error

      await fetchAgents()
      setMessage("Agente excluído com sucesso!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Erro ao excluir agente:", error)
      setMessage("Erro ao excluir agente")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleToggleStatus = async (agent: Agent) => {
    try {
      const newStatus = agent.status === "active" ? "inactive" : "active"

      const { error } = await supabase.from("ai_agents").update({ status: newStatus }).eq("id", agent.id)

      if (error) throw error

      await fetchAgents()
      setMessage(`Agente ${newStatus === "active" ? "ativado" : "desativado"} com sucesso!`)
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      setMessage("Erro ao alterar status do agente")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const getVoiceToneLabel = (tone: string) => {
    const tones = {
      humanizado: "Humanizado",
      formal: "Formal",
      tecnico: "Técnico",
      casual: "Casual",
      comercial: "Comercial",
    }
    return tones[tone] || tone
  }

  const getFunctionLabel = (func: string) => {
    const functions = {
      atendimento: "Atendimento ao Cliente",
      vendas: "Vendas",
      agendamento: "Agendamento",
      suporte: "Suporte Técnico",
      qualificacao: "Qualificação de Leads",
    }
    return functions[func] || func
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meus Agentes IA</h1>
          <p className="text-gray-600">
            Gerencie seus agentes de inteligência artificial ({agents.length}/{userSettings?.agents_limit || 1})
          </p>
        </div>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleCreateAgent}
          disabled={!userSettings || agents.length >= userSettings.agents_limit || whatsappConnections.length === 0}
        >
          <Plus className="w-4 h-4" />
          Novo Agente
        </Button>
      </div>

      {message && (
        <Alert
          className={`mb-6 ${message.includes("sucesso") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          <AlertDescription className={message.includes("sucesso") ? "text-green-700" : "text-red-700"}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {whatsappConnections.length === 0 && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-700">
            Você precisa ter pelo menos uma conexão WhatsApp ativa para criar agentes.
            <a href="/dashboard/whatsapp" className="underline ml-1">
              Configurar WhatsApp
            </a>
          </AlertDescription>
        </Alert>
      )}

      {agents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum agente criado</h3>
            <p className="text-gray-600 mb-6">
              Crie seu primeiro agente IA para começar a automatizar suas conversas no WhatsApp
            </p>
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleCreateAgent}
              disabled={!userSettings || whatsappConnections.length === 0}
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Agente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <p className="text-sm text-gray-600">{getFunctionLabel(agent.main_function)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={agent.status === "active" ? "default" : "secondary"}
                      className={
                        agent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }
                    >
                      {agent.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                    {agent.is_default && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Padrão
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{agent.identity_description || "Sem descrição"}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Tom: {getVoiceToneLabel(agent.voice_tone)}</span>
                  </div>

                  {agent.whatsapp_connections && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MessageSquare className="w-3 h-3" />
                      <span>{agent.whatsapp_connections.connection_name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          agent.whatsapp_connections.status === "connected"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {agent.whatsapp_connections.status === "connected" ? "Conectado" : "Desconectado"}
                      </Badge>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Criado em {new Date(agent.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditAgent(agent)} title="Editar agente">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(agent)}
                        title={agent.status === "active" ? "Desativar" : "Ativar"}
                      >
                        {agent.status === "active" ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteAgent(agent.id)}
                        title="Excluir agente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Settings className="w-3 h-3" />
                      Config
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AgentModal
        open={agentModalOpen}
        onOpenChange={setAgentModalOpen}
        agent={selectedAgent}
        whatsappConnections={whatsappConnections}
        userSettings={userSettings}
        onSuccess={() => {
          fetchAgents()
          setMessage("Agente salvo com sucesso!")
          setTimeout(() => setMessage(""), 3000)
        }}
      />
    </div>
  )
}
