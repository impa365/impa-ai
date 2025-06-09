"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Copy, MessageSquare, Settings, Trash2, Power, PowerOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import AgentModal from "@/components/agent-modal"
import AgentDuplicateDialog from "@/components/agent-duplicate-dialog"
import AgentStats from "@/components/agent-stats"
import { deleteEvolutionBot } from "@/lib/evolution-api"

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [whatsappConnections, setWhatsappConnections] = useState([])
  const [userSettings, setUserSettings] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      fetchAgent()
      fetchWhatsAppConnections()
      fetchUserSettings()
    } else {
      router.push("/login")
    }
  }, [params.id])

  const fetchAgent = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("ai_agents")
        .select(`
          *,
          whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(
            connection_name,
            status,
            instance_name
          )
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error
      if (data) setAgent(data)
    } catch (error) {
      console.error("Erro ao buscar agente:", error)
      setError("Erro ao carregar dados do agente")
    } finally {
      setLoading(false)
    }
  }

  const fetchWhatsAppConnections = async () => {
    try {
      const currentUser = getCurrentUser()
      const { data, error } = await supabase.from("whatsapp_connections").select("*").eq("user_id", currentUser?.id)

      if (error) throw error
      if (data) setWhatsappConnections(data)
    } catch (error) {
      console.error("Erro ao buscar conexões WhatsApp:", error)
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

  const handleToggleStatus = async () => {
    try {
      const newStatus = agent.status === "active" ? "inactive" : "active"

      const { error } = await supabase.from("ai_agents").update({ status: newStatus }).eq("id", agent.id)

      if (error) throw error

      await fetchAgent()
      setMessage(`Agente ${newStatus === "active" ? "ativado" : "desativado"} com sucesso!`)
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      setError("Erro ao alterar status do agente")
      setTimeout(() => setError(""), 3000)
    }
  }

  const handleDeleteAgent = async () => {
    if (!confirm("Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      // Deletar bot na Evolution API
      if (agent.evolution_bot_id && agent.whatsapp_connections?.instance_name) {
        await deleteEvolutionBot(agent.whatsapp_connections.instance_name, agent.evolution_bot_id)
      }

      // Deletar agente no banco
      const { error } = await supabase.from("ai_agents").delete().eq("id", agent.id)

      if (error) throw error

      setMessage("Agente excluído com sucesso!")
      setTimeout(() => {
        router.push("/dashboard/agents")
      }, 1500)
    } catch (error) {
      console.error("Erro ao excluir agente:", error)
      setError("Erro ao excluir agente")
      setTimeout(() => setError(""), 3000)
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
          <div className="h-64 bg-gray-200 rounded mt-4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/dashboard/agents")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Agentes
        </Button>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>Agente não encontrado</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/dashboard/agents")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Agentes
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/agents")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <Badge
            variant={agent.status === "active" ? "default" : "secondary"}
            className={agent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
          >
            {agent.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
          {agent.is_default && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Padrão
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDuplicateDialogOpen(true)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            className={agent.status === "active" ? "text-amber-600" : "text-green-600"}
          >
            {agent.status === "active" ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Desativar
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Ativar
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="text-red-600" onClick={handleDeleteAgent}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
          <Button onClick={() => setEditModalOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Editar Agente
          </Button>
        </div>
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm">Descrição da Identidade</h3>
                  <p className="text-gray-600 mt-1">{agent.identity_description || "Sem descrição"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm">Tom de Voz</h3>
                    <p className="text-gray-600 mt-1">{getVoiceToneLabel(agent.voice_tone)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Função Principal</h3>
                    <p className="text-gray-600 mt-1">{getFunctionLabel(agent.main_function)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Temperatura (Criatividade)</h3>
                  <p className="text-gray-600 mt-1">{agent.temperature}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Conexão WhatsApp</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-600">{agent.whatsapp_connections?.connection_name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        agent.whatsapp_connections?.status === "connected"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {agent.whatsapp_connections?.status === "connected" ? "Conectado" : "Desconectado"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações do Bot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm">Tipo de Ativação</h3>
                    <p className="text-gray-600 mt-1">
                      {agent.trigger_type === "keyword" ? "Palavra-chave" : "Todas as mensagens"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Operador</h3>
                    <p className="text-gray-600 mt-1">
                      {
                        {
                          contains: "Contém",
                          equals: "Igual a",
                          startsWith: "Começa com",
                          endsWith: "Termina com",
                          regex: "Expressão regular",
                          none: "Nenhum",
                        }[agent.trigger_operator]
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Palavra-chave de Ativação</h3>
                  <p className="text-gray-600 mt-1">{agent.trigger_value}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm">Palavra para Sair</h3>
                    <p className="text-gray-600 mt-1">{agent.keyword_finish}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Tempo de Espera</h3>
                    <p className="text-gray-600 mt-1">{agent.debounce_time} segundos</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Opções Avançadas</h3>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${agent.listening_from_me ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className="text-sm text-gray-600">Escutar minhas mensagens</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${agent.keep_open ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <span className="text-sm text-gray-600">Manter conversa aberta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${agent.split_messages ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className="text-sm text-gray-600">Dividir mensagens longas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${agent.stop_bot_from_me ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className="text-sm text-gray-600">Parar bot com minhas mensagens</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prompt de Treinamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-md border whitespace-pre-wrap">{agent.training_prompt}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Funcionalidades Ativadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 border rounded-md">
                  <div
                    className={`w-4 h-4 rounded-full ${agent.transcribe_audio ? "bg-green-500" : "bg-gray-300"}`}
                  ></div>
                  <span className="mt-2 text-sm font-medium">Transcrição de Áudio</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-md">
                  <div
                    className={`w-4 h-4 rounded-full ${agent.understand_images ? "bg-green-500" : "bg-gray-300"}`}
                  ></div>
                  <span className="mt-2 text-sm font-medium">Entendimento de Imagens</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-md">
                  <div
                    className={`w-4 h-4 rounded-full ${agent.voice_response_enabled ? "bg-green-500" : "bg-gray-300"}`}
                  ></div>
                  <span className="mt-2 text-sm font-medium">Resposta com Voz</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-md">
                  <div
                    className={`w-4 h-4 rounded-full ${agent.calendar_integration ? "bg-green-500" : "bg-gray-300"}`}
                  ></div>
                  <span className="mt-2 text-sm font-medium">Integração com Calendário</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <AgentStats agentId={agent.id} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm">ID do Agente</h3>
                  <p className="text-gray-600 mt-1 font-mono text-xs">{agent.id}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">ID do Bot Evolution</h3>
                  <p className="text-gray-600 mt-1 font-mono text-xs">{agent.evolution_bot_id || "Não definido"}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm">Criado em</h3>
                <p className="text-gray-600 mt-1">
                  {new Date(agent.created_at).toLocaleDateString()} às {new Date(agent.created_at).toLocaleTimeString()}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm">Última atualização</h3>
                <p className="text-gray-600 mt-1">
                  {new Date(agent.updated_at).toLocaleDateString()} às {new Date(agent.updated_at).toLocaleTimeString()}
                </p>
              </div>

              {agent.voice_response_enabled && (
                <div>
                  <h3 className="font-medium text-sm">Provedor de Voz</h3>
                  <p className="text-gray-600 mt-1">
                    {agent.voice_provider === "fish_audio" ? "Fish Audio" : "Eleven Labs"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logs de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-semibold">Nenhum log disponível</h3>
                <p className="mt-1 text-sm">
                  Os logs de atividade aparecerão aqui quando o agente começar a interagir.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AgentModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        agent={agent}
        whatsappConnections={whatsappConnections}
        userSettings={userSettings}
        onSuccess={() => {
          fetchAgent()
          setMessage("Agente atualizado com sucesso!")
          setTimeout(() => setMessage(""), 3000)
        }}
      />

      <AgentDuplicateDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        agent={agent}
        onSuccess={() => {
          setMessage("Agente duplicado com sucesso!")
          setTimeout(() => {
            router.push("/dashboard/agents")
          }, 1500)
        }}
      />
    </div>
  )
}
