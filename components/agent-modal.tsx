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
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles, Eye, EyeOff, Volume2, Users, MessageSquare, Clock, Search, Filter } from "lucide-react"
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
  description?: string | null // Adicionar esta linha
  status?: string | null
  is_default?: boolean | null
  user_id?: string | null
  whatsapp_connection_id?: string | null
  evolution_bot_id?: string | null
  model?: string | null
  model_config?: string | null // Provedor LLM (openai, anthropic, etc.)
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
  description: null, // Adicionar esta linha
  status: "active",
  is_default: false,
  user_id: "",
  whatsapp_connection_id: null,
  evolution_bot_id: null,
  model: null,
  model_config: null,
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
  const [n8nIntegrationConfig, setN8nIntegrationConfig] = useState<any>(null)
  const [showVoiceApiKey, setShowVoiceApiKey] = useState(false)
  const [showCalendarApiKey, setShowCalendarApiKey] = useState(false)
  const [showChatnodeApiKey, setShowChatnodeApiKey] = useState(false) // Adicionar esta linha
  const [showOrimonApiKey, setShowOrimonApiKey] = useState(false) // Adicionar esta linha
  const [evolutionSyncStatus, setEvolutionSyncStatus] = useState<string>("")
  const [systemDefaultModel, setSystemDefaultModel] = useState<string | null>(null)
  const [llmConfig, setLlmConfig] = useState<any>(null)
  const [loadingLlmConfig, setLoadingLlmConfig] = useState(false)
  const [modelSelection, setModelSelection] = useState<"default" | "custom">("default")
  const [showCurlModal, setShowCurlModal] = useState(false)
  const [curlInput, setCurlInput] = useState("")
  const [curlDescription, setCurlDescription] = useState("")
  const [showIgnoreJidsWarning, setShowIgnoreJidsWarning] = useState(false)
  const [showGroupsProtectionWarning, setShowGroupsProtectionWarning] = useState(false)
  const [tempIgnoreJids, setTempIgnoreJids] = useState<string[]>([])
  const [newIgnoreJid, setNewIgnoreJid] = useState("")
  const [pendingSubmit, setPendingSubmit] = useState(false)

  // Estados para filtros de conexão
  const [connectionSearch, setConnectionSearch] = useState("")
  const [connectionApiTypeFilter, setConnectionApiTypeFilter] = useState<string>("all")

  // Função para filtrar conexões
  const filteredConnections = whatsappConnections.filter((conn) => {
    // Filtro por busca (nome ou telefone)
    const matchesSearch = 
      connectionSearch === "" ||
      conn.connection_name?.toLowerCase().includes(connectionSearch.toLowerCase()) ||
      conn.phone_number?.toLowerCase().includes(connectionSearch.toLowerCase())

    // Filtro por tipo de API
    const matchesApiType =
      connectionApiTypeFilter === "all" ||
      (conn.api_type || "evolution") === connectionApiTypeFilter

    return matchesSearch && matchesApiType
  })

  // Estados para Uazapi
  const [selectedConnectionApiType, setSelectedConnectionApiType] = useState<string | null>(null)
  const [botFormData, setBotFormData] = useState({
    bot_gatilho: "Todos",
    bot_operador: "Contém",
    bot_value: "",
    bot_debounce: 5,
    bot_splitMessage: 2,
    bot_ignoreJids: ["@g.us"], // Array igual ao Evolution
    bot_padrao: false, // Bot padrão da conexão
  })
  const [newBotIgnoreJid, setNewBotIgnoreJid] = useState("")
  const [showBotIgnoreJidsWarning, setShowBotIgnoreJidsWarning] = useState(false)

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

        // Usar API segura ao invés de Supabase direto
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

  // Função SEGURA para carregar configurações LLM
  const loadLlmConfig = async () => {
    if (!open) return

    try {
      console.log("🔄 [AgentModal] Carregando configurações LLM via API segura...")
      setLoadingLlmConfig(true)

      const response = await fetch("/api/system/llm-config", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.config) {
        console.log("✅ [AgentModal] Configurações LLM carregadas:", data.config)
        setLlmConfig(data.config)
      } else {
        throw new Error(data.error || "Erro desconhecido ao carregar configurações LLM")
       }
    } catch (error: any) {
       console.error("❌ [AgentModal] Erro ao carregar configurações LLM:", error)
      toast({
        title: "Erro ao carregar configurações LLM",
        description: error.message || error.toString(),
        variant: "destructive"
      })
      setLlmConfig(null)
    } finally {
      setLoadingLlmConfig(false)
    }
  }

    loadSystemDefaultModel()
    loadLlmConfig()
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
      // Usar API ao invés de Supabase direto
      console.log("🔄 [AgentModal] Carregando configuração N8N via API...")
      // Por enquanto, vamos comentar esta funcionalidade até ter a API específica
      console.warn("⚠️ [AgentModal] Configuração N8N temporariamente desabilitada - usar API específica")
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
        ...agent, // Usar todos os dados do agente primeiro
        user_id: agent.user_id || selectedUserId || currentUser?.id || "",
        // Garantir que campos booleanos sejam tratados corretamente
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
        // Garantir que @g.us esteja sempre presente
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
        model: agentData.model,
        model_config: agentData.model_config,
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
        ignore_jids: ["@g.us"], // Garantir proteção padrão
      })
    }
  }, [agent, currentUser, selectedUserId, isAdmin])

  // useEffect para detectar o api_type da conexão quando editando um agente (busca do BACKEND)
  useEffect(() => {
    const fetchConnectionApiType = async () => {
      // Só buscar se estiver editando um agente e ele tiver uma conexão
      if (!agent || !agent.whatsapp_connection_id) {
        console.log("🔍 [AgentModal] Não está editando ou não tem conexão, resetando api_type")
        setSelectedConnectionApiType(null)
        return
      }

      try {
        console.log("🔄 [AgentModal] Buscando api_type da conexão do BACKEND:", agent.whatsapp_connection_id)
        
        // Buscar dados da conexão via API (BACKEND)
        const response = await fetch(`/api/whatsapp-connections/info/${agent.whatsapp_connection_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.success && data.connection) {
          const apiType = data.connection.api_type || "evolution"
          console.log("✅ [AgentModal] API Type detectado do BACKEND:", apiType)
          setSelectedConnectionApiType(apiType)
          
          // Se for Uazapi e o agente tiver bot_id, buscar dados do bot
          if (apiType === "uazapi" && agent.bot_id) {
            console.log("🤖 [AgentModal] Agente Uazapi detectado, buscando dados do bot...")
            try {
              const botResponse = await fetch(`/api/bots/${agent.bot_id}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              })

              if (botResponse.ok) {
                const botData = await botResponse.json()
                if (botData.success && botData.bot) {
                  console.log("✅ [AgentModal] Dados do bot Uazapi carregados:", botData.bot)
                  
                  // Converter ignoreJids de string para array
                  let ignoreJidsArray = ["@g.us"]
                  if (botData.bot.ignoreJids) {
                    const jidsString = botData.bot.ignoreJids.replace(/,\s*$/, "") // Remove vírgula final
                    ignoreJidsArray = jidsString.split(",").map((jid: string) => jid.trim()).filter(Boolean)
                  }

                  // Preencher botFormData com os dados do bot
                  setBotFormData({
                    bot_gatilho: botData.bot.gatilho || "Todos",
                    bot_operador: botData.bot.operador_gatilho || "Contém",
                    bot_value: botData.bot.value_gatilho || "",
                    bot_debounce: botData.bot.debounce || 5,
                    bot_splitMessage: botData.bot.splitMessage || 2,
                    bot_ignoreJids: ignoreJidsArray,
                    bot_padrao: Boolean(botData.bot.padrao) || false,
                  })
                  console.log("✅ [AgentModal] botFormData preenchido com dados do bot")
                }
              }
            } catch (botError) {
              console.warn("⚠️ [AgentModal] Erro ao buscar dados do bot:", botError)
            }
          }
        } else {
          throw new Error(data.error || "Erro ao buscar dados da conexão")
        }
      } catch (error: any) {
        console.error("❌ [AgentModal] Erro ao buscar api_type da conexão:", error)
        // Em caso de erro, assumir evolution por padrão
        setSelectedConnectionApiType("evolution")
      }
    }

    fetchConnectionApiType()
  }, [agent, open])

  // useEffect específico para sincronizar modelSelection com o modelo do agente APENAS na inicialização
  useEffect(() => {
    // APENAS sincronizar quando abrindo o modal com um agente existente
    // NÃO interferir durante a digitação do usuário
    if (agent && formData.model && formData.model_config && llmConfig?.default_models && open) {
      const selectedProvider = formData.model_config
      const defaultModel = llmConfig.default_models[selectedProvider]
      
      // Se o modelo do agente é igual ao modelo padrão do provedor, usar "default"
      // Caso contrário, usar "custom"
      if (formData.model === defaultModel) {
        setModelSelection("default")
        console.log("✅ [AgentModal] Modelo padrão detectado, definindo modelSelection como 'default'")
      } else {
        setModelSelection("custom")
        console.log("✅ [AgentModal] Modelo personalizado detectado, definindo modelSelection como 'custom'")
      }
    } else if (!agent && open) {
      // Para novo agente, sempre usar modelo padrão
      setModelSelection("default")
    }
  }, [agent, formData.model_config, llmConfig, open]) // ⚠️ REMOVIDO formData.model da dependência!

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
      setTempIgnoreJids(formData.ignore_jids || [])
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

  // Funções para manipular bot_ignoreJids (Uazapi)
  const handleAddBotIgnoreJid = () => {
    if (!newBotIgnoreJid.trim()) return

    const currentJids = botFormData.bot_ignoreJids || ["@g.us"]
    if (!currentJids.includes(newBotIgnoreJid.trim())) {
      setBotFormData((prev) => ({
        ...prev,
        bot_ignoreJids: [...currentJids, newBotIgnoreJid.trim()],
      }))
    }
    setNewBotIgnoreJid("")
  }

  const handleRemoveBotIgnoreJid = (jidToRemove: string) => {
    if (jidToRemove === "@g.us") {
      setShowBotIgnoreJidsWarning(true)
      return
    }

    const currentJids = botFormData.bot_ignoreJids || ["@g.us"]
    setBotFormData((prev) => ({
      ...prev,
      bot_ignoreJids: currentJids.filter((jid) => jid !== jidToRemove),
    }))
  }

  const confirmRemoveBotGroupsJid = () => {
    const currentJids = botFormData.bot_ignoreJids || ["@g.us"]
    setBotFormData((prev) => ({
      ...prev,
      bot_ignoreJids: currentJids.filter((jid) => jid !== "@g.us"),
    }))
    setShowBotIgnoreJidsWarning(false)
  }

  const convertCurlToDescription = () => {
    if (!curlInput.trim()) return

    // Parse básico do cURL
    const lines = curlInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
    let method = "GET"
    let url = ""
    const headersArray: string[] = []
    let localBody = "" // Usar uma variável local para o body

    lines.forEach((line) => {
      if (line.includes("-X ") || line.includes("--request ")) {
        method = line.split(/(-X |--request )/)[2]?.split(" ")[0] || "GET"
      }

      // Captura de Headers
      const headerMatch = line.match(/(-H |--header )\s*(['"])(.*?)\2/) // Regex para header com aspas
      if (headerMatch && headerMatch[3]) {
        headersArray.push(headerMatch[3])
      } else {
        const headerMatchNoQuotes = line.match(/(-H |--header )\s*([^'"].*)/) // Regex para header sem aspas em volta do valor completo
        if (headerMatchNoQuotes && headerMatchNoQuotes[2]) {
          headersArray.push(headerMatchNoQuotes[2].trim())
        }
      }

      // Captura de Body (-d, --data, --data-raw)
      // Tenta capturar body delimitado por aspas primeiro
      const dataMatchWithQuotes = line.match(/(-d|--data(?:-raw)?)\s*(['"])([\s\S]*?)\2/)
      if (dataMatchWithQuotes && typeof dataMatchWithQuotes[3] === "string") {
        localBody = dataMatchWithQuotes[3]
      } else {
        // Se não encontrar com aspas, tenta capturar body não delimitado por aspas
        // (ex: -d foo=bar ou -d '{"key":"val"}' onde o shell remove as aspas externas)
        const dataMatchWithoutQuotes = line.match(/(-d|--data(?:-raw)?)\s+(.+)/)
        if (dataMatchWithoutQuotes && typeof dataMatchWithoutQuotes[2] === "string" && !localBody) {
          // só preenche se não foi preenchido antes
          // Verifica se o que foi capturado não é um novo argumento -H, etc.
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

      // Detectar automaticamente se é contexto de admin ou usuário
      const isAdminContext = typeof window !== 'undefined' && window.location.pathname.includes('/admin/')
      console.log(`🔍 [AgentModal] Contexto detectado: ${isAdminContext ? 'ADMIN' : 'USUÁRIO'}`)

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

      // Garantir que @g.us esteja sempre presente antes de salvar
      const finalIgnoreJids = ensureGroupsProtection(formData.ignore_jids)

      // Payload completo para a API
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
        model: formData.model ? String(formData.model) : (systemDefaultModel || "gpt-4o-mini"),
      model_config: formData.model_config || "openai",
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
        ignore_jids: finalIgnoreJids,
        // Campos para bot Uazapi (apenas se for uazapi)
        ...(selectedConnectionApiType === "uazapi" && {
          bot_gatilho: botFormData.bot_gatilho,
          bot_operador: botFormData.bot_operador,
          bot_value: botFormData.bot_value,
          bot_debounce: botFormData.bot_debounce,
          bot_splitMessage: botFormData.bot_splitMessage,
          bot_ignoreJids: botFormData.bot_ignoreJids, // Array - será convertido para string no servidor
          bot_padrao: botFormData.bot_padrao,
        }),
      }

      // Escolher a API correta baseada no contexto
      const baseApiPath = isAdminContext ? "/api/admin/agents" : "/api/user/agents"
      
      let response
      if (isEditing && agent?.id) {
        // Atualizar agente existente
        console.log(`🔄 [AgentModal] Atualizando agente via API (${isAdminContext ? 'admin' : 'usuário'}):`, agent.id)
        
        if (isAdminContext) {
          // Para admin: usar PUT com ID no payload
          response = await fetch(baseApiPath, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: agent.id, ...agentPayload }),
          })
        } else {
          // Para usuário: usar PUT com ID na URL
          response = await fetch(`${baseApiPath}/${agent.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(agentPayload),
          })
        }
      } else {
        // Criar novo agente
        console.log(`🔄 [AgentModal] Criando novo agente via API (${isAdminContext ? 'admin' : 'usuário'})`)
        response = await fetch(baseApiPath, {
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
    // ============================================
    // VALIDAÇÕES DE UX (Frontend - apenas para melhorar experiência)
    // As validações REAIS e de SEGURANÇA estão no BACKEND
    // ============================================
    
    // Validação específica para Evolution (NÃO validar para Uazapi)
    if (selectedConnectionApiType !== "uazapi" && !formData.trigger_value?.trim() && formData.trigger_type === "keyword") {
      setError("A palavra-chave de ativação é obrigatória para bots com ativação por palavra-chave.")
      return
    }
    
    // Validação de UX para Uazapi (backend valida novamente por segurança)
    if (selectedConnectionApiType === "uazapi" && botFormData.bot_gatilho === "Palavra-chave" && !botFormData.bot_value?.trim()) {
      setError("A palavra-chave do bot é obrigatória quando o gatilho é 'Palavra-chave'.")
      return
    }
    if (!formData.training_prompt?.trim()) {
      setError("O prompt de treinamento é obrigatório.")
      return
    }

    // Verificar se @g.us está presente
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">
                      Descrição de APIs (Integrações Personalizadas)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCurlModal(true)}
                      className="text-xs"
                    >
                      + Adicionar cURL
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    placeholder={`Exemplo de formato:

Descrição: Para consultar CPF de clientes ativos

GET: https://webhook.nexo3.com.br/webhook/CONSULTA_CPF
header: APIKEY:40028922
body: cpf:cpf do cliente sem pontos traços ou vírgulas apenas números
query: {}

_______________________________________

Descrição: Para buscar produtos no e-commerce

POST: https://api.exemplo.com/produtos
header: Authorization:Bearer token_aqui
body: {"categoria": "categoria_desejada", "limite": 10}
query: {}

_______________________________________`}
                    rows={12}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Para usar integrações que não estão disponíveis nativamente, descreva aqui as APIs que o agente pode
                    usar. Separe cada endpoint com uma linha de underscores.
                    <br />
                    <strong>Importante:</strong> Caso o endpoint não tenha header, body ou query, não deixe vazio -
                    sempre coloque as chaves vazias {} para evitar erros na requisição.
                  </p>
                </div>

                {/* Modal para cURL */}
                {showCurlModal && (
                  <Dialog open={showCurlModal} onOpenChange={setShowCurlModal}>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Converter cURL para Endpoint</DialogTitle>
                        <DialogDescription>
                          Cole seu comando cURL aqui e ele será convertido para o formato de endpoint
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="curl_description" className="text-gray-900 dark:text-gray-100">
                            Descrição do Endpoint
                          </Label>
                          <Input
                            id="curl_description"
                            value={curlDescription}
                            onChange={(e) => setCurlDescription(e.target.value)}
                            placeholder="Ex: Para consultar CPF de clientes ativos"
                            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          />
                          <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                            Descreva o que este endpoint faz
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="curl_input" className="text-gray-900 dark:text-gray-100">
                            Comando cURL
                          </Label>
                          <Textarea
                            id="curl_input"
                            value={curlInput}
                            onChange={(e) => setCurlInput(e.target.value)}
                            placeholder={`Cole seu cURL aqui, exemplo:

curl -X POST "https://api.exemplo.com/endpoint" \\
-H "Authorization: Bearer token" \\
-H "Content-Type: application/json" \\
-d '{"campo": "valor"}'`}
                            rows={8}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCurlModal(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={convertCurlToDescription}>Converter e Adicionar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

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

                {/* Seção SEGURA de Configuração de LLM */}
                <div>
                  <Label htmlFor="model_config" className="text-gray-900 dark:text-gray-100">
                    Provedor de IA 🔒
                  </Label>
                  <Select
                    name="model_config"
                    value={formData.model_config || ""}
                    onValueChange={(value) => {
                      console.log("🔄 [AgentModal] Provedor selecionado:", value)
                      // Ao trocar provedor, automaticamente usar o modelo padrão desse provedor
                      const defaultModelForProvider = llmConfig?.default_models?.[value] || systemDefaultModel || "gpt-4o-mini"
                      console.log("📋 [AgentModal] Modelo padrão para", value, ":", defaultModelForProvider)
                      setFormData((prev) => ({ 
                        ...prev, 
                        model_config: value,
                        model: String(defaultModelForProvider)
                      }))
                      // Quando trocar de provedor, usar modelo padrão
                      setModelSelection("default")
                    }}
                    disabled={loadingLlmConfig || !llmConfig}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder={loadingLlmConfig ? "Carregando provedores..." : "Selecione o provedor de IA"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                      {(() => {
                        // Garantir que available_providers seja sempre um array
                        const providers = llmConfig?.available_providers;
                        
                        if (loadingLlmConfig) {
                          return (
                            <SelectItem value="loading" disabled>
                              Carregando provedores...
                            </SelectItem>
                          );
                        }
                        
                        if (!providers) {
                          return (
                            <SelectItem value="openai">
                              OpenAI (GPT) - Padrão
                            </SelectItem>
                          );
                        }
                        
                        // Se providers for um array, usar normalmente
                        if (Array.isArray(providers)) {
                          return providers.map((provider: string) => {
                            const getProviderName = (provider: string) => {
                              switch (provider) {
                                case "openai": return "OpenAI (GPT)";
                                case "anthropic": return "Anthropic (Claude)";
                                case "google": return "Google (Gemini)";
                                case "ollama": return "Ollama (Local)";
                                case "groq": return "Groq (Fast)";
                                default: return provider;
                              }
                            };
                            
                            return (
                        <SelectItem key={provider} value={provider}>
                                {getProviderName(provider)}
                        </SelectItem>
                            );
                          });
                        }
                        
                        // Se providers for um objeto (caso de erro), extrair as chaves
                        if (typeof providers === 'object' && providers !== null) {
                          return Object.keys(providers).map((provider: string) => {
                            const getProviderName = (provider: string) => {
                              switch (provider) {
                                case "openai": return "OpenAI (GPT)";
                                case "anthropic": return "Anthropic (Claude)";
                                case "google": return "Google (Gemini)";
                                case "ollama": return "Ollama (Local)";
                                case "groq": return "Groq (Fast)";
                                default: return provider;
                              }
                            };
                            
                            return (
                              <SelectItem key={provider} value={provider}>
                                {getProviderName(provider)}
                        </SelectItem>
                            );
                          });
                        }
                        
                        // Fallback final
                        return (
                          <SelectItem value="openai">
                            OpenAI (GPT) - Padrão
                          </SelectItem>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                    Escolha qual provedor de IA será usado (configurações carregadas do servidor)
                  </p>
                </div>

                {formData.model_config && (
                  <div>
                    <Label htmlFor="model_selection" className="text-gray-900 dark:text-gray-100">
                      Modelo Específico 🎯
                    </Label>
                    <Select
                      name="model_selection"
                      value={modelSelection}
                      onValueChange={(value: "default" | "custom") => {
                        console.log("🎯 [AgentModal] Usuário mudou seleção de modelo para:", value)
                        setModelSelection(value)
                        
                        if (value === "default") {
                          const selectedProvider = formData.model_config || "openai"
                          const defaultModel = llmConfig?.default_models?.[selectedProvider] || systemDefaultModel || "gpt-4o-mini"
                          console.log("🔧 [AgentModal] Definindo modelo padrão:", defaultModel, "para provedor:", selectedProvider)
                          setFormData((prev) => ({ ...prev, model: String(defaultModel) }))
                        } else {
                          console.log("🔧 [AgentModal] Usuário escolheu modelo personalizado - mantendo valor atual ou limpando")
                          // Se já tem um valor personalizado, manter. Se não, limpar para o usuário digitar
                          const currentModel = formData.model || ""
                          const selectedProvider = formData.model_config || "openai"
                          const defaultModel = llmConfig?.default_models?.[selectedProvider] || systemDefaultModel || "gpt-4o-mini"
                          
                          // Se o modelo atual é o padrão, limpar para o usuário digitar um personalizado
                          if (currentModel === defaultModel) {
                            setFormData((prev) => ({ ...prev, model: "" }))
                          }
                          // Se já é um modelo personalizado, manter o valor atual
                        }
                      }}
                    >
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Usar modelo padrão ou personalizado" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                        <SelectItem value="default">
                          Modelo Padrão ({(() => {
                            const selectedProvider = formData.model_config || "openai"
                            const defaultModel = llmConfig?.default_models?.[selectedProvider]
                            return defaultModel || systemDefaultModel || "carregando..."
                          })()})
                        </SelectItem>
                        <SelectItem value="custom">Modelo Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Use o modelo padrão recomendado ou especifique um modelo específico
                  </p>
                </div>
                )}

                {formData.model_config && modelSelection === "custom" && (
                  <div>
                    <Label htmlFor="model" className="text-gray-900 dark:text-gray-100">
                      Nome do Modelo Personalizado * 🔧
                    </Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model || ""}
                      onChange={handleInputChange}
                      placeholder={
                        formData.model_config === "openai" ? "Ex: gpt-4o, gpt-4o-mini, gpt-3.5-turbo" :
                        formData.model_config === "anthropic" ? "Ex: claude-3-haiku-20240307, claude-3-sonnet-20240229" :
                        formData.model_config === "google" ? "Ex: gemini-1.5-flash, gemini-1.5-pro" :
                        formData.model_config === "ollama" ? "Ex: llama3.2:3b, llama3.2:1b" :
                        formData.model_config === "groq" ? "Ex: llama3-8b-8192, mixtral-8x7b-32768" :
                        "Digite o nome exato do modelo"
                      }
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Digite o nome exato do modelo para o provedor {formData.model_config}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="whatsapp_connection_id" className="text-gray-900 dark:text-gray-100">
                    Conexão WhatsApp *
                  </Label>

                  {/* Filtros de Conexão */}
                  {whatsappConnections.length > 0 && (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      {/* Busca por nome/telefone */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Buscar por nome ou telefone..."
                          value={connectionSearch}
                          onChange={(e) => setConnectionSearch(e.target.value)}
                          className="pl-10 bg-white dark:bg-gray-800"
                        />
                      </div>

                      {/* Filtro por tipo de API */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo:</span>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant={connectionApiTypeFilter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setConnectionApiTypeFilter("all")}
                            className="h-8"
                          >
                            Todas ({whatsappConnections.length})
                          </Button>
                          <Button
                            type="button"
                            variant={connectionApiTypeFilter === "uazapi" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setConnectionApiTypeFilter("uazapi")}
                            className="h-8 bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                          >
                            🚀 Uazapi ({whatsappConnections.filter(c => (c.api_type || "evolution") === "uazapi").length})
                          </Button>
                          <Button
                            type="button"
                            variant={connectionApiTypeFilter === "evolution" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setConnectionApiTypeFilter("evolution")}
                            className="h-8 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                          >
                            ⚡ Evolution ({whatsappConnections.filter(c => (c.api_type || "evolution") === "evolution").length})
                          </Button>
                        </div>
                      </div>

                      {/* Contador de resultados filtrados */}
                      {(connectionSearch || connectionApiTypeFilter !== "all") && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            Mostrando {filteredConnections.length} de {whatsappConnections.length} conexões
                          </span>
                          {(connectionSearch || connectionApiTypeFilter !== "all") && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setConnectionSearch("")
                                setConnectionApiTypeFilter("all")
                              }}
                              className="h-6 text-xs"
                            >
                              Limpar filtros
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Select
                    name="whatsapp_connection_id"
                    value={formData.whatsapp_connection_id || ""}
                    onValueChange={(value) => {
                      console.log("🔗 [AgentModal] Selecionando conexão:", value)
                      handleSelectChange("whatsapp_connection_id", value)
                      
                      // Detectar api_type da conexão selecionada
                      const selectedConn = whatsappConnections.find(conn => conn.id === value)
                      const apiType = selectedConn?.api_type || "evolution"
                      setSelectedConnectionApiType(apiType)
                      console.log("🔍 [AgentModal] API Type detectado:", apiType)
                    }}
                    disabled={
                      (() => {
                        const isDisabled = (!selectedUserId && isAdmin) ||
                          loadingConnections ||
                          (!whatsappConnections.length && !!selectedUserId)
                        
                        console.log("🔍 [AgentModal] Debug do Select WhatsApp:", {
                          selectedUserId,
                          isAdmin,
                          loadingConnections,
                          whatsappConnectionsLength: whatsappConnections.length,
                          isDisabled,
                          reasons: {
                            noUserAndAdmin: (!selectedUserId && isAdmin),
                            loading: loadingConnections,
                            noConnectionsButHasUser: (!whatsappConnections.length && !!selectedUserId)
                          }
                        })
                        
                        return isDisabled
                      })()
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
                    <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 max-h-[300px]">
                      {filteredConnections.length > 0 ? (
                        filteredConnections.map((conn) => {
                          const apiType = conn.api_type || "evolution"
                          const apiIcon = apiType === "uazapi" ? "🚀" : "⚡"
                          const apiColor = apiType === "uazapi" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          
                          return (
                            <SelectItem key={conn.id} value={conn.id}>
                              <div className="flex items-center gap-2 py-1">
                                <Badge variant="outline" className={`text-xs font-bold px-2 ${apiColor}`}>
                                  {apiIcon} {apiType.toUpperCase()}
                                </Badge>
                                <span className="font-medium">{conn.connection_name}</span>
                                <span className="text-gray-500 dark:text-gray-400">({conn.phone_number || "Número não disponível"})</span>
                              </div>
                            </SelectItem>
                          )
                        })
                      ) : whatsappConnections.length > 0 ? (
                        <SelectItem value="no-results" disabled>
                          Nenhuma conexão encontrada com os filtros aplicados
                        </SelectItem>
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

            {/* Card de configurações para Uazapi */}
            {selectedConnectionApiType === "uazapi" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                    <Bot className="w-5 h-5 mr-2" />
                    Configurações do Bot (Uazapi)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bot_gatilho" className="text-gray-900 dark:text-gray-100">
                      Tipo de Gatilho *
                      {botFormData.bot_padrao && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                          (Desabilitado - Bot Padrão)
                        </span>
                      )}
                    </Label>
                    <Select
                      value={botFormData.bot_gatilho}
                      onValueChange={(value) => {
                        setBotFormData(prev => ({ ...prev, bot_gatilho: value }))
                        // Se mudar para "Palavra-chave", limpar o value se estava vazio
                        if (value !== "Palavra-chave") {
                          setBotFormData(prev => ({ ...prev, bot_value: "" }))
                        }
                      }}
                      disabled={botFormData.bot_padrao}
                    >
                      <SelectTrigger 
                        className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${
                          botFormData.bot_padrao ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={botFormData.bot_padrao}
                      >
                        <SelectValue placeholder="Selecione o tipo de gatilho" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                        <SelectItem value="Palavra-chave">Palavra-chave</SelectItem>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="Avançado">Avançado</SelectItem>
                        <SelectItem value="Nenhum">Nenhum</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      {botFormData.bot_padrao 
                        ? "🔒 Bot padrão não usa gatilho - é acionado automaticamente" 
                        : "Como o bot será ativado (padrão: Todos)"}
                    </p>
                  </div>

                  {botFormData.bot_gatilho === "Palavra-chave" && !botFormData.bot_padrao && (
                    <>
                      <div>
                        <Label htmlFor="bot_operador" className="text-gray-900 dark:text-gray-100">
                          Operador de Comparação *
                        </Label>
                        <Select
                          value={botFormData.bot_operador}
                          onValueChange={(value) => setBotFormData(prev => ({ ...prev, bot_operador: value }))}
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Selecione o operador" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <SelectItem value="Contém">Contém</SelectItem>
                            <SelectItem value="Igual">Igual</SelectItem>
                            <SelectItem value="Começa Com">Começa Com</SelectItem>
                            <SelectItem value="Termina Com">Termina Com</SelectItem>
                            <SelectItem value="Regex">Regex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="bot_value" className="text-gray-900 dark:text-gray-100">
                          Palavra-chave *
                        </Label>
                        <Input
                          id="bot_value"
                          name="bot_value"
                          value={botFormData.bot_value}
                          onChange={(e) => setBotFormData(prev => ({ ...prev, bot_value: e.target.value }))}
                          placeholder="Ex: oi|olá|bom dia"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                          Use | para separar múltiplas palavras (ex: oi|olá|bom dia)
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="bot_debounce" className="text-gray-900 dark:text-gray-100">
                      Debounce (segundos)
                    </Label>
                    <Input
                      id="bot_debounce"
                      name="bot_debounce"
                      type="number"
                      min="0"
                      step="1"
                      value={botFormData.bot_debounce}
                      onChange={(e) => setBotFormData(prev => ({ ...prev, bot_debounce: Number(e.target.value) }))}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Tempo de espera antes de processar mensagens (padrão: 5 segundos)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bot_splitMessage" className="text-gray-900 dark:text-gray-100">
                      Split Message (quebras de linha)
                    </Label>
                    <Input
                      id="bot_splitMessage"
                      name="bot_splitMessage"
                      type="number"
                      min="1"
                      step="1"
                      value={botFormData.bot_splitMessage}
                      onChange={(e) => setBotFormData(prev => ({ ...prev, bot_splitMessage: Number(e.target.value) }))}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                      Quantas quebras de linha (\\n) para dividir mensagem em múltiplas (padrão: 2)
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex-1">
                      <Label htmlFor="bot_padrao" className="text-gray-900 dark:text-gray-100 font-medium">
                        Bot Padrão da Conexão
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                        Se ativado, este bot será o bot principal da conexão. Usado no n8n quando não há palavra-chave correspondente.
                        {botFormData.bot_padrao && (
                          <span className="block mt-1 text-blue-600 dark:text-blue-400 font-medium">
                            ⚠️ Bots padrão não precisam de gatilho - serão acionados automaticamente.
                          </span>
                        )}
                      </p>
                    </div>
                    <Switch
                      id="bot_padrao"
                      checked={botFormData.bot_padrao}
                      onCheckedChange={(checked) => {
                        setBotFormData(prev => ({ 
                          ...prev, 
                          bot_padrao: checked,
                          // Se ativar bot padrão, setar gatilho para "Nenhum"
                          bot_gatilho: checked ? "Nenhum" : prev.bot_gatilho,
                          // Limpar palavra-chave se setar como padrão
                          bot_value: checked ? "" : prev.bot_value,
                        }))
                      }}
                      className={switchStyles}
                    />
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">
                      JIDs Ignorados (Números/Grupos que não ativam o Bot)
                    </Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={newBotIgnoreJid}
                          onChange={(e) => setNewBotIgnoreJid(e.target.value)}
                          placeholder="Ex: @s.whatsapp.net, @g.us, 5511999999999@s.whatsapp.net"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Tab") {
                              e.preventDefault()
                              handleAddBotIgnoreJid()
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddBotIgnoreJid} variant="outline" size="sm">
                          Adicionar
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(botFormData.bot_ignoreJids || ["@g.us"]).map((jid, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              jid === "@g.us"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}
                          >
                            <span>{jid}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBotIgnoreJid(jid)}
                              className={`ml-1 hover:bg-red-200 rounded-full w-4 h-4 flex items-center justify-center ${
                                jid === "@g.us" ? "text-red-600" : "text-gray-600"
                              }`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                        <strong>@g.us</strong> (grupos) é obrigatório para evitar spam em grupos do WhatsApp. Você pode
                        adicionar números específicos ou outros tipos de JIDs para ignorar. Use Enter ou Tab para adicionar.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card de configurações Evolution - só aparece se NÃO for Uazapi */}
            {selectedConnectionApiType !== "uazapi" && (
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
            )}

            {/* Card de Tempo e Comportamento - também só para Evolution */}
            {selectedConnectionApiType !== "uazapi" && (
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

                <div>
                  <Label className="text-gray-900 dark:text-gray-100">
                    JIDs Ignorados (Números/Grupos que não ativam a IA)
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newIgnoreJid}
                        onChange={(e) => setNewIgnoreJid(e.target.value)}
                        placeholder="Ex: @s.whatsapp.net, @g.us, 5511999999999@s.whatsapp.net"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        onKeyPress={(e) => e.key === "Enter" && handleAddIgnoreJid()}
                      />
                      <Button type="button" onClick={handleAddIgnoreJid} variant="outline" size="sm">
                        Adicionar
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {ensureGroupsProtection(formData.ignore_jids).map((jid, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                            jid === "@g.us"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          <span>{jid}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIgnoreJid(jid)}
                            className={`ml-1 hover:bg-red-200 rounded-full w-4 h-4 flex items-center justify-center ${
                              jid === "@g.us" ? "text-red-600" : "text-gray-600"
                            }`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                      <strong>@g.us</strong> (grupos) é obrigatório para evitar spam em grupos do WhatsApp. Você pode
                      adicionar números específicos ou outros tipos de JIDs para ignorar.
                    </p>
                  </div>
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
            )}

            {/* Funcionalidades Extras - comum para Evolution e Uazapi */}
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
                            <SelectItem value="fish_audio">Fish Audio (Recomendado)</SelectItem>
                            <SelectItem value="eleven_labs">ElevenLabs</SelectItem>
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
                  <Button
                    variant="outline"
                    className="border border-red-600 text-red-600 hover:bg-red-50"
                    onClick={confirmRemoveGroupsJid}
                  >
                    Remover Mesmo Assim
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-green-600 text-white hover:bg-green-700 font-semibold shadow"
                    onClick={() => setShowIgnoreJidsWarning(false)}
                  >
                    Cancelar (Recomendado)
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Modal de Aviso para Remoção de @g.us do Bot Uazapi */}
          {showBotIgnoreJidsWarning && (
            <Dialog open={showBotIgnoreJidsWarning} onOpenChange={setShowBotIgnoreJidsWarning}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-red-600 flex items-center">
                    ⚠️ Atenção: Configuração Importante do Bot
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Você está tentando remover <strong>@g.us</strong> da lista de JIDs ignorados do bot Uazapi.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Por que isso é importante?</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>
                        • <strong>@g.us</strong> representa todos os grupos do WhatsApp
                      </li>
                      <li>• Sem essa proteção, seu bot será ativado em TODOS os grupos</li>
                      <li>• Isso pode incomodar outros membros dos grupos</li>
                      <li>• Pode gerar spam e prejudicar a experiência dos usuários</li>
                      <li>• Sua conta pode ser banida por comportamento inadequado</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      <strong>Atenção:</strong> Esta é uma proteção padrão recomendada. Remova apenas se você tiver
                      certeza absoluta do que está fazendo e compreende os riscos envolvidos.
                    </p>
                  </div>
                </div>
                <DialogFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      confirmRemoveBotGroupsJid()
                      setShowBotIgnoreJidsWarning(false)
                    }}
                  >
                    Remover Mesmo Assim
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-green-600 text-white hover:bg-green-700 font-semibold shadow"
                    onClick={() => setShowBotIgnoreJidsWarning(false)}
                  >
                    Cancelar (Recomendado)
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
                      // Adicionar @g.us automaticamente
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
