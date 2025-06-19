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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Sparkles, Users } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { fetchWhatsAppConnections, fetchUsers } from "@/lib/whatsapp-connections"
import { publicApi } from "@/lib/api-client"

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
  voice_id?: string | null
  calendar_integration?: boolean | null
  calendar_api_key?: string | null
  calendar_meeting_id?: string | null
  chatnode_integration?: boolean | null
  chatnode_api_key?: string | null
  chatnode_bot_id?: string | null
  orimon_integration?: string | null
  orimon_api_key?: string | null
  orimon_bot_id?: string | null
  description?: string | null
  status?: string | null
  is_default?: boolean | null
  user_id?: string | null
  whatsapp_connection_id?: string | null
  evolution_bot_id?: string | null
  model?: string | null
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
  voice_id: null,
  calendar_integration: false,
  calendar_api_key: null,
  calendar_meeting_id: null,
  chatnode_integration: false,
  chatnode_api_key: null,
  chatnode_bot_id: null,
  orimon_integration: false,
  orimon_api_key: null,
  orimon_bot_id: null,
  description: null,
  status: "active",
  is_default: false,
  user_id: "",
  whatsapp_connection_id: null,
  evolution_bot_id: null,
  model: null,
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
  ignore_jids: ["@g.us"],
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
  const [showVoiceApiKey, setShowVoiceApiKey] = useState(false)
  const [showCalendarApiKey, setShowCalendarApiKey] = useState(false)
  const [showChatnodeApiKey, setShowChatnodeApiKey] = useState(false)
  const [showOrimonApiKey, setShowOrimonApiKey] = useState(false)
  const [systemDefaultModel, setSystemDefaultModel] = useState<string | null>(null)
  const [showCurlModal, setShowCurlModal] = useState(false)
  const [curlInput, setCurlInput] = useState("")
  const [curlDescription, setCurlDescription] = useState("")
  const [showIgnoreJidsWarning, setShowIgnoreJidsWarning] = useState(false)
  const [showGroupsProtectionWarning, setShowGroupsProtectionWarning] = useState(false)
  const [newIgnoreJid, setNewIgnoreJid] = useState("")
  const [pendingSubmit, setPendingSubmit] = useState(false)

  const isAdmin = currentUser?.role === "admin"

  // Função para garantir que @g.us esteja sempre presente
  const ensureGroupsProtection = (jids: string[] | null): string[] => {
    const currentJids = jids || []
    if (!currentJids.includes("@g.us")) {
      return ["@g.us", ...currentJids]
    }
    return currentJids
  }

  useEffect(() => {
    const loadSystemDefaultModel = async () => {
      if (!open) return

      try {
        console.log("🔄 [AgentModal] Carregando modelo padrão do sistema via API...")
        setSystemDefaultModel("carregando...")

        const response = await publicApi.getSystemDefaultModel()

        if (response.error) {
          console.error("❌ [AgentModal] Erro ao buscar default_model:", response.error)
          setSystemDefaultModel("Erro ao carregar")
        } else if (response.data?.defaultModel) {
          const systemDefaultModel = response.data.defaultModel.toString().trim()
          console.log("✅ [AgentModal] Default model encontrado:", systemDefaultModel)
          setSystemDefaultModel(systemDefaultModel)
        } else {
          console.error("❌ [AgentModal] default_model não encontrado")
          setSystemDefaultModel("Não configurado")
        }
      } catch (error) {
        console.error("❌ [AgentModal] Erro ao carregar modelo padrão:", error)
        setSystemDefaultModel("Erro ao carregar")
      }
    }

    loadSystemDefaultModel()
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
    console.log("🔄 [AgentModal] useEffect - agent changed:", {
      agentExists: !!agent,
      agentId: agent?.id,
      agentName: agent?.name,
      currentUser: currentUser?.id,
      selectedUserId,
      isAdmin,
    })

    if (agent) {
      console.log("📝 [AgentModal] Dados COMPLETOS do agente recebido:", agent)

      // Processar ignore_jids se for string JSON
      let processedIgnoreJids = agent.ignore_jids
      if (typeof agent.ignore_jids === "string") {
        try {
          processedIgnoreJids = JSON.parse(agent.ignore_jids)
          console.log("✅ [AgentModal] ignore_jids processado de string para array:", processedIgnoreJids)
        } catch (e) {
          console.warn("⚠️ [AgentModal] Erro ao processar ignore_jids:", e)
          processedIgnoreJids = ["@g.us"]
        }
      }

      // Carregar dados do agente existente
      const agentData = {
        ...agent,
        user_id: agent.user_id || selectedUserId || currentUser?.id || "",
        transcribe_audio: Boolean(agent.transcribe_audio),
        understand_images: Boolean(agent.understand_images),
        voice_response_enabled: Boolean(agent.voice_response_enabled),
        calendar_integration: Boolean(agent.calendar_integration),
        chatnode_integration: Boolean(agent.chatnode_integration),
        orimon_integration: Boolean(agent.orimon_integration),
        is_default: Boolean(agent.is_default),
        listening_from_me: Boolean(agent.listening_from_me),
        stop_bot_from_me: Boolean(agent.stop_bot_from_me),
        keep_open: Boolean(agent.keep_open),
        split_messages: Boolean(agent.split_messages),
        ignore_jids: ensureGroupsProtection(processedIgnoreJids),
      }

      console.log("✅ [AgentModal] Dados processados para o formulário:", {
        name: agentData.name,
        identity_description: agentData.identity_description,
        training_prompt: agentData.training_prompt,
        voice_response_enabled: agentData.voice_response_enabled,
        voice_provider: agentData.voice_provider,
        voice_api_key: agentData.voice_api_key ? "***PRESENTE***" : "AUSENTE",
        voice_id: agentData.voice_id,
        calendar_integration: agentData.calendar_integration,
        calendar_api_key: agentData.calendar_api_key ? "***PRESENTE***" : "AUSENTE",
        calendar_meeting_id: agentData.calendar_meeting_id,
        chatnode_integration: agentData.chatnode_integration,
        orimon_integration: agentData.orimon_integration,
      })

      setFormData(agentData)

      if (isAdmin && agent.user_id) {
        setSelectedUserId(agent.user_id)
      }
    } else {
      console.log("🆕 [AgentModal] Criando novo agente")
      setFormData({
        ...initialFormData,
        user_id: selectedUserId || currentUser?.id || "",
        ignore_jids: ["@g.us"],
      })
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

  const handleAddIgnoreJid = () => {
    if (!newIgnoreJid.trim()) return

    const currentJids = formData.ignore_jids || ["@g.us"]
    if (!currentJids.includes(newIgnoreJid.trim())) {
      setFormData((prev) => ({
        ...prev,
        ignore_jids: [...currentJids, newIgnoreJid.trim()],
      }))
    }
    setNewIgnoreJid("")
  }

  const handleRemoveIgnoreJid = (jidToRemove: string) => {
    if (jidToRemove === "@g.us") {
      setShowIgnoreJidsWarning(true)
      return
    }

    const currentJids = formData.ignore_jids || ["@g.us"]
    setFormData((prev) => ({
      ...prev,
      ignore_jids: currentJids.filter((jid) => jid !== jidToRemove),
    }))
  }

  const confirmRemoveGroupsJid = () => {
    const currentJids = formData.ignore_jids || ["@g.us"]
    setFormData((prev) => ({
      ...prev,
      ignore_jids: currentJids.filter((jid) => jid !== "@g.us"),
    }))
    setShowIgnoreJidsWarning(false)
  }

  const convertCurlToDescription = () => {
    if (!curlInput.trim()) return

    const lines = curlInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
    let method = "GET"
    let url = ""
    const headersArray: string[] = []
    let localBody = ""

    lines.forEach((line) => {
      if (line.includes("-X ") || line.includes("--request ")) {
        method = line.split(/(-X |--request )/)[2]?.split(" ")[0] || "GET"
      }

      const headerMatch = line.match(/(-H |--header )\s*(['"])(.*?)\2/)
      if (headerMatch && headerMatch[3]) {
        headersArray.push(headerMatch[3])
      } else {
        const headerMatchNoQuotes = line.match(/(-H |--header )\s*([^'"].*)/)
        if (headerMatchNoQuotes && headerMatchNoQuotes[2]) {
          headersArray.push(headerMatchNoQuotes[2].trim())
        }
      }

      const dataMatchWithQuotes = line.match(/(-d|--data(?:-raw)?)\s*(['"])([\s\S]*?)\2/)
      if (dataMatchWithQuotes && typeof dataMatchWithQuotes[3] === "string") {
        localBody = dataMatchWithQuotes[3]
      } else {
        const dataMatchWithoutQuotes = line.match(/(-d|--data(?:-raw)?)\s+(.+)/)
        if (dataMatchWithoutQuotes && typeof dataMatchWithoutQuotes[2] === "string" && !localBody) {
          const potentialBody = dataMatchWithoutQuotes[2].trim()
          if (!potentialBody.startsWith("-")) {
            localBody = potentialBody
          }
        }
      }

      if (line.startsWith("curl ") || (!line.startsWith("-") && line.includes("http"))) {
        const urlMatch = line.match(/https?:\/\/[^\s'"]+/)
        if (urlMatch) {
          url = urlMatch[0]
        }
      }
    })

    const description = curlDescription.trim() || "[Descreva o que este endpoint faz]"

    const formattedHeaders = headersArray.length > 0 ? headersArray.map((h) => `header: ${h}`).join("\n") : "header: {}"
    const formattedBody = localBody ? `body: ${localBody}` : "body: {}"

    const newEndpoint = `
Descrição: ${description}

${method.toUpperCase()}: ${url}
${formattedHeaders}
${formattedBody}
query: {}

_______________________________________
`

    const currentDescription = formData.description || ""
    setFormData((prev) => ({
      ...prev,
      description: currentDescription + newEndpoint,
    }))

    setCurlInput("")
    setCurlDescription("")
    setShowCurlModal(false)
  }

  const proceedWithSubmit = async () => {
    setShowGroupsProtectionWarning(false)
    setPendingSubmit(false)
    await performSubmit()
  }

  const performSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🔄 [AgentModal] Iniciando salvamento via API...")

      const validTriggerType =
        formData.trigger_type && ["keyword", "all"].includes(formData.trigger_type)
          ? formData.trigger_type
          : formData.is_default
            ? "all"
            : "keyword"

      const validTriggerOperator =
        formData.trigger_operator &&
        ["equals", "contains", "startsWith", "endsWith", "regex"].includes(formData.trigger_operator)
          ? formData.trigger_operator
          : "equals"

      const finalIgnoreJids = ensureGroupsProtection(formData.ignore_jids)

      const agentPayload = {
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
        voice_id: formData.voice_id,
        calendar_integration: formData.calendar_integration,
        calendar_api_key: formData.calendar_api_key,
        calendar_meeting_id: formData.calendar_meeting_id,
        chatnode_integration: formData.chatnode_integration,
        chatnode_api_key: formData.chatnode_api_key,
        chatnode_bot_id: formData.chatnode_bot_id,
        orimon_integration: formData.orimon_integration,
        orimon_api_key: formData.orimon_api_key,
        orimon_bot_id: formData.orimon_bot_id,
        description: formData.description,
        status: formData.status,
        is_default: formData.is_default,
        user_id: formData.user_id,
        whatsapp_connection_id: formData.whatsapp_connection_id,
        evolution_bot_id: formData.evolution_bot_id,
        model: formData.model || systemDefaultModel,
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
        ignore_jids: finalIgnoreJids,
      }

      let response
      if (isEditing && agent?.id) {
        // Atualizar agente existente
        console.log("🔄 [AgentModal] Atualizando agente via API:", agent.id)
        response = await fetch("/api/admin/agents", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: agent.id, ...agentPayload }),
        })
      } else {
        // Criar novo agente
        console.log("🔄 [AgentModal] Criando novo agente via API")
        response = await fetch("/api/admin/agents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(agentPayload),
        })
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ [AgentModal] Erro na resposta da API:", response.status, errorText)
        throw new Error(`Erro na API: ${response.status}`)
      }

      const result = await response.json()
      console.log("✅ [AgentModal] Agente salvo com sucesso:", result)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (maxAgentsReached && !isEditing) {
      setError("Você atingiu o limite máximo de agentes.")
      return
    }

    if (!formData.name.trim()) {
      setError("O nome da IA é obrigatório.")
      return
    }
    if (!formData.user_id) {
      setError(isAdmin ? "É necessário selecionar um usuário." : "Erro: ID de usuário não encontrado.")
      return
    }
    if (!formData.whatsapp_connection_id) {
      setError("A conexão WhatsApp é obrigatória.")
      return
    }
    if (!formData.trigger_value?.trim() && formData.trigger_type === "keyword") {
      setError("A palavra-chave de ativação é obrigatória para bots com ativação por palavra-chave.")
      return
    }
    if (!formData.training_prompt?.trim()) {
      setError("O prompt de treinamento é obrigatório.")
      return
    }

    const currentJids = formData.ignore_jids || []
    if (!currentJids.includes("@g.us")) {
      setPendingSubmit(true)
      setShowGroupsProtectionWarning(true)
      return
    }

    await performSubmit()
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
          </div>

          {/* Modal de Aviso para Remoção de @g.us */}
          {showIgnoreJidsWarning && (
            <Dialog open={showIgnoreJidsWarning} onOpenChange={setShowIgnoreJidsWarning}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-red-600 flex items-center">
                    ⚠️ Atenção: Configuração Importante
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Você está tentando remover <strong>@g.us</strong> da lista de JIDs ignorados.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Por que isso é importante?</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>
                        • <strong>@g.us</strong> representa todos os grupos do WhatsApp
                      </li>
                      <li>• Sem essa proteção, sua IA será ativada em TODOS os grupos</li>
                      <li>• Isso pode incomodar outros membros dos grupos</li>
                      <li>• Pode gerar spam e prejudicar a experiência dos usuários</li>
                      <li>• Sua conta pode ser banida por comportamento inadequado</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      <strong>Recomendação:</strong> Mantenha sempre <strong>@g.us</strong> na lista para proteger sua
                      conta e respeitar outros usuários.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowIgnoreJidsWarning(false)}>
                    Cancelar (Recomendado)
                  </Button>
                  <Button variant="destructive" onClick={confirmRemoveGroupsJid}>
                    Remover Mesmo Assim
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Modal de Aviso para Salvar sem Proteção de Grupos */}
          {showGroupsProtectionWarning && (
            <Dialog open={showGroupsProtectionWarning} onOpenChange={setShowGroupsProtectionWarning}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-orange-600 flex items-center">
                    🚨 Aviso: Proteção contra Grupos Desativada
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Você está tentando salvar o agente sem a proteção <strong>@g.us</strong> ativada.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 mb-2">⚠️ Riscos de continuar sem proteção:</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Sua IA será ativada em TODOS os grupos do WhatsApp</li>
                      <li>• Pode gerar spam massivo e incomodar outros usuários</li>
                      <li>• Risco de banimento da sua conta WhatsApp</li>
                      <li>• Violação das boas práticas de uso do WhatsApp</li>
                      <li>• Experiência ruim para outros membros dos grupos</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700">
                      <strong>Recomendação:</strong> Clique em "Adicionar Proteção" para que o sistema adicione
                      automaticamente <strong>@g.us</strong> à lista de JIDs ignorados.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        ignore_jids: ensureGroupsProtection(prev.ignore_jids),
                      }))
                      setShowGroupsProtectionWarning(false)
                      setPendingSubmit(false)
                    }}
                  >
                    Adicionar Proteção (Recomendado)
                  </Button>
                  <Button variant="destructive" onClick={proceedWithSubmit}>
                    Continuar sem Proteção
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

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
