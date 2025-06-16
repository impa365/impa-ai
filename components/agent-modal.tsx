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
import { Bot, Sparkles, Eye, EyeOff, Volume2, Users, MessageSquare, Clock } from "lucide-react"
import { getSupabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { fetchWhatsAppConnections, fetchUsers } from "@/lib/whatsapp-connections"
import {
  createEvolutionBot,
  updateEvolutionBot,
  setEvolutionInstanceSettings,
  type EvolutionBotIndividualConfig,
  type EvolutionInstanceSettings,
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
  name: string
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
  voice_id?: string | null // Adicionar esta linha
  calendar_integration?: boolean | null
  calendar_api_key?: string | null
  calendar_meeting_id?: string | null
  chatnode_integration?: boolean | null // Adicionar esta linha
  chatnode_api_key?: string | null // Adicionar esta linha
  chatnode_bot_id?: string | null // Adicionar esta linha
  orimon_integration?: boolean | null // Adicionar esta linha
  orimon_api_key?: string | null // Adicionar esta linha
  orimon_bot_id?: string | null // Adicionar esta linha
  status?: string | null
  is_default?: boolean | null
  user_id?: string | null
  whatsapp_connection_id?: string | null
  evolution_bot_id?: string | null
  model?: string | null
  // Campos para sincronização com Evolution API
  trigger_type?: string | null
  trigger_operator?: string | null
  trigger_value?: string | null
  keyword_finish?: string | null
  debounce_time?: number | null
  listening_from_me?: boolean | null
  stop_bot_from_me?: boolean | null
  keep_open?: boolean | null
  split_messages?: boolean | null
  unknown_message?: string | null
  delay_message?: number | null
  expire_time?: number | null
  ignore_jids?: string[] | null
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
  voice_id: null, // Adicionar esta linha
  calendar_integration: false,
  calendar_api_key: null,
  calendar_meeting_id: null,
  chatnode_integration: false, // Adicionar esta linha
  chatnode_api_key: null, // Adicionar esta linha
  chatnode_bot_id: null, // Adicionar esta linha
  orimon_integration: false, // Adicionar esta linha
  orimon_api_key: null, // Adicionar esta linha
  orimon_bot_id: null, // Adicionar esta linha
  status: "active",
  is_default: false,
  user_id: "",
  whatsapp_connection_id: null,
  evolution_bot_id: null,
  model: null,
  // Valores padrão para campos Evolution API
  trigger_type: "keyword",
  trigger_operator: "equals",
  trigger_value: "",
  keyword_finish: "#sair",
  debounce_time: 10,
  listening_from_me: false,
  stop_bot_from_me: true,
  keep_open: false,
  split_messages: true,
  unknown_message: "Desculpe, não entendi sua mensagem.",
  delay_message: 1000,
  expire_time: 0,
  ignore_jids: [],
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
  const [showChatnodeApiKey, setShowChatnodeApiKey] = useState(false) // Adicionar esta linha
  const [showOrimonApiKey, setShowOrimonApiKey] = useState(false) // Adicionar esta linha
  const [evolutionSyncStatus, setEvolutionSyncStatus] = useState<string>("")
  const [systemDefaultModel, setSystemDefaultModel] = useState<string | null>(null)

  const isAdmin = currentUser?.role === "admin"

  useEffect(() => {
    const loadSystemDefaultModel = async () => {
      try {
        const { getDefaultModel } = await import("@/lib/api-helpers")
        const defaultModel = await getDefaultModel()
        setSystemDefaultModel(defaultModel)
        console.log("✅ Modelo padrão do sistema carregado:", defaultModel)
      } catch (error) {
        console.error("❌ Erro ao carregar modelo padrão:", error)
      }
    }

    if (open) {
      loadSystemDefaultModel()
    }
  }, [open])

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

  async function loadN8nConfig() {
    try {
      const client = await getSupabase()
      const { data } = await client.from("integrations").select("config").eq("type", "n8n").single()
      if (data && data.config) setN8nIntegrationConfig(data.config)
      else console.warn("Configuração da integração n8n não encontrada.")
    } catch (err) {
      console.error("Erro ao carregar configuração N8N:", err?.message || err)
    }
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
    if (!formData.trigger_value?.trim() && formData.trigger_type === "keyword") {
      setError("A palavra-chave de ativação é obrigatória para bots com ativação por palavra-chave.")
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
      const client = await getSupabase()

      // Garantir que trigger_type tenha um valor válido
      const validTriggerType =
        formData.trigger_type && ["keyword", "all"].includes(formData.trigger_type)
          ? formData.trigger_type
          : formData.is_default
            ? "all"
            : "keyword"

      // Garantir que trigger_operator tenha um valor válido
      const validTriggerOperator =
        formData.trigger_operator &&
        ["equals", "contains", "startsWith", "endsWith", "regex"].includes(formData.trigger_operator)
          ? formData.trigger_operator
          : "equals"

      // Payload completo com todos os campos necessários para Evolution API
      const agentPayloadForDb = {
        name: formData.name,
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
        voice_id: formData.voice_id, // Adicionar esta linha
        calendar_integration: formData.calendar_integration,
        calendar_api_key: formData.calendar_api_key,
        calendar_meeting_id: formData.calendar_meeting_id,
        chatnode_integration: formData.chatnode_integration, // Adicionar esta linha
        chatnode_api_key: formData.chatnode_api_key, // Adicionar esta linha
        chatnode_bot_id: formData.chatnode_bot_id, // Adicionar esta linha
        orimon_integration: formData.orimon_integration, // Adicionar esta linha
        orimon_api_key: formData.orimon_api_key, // Adicionar esta linha
        orimon_bot_id: formData.orimon_bot_id, // Adicionar esta linha
        status: formData.status,
        is_default: formData.is_default,
        user_id: formData.user_id,
        whatsapp_connection_id: formData.whatsapp_connection_id,
        evolution_bot_id: currentEvolutionBotId,
        model: formData.model || systemDefaultModel,
        // Campos para sincronização Evolution API
        trigger_type: validTriggerType,
        trigger_operator: validTriggerOperator,
        trigger_value: formData.trigger_value,
        keyword_finish: formData.keyword_finish,
        debounce_time: formData.debounce_time,
        listening_from_me: formData.listening_from_me,
        stop_bot_from_me: formData.stop_bot_from_me,
        keep_open: formData.keep_open,
        split_messages: formData.split_messages,
        unknown_message: formData.unknown_message,
        delay_message: formData.delay_message,
        expire_time: formData.expire_time,
        ignore_jids: formData.ignore_jids,
      }

      if (isEditing && currentAgentIdInDb) {
        const { error: updateDbError } = await client
          .from("ai_agents")
          .update(agentPayloadForDb)
          .eq("id", currentAgentIdInDb)
        if (updateDbError) throw updateDbError
      } else {
        const { data: newAgent, error: insertDbError } = await client
          .from("ai_agents")
          .insert(agentPayloadForDb)
          .select()
          .single()
        if (insertDbError) throw insertDbError
        currentAgentIdInDb = newAgent.id
      }

      // Configuração Evolution API
      const { data: connection, error: connectionError } = await client
        .from("whatsapp_connections")
        .select("instance_name")
        .eq("id", formData.whatsapp_connection_id)
        .single()
      if (connectionError) throw new Error(`Erro ao buscar conexão WhatsApp: ${connectionError.message}`)
      if (!connection?.instance_name) throw new Error("Instância WhatsApp não encontrada.")
      const instanceName = connection.instance_name

      if (n8nIntegrationConfig?.flowUrl && currentAgentIdInDb) {
        const webhookUrl = `${n8nIntegrationConfig.flowUrl}${n8nIntegrationConfig.flowUrl.includes("?") ? "&" : "?"}bot_token=AGENT_${currentAgentIdInDb}`

        const evolutionBotIndividualData: EvolutionBotIndividualConfig = {
          enabled: formData.status === "active",
          description: formData.name,
          apiUrl: webhookUrl,
          apiKey: n8nIntegrationConfig.apiKey || "",
          triggerType: formData.trigger_type || "keyword",
          triggerOperator: formData.trigger_operator || "equals",
          triggerValue: formData.trigger_value || "",
          expire: formData.expire_time || 0,
          keywordFinish: formData.keyword_finish || "#sair",
          delayMessage: formData.delay_message || 1000,
          unknownMessage: formData.unknown_message || "Desculpe, não entendi.",
          listeningFromMe: formData.listening_from_me || false,
          stopBotFromMe: formData.stop_bot_from_me || true,
          keepOpen: formData.keep_open || false,
          debounceTime: formData.debounce_time || 10,
          ignoreJids: formData.ignore_jids || [],
          splitMessages: formData.split_messages || true,
          timePerChar: 100,
        }

        if (currentEvolutionBotId) {
          const updateSuccess = await updateEvolutionBot(
            instanceName,
            currentEvolutionBotId,
            evolutionBotIndividualData,
          )
          if (!updateSuccess) throw new Error("Falha ao atualizar bot na Evolution API.")
        } else {
          const createResult = await createEvolutionBot(instanceName, evolutionBotIndividualData)
          if (!createResult.success || !createResult.botId) {
            throw new Error(createResult.error || "Falha ao criar bot na Evolution API.")
          }
          currentEvolutionBotId = createResult.botId
          const { error: updateEvoIdError } = await client
            .from("ai_agents")
            .update({ evolution_bot_id: currentEvolutionBotId })
            .eq("id", currentAgentIdInDb)
          if (updateEvoIdError) console.error("Erro ao salvar evolution_bot_id no DB ImpaAI:", updateEvoIdError.message)
        }

        // Configurar bot padrão se necessário
        if (formData.is_default && currentEvolutionBotId) {
          const { error: uncheckError } = await client
            .from("ai_agents")
            .update({ is_default: false })
            .eq("whatsapp_connection_id", formData.whatsapp_connection_id)
            .not("id", "eq", currentAgentIdInDb)
          if (uncheckError) console.error("Erro ao desmarcar outros bots padrão no DB:", uncheckError.message)

          const instanceSettingsPayload: EvolutionInstanceSettings = {
            botIdFallback: currentEvolutionBotId,
            expire: formData.expire_time || 20,
            keywordFinish: formData.keyword_finish || "#SAIR",
            delayMessage: formData.delay_message || 1000,
            unknownMessage: formData.unknown_message || "Mensagem não reconhecida",
            listeningFromMe: formData.listening_from_me || false,
            stopBotFromMe: formData.stop_bot_from_me || false,
            keepOpen: formData.keep_open || false,
            splitMessages: formData.split_messages || true,
            timePerChar: 50,
            debounceTime: formData.debounce_time || 5,
            ignoreJids: formData.ignore_jids || ["@g.us"],
          }

          const settingsSuccess = await setEvolutionInstanceSettings(instanceName, instanceSettingsPayload)
          if (!settingsSuccess)
            throw new Error("Falha ao definir configurações da instância na Evolution API (bot padrão).")
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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
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

                <div>
                  <Label htmlFor="model_type" className="text-gray-900 dark:text-gray-100">
                    Modelo de IA
                  </Label>
                  <Select
                    name="model_type"
                    value={formData.model ? "custom" : "default"}
                    onValueChange={(value) => {
                      if (value === "default") {
                        setFormData((prev) => ({ ...prev, model: null }))
                      } else {
                        setFormData((prev) => ({ ...prev, model: formData.model || "" }))
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Selecione o tipo de modelo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                      <SelectItem value="default">Modelo Padrão ({systemDefaultModel || "carregando..."})</SelectItem>
                      <SelectItem value="custom">Outro Modelo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Escolha se quer usar o modelo padrão do sistema ou especificar outro modelo
                  </p>
                </div>

                {formData.model !== null && (
                  <div>
                    <Label htmlFor="model" className="text-gray-900 dark:text-gray-100">
                      Nome do Modelo Personalizado *
                    </Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: gpt-4o, claude-3-sonnet, gemini-pro, etc."
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Digite o nome exato do modelo que deseja usar (ex: gpt-4o, gpt-4o-mini, claude-3-sonnet,
                      gemini-pro)
                    </p>
                  </div>
                )}

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
                  Configurações de Ativação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="trigger_type" className="text-gray-900 dark:text-gray-100">
                    Tipo de Ativação
                  </Label>
                  <Select
                    name="trigger_type"
                    value={formData.trigger_type || "keyword"}
                    onValueChange={(value) => {
                      handleSelectChange("trigger_type", value)
                      if (value === "all") {
                        setFormData((prev) => ({ ...prev, is_default: true }))
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Como a IA será ativada" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                      <SelectItem value="keyword">Por Palavra-chave</SelectItem>
                      <SelectItem value="all">Todas as Mensagens (IA Padrão)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Escolha se a IA responde apenas a palavras-chave específicas ou a todas as mensagens
                  </p>
                </div>

                {formData.trigger_type === "keyword" && (
                  <>
                    <div>
                      <Label htmlFor="trigger_operator" className="text-gray-900 dark:text-gray-100">
                        Operador de Comparação
                      </Label>
                      <Select
                        name="trigger_operator"
                        value={formData.trigger_operator || "equals"}
                        onValueChange={(value) => handleSelectChange("trigger_operator", value)}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Como comparar a palavra-chave" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                          <SelectItem value="equals">Igual a</SelectItem>
                          <SelectItem value="contains">Contém</SelectItem>
                          <SelectItem value="startsWith">Começa com</SelectItem>
                          <SelectItem value="endsWith">Termina com</SelectItem>
                          <SelectItem value="regex">Expressão Regular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="trigger_value" className="text-gray-900 dark:text-gray-100">
                        Palavra-chave para Ativar a IA *
                      </Label>
                      <Input
                        id="trigger_value"
                        name="trigger_value"
                        value={formData.trigger_value || ""}
                        onChange={handleInputChange}
                        placeholder="Ex: /bot, !assistente, oi"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                        Palavra ou frase que ativa a IA
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="keyword_finish" className="text-gray-900 dark:text-gray-100">
                    Palavra para Finalizar Conversa
                  </Label>
                  <Input
                    id="keyword_finish"
                    name="keyword_finish"
                    value={formData.keyword_finish || "#sair"}
                    onChange={handleInputChange}
                    placeholder="#sair"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Palavra que o usuário pode enviar para encerrar a conversa com a IA
                  </p>
                </div>

                <div>
                  <Label htmlFor="unknown_message" className="text-gray-900 dark:text-gray-100">
                    Mensagem para Quando Não Entender
                  </Label>
                  <Textarea
                    id="unknown_message"
                    name="unknown_message"
                    value={formData.unknown_message || ""}
                    onChange={handleInputChange}
                    placeholder="Desculpe, não entendi sua mensagem."
                    rows={2}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Mensagem enviada quando a IA não consegue processar a solicitação
                  </p>
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
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        is_default: checked,
                        trigger_type: checked ? "all" : "keyword",
                      }))
                    }}
                    className={switchStyles}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                  <Clock className="w-5 h-5 mr-2" />
                  Configurações de Tempo e Comportamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="debounce_time" className="text-gray-900 dark:text-gray-100">
                      Tempo de Espera (segundos): {formData.debounce_time || 10}
                    </Label>
                    <Slider
                      id="debounce_time"
                      name="debounce_time"
                      min={1}
                      max={60}
                      step={1}
                      value={[formData.debounce_time || 10]}
                      onValueChange={(value) => handleSliderChange("debounce_time", value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Tempo que a IA espera antes de processar uma mensagem
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="delay_message" className="text-gray-900 dark:text-gray-100">
                      Delay entre Mensagens (ms): {formData.delay_message || 1000}
                    </Label>
                    <Slider
                      id="delay_message"
                      name="delay_message"
                      min={100}
                      max={5000}
                      step={100}
                      value={[formData.delay_message || 1000]}
                      onValueChange={(value) => handleSliderChange("delay_message", value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Tempo entre o envio de mensagens consecutivas
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="expire_time" className="text-gray-900 dark:text-gray-100">
                    Tempo de Expiração da Conversa (minutos): {formData.expire_time || 0}{" "}
                    {(formData.expire_time || 0) === 0 ? "(Sem expiração)" : ""}
                  </Label>
                  <Slider
                    id="expire_time"
                    name="expire_time"
                    min={0}
                    max={120}
                    step={5}
                    value={[formData.expire_time || 0]}
                    onValueChange={(value) => handleSliderChange("expire_time", value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Tempo após o qual a conversa expira automaticamente (0 = sem expiração)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="listening_from_me" className="text-gray-900 dark:text-gray-100">
                        Escutar Minhas Mensagens
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        IA responde às suas próprias mensagens
                      </p>
                    </div>
                    <Switch
                      id="listening_from_me"
                      name="listening_from_me"
                      checked={formData.listening_from_me || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, listening_from_me: checked }))}
                      className={switchStyles}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="stop_bot_from_me" className="text-gray-900 dark:text-gray-100">
                        Parar Bot com Minhas Mensagens
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Suas mensagens interrompem o bot
                      </p>
                    </div>
                    <Switch
                      id="stop_bot_from_me"
                      name="stop_bot_from_me"
                      checked={formData.stop_bot_from_me || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, stop_bot_from_me: checked }))}
                      className={switchStyles}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="keep_open" className="text-gray-900 dark:text-gray-100">
                        Manter Conversa Aberta
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Conversa não expira automaticamente
                      </p>
                    </div>
                    <Switch
                      id="keep_open"
                      name="keep_open"
                      checked={formData.keep_open || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, keep_open: checked }))}
                      className={switchStyles}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="split_messages" className="text-gray-900 dark:text-gray-100">
                        Dividir Mensagens Longas
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Quebra mensagens muito longas
                      </p>
                    </div>
                    <Switch
                      id="split_messages"
                      name="split_messages"
                      checked={formData.split_messages || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, split_messages: checked }))}
                      className={switchStyles}
                    />
                  </div>
                </div>
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
                          name="voice_id"
                          value={formData.voice_id || ""}
                          onChange={handleInputChange}
                          placeholder="ID específico da voz do provedor"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                          ID específico da voz no provedor selecionado
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
                        <Label htmlFor="calendar_meeting_id" className="text-gray-900 dark:text-gray-100">
                          ID da Reunião/Calendário
                        </Label>
                        <Input
                          id="calendar_meeting_id"
                          name="calendar_meeting_id"
                          value={formData.calendar_meeting_id || ""}
                          onChange={handleInputChange}
                          placeholder="ID da reunião ou calendário"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                          ID específico da reunião ou calendário para agendamentos
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="chatnode_integration" className="text-gray-900 dark:text-gray-100">
                        Integração Chatnode
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Conectar com plataforma Chatnode.
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
                          Chave API Chatnode
                        </Label>
                        <div className="relative">
                          <Input
                            id="chatnode_api_key"
                            name="chatnode_api_key"
                            type={showChatnodeApiKey ? "text" : "password"}
                            value={formData.chatnode_api_key || ""}
                            onChange={handleInputChange}
                            placeholder="Chave API do Chatnode"
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
                          ID do Bot Chatnode
                        </Label>
                        <Input
                          id="chatnode_bot_id"
                          name="chatnode_bot_id"
                          value={formData.chatnode_bot_id || ""}
                          onChange={handleInputChange}
                          placeholder="ID do bot no Chatnode"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                          ID específico do bot na plataforma Chatnode
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="orimon_integration" className="text-gray-900 dark:text-gray-100">
                        Integração Orimon
                      </Label>
                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        Conectar com plataforma Orimon.
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
                          Chave API Orimon
                        </Label>
                        <div className="relative">
                          <Input
                            id="orimon_api_key"
                            name="orimon_api_key"
                            type={showOrimonApiKey ? "text" : "password"}
                            value={formData.orimon_api_key || ""}
                            onChange={handleInputChange}
                            placeholder="Chave API do Orimon"
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
                          ID do Bot Orimon
                        </Label>
                        <Input
                          id="orimon_bot_id"
                          name="orimon_bot_id"
                          value={formData.orimon_bot_id || ""}
                          onChange={handleInputChange}
                          placeholder="ID do bot no Orimon"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                          ID específico do bot na plataforma Orimon
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
