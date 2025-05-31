"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Power, PowerOff, Bot, MessageSquare, Calendar, Mic } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import AgentModal from "@/components/agent-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [userSettings, setUserSettings] = useState<any>(null)
  const [globalSettings, setGlobalSettings] = useState<any>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    if (currentUser) {
      fetchAgents()
      fetchSettings()
    }
  }, [])

  const fetchAgents = async () => {
    try {
      const currentUser = getCurrentUser()
      const response = await fetch(`/api/agents?userId=${currentUser?.id}`)
      const data = await response.json()

      if (response.ok) {
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error("Erro ao buscar agentes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const currentUser = getCurrentUser()

      // Buscar configurações do usuário
      const { data: userSettingsData } = await supabase
        .from("user_agent_settings")
        .select("*")
        .eq("user_id", currentUser?.id)
        .single()

      setUserSettings(userSettingsData)

      // Buscar configurações globais
      const { data: globalSettingsData } = await supabase
        .from("global_agent_settings")
        .select("setting_key, setting_value")

      const globalSettingsObj = {}
      globalSettingsData?.forEach((setting) => {
        globalSettingsObj[setting.setting_key] = JSON.parse(setting.setting_value)
      })
      setGlobalSettings(globalSettingsObj)
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
    }
  }

  const handleToggleAgent = async (agentId: string, enabled: boolean) => {
    setActionLoading(agentId)
    try {
      const response = await fetch(`/api/agents/${agentId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          enabled,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        fetchAgents()
      } else {
        alert(result.error || "Erro ao alterar status do agente")
      }
    } catch (error) {
      console.error("Erro ao alterar status do agente:", error)
      alert("Erro ao alterar status do agente")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    setActionLoading(agentId)
    try {
      const response = await fetch(`/api/agents?agentId=${agentId}&userId=${user?.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (response.ok) {
        fetchAgents()
      } else {
        alert(result.error || "Erro ao deletar agente")
      }
    } catch (error) {
      console.error("Erro ao deletar agente:", error)
      alert("Erro ao deletar agente")
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditAgent = (agent: any) => {
    setSelectedAgent(agent)
    setAgentModalOpen(true)
  }

  const handleNewAgent = () => {
    setSelectedAgent(null)
    setAgentModalOpen(true)
  }

  const handleModalSuccess = () => {
    fetchAgents()
    setAgentModalOpen(false)
    setSelectedAgent(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
      case "inactive":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      case "training":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
      case "error":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo"
      case "inactive":
        return "Inativo"
      case "training":
        return "Treinando"
      case "error":
        return "Erro"
      default:
        return "Desconhecido"
    }
  }

  const maxAgents = userSettings?.max_agents || Number.parseInt(globalSettings.default_max_agents || "3")
  const canCreateAgent = agents.length < maxAgents

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
          <h1 className="text-2xl font-bold text-foreground mb-2">Meus Agentes IA</h1>
          <p className="text-muted-foreground">
            Gerencie seus agentes de inteligência artificial ({agents.length}/{maxAgents})
          </p>
        </div>
        <Button
          onClick={handleNewAgent}
          disabled={!canCreateAgent}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Novo Agente
        </Button>
      </div>

      {!canCreateAgent && (
        <Alert className="mb-6">
          <AlertDescription className="text-muted-foreground">
            Você atingiu o limite de {maxAgents} agentes. Para criar mais agentes, entre em contato com o administrador.
          </AlertDescription>
        </Alert>
      )}

      {agents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum agente criado</h3>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro agente IA para começar a automatizar suas conversas
            </p>
            <Button
              onClick={handleNewAgent}
              disabled={!canCreateAgent}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">{agent.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{agent.main_function}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className={getStatusColor(agent.status)}>
                      {getStatusText(agent.status)}
                    </Badge>
                    {agent.is_default && (
                      <Badge variant="outline" className="text-xs">
                        Padrão
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{agent.description || "Sem descrição"}</p>

                  <div className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Conexão:</strong> {agent.whatsapp_connections?.connection_name}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {agent.transcribe_audio && (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Mic className="w-3 h-3" />
                        <span>Áudio</span>
                      </div>
                    )}
                    {agent.voice_response && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <MessageSquare className="w-3 h-3" />
                        <span>Voz</span>
                      </div>
                    )}
                    {agent.calendar_integration && (
                      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <Calendar className="w-3 h-3" />
                        <span>Agenda</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Criado em {new Date(agent.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAgent(agent)}
                        disabled={actionLoading === agent.id}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAgent(agent.id, agent.status !== "active")}
                        disabled={actionLoading === agent.id || agent.whatsapp_connections?.status !== "connected"}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {agent.status === "active" ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading === agent.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Deletar Agente</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Tem certeza que deseja deletar o agente "{agent.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-foreground">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Deletar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {agent.whatsapp_connections?.status !== "connected" && (
                      <span className="text-xs text-orange-600 dark:text-orange-400">WhatsApp desconectado</span>
                    )}
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
        userId={user?.id}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
