"use client"

import type React from "react" // type import for React

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Sparkles, Eye, EyeOff, Settings, MessageSquare, Volume2, Database, Brain, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { fetchWhatsAppConnections, fetchUsers } from "@/lib/whatsapp-connections"
import {
  createEvolutionBot,
  updateEvolutionBot,
  fetchEvolutionBot,
  setEvolutionInstanceSettings,
  type EvolutionBotIndividualConfig,
  type EvolutionInstanceSettings,
  fetchEvolutionBotSettings,
} from "@/lib/evolution-api"

// Estilos customizados para os switches
const switchStyles =
  "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 border-2 border-gray-300 data-[state=checked]:border-blue-600"

interface AgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: Agent | null
  onSave: () => void
  maxAgentsReached?: boolean
  isEditing?: boolean
}

export interface Agent {
  id: string
  organization_id?: string | null
  name: string
  type: string
  description?: string | null
  status?: string | null
  model_config?: any // JSONB field
  prompt_template?: string | null
  user_id?: string | null
  whatsapp_connection_id?: string | null
  evolution_bot_id?: string | null
  identity_description?: string | null
  training_prompt?: string | null
  voice_tone?: string | null
  main_function?: string | null
  temperature?: number | null
  transcribe_audio?: boolean | null
  understand_images?: boolean | null
  voice_response_enabled?: boolean | null
  voice_provider?: string | null
  voice_api_key?: string | null
  calendar_integration?: boolean | null
  calendar_api_key?: string | null
  chatnode_integration?: boolean | null
  chatnode_api_key?: string | null
  chatnode_bot_id?: string | null
  orimon_integration?: boolean | null
  orimon_api_key?: string | null
  orimon_bot_id?: string | null
  is_default?: boolean | null
  created_at?: string
  updated_at?: string
}

interface User {
  id: string
  full_name: string
  email: string
  status: string
  role?: string
}

const initialFormData: Agent = {
  id: "",
  name: "",
  type: "chat",
  description: "",
  status: "active",
  model_config: {
    activation_keyword: "",
    model: "gpt-3.5-turbo",
    voice_id: "",
    calendar_event_id: "",
    keyword_finish: "#sair",
    delay_message: 1000,
    unknown_message: "Desculpe, não entendi. Digite a palavra-chave para começar.",
    listening_from_me: false,
    stop_bot_from_me: true,
    keep_open: false,
    debounce_time: 10,
    split_messages: true,
    time_per_char: 100,
  },
  prompt_template: "",
  user_id: "",
  whatsapp_connection_id: null,
  evolution_bot_id: null,
  identity_description: "",
  training_prompt: "",
  voice_tone: "humanizado",
  main_function: "atendimento",
  temperature: 0.7,
  transcribe_audio: false,
  understand_images: false,
  voice_response_enabled: false,
  voice_provider: null,
  voice_api_key: null,
  calendar_integration: false,
  calendar_api_key: null,
  chatnode_integration: false,
  chatnode_api_key: null,
  chatnode_bot_id: null,
  orimon_integration: false,
  orimon_api_key: null,
  orimon_bot_id: null,
  is_default: false,
}

export function AgentModal({
  open,
  onOpenChange,
  agent,
  onSave,
  maxAgentsReached = false,
  isEditing = false,
}: AgentModalProps) {
  const [formData, setFormData] = useState<Agent>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [whatsappConnections, setWhatsappConnections] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [n8nIntegrationConfig, setN8nIntegrationConfig] = useState<any>(null)
  const [showVoiceApiKey, setShowVoiceApiKey] = useState(false)
  const [showCalendarApiKey, setShowCalendarApiKey] = useState(false)
  const [showChatnodeApiKey, setShowChatnodeApiKey] = useState(false)
  const [showOrimonApiKey, setShowOrimonApiKey] = useState(false)
  const [evolutionSyncStatus, setEvolutionSyncStatus] = useState<string>("")

  const isAdmin = currentUser?.role === "admin"

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    if (user) {
      if (user.role === "admin") {
        loadUsers()
        if (agent?.user_id) {
          setSelectedUserId(agent.user_id)
        }
      } else {
        setSelectedUserId(user.id)
        loadWhatsAppConnections(user.id, false)
      }
      loadN8nConfig()
    }
  }, [agent, open])

  useEffect(() => {
    if (selectedUserId) {
      loadWhatsAppConnections(selectedUserId, isAdmin)
    } else {
      setWhatsappConnections([])
    }
  }, [selectedUserId, isAdmin])

  const loadUsers = async () => {
    try {
      const usersData = await fetchUsers()
      setUsers(usersData)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast({ title: "Erro", description: "Falha ao carregar lista de usuários", variant: "destructive" })
    }
  }

  const loadN8nConfig = async () => {
    const { data } = await supabase.from("integrations").select("config").eq("type", "n8n").single()
    if (data && data.config) setN8nIntegrationConfig(data.config)
    else console.warn("Configuração da integração n8n não encontrada.")
  }

  const loadWhatsAppConnections = async (userId: string, userIsAdmin: boolean) => {
    if (!userId) {
      setWhatsappConnections([])
      return
    }
    setLoadingConnections(true)
    try {
      const connections = await fetchWhatsAppConnections(userId, userIsAdmin)
      setWhatsappConnections(connections)
    } catch (error) {
      console.error("Erro ao carregar conexões:", error)
      toast({ title: "Erro", description: "Falha ao carregar conexões WhatsApp", variant: "destructive" })
    } finally {
      setLoadingConnections(false)
    }
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId)
    setFormData((prev) => ({ ...prev, user_id: userId, whatsapp_connection_id: null }))
    setWhatsappConnections([])
  }

  useEffect(() => {
    if (agent && agent.evolution_bot_id && agent.whatsapp_connection_id && open) {
      syncWithEvolutionAPI()
    }
  }, [agent, open])

  const syncWithEvolutionAPI = async () => {
    if (!agent?.evolution_bot_id || !agent?.whatsapp_connection_id) return

    setEvolutionSyncStatus("Sincronizando com Evolution API...")
    try {
      const { data: connection } = await supabase
        .from("whatsapp_connections")
        .select("instance_name")
        .eq("id", agent.whatsapp_connection_id)
        .single()

      if (connection?.instance_name) {
        const evolutionBotData = await fetchEvolutionBot(connection.instance_name, agent.evolution_bot_id)
        if (evolutionBotData) {
          setFormData((prev) => ({
            ...prev,
            model_config: {
              ...prev.model_config,
              activation_keyword: evolutionBotData.triggerValue || prev.model_config.activation_keyword,
              keyword_finish: evolutionBotData.keywordFinish || prev.model_config.keyword_finish,
              delay_message: evolutionBotData.delayMessage || prev.model_config.delay_message,
              unknown_message: evolutionBotData.unknownMessage || prev.model_config.unknown_message,
              listening_from_me:
                evolutionBotData.listeningFromMe === undefined
                  ? prev.model_config.listening_from_me
                  : evolutionBotData.listeningFromMe,
              stop_bot_from_me:
                evolutionBotData.stopBotFromMe === undefined
                  ? prev.model_config.stop_bot_from_me
                  : evolutionBotData.stopBotFromMe,
              keep_open:
                evolutionBotData.keepOpen === undefined ? prev.model_config.keep_open : evolutionBotData.keepOpen,
              debounce_time: evolutionBotData.debounceTime || prev.model_config.debounce_time,
              split_messages:
                evolutionBotData.splitMessages === undefined
                  ? prev.model_config.split_messages
                  : evolutionBotData.splitMessages,
              time_per_char: evolutionBotData.timePerChar || prev.model_config.time_per_char,
            },
            status: evolutionBotData.enabled ? "active" : "inactive",
          }))
          setEvolutionSyncStatus("Sincronizado com sucesso!")
        } else {
          setEvolutionSyncStatus("Erro na sincronização: Bot não encontrado na Evolution API.")
        }
      } else {
        setEvolutionSyncStatus("Conexão WhatsApp não encontrada para sincronia.")
      }
    } catch (error) {
      console.error("Erro ao sincronizar com Evolution API:", error)
      setEvolutionSyncStatus("Erro na sincronização com Evolution API.")
    } finally {
      setTimeout(() => setEvolutionSyncStatus(""), 3000)
    }
  }

  useEffect(() => {
    if (agent) {
      setFormData({ ...initialFormData, ...agent, user_id: agent.user_id || selectedUserId || currentUser?.id || "" })
      if (isAdmin && agent.user_id) {
        setSelectedUserId(agent.user_id)
      }
    } else {
      setFormData({ ...initialFormData, user_id: selectedUserId || currentUser?.id || "" })
    }
  }, [agent, currentUser, selectedUserId, isAdmin])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }
  const handleSelectChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({ ...prev, [name]: value[0] }))
  }
  const handleConfigChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, model_config: { ...(prev.model_config || {}), [key]: value } }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (maxAgentsReached && !isEditing) {
      setError("Você atingiu o limite máximo de agentes.")
      return
    }
    setLoading(true)
    setError(null)

    if (!formData.name.trim()) {
      setError("O nome da IA é obrigatório.")
      setLoading(false)
      return
    }
    if (!formData.user_id) {
      setError(isAdmin ? "É necessário selecionar um usuário." : "Erro: ID de usuário não encontrado.")
      setLoading(false)
      return
    }
    if (!formData.whatsapp_connection_id) {
      setError("A conexão WhatsApp é obrigatória.")
      setLoading(false)
      return
    }
    if (!formData.model_config?.activation_keyword?.trim() && !formData.is_default) {
      setError("A palavra-chave de ativação é obrigatória para bots não padrão.")
      setLoading(false)
      return
    }
    if (!formData.training_prompt?.trim()) {
      setError("O prompt de treinamento é obrigatório.")
      setLoading(false)
      return
    }

    let currentAgentIdInDb = isEditing && agent?.id ? agent.id : null
    let currentEvolutionBotId = formData.evolution_bot_id

    try {
      const agentPayloadForDb = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        status: formData.status,
        model_config: formData.model_config,
        prompt_template: formData.prompt_template,
        user_id: formData.user_id,
        whatsapp_connection_id: formData.whatsapp_connection_id,
        evolution_bot_id: currentEvolutionBotId,
        identity_description: formData.identity_description,
        training_prompt: formData.training_prompt,
        voice_tone: formData.voice_tone,
        main_function: formData.main_function,
        temperature: formData.temperature,
        transcribe_audio: formData.transcribe_audio,
        understand_images: formData.understand_images,
        voice_response_enabled: formData.voice_response_enabled,
        voice_provider: formData.voice_provider,
        voice_api_key: formData.voice_api_key,
        calendar_integration: formData.calendar_integration,
        calendar_api_key: formData.calendar_api_key,
        chatnode_integration: formData.chatnode_integration,
        chatnode_api_key: formData.chatnode_api_key,
        chatnode_bot_id: formData.chatnode_bot_id,
        orimon_integration: formData.orimon_integration,
        orimon_api_key: formData.orimon_api_key,
        orimon_bot_id: formData.orimon_bot_id,
        is_default: formData.is_default,
      }

      if (isEditing && currentAgentIdInDb) {
        const { error: updateDbError } = await supabase
          .from("ai_agents")
          .update(agentPayloadForDb)
          .eq("id", currentAgentIdInDb)
        if (updateDbError) throw updateDbError
      } else {
        const { data: newAgent, error: insertDbError } = await supabase
          .from("ai_agents")
          .insert(agentPayloadForDb)
          .select()
          .single()
        if (insertDbError) throw insertDbError
        currentAgentIdInDb = newAgent.id
      }

      const { data: connection, error: connectionError } = await supabase
        .from("whatsapp_connections")
        .select("instance_name")
        .eq("id", formData.whatsapp_connection_id)
        .single()
      if (connectionError) throw new Error(`Erro ao buscar conexão WhatsApp: ${connectionError.message}`)
      if (!connection?.instance_name) throw new Error("Instância WhatsApp não encontrada.")
      const instanceName = connection.instance_name

      if (!n8nIntegrationConfig?.flowUrl || !currentAgentIdInDb) {
        throw new Error("Configuração n8n ou ID do agente não encontrado para sincronização com Evolution API.")
      }
      const webhookUrl = `${n8nIntegrationConfig.flowUrl}${n8nIntegrationConfig.flowUrl.includes("?") ? "&" : "?"}bot_token=AGENT_${currentAgentIdInDb}`

      const evolutionBotIndividualData: EvolutionBotIndividualConfig = {
        enabled: formData.status === "active",
        description: formData.name,
        apiUrl: webhookUrl,
        apiKey: n8nIntegrationConfig.apiKey || "",
        triggerType: formData.is_default ? "all" : "keyword",
        triggerValue: formData.is_default ? "" : formData.model_config?.activation_keyword || "",
        expire: formData.model_config?.expire_message_bot || 0,
        keywordFinish: formData.model_config?.keyword_finish || "#sair",
        delayMessage: formData.model_config?.delay_message || 1000,
        unknownMessage: formData.model_config?.unknown_message || "Desculpe, não entendi.",
        listeningFromMe: formData.model_config?.listening_from_me || false,
        stopBotFromMe: formData.model_config?.stop_bot_from_me || true,
        keepOpen: formData.model_config?.keep_open || false,
        debounceTime: formData.model_config?.debounce_time || 10,
        ignoreJids: formData.model_config?.ignore_jids || [],
        splitMessages:
          formData.model_config?.split_messages === undefined ? true : formData.model_config.split_messages,
        timePerChar: formData.model_config?.time_per_char || 100,
      }

      if (currentEvolutionBotId) {
        const updateSuccess = await updateEvolutionBot(instanceName, currentEvolutionBotId, evolutionBotIndividualData)
        if (!updateSuccess) throw new Error("Falha ao atualizar bot na Evolution API.")
      } else {
        const createResult = await createEvolutionBot(instanceName, evolutionBotIndividualData)
        if (!createResult.success || !createResult.botId) {
          throw new Error(createResult.error || "Falha ao criar bot na Evolution API.")
        }
        currentEvolutionBotId = createResult.botId
        const { error: updateEvoIdError } = await supabase
          .from("ai_agents")
          .update({ evolution_bot_id: currentEvolutionBotId })
          .eq("id", currentAgentIdInDb)
        if (updateEvoIdError) console.error("Erro ao salvar evolution_bot_id no DB ImpaAI:", updateEvoIdError.message)
        setFormData((prev) => ({ ...prev, evolution_bot_id: currentEvolutionBotId }))
      }

      if (formData.is_default && currentEvolutionBotId) {
        const { error: uncheckError } = await supabase
          .from("ai_agents")
          .update({ is_default: false })
          .eq("whatsapp_connection_id", formData.whatsapp_connection_id)
          .not("id", "eq", currentAgentIdInDb)
        if (uncheckError) console.error("Erro ao desmarcar outros bots padrão no DB:", uncheckError.message)

        const { error: setDefaultError } = await supabase
          .from("ai_agents")
          .update({ is_default: true })
          .eq("id", currentAgentIdInDb)
        if (setDefaultError) console.error("Erro ao definir agente atual como padrão no DB:", setDefaultError.message)

        const instanceSettingsPayload: EvolutionInstanceSettings = {
          botIdFallback: currentEvolutionBotId,
          expire: formData.model_config?.expire_message_bot || 20,
          keywordFinish: formData.model_config?.keyword_finish || "#SAIR",
          delayMessage: formData.model_config?.delay_message || 1000,
          unknownMessage: formData.model_config?.unknown_message || "Mensagem não reconhecida",
          listeningFromMe:
            formData.model_config?.listening_from_me === undefined ? false : formData.model_config.listeningFromMe,
          stopBotFromMe:
            formData.model_config?.stop_bot_from_me === undefined ? false : formData.model_config.stop_bot_from_me,
          keepOpen: formData.model_config?.keep_open === undefined ? false : formData.model_config.keepOpen,
          splitMessages:
            formData.model_config?.split_messages === undefined ? true : formData.model_config.splitMessages,
          timePerChar: formData.model_config?.time_per_char || 50,
          debounceTime: formData.model_config?.debounce_time || 5,
          ignoreJids: formData.model_config?.ignore_jids || ["@g.us"],
        }

        const settingsSuccess = await setEvolutionInstanceSettings(instanceName, instanceSettingsPayload)
        if (!settingsSuccess)
          throw new Error("Falha ao definir configurações da instância na Evolution API (bot padrão).")
      } else if (!formData.is_default && agent?.is_default && currentEvolutionBotId) {
        const currentInstanceSettings = await fetchEvolutionBotSettings(instanceName)
        if (currentInstanceSettings && currentInstanceSettings.botIdFallback === currentEvolutionBotId) {
          const instanceSettingsPayload: EvolutionInstanceSettings = {
            ...currentInstanceSettings,
            botIdFallback: null,
          }
          await setEvolutionInstanceSettings(instanceName, instanceSettingsPayload)
        }
      }

      toast({
        title: "Sucesso",
        description: isEditing ? "Agente atualizado com sucesso!" : "Agente criado com sucesso!",
      })
      if (typeof onSave === "function") onSave()
      else onOpenChange(false)
    } catch (err: any) {
      console.error("❌ Erro detalhado ao salvar agente:", err)
      setError(err.message || "Ocorreu um erro ao salvar o agente.")
      toast({ title: "Erro", description: err.message || "Falha ao salvar o agente.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-2xl font-bold flex items-center text-gray-900 dark:text-gray-100">
              <Bot className="w-7 h-7 mr-2 text-primary" />
              {isEditing ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Configure sua Inteligência Artificial para WhatsApp. Preencha os campos abaixo para definir como sua IA
              irá se comportar e responder aos usuários.
            </DialogDescription>
            {evolutionSyncStatus && (
              <div
                className={`text-sm p-2 rounded mt-2 ${evolutionSyncStatus.includes("Erro") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
              >
                {evolutionSyncStatus}
              </div>
            )}
          </DialogHeader>

          <div className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <Sparkles className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                    <Users className="w-5 h-5 mr-2" />
                    Seleção de Usuário (Administrador)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="user_select" className="text-gray-900 dark:text-gray-100">
                      Selecionar Usuário *
                    </Label>
                    <Select value={selectedUserId} onValueChange={handleUserSelect}>
                      <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Escolha para qual usuário criar/editar este agente" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Como administrador, você deve primeiro escolher para qual usuário este agente pertence.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                  <Bot className="w-5 h-5 mr-2" />
                  Informações Básicas da IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">
                    Nome da IA *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Luna, Assistente de Vendas, Bot Atendimento"
                    required
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Este será o nome que identifica sua IA no sistema
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">
                    Descrição do Propósito da IA
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: IA especializada em vendas de produtos digitais..."
                    rows={3}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Descreva qual é o objetivo principal desta IA.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="main_function" className="text-gray-900 dark:text-gray-100">
                      Função Principal
                    </Label>
                    <Select
                      name="main_function"
                      value={formData.main_function || ""}
                      onValueChange={(value) => handleSelectChange("main_function", value)}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                        <SelectItem value="atendimento">Atendimento ao Cliente</SelectItem>
                        <SelectItem value="vendas">Vendas e Conversão</SelectItem>
                        <SelectItem value="agendamento">Agendamento de Reuniões</SelectItem>
                        <SelectItem value="suporte">Suporte Técnico</SelectItem>
                        <SelectItem value="qualificacao">Qualificação de Leads</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="voice_tone" className="text-gray-900 dark:text-gray-100">
                      Tom de Voz
                    </Label>
                    <Select
                      name="voice_tone"
                      value={formData.voice_tone || ""}
                      onValueChange={(value) => handleSelectChange("voice_tone", value)}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Selecione o tom" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                        <SelectItem value="humanizado">Humanizado e Empático</SelectItem>
                        <SelectItem value="formal">Formal e Profissional</SelectItem>
                        <SelectItem value="tecnico">Técnico e Direto</SelectItem>
                        <SelectItem value="casual">Casual e Descontraído</SelectItem>
                        <SelectItem value="comercial">Comercial e Persuasivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="whatsapp_connection_id" className="text-gray-900 dark:text-gray-100">
                    Conexão WhatsApp *
                  </Label>
                  <Select
                    name="whatsapp_connection_id"
                    value={formData.whatsapp_connection_id || ""}
                    onValueChange={(value) => handleSelectChange("whatsapp_connection_id", value)}
                    disabled={
                      (!selectedUserId && isAdmin) ||
                      loadingConnections ||
                      (!whatsappConnections.length && !!selectedUserId)
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                      <SelectValue
                        placeholder={
                          isAdmin && !selectedUserId
                            ? "Primeiro selecione um usuário"
                            : loadingConnections
                              ? "Carregando conexões..."
                              : "Selecione qual número WhatsApp esta IA irá usar"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                      {whatsappConnections.length > 0 ? (
                        whatsappConnections.map((conn) => (
                          <SelectItem key={conn.id} value={conn.id}>
                            {conn.connection_name} ({conn.phone_number || "Número não disponível"})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-connections" disabled>
                          {selectedUserId
                            ? "Nenhuma conexão WhatsApp encontrada para este usuário"
                            : isAdmin
                              ? "Selecione um usuário para ver as conexões"
                              : "Nenhuma conexão WhatsApp encontrada"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    {isAdmin
                      ? "Conexões WhatsApp disponíveis para o usuário selecionado"
                      : "Escolha qual número de WhatsApp esta IA irá utilizar para conversar"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Personalidade e Comportamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="identity_description" className="text-gray-900 dark:text-gray-100">
                    Como a IA se Apresenta
                  </Label>
                  <Textarea
                    id="identity_description"
                    name="identity_description"
                    value={formData.identity_description || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Olá! Eu sou a Luna, sua assistente virtual..."
                    rows={3}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Como a IA irá se apresentar ao iniciar uma conversa.
                  </p>
                </div>

                <div>
                  <Label htmlFor="training_prompt" className="text-gray-900 dark:text-gray-100">
                    Instruções de Comportamento (Prompt de Treinamento) *
                  </Label>
                  <Textarea
                    id="training_prompt"
                    name="training_prompt"
                    value={formData.training_prompt || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Você é uma assistente de vendas..."
                    rows={6}
                    required
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Instruções detalhadas sobre como a IA deve se comportar.
                  </p>
                </div>

                <div>
                  <Label htmlFor="temperature" className="text-gray-900 dark:text-gray-100">
                    Criatividade das Respostas: {(formData.temperature || 0.7).toFixed(1)}
                  </Label>
                  <Slider
                    id="temperature"
                    name="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    defaultValue={[0.7]}
                    value={[formData.temperature || 0.7]}
                    onValueChange={(value) => handleSliderChange("temperature", value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    0 = Mais previsível | 2 = Mais criativo
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações de Ativação e Controle (Evolution API)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="activation_keyword" className="text-gray-900 dark:text-gray-100">
                    Palavra-chave para Ativar a IA *
                  </Label>
                  <Input
                    id="activation_keyword"
                    value={formData.model_config?.activation_keyword || ""}
                    onChange={(e) => handleConfigChange("activation_keyword", e.target.value)}
                    placeholder="Ex: /bot, !assistente, oi"
                    disabled={formData.is_default}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Palavra para iniciar a conversa com a IA. Ignorado se "IA Padrão" estiver ativo.
                  </p>
                </div>

                <div>
                  <Label htmlFor="keyword_finish" className="text-gray-900 dark:text-gray-100">
                    Palavra para Encerrar Conversa
                  </Label>
                  <Input
                    id="keyword_finish"
                    value={formData.model_config?.keyword_finish || ""}
                    onChange={(e) => handleConfigChange("keyword_finish", e.target.value)}
                    placeholder="Ex: #sair, /parar, tchau"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Palavra para o usuário encerrar a conversa.
                  </p>
                </div>

                <div>
                  <Label htmlFor="unknown_message" className="text-gray-900 dark:text-gray-100">
                    Mensagem para Comandos Não Reconhecidos
                  </Label>
                  <Textarea
                    id="unknown_message"
                    value={formData.model_config?.unknown_message || ""}
                    onChange={(e) => handleConfigChange("unknown_message", e.target.value)}
                    placeholder="Ex: Desculpe, não entendi. Digite '/bot' para falar comigo."
                    rows={2}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Mensagem quando a IA não é ativada.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delay_message" className="text-gray-900 dark:text-gray-100">
                      Delay entre Mensagens (ms)
                    </Label>
                    <Input
                      type="number"
                      id="delay_message"
                      value={formData.model_config?.delay_message || 1000}
                      onChange={(e) => handleConfigChange("delay_message", Number.parseInt(e.target.value))}
                      placeholder="1000"
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Tempo de espera entre mensagens.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="debounce_time" className="text-gray-900 dark:text-gray-100">
                      Tempo de Debounce (segundos)
                    </Label>
                    <Input
                      type="number"
                      id="debounce_time"
                      value={formData.model_config?.debounce_time || 10}
                      onChange={(e) => handleConfigChange("debounce_time", Number.parseInt(e.target.value))}
                      placeholder="10"
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Tempo para aguardar antes de processar.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="listening_from_me" className="text-gray-900 dark:text-gray-100">
                        Ouvir Minhas Mensagens
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        IA responde quando EU envio.
                      </p>
                    </div>
                    <Switch
                      id="listening_from_me"
                      checked={formData.model_config?.listening_from_me || false}
                      onCheckedChange={(checked) => handleConfigChange("listening_from_me", checked)}
                      className={switchStyles}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="stop_bot_from_me" className="text-gray-900 dark:text-gray-100">
                        Parar Bot por Mim
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Eu posso parar a IA.
                      </p>
                    </div>
                    <Switch
                      id="stop_bot_from_me"
                      checked={formData.model_config?.stop_bot_from_me || false}
                      onCheckedChange={(checked) => handleConfigChange("stop_bot_from_me", checked)}
                      className={switchStyles}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="keep_open" className="text-gray-900 dark:text-gray-100">
                        Manter Conversa Aberta
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        IA continua sem reativar.
                      </p>
                    </div>
                    <Switch
                      id="keep_open"
                      checked={formData.model_config?.keep_open || false}
                      onCheckedChange={(checked) => handleConfigChange("keep_open", checked)}
                      className={switchStyles}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="split_messages" className="text-gray-900 dark:text-gray-100">
                        Dividir Mensagens Longas
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Quebra respostas longas.
                      </p>
                    </div>
                    <Switch
                      id="split_messages"
                      checked={
                        formData.model_config?.split_messages === undefined
                          ? true
                          : formData.model_config.split_messages
                      }
                      onCheckedChange={(checked) => handleConfigChange("split_messages", checked)}
                      className={switchStyles}
                    />
                  </div>
                </div>

                {formData.model_config?.split_messages && (
                  <div>
                    <Label htmlFor="time_per_char" className="text-gray-900 dark:text-gray-100">
                      Tempo por Caractere (ms)
                    </Label>
                    <Input
                      type="number"
                      id="time_per_char"
                      value={formData.model_config?.time_per_char || 100}
                      onChange={(e) => handleConfigChange("time_per_char", Number.parseInt(e.target.value))}
                      placeholder="100"
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Tempo por caractere ao dividir mensagens.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                  <Volume2 className="w-5 h-5 mr-2" />
                  Funcionalidades Extras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="transcribe_audio" className="text-gray-900 dark:text-gray-100">
                        Transcrever Áudios
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Converte áudios em texto.
                      </p>
                    </div>
                    <Switch
                      id="transcribe_audio"
                      name="transcribe_audio"
                      checked={formData.transcribe_audio || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, transcribe_audio: checked }))}
                      className={switchStyles}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="understand_images" className="text-gray-900 dark:text-gray-100">
                        Analisar Imagens
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Entende imagens enviadas.
                      </p>
                    </div>
                    <Switch
                      id="understand_images"
                      name="understand_images"
                      checked={formData.understand_images || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, understand_images: checked }))}
                      className={switchStyles}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="voice_response_enabled" className="text-gray-900 dark:text-gray-100">
                        Resposta por Voz
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Envia respostas em áudio.
                      </p>
                    </div>
                    <Switch
                      id="voice_response_enabled"
                      name="voice_response_enabled"
                      checked={formData.voice_response_enabled || false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, voice_response_enabled: checked }))
                      }
                      className={switchStyles}
                    />
                  </div>
                  {formData.voice_response_enabled && (
                    <div className="space-y-3 pl-4 border-l-2 border-blue-200 bg-blue-50 p-4 rounded dark:bg-gray-700 dark:border-blue-700">
                      <div>
                        <Label htmlFor="voice_provider" className="text-gray-900 dark:text-gray-100">
                          Provedor de Voz
                        </Label>
                        <Select
                          name="voice_provider"
                          value={formData.voice_provider || ""}
                          onValueChange={(value) => handleSelectChange("voice_provider", value)}
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Selecione o provedor" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <SelectItem value="eleven_labs">ElevenLabs (Recomendado)</SelectItem>
                            <SelectItem value="fish_audio">Fish Audio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="voice_api_key" className="text-gray-900 dark:text-gray-100">
                          Chave API Provedor de Voz
                        </Label>
                        <div className="relative">
                          <Input
                            id="voice_api_key"
                            name="voice_api_key"
                            type={showVoiceApiKey ? "text" : "password"}
                            value={formData.voice_api_key || ""}
                            onChange={handleInputChange}
                            placeholder="Chave API do provedor de voz"
                            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowVoiceApiKey(!showVoiceApiKey)}
                          >
                            {showVoiceApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="voice_id" className="text-gray-900 dark:text-gray-100">
                          ID da Voz
                        </Label>
                        <Input
                          id="voice_id"
                          value={formData.model_config?.voice_id || ""}
                          onChange={(e) => handleConfigChange("voice_id", e.target.value)}
                          placeholder="ID da voz no provedor"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                          Encontre na plataforma do provedor.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="calendar_integration" className="text-gray-900 dark:text-gray-100">
                        Agendamento de Reuniões
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Permite agendar via calendário.
                      </p>
                    </div>
                    <Switch
                      id="calendar_integration"
                      name="calendar_integration"
                      checked={formData.calendar_integration || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, calendar_integration: checked }))}
                      className={switchStyles}
                    />
                  </div>
                  {formData.calendar_integration && (
                    <div className="space-y-3 pl-4 border-l-2 border-green-200 bg-green-50 p-4 rounded dark:bg-gray-700 dark:border-green-700">
                      <div>
                        <Label htmlFor="calendar_api_key" className="text-gray-900 dark:text-gray-100">
                          Chave API do Calendário
                        </Label>
                        <div className="relative">
                          <Input
                            id="calendar_api_key"
                            name="calendar_api_key"
                            type={showCalendarApiKey ? "text" : "password"}
                            value={formData.calendar_api_key || ""}
                            onChange={handleInputChange}
                            placeholder="Chave API (Cal.com, etc.)"
                            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowCalendarApiKey(!showCalendarApiKey)}
                          >
                            {showCalendarApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="calendar_event_id" className="text-gray-900 dark:text-gray-100">
                          ID da Agenda/Evento
                        </Label>
                        <Input
                          id="calendar_event_id"
                          value={formData.model_config?.calendar_event_id || ""}
                          onChange={(e) => handleConfigChange("calendar_event_id", e.target.value)}
                          placeholder="ID do tipo de evento"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                          ID do tipo de reunião.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_default" className="text-gray-900 dark:text-gray-100">
                      IA Padrão desta Conexão
                    </Label>
                    <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                      IA principal deste número WhatsApp.
                    </p>
                  </div>
                  <Switch
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default || false}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_default: checked }))}
                    className={switchStyles}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                  <Database className="w-5 h-5 mr-2" />
                  Integrações de Vector Store (Base de Conhecimento)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm text-muted-foreground mb-4 text-gray-500 dark:text-gray-400">
                  <Brain className="w-4 h-4 inline mr-1" />
                  Vector stores melhoram a qualidade das respostas da IA.
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="chatnode_integration" className="text-gray-900 dark:text-gray-100">
                        ChatNode.ai
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Integração com ChatNode.ai.
                      </p>
                    </div>
                    <Switch
                      id="chatnode_integration"
                      name="chatnode_integration"
                      checked={formData.chatnode_integration || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, chatnode_integration: checked }))}
                      className={switchStyles}
                    />
                  </div>
                  {formData.chatnode_integration && (
                    <div className="space-y-3 pl-4 border-l-2 border-purple-200 bg-purple-50 p-4 rounded dark:bg-gray-700 dark:border-purple-700">
                      <div>
                        <Label htmlFor="chatnode_api_key" className="text-gray-900 dark:text-gray-100">
                          Chave API ChatNode.ai
                        </Label>
                        <div className="relative">
                          <Input
                            id="chatnode_api_key"
                            name="chatnode_api_key"
                            type={showChatnodeApiKey ? "text" : "password"}
                            value={formData.chatnode_api_key || ""}
                            onChange={handleInputChange}
                            placeholder="Chave API ChatNode.ai"
                            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowChatnodeApiKey(!showChatnodeApiKey)}
                          >
                            {showChatnodeApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="chatnode_bot_id" className="text-gray-900 dark:text-gray-100">
                          ID do Bot ChatNode.ai
                        </Label>
                        <Input
                          id="chatnode_bot_id"
                          name="chatnode_bot_id"
                          value={formData.chatnode_bot_id || ""}
                          onChange={handleInputChange}
                          placeholder="ID do bot ChatNode.ai"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                          Encontre no painel ChatNode.ai.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="orimon_integration" className="text-gray-900 dark:text-gray-100">
                        Orimon.ai
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Integração com Orimon.ai.
                      </p>
                    </div>
                    <Switch
                      id="orimon_integration"
                      name="orimon_integration"
                      checked={formData.orimon_integration || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, orimon_integration: checked }))}
                      className={switchStyles}
                    />
                  </div>
                  {formData.orimon_integration && (
                    <div className="space-y-3 pl-4 border-l-2 border-orange-200 bg-orange-50 p-4 rounded dark:bg-gray-700 dark:border-orange-700">
                      <div>
                        <Label htmlFor="orimon_api_key" className="text-gray-900 dark:text-gray-100">
                          Chave API Orimon.ai
                        </Label>
                        <div className="relative">
                          <Input
                            id="orimon_api_key"
                            name="orimon_api_key"
                            type={showOrimonApiKey ? "text" : "password"}
                            value={formData.orimon_api_key || ""}
                            onChange={handleInputChange}
                            placeholder="Chave API Orimon.ai"
                            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowOrimonApiKey(!showOrimonApiKey)}
                          >
                            {showOrimonApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="orimon_bot_id" className="text-gray-900 dark:text-gray-100">
                          ID do Bot Orimon.ai
                        </Label>
                        <Input
                          id="orimon_bot_id"
                          name="orimon_bot_id"
                          value={formData.orimon_bot_id || ""}
                          onChange={handleInputChange}
                          placeholder="ID do bot Orimon.ai"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                          Encontre no painel Orimon.ai.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {(formData.chatnode_integration || formData.orimon_integration) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-gray-700 dark:border-blue-700">
                    <div className="flex items-start space-x-2">
                      <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100">💡 Dica sobre Vector Stores:</p>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                          Você pode ativar ambas as integrações. A IA consultará ambas as bases de conhecimento.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="p-6 pt-4 border-t bg-gray-50 dark:bg-gray-800">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={
                loading ||
                (maxAgentsReached && !isEditing) ||
                (isAdmin && !selectedUserId) ||
                (!formData.whatsapp_connection_id &&
                  !!selectedUserId &&
                  !loadingConnections &&
                  whatsappConnections.length === 0) ||
                loadingConnections
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Agente de IA"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgentModal
