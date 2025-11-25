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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles, Eye, EyeOff, Volume2, Users, MessageSquare, Clock, Search, Filter, Plus, Copy, Trash2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { fetchWhatsAppConnections, fetchUsers } from "@/lib/whatsapp-connections"
import { publicApi } from "@/lib/api-client"

// Estilos customizados para os switches
const switchStyles =
  "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 border-2 border-gray-300 data-[state=checked]:border-blue-600"

const CALCOM_DEFAULT_API_URLS = {
  v1: "https://api.cal.com/v1",
  v2: "https://api.cal.com/v2",
} as const

const getCalcomDefaultUrl = (version?: string | null) => {
  if (version === "v2") return CALCOM_DEFAULT_API_URLS.v2
  return CALCOM_DEFAULT_API_URLS.v1
}

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
  calendar_provider?: string | null
  calendar_api_version?: string | null
  calendar_api_url?: string | null
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
  llm_api_key?: string | null // API Key customizada do usuário para LLM
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
  availability_mode?: 'always' | 'schedule' | 'disabled' | null
  created_at?: string
  updated_at?: string
}

interface AvailabilitySchedule {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string
  is_active: boolean
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
  calendar_provider: "calcom",
  calendar_api_version: "v1",
  calendar_api_url: CALCOM_DEFAULT_API_URLS.v1,
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
  llm_api_key: null,
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
  availability_mode: 'always',
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
  const [showLlmApiKey, setShowLlmApiKey] = useState(false)
  const [evolutionSyncStatus, setEvolutionSyncStatus] = useState<string>("")
  const [systemDefaultModel, setSystemDefaultModel] = useState<string | null>(null)
  const [llmConfig, setLlmConfig] = useState<any>(null)
  const [loadingLlmConfig, setLoadingLlmConfig] = useState(false)
  const [modelSelection, setModelSelection] = useState<"default" | "custom">("default")
  const [savedLlmKeys, setSavedLlmKeys] = useState<any[]>([])
  const [llmKeySource, setLlmKeySource] = useState<"saved" | "manual" | "system">("system")
  const [selectedSavedKeyId, setSelectedSavedKeyId] = useState<string>("")
  const [showCurlModal, setShowCurlModal] = useState(false)
  const [curlInput, setCurlInput] = useState("")
  const [curlDescription, setCurlDescription] = useState("")
  const [showIgnoreJidsWarning, setShowIgnoreJidsWarning] = useState(false)
  const [showGroupsProtectionWarning, setShowGroupsProtectionWarning] = useState(false)
  const [availabilitySchedules, setAvailabilitySchedules] = useState<AvailabilitySchedule[]>([])
  const [selectedTimezone, setSelectedTimezone] = useState<string>('America/Sao_Paulo')
  const [timezoneSearchFilter, setTimezoneSearchFilter] = useState<string>('')
  const [tempIgnoreJids, setTempIgnoreJids] = useState<string[]>([])
  const [newIgnoreJid, setNewIgnoreJid] = useState("")
  const [pendingSubmit, setPendingSubmit] = useState(false)

  // Estados para duplicação de horários
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [sourceDayForDuplicate, setSourceDayForDuplicate] = useState<number | null>(null)
  const [selectedDaysForDuplicate, setSelectedDaysForDuplicate] = useState<number[]>([])
  const [scheduleErrors, setScheduleErrors] = useState<Map<number, string>>(new Map())
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false)

  // Funções auxiliares para validação de sobreposição de horários
  const timeToMinutes = (time: string): number => {
    if (typeof time !== 'string') return 0
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const checkTimeOverlap = (start1Minutes: number, end1Minutes: number, start2Minutes: number, end2Minutes: number): boolean => {
    // Algoritmo clássico: (StartA < EndB) AND (EndA > StartB)
    return start1Minutes < end2Minutes && end1Minutes > start2Minutes
  }

  const validateSchedulesForOverlap = (schedules: AvailabilitySchedule[]): { isValid: boolean; message?: string } => {
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    
    // Agrupar por dia da semana
    for (let day = 0; day <= 6; day++) {
      const daySchedules = schedules.filter(s => s.day_of_week === day && s.is_active !== false)
      
      // Verificar sobreposição dentro do mesmo dia
      for (let i = 0; i < daySchedules.length; i++) {
        for (let j = i + 1; j < daySchedules.length; j++) {
          const schedule1 = daySchedules[i]
          const schedule2 = daySchedules[j]
          
          if (checkTimeOverlap(schedule1.start_time, schedule1.end_time, schedule2.start_time, schedule2.end_time)) {
            return {
              isValid: false,
              message: `❌ Sobreposição detectada em ${dayNames[day]}:\n\n` +
                       `📍 Horário 1: ${schedule1.start_time} - ${schedule1.end_time}\n` +
                       `📍 Horário 2: ${schedule2.start_time} - ${schedule2.end_time}\n\n` +
                       `⚠️ Os horários não podem se sobrepor. Por favor, ajuste os intervalos.`
            }
          }
        }
      }
    }
    
    return { isValid: true }
  }

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
    bot_gatilho: "Palavra-chave",
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
        setSystemDefaultModel("carregando...")

        // Usar API segura ao invés de Supabase direto
        const response = await publicApi.getSystemDefaultModel()

        if (response.error) {
          setSystemDefaultModel("Erro ao carregar")
        } else if (response.data?.defaultModel) {
          const systemDefaultModel = response.data.defaultModel.toString().trim()
          setSystemDefaultModel(systemDefaultModel)
        } else {
          setSystemDefaultModel("Não configurado")
        }
      } catch (error) {
        setSystemDefaultModel("Erro ao carregar")
      }
    }

  // Função SEGURA para carregar configurações LLM
  const loadLlmConfig = async () => {
    if (!open) return

    try {
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
        setLlmConfig(data.config)
      } else {
        throw new Error(data.error || "Erro desconhecido ao carregar configurações LLM")
       }
    } catch (error: any) {
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
          // Editando agente existente - usar user_id do agente
          setSelectedUserId(agent.user_id)
        } else {
          // Criando novo agente - pré-selecionar usuário atual (admin)
          setSelectedUserId(user.id)
          loadWhatsAppConnections(user.id, true)
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
      toast({ title: "Erro", description: "Falha ao carregar lista de usuários", variant: "destructive" })
    }
  }

  async function loadN8nConfig() {
    try {
      // Por enquanto, vamos comentar esta funcionalidade até ter a API específica
    } catch (err) {
      // Silencioso
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

      // Processar ignore_jids se for string JSON
      let processedIgnoreJids = agent.ignore_jids
      if (typeof agent.ignore_jids === "string") {
        try {
          processedIgnoreJids = JSON.parse(agent.ignore_jids)
        } catch (e) {
          processedIgnoreJids = ["@g.us"]
        }
      }

      // Normalizar configurações de calendário
      const resolvedCalendarProvider = agent.calendar_provider || "calcom"
      const resolvedCalendarVersion =
        resolvedCalendarProvider === "calcom"
          ? agent.calendar_api_version || "v1"
          : agent.calendar_api_version
      const resolvedCalendarUrl =
        resolvedCalendarProvider === "calcom"
          ? agent.calendar_api_url || getCalcomDefaultUrl(resolvedCalendarVersion)
          : agent.calendar_api_url || null

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
        calendar_provider: resolvedCalendarProvider,
        calendar_api_version: resolvedCalendarProvider === "calcom" ? resolvedCalendarVersion || "v1" : resolvedCalendarVersion,
        calendar_api_url:
          resolvedCalendarProvider === "calcom"
            ? resolvedCalendarUrl || getCalcomDefaultUrl(resolvedCalendarVersion)
            : resolvedCalendarUrl,
      }

      setFormData(agentData)

      if (isAdmin && agent.user_id) {
        setSelectedUserId(agent.user_id)
      }
    } else {
      setFormData({
        ...initialFormData,
        user_id: selectedUserId || currentUser?.id || "",
        ignore_jids: ["@g.us"], // Garantir proteção padrão
      })
      // Resetar estado de LLM Key para novo agente
      setLlmKeySource("system")
      setSelectedSavedKeyId("")
    }
  }, [agent, currentUser, selectedUserId, isAdmin])

  // useEffect para carregar schedules de disponibilidade
  useEffect(() => {
    const fetchAvailabilitySchedules = async () => {
      if (!agent?.id || !open) return

      try {
        const apiPath = isAdmin 
          ? `/api/admin/agents/${agent.id}/availability` 
          : `/api/user/agents/${agent.id}/availability`
        
        const response = await fetch(apiPath)
        const data = await response.json()

        if (data.success && data.schedules) {
          setAvailabilitySchedules(data.schedules)
          if (data.schedules.length > 0) {
            setSelectedTimezone(data.schedules[0].timezone || 'America/Sao_Paulo')
          }
        }
      } catch (error) {
        console.error('Erro ao carregar horários:', error)
      }
    }

    fetchAvailabilitySchedules()
  }, [agent?.id, open, isAdmin])

  // useEffect para buscar API keys salvas do usuário
  useEffect(() => {
    const fetchSavedLlmKeys = async () => {
      if (!open) return

      const userId = selectedUserId || currentUser?.id
      if (!userId) return

      try {
        const apiPath = isAdmin ? `/api/admin/llm-keys?user_id=${userId}` : "/api/user/llm-keys"
        const response = await fetch(apiPath)
        const data = await response.json()

        if (data.success) {
          setSavedLlmKeys(data.keys || [])
          // CASO 1: Agente JÁ tem uma chave salva - verificar se ainda existe
          if (formData.llm_api_key && formData.llm_api_key.startsWith("__SAVED_KEY__")) {
            const keyId = formData.llm_api_key.replace("__SAVED_KEY__", "")
            const savedKey = data.keys?.find((k: any) => k.id === keyId)
            
            if (savedKey) {
              setLlmKeySource("saved")
              setSelectedSavedKeyId(keyId)
            } else {
              setLlmKeySource("system")
              setFormData(prev => ({ ...prev, llm_api_key: null }))
            }
          }
          // CASO 2: Agente tem chave MANUAL (não começa com __SAVED_KEY__)
          else if (formData.llm_api_key && !formData.llm_api_key.startsWith("__SAVED_KEY__")) {
            setLlmKeySource("manual")
          }
          // CASO 3: Novo agente sem chave - buscar chave padrão
          else if (!formData.llm_api_key && formData.model_config && data.keys && data.keys.length > 0) {
            const defaultKey = data.keys.find(
              (k: any) => k.provider === formData.model_config && k.is_default && k.is_active
            )
            if (defaultKey) {
              setLlmKeySource("saved")
              setSelectedSavedKeyId(defaultKey.id)
            }
          }
        }
      } catch (error) {
        // Silencioso
      }
    }

    fetchSavedLlmKeys()
  }, [open, selectedUserId, currentUser, isAdmin, formData.llm_api_key, formData.model_config])


  // useEffect para detectar o api_type da conexão quando editando um agente (busca do BACKEND)
  useEffect(() => {
    const fetchConnectionApiType = async () => {
      // Só buscar se estiver editando um agente e ele tiver uma conexão
      if (!agent || !agent.whatsapp_connection_id) {
        setSelectedConnectionApiType(null)
        return
      }

      try {
        
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
          setSelectedConnectionApiType(apiType)
          
          // Se for Uazapi e o agente tiver bot_id, buscar dados do bot
          if (apiType === "uazapi" && agent.bot_id) {
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
                  // Converter ignoreJids de string para array
                  let ignoreJidsArray = ["@g.us"]
                  if (botData.bot.ignoreJids) {
                    const jidsString = botData.bot.ignoreJids.replace(/,\s*$/, "") // Remove vírgula final
                    ignoreJidsArray = jidsString.split(",").map((jid: string) => jid.trim()).filter(Boolean)
                  }

                  // Preencher botFormData com os dados do bot
                  setBotFormData({
                    bot_gatilho: botData.bot.gatilho || "Palavra-chave",
                    bot_operador: botData.bot.operador_gatilho || "Contém",
                    bot_value: botData.bot.value_gatilho || "",
                    bot_debounce: botData.bot.debounce || 5,
                    bot_splitMessage: botData.bot.splitMessage || 2,
                    bot_ignoreJids: ignoreJidsArray,
                    bot_padrao: Boolean(botData.bot.padrao) || false,
                  })
                }
              }
            } catch (botError) {
              // Silencioso
            }
          }
        } else {
          throw new Error(data.error || "Erro ao buscar dados da conexão")
        }
      } catch (error: any) {
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
      } else {
        setModelSelection("custom")
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

  const handleCalendarProviderChange = (value: string) => {
    setFormData((prev) => {
      if (value === "calcom") {
        const version = prev.calendar_api_version || "v1"
        const shouldPreserveUrl =
          prev.calendar_provider === "calcom" &&
          prev.calendar_api_url &&
          prev.calendar_api_url.trim().length > 0 &&
          prev.calendar_api_url !== getCalcomDefaultUrl(prev.calendar_api_version)

        return {
          ...prev,
          calendar_provider: value,
          calendar_api_version: version,
          calendar_api_url: shouldPreserveUrl ? prev.calendar_api_url : getCalcomDefaultUrl(version),
        }
      }

      return {
        ...prev,
        calendar_provider: value,
        calendar_api_version: null,
        calendar_api_url: null,
      }
    })
  }

  const handleCalendarVersionChange = (value: string) => {
    setFormData((prev) => {
      if (prev.calendar_provider !== "calcom") {
        return {
          ...prev,
          calendar_api_version: value,
        }
      }

      const previousVersion = prev.calendar_api_version || "v1"
      const previousDefault = getCalcomDefaultUrl(previousVersion)
      const shouldUpdateUrl =
        !prev.calendar_api_url ||
        prev.calendar_api_url === previousDefault ||
        prev.calendar_api_url === getCalcomDefaultUrl(prev.calendar_api_version)

      return {
        ...prev,
        calendar_api_version: value,
        calendar_api_url: shouldUpdateUrl ? getCalcomDefaultUrl(value) : prev.calendar_api_url,
      }
    })
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
      // Detectar automaticamente se é contexto de admin ou usuário
      const isAdminContext = typeof window !== 'undefined' && window.location.pathname.includes('/admin/')

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

      const calendarProvider = formData.calendar_provider || "calcom"
      const calendarVersion =
        calendarProvider === "calcom"
          ? formData.calendar_api_version || "v1"
          : formData.calendar_api_version || null
      const calendarUrl =
        calendarProvider === "calcom"
          ? formData.calendar_api_url || getCalcomDefaultUrl(calendarVersion)
          : formData.calendar_api_url || null

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
        calendar_provider: calendarProvider,
        calendar_api_version: calendarVersion,
        calendar_api_url: calendarUrl,
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
        llm_api_key: formData.llm_api_key || null,
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
        availability_mode: formData.availability_mode || 'always',
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
        throw new Error(`Erro na API: ${response.status}`)
      }

      const result = await response.json()

      // Salvar horários de disponibilidade se modo for 'schedule'
      if (formData.availability_mode === 'schedule' && availabilitySchedules.length > 0) {
        try {
          const agentId = isEditing ? agent?.id : result.agent?.id || result.id
          const scheduleApiPath = isAdminContext 
            ? `/api/admin/agents/${agentId}/availability` 
            : `/api/user/agents/${agentId}/availability`

          await fetch(scheduleApiPath, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ schedules: availabilitySchedules }),
          })
        } catch (scheduleError) {
          console.error('Erro ao salvar horários:', scheduleError)
          // Não interromper o fluxo se falhar ao salvar schedules
        }
      }

      toast({
        title: "Sucesso",
        description: isEditing ? "Agente atualizado com sucesso!" : "Agente criado com sucesso!",
      })

      if (typeof onSave === "function") onSave()
      else onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao salvar o agente.")
      toast({ title: "Erro", description: err.message || "Falha ao salvar o agente.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHasSubmitAttempted(true)
    
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

    // Validar sobreposição de horários
    if (availabilitySchedules.length > 0) {
      const validation = validateSchedulesForOverlap(availabilitySchedules)
      if (!validation.isValid) {
        // Mapear índices com erros
        const errorIndexes = new Map<number, string>()
        availabilitySchedules.forEach((schedule, i) => {
          availabilitySchedules.forEach((otherSchedule, j) => {
            if (i < j && schedule.day_of_week === otherSchedule.day_of_week) {
              const start1 = timeToMinutes(schedule.start_time)
              const end1 = timeToMinutes(schedule.end_time)
              const start2 = timeToMinutes(otherSchedule.start_time)
              const end2 = timeToMinutes(otherSchedule.end_time)
              
              if (checkTimeOverlap(start1, end1, start2, end2)) {
                const errorMsg = `Conflito: ${schedule.start_time}-${schedule.end_time} ⚔️ ${otherSchedule.start_time}-${otherSchedule.end_time}`
                errorIndexes.set(i, errorMsg)
                errorIndexes.set(j, errorMsg)
              }
            }
          })
        })
        
        setScheduleErrors(errorIndexes)
        
        // Auto-scroll para primeiro erro
        const firstErrorIndex = Math.min(...Array.from(errorIndexes.keys()))
        setTimeout(() => {
          const errorElement = document.querySelector(`[data-schedule-index="${firstErrorIndex}"]`)
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            const firstInput = errorElement.querySelector('input[type="time"]') as HTMLInputElement
            if (firstInput) setTimeout(() => firstInput.focus(), 300)
          }
        }, 100)
        
        setError(validation.message || "Hor\u00e1rios com sobreposi\u00e7\u00e3o detectados")
        toast({
          title: "Hor\u00e1rios com sobreposi\u00e7\u00e3o",
          description: validation.message,
          variant: "destructive",
          duration: 8000,
        })
        return
      } else {
        setScheduleErrors(new Map())
      }
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
                      // Ao trocar provedor, automaticamente usar o modelo padrão desse provedor
                      const defaultModelForProvider = llmConfig?.default_models?.[value] || systemDefaultModel || "gpt-4o-mini"
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
                        setModelSelection(value)
                        
                        if (value === "default") {
                          const selectedProvider = formData.model_config || "openai"
                          const defaultModel = llmConfig?.default_models?.[selectedProvider] || systemDefaultModel || "gpt-4o-mini"
                          setFormData((prev) => ({ ...prev, model: String(defaultModel) }))
                        } else {
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

                {/* Campo de API Key da LLM - Interface Profissional */}
                {formData.model_config && (
                  <Card className="border-2 border-blue-100 dark:border-blue-900">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Configuração de API Key LLM
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Radio Group para escolher fonte da chave */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">
                          Como deseja fornecer a chave API?
                        </Label>
                        <RadioGroup
                          value={llmKeySource}
                          onValueChange={(value: "saved" | "manual" | "system") => {
                            setLlmKeySource(value)
                            if (value === "system") {
                              setFormData((prev) => ({ ...prev, llm_api_key: null }))
                              setSelectedSavedKeyId("")
                            } else if (value === "saved" && !selectedSavedKeyId) {
                              // Selecionar chave padrão se existir
                              const defaultKey = savedLlmKeys.find(
                                (k) => k.provider === formData.model_config && k.is_default && k.is_active
                              )
                              if (defaultKey) {
                                setSelectedSavedKeyId(defaultKey.id)
                              }
                            }
                          }}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors cursor-pointer">
                            <RadioGroupItem value="system" id="system" />
                            <Label htmlFor="system" className="cursor-pointer flex-1">
                              <div className="font-medium">Usar chave do sistema</div>
                              <div className="text-xs text-muted-foreground">
                                Recomendado - usa a chave padrão configurada no sistema
                              </div>
                            </Label>
                            <Badge variant="secondary">Padrão</Badge>
                          </div>

                          {savedLlmKeys.filter((k) => k.provider === formData.model_config).length > 0 && (
                            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-green-200 dark:hover:border-green-800 transition-colors cursor-pointer">
                              <RadioGroupItem value="saved" id="saved" />
                              <Label htmlFor="saved" className="cursor-pointer flex-1">
                                <div className="font-medium">Usar chave salva</div>
                                <div className="text-xs text-muted-foreground">
                                  {savedLlmKeys.filter((k) => k.provider === formData.model_config && k.is_active).length} chave(s) disponível(is)
                                </div>
                              </Label>
                              <Badge className="bg-green-500">Seguro</Badge>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-orange-200 dark:hover:border-orange-800 transition-colors cursor-pointer">
                            <RadioGroupItem value="manual" id="manual" />
                            <Label htmlFor="manual" className="cursor-pointer flex-1">
                              <div className="font-medium">Digitar manualmente</div>
                              <div className="text-xs text-muted-foreground">
                                Cole sua chave API diretamente
                              </div>
                            </Label>
                            <Badge variant="outline">Manual</Badge>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Select para chaves salvas */}
                      {llmKeySource === "saved" && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                          <Label htmlFor="saved_key_select">
                            Selecione uma chave salva <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={selectedSavedKeyId}
                            onValueChange={(value) => {
                              setSelectedSavedKeyId(value)
                              // Não salvar a chave no formData por segurança
                              // O backend vai buscar quando necessário
                              setFormData((prev) => ({ ...prev, llm_api_key: `__SAVED_KEY__${value}` }))
                            }}
                          >
                            <SelectTrigger className="bg-white dark:bg-gray-800">
                              <SelectValue placeholder="Escolha uma chave..." />
                            </SelectTrigger>
                            <SelectContent>
                              {savedLlmKeys
                                .filter((k) => k.provider === formData.model_config && k.is_active)
                                .map((key) => (
                                  <SelectItem key={key.id} value={key.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-medium">{key.key_name}</span>
                                      <div className="flex items-center gap-2 ml-4">
                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                          {key.api_key_preview}
                                        </code>
                                        {key.is_default && (
                                          <Badge className="bg-blue-500 text-xs">Padrão</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Suas chaves ficam criptografadas e seguras
                          </p>
                        </div>
                      )}

                      {/* Input manual */}
                      {llmKeySource === "manual" && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                          <Label htmlFor="llm_api_key_manual">
                            Cole sua API Key <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="llm_api_key_manual"
                              name="llm_api_key"
                              type={showLlmApiKey ? "text" : "password"}
                              value={formData.llm_api_key?.startsWith("__SAVED_KEY__") ? "" : formData.llm_api_key || ""}
                              onChange={handleInputChange}
                              placeholder={
                                formData.model_config === "openai"
                                  ? "sk-..."
                                  : formData.model_config === "anthropic"
                                    ? "sk-ant-..."
                                    : formData.model_config === "google"
                                      ? "AIza..."
                                      : "Cole sua API key aqui"
                              }
                              className="bg-white dark:bg-gray-800 pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowLlmApiKey(!showLlmApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showLlmApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                            ⚠️ A chave será usada apenas para este agente
                          </p>
                        </div>
                      )}

                      {/* Informação sobre chave do sistema */}
                      {llmKeySource === "system" && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 animate-in fade-in duration-300">
                          <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Este agente usará a chave padrão configurada no sistema
                          </p>
                        </div>
                      )}

                      {/* Link para gerenciar chaves */}
                      {savedLlmKeys.filter((k) => k.provider === formData.model_config).length === 0 && llmKeySource !== "manual" && (
                        <div className="text-center py-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            Nenhuma chave salva para {formData.model_config}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const keysUrl = isAdmin ? "/admin/llm-keys" : "/dashboard/llm-keys"
                              window.open(keysUrl, "_blank")
                            }}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Gerenciar Minhas Chaves
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
                      handleSelectChange("whatsapp_connection_id", value)
                      
                      // Detectar api_type da conexão selecionada
                      const selectedConn = whatsappConnections.find(conn => conn.id === value)
                      const apiType = selectedConn?.api_type || "evolution"
                      setSelectedConnectionApiType(apiType)
                    }}
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

            {/* Horários de Disponibilidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                  <Clock className="w-5 h-5 mr-2" />
                  Horários de Disponibilidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-gray-900 dark:text-gray-100">Modo de Disponibilidade</Label>
                  <RadioGroup
                    value={formData.availability_mode || 'always'}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, availability_mode: value as 'always' | 'schedule' | 'disabled' }))}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="always" id="always" />
                      <Label htmlFor="always" className="font-normal cursor-pointer">
                        <div>
                          <div className="font-medium">Sempre Ativo (24h)</div>
                          <div className="text-xs text-muted-foreground">O agente estará disponível 24 horas por dia</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="schedule" id="schedule" />
                      <Label htmlFor="schedule" className="font-normal cursor-pointer">
                        <div>
                          <div className="font-medium">Horários Específicos</div>
                          <div className="text-xs text-muted-foreground">Definir dias e horários de funcionamento</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="disabled" id="disabled" />
                      <Label htmlFor="disabled" className="font-normal cursor-pointer">
                        <div>
                          <div className="font-medium">Desativado</div>
                          <div className="text-xs text-muted-foreground">O agente não estará acessível via API</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.availability_mode === 'schedule' && (
                  <div className="space-y-4 pl-4 border-l-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-lg dark:from-gray-800 dark:to-gray-900 dark:border-blue-700">
                    <div>
                      <Label htmlFor="timezone" className="text-gray-900 dark:text-gray-100 font-semibold">Fuso Horário</Label>
                      <Select
                        value={selectedTimezone}
                        onValueChange={setSelectedTimezone}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 mt-2">
                          <SelectValue placeholder="Selecione o fuso horário" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 max-h-[400px]">
                          <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700 z-10">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                              <Input
                                placeholder="Buscar fuso horário..."
                                value={timezoneSearchFilter}
                                onChange={(e) => setTimezoneSearchFilter(e.target.value)}
                                className="pl-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="overflow-y-auto max-h-[300px]">
                          {/* América do Sul */}
                          {('São Paulo'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Brasil'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Sao_Paulo">🇧🇷 São Paulo (UTC-3)</SelectItem>
                          )}
                          {('Cuiabá'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Brasil'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Cuiaba">🇧🇷 Cuiabá (UTC-4)</SelectItem>
                          )}
                          {('Buenos Aires'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Argentina'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Argentina/Buenos_Aires">🇦🇷 Buenos Aires (UTC-3)</SelectItem>
                          )}
                          {('Santiago'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Chile'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Santiago">🇨🇱 Santiago (UTC-3)</SelectItem>
                          )}
                          {('Bogotá'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Colômbia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Bogota">🇨🇴 Bogotá (UTC-5)</SelectItem>
                          )}
                          {('Lima'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Peru'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Lima">🇵🇪 Lima (UTC-5)</SelectItem>
                          )}
                          {('Caracas'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Venezuela'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Caracas">🇻🇪 Caracas (UTC-4)</SelectItem>
                          )}
                          
                          {/* América do Norte */}
                          {('Nova York'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'New York'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'USA'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/New_York">🇺🇸 Nova York (UTC-5)</SelectItem>
                          )}
                          {('Chicago'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'USA'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Chicago">🇺🇸 Chicago (UTC-6)</SelectItem>
                          )}
                          {('Denver'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'USA'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Denver">🇺🇸 Denver (UTC-7)</SelectItem>
                          )}
                          {('Los Angeles'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'USA'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Los_Angeles">🇺🇸 Los Angeles (UTC-8)</SelectItem>
                          )}
                          {('Phoenix'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'USA'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Phoenix">🇺🇸 Phoenix (UTC-7)</SelectItem>
                          )}
                          {('Anchorage'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'USA'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Anchorage">🇺🇸 Anchorage (UTC-9)</SelectItem>
                          )}
                          {('Honolulu'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Hawaii'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'USA'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Honolulu">🇺🇸 Honolulu (UTC-10)</SelectItem>
                          )}
                          {('Toronto'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Canadá'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Canada'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Toronto">🇨🇦 Toronto (UTC-5)</SelectItem>
                          )}
                          {('Vancouver'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Canadá'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Canada'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Vancouver">🇨🇦 Vancouver (UTC-8)</SelectItem>
                          )}
                          {('México'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Mexico'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="America/Mexico_City">🇲🇽 Cidade do México (UTC-6)</SelectItem>
                          )}
                          
                          {/* Europa */}
                          {('Londres'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'London'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/London">🇬🇧 Londres (UTC+0)</SelectItem>
                          )}
                          {('Dublin'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Irlanda'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Dublin">🇮🇪 Dublin (UTC+0)</SelectItem>
                          )}
                          {('Lisboa'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Portugal'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Lisbon">🇵🇹 Lisboa (UTC+0)</SelectItem>
                          )}
                          {('Paris'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'França'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Paris">🇫🇷 Paris (UTC+1)</SelectItem>
                          )}
                          {('Madrid'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Espanha'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Madrid">🇪🇸 Madrid (UTC+1)</SelectItem>
                          )}
                          {('Roma'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Itália'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Rome">🇮🇹 Roma (UTC+1)</SelectItem>
                          )}
                          {('Berlim'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Berlin'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Alemanha'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Berlin">🇩🇪 Berlim (UTC+1)</SelectItem>
                          )}
                          {('Amsterdã'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Amsterdam'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Holanda'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Amsterdam">🇳🇱 Amsterdã (UTC+1)</SelectItem>
                          )}
                          {('Bruxelas'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Brussels'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Bélgica'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Brussels">🇧🇪 Bruxelas (UTC+1)</SelectItem>
                          )}
                          {('Zurique'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Zurich'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Suíça'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Zurich">🇨🇭 Zurique (UTC+1)</SelectItem>
                          )}
                          {('Viena'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Vienna'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Áustria'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Vienna">🇦🇹 Viena (UTC+1)</SelectItem>
                          )}
                          {('Praga'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Prague'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Prague">🇨🇿 Praga (UTC+1)</SelectItem>
                          )}
                          {('Varsóvia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Warsaw'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Polônia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Warsaw">🇵🇱 Varsóvia (UTC+1)</SelectItem>
                          )}
                          {('Atenas'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Athens'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Grécia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Athens">🇬🇷 Atenas (UTC+2)</SelectItem>
                          )}
                          {('Istambul'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Istanbul'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Turquia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Istanbul">🇹🇷 Istambul (UTC+3)</SelectItem>
                          )}
                          {('Moscou'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Moscow'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Rússia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Europe/Moscow">🇷🇺 Moscou (UTC+3)</SelectItem>
                          )}
                          
                          {/* África */}
                          {('Cairo'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Egito'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Africa/Cairo">🇪🇬 Cairo (UTC+2)</SelectItem>
                          )}
                          {('Joanesburgo'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Johannesburg'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'África do Sul'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Africa/Johannesburg">🇿🇦 Joanesburgo (UTC+2)</SelectItem>
                          )}
                          {('Lagos'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Nigéria'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Africa/Lagos">🇳🇬 Lagos (UTC+1)</SelectItem>
                          )}
                          {('Nairobi'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Quênia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Africa/Nairobi">🇰🇪 Nairobi (UTC+3)</SelectItem>
                          )}
                          
                          {/* Ásia */}
                          {('Dubai'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Emirados'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Dubai">🇦🇪 Dubai (UTC+4)</SelectItem>
                          )}
                          {('Karachi'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Paquistão'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Karachi">🇵🇰 Karachi (UTC+5)</SelectItem>
                          )}
                          {('Índia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'India'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Kolkata'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Kolkata">🇮🇳 Índia (UTC+5:30)</SelectItem>
                          )}
                          {('Dhaka'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Bangladesh'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Dhaka">🇧🇩 Dhaka (UTC+6)</SelectItem>
                          )}
                          {('Bangkok'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Tailândia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Bangkok">🇹🇭 Bangkok (UTC+7)</SelectItem>
                          )}
                          {('Singapura'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Singapore'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Singapore">🇸🇬 Singapura (UTC+8)</SelectItem>
                          )}
                          {('Hong Kong'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Hong_Kong">🇭🇰 Hong Kong (UTC+8)</SelectItem>
                          )}
                          {('Xangai'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Shanghai'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'China'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Shanghai">🇨🇳 Xangai (UTC+8)</SelectItem>
                          )}
                          {('Tóquio'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Tokyo'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Japão'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Tokyo">🇯🇵 Tóquio (UTC+9)</SelectItem>
                          )}
                          {('Seul'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Seoul'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Coreia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Seoul">🇰🇷 Seul (UTC+9)</SelectItem>
                          )}
                          {('Jacarta'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Jakarta'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Indonésia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Jakarta">🇮🇩 Jacarta (UTC+7)</SelectItem>
                          )}
                          {('Manila'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Filipinas'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Manila">🇵🇭 Manila (UTC+8)</SelectItem>
                          )}
                          {('Taipei'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Taiwan'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Taipei">🇹🇼 Taipei (UTC+8)</SelectItem>
                          )}
                          
                          {/* Oceania */}
                          {('Sydney'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Austrália'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Australia/Sydney">🇦🇺 Sydney (UTC+10)</SelectItem>
                          )}
                          {('Melbourne'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Austrália'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Australia/Melbourne">🇦🇺 Melbourne (UTC+10)</SelectItem>
                          )}
                          {('Brisbane'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Austrália'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Australia/Brisbane">🇦🇺 Brisbane (UTC+10)</SelectItem>
                          )}
                          {('Perth'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Austrália'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Australia/Perth">🇦🇺 Perth (UTC+8)</SelectItem>
                          )}
                          {('Auckland'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Nova Zelândia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Pacific/Auckland">🇳🇿 Auckland (UTC+12)</SelectItem>
                          )}
                          
                          {/* Oriente Médio */}
                          {('Jerusalém'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Jerusalem'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Israel'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Jerusalem">🇮🇱 Jerusalém (UTC+2)</SelectItem>
                          )}
                          {('Riad'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Riyadh'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Arábia'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Riyadh">🇸🇦 Riad (UTC+3)</SelectItem>
                          )}
                          {('Teerã'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Tehran'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Irã'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="Asia/Tehran">🇮🇷 Teerã (UTC+3:30)</SelectItem>
                          )}
                          
                          {/* UTC Universal */}
                          {('UTC'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || 'Universal'.toLowerCase().includes(timezoneSearchFilter.toLowerCase()) || timezoneSearchFilter === '') && (
                            <SelectItem value="UTC">🌍 UTC (Universal)</SelectItem>
                          )}
                          </div>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                        Todos os horários serão baseados neste fuso horário
                      </p>
                    </div>

                    <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 font-semibold text-base">Horários por Dia da Semana</Label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Configure os horários de disponibilidade para cada dia</p>
                        </div>
                      </div>

                      {availabilitySchedules.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <Clock className="w-16 h-16 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nenhum horário configurado</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Adicione horários para definir quando o agente estará disponível</p>
                        </div>
                      )}

                      {/* Agrupar por dia da semana */}
                      {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                        const daySchedules = availabilitySchedules.filter(s => s.day_of_week === dayOfWeek)
                        const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
                        const dayEmojis = ['☀️', '🌙', '🔥', '💼', '⚡', '🎉', '🌴']
                        
                        return (
                          <div key={dayOfWeek} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{dayEmojis[dayOfWeek]}</span>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{dayNames[dayOfWeek]}</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {daySchedules.length === 0 ? 'Sem horários' : `${daySchedules.length} horário${daySchedules.length > 1 ? 's' : ''}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {daySchedules.length > 0 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSourceDayForDuplicate(dayOfWeek)
                                        setSelectedDaysForDuplicate([])
                                        setShowDuplicateModal(true)
                                      }}
                                      className="text-xs"
                                      title="Duplicar para outros dias"
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      Duplicar
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newSchedule: AvailabilitySchedule = {
                                        day_of_week: dayOfWeek,
                                        start_time: '09:00',
                                        end_time: '18:00',
                                        timezone: selectedTimezone,
                                        is_active: true,
                                      }
                                      setAvailabilitySchedules([...availabilitySchedules, newSchedule])
                                    }}
                                    className="text-xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Adicionar
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {daySchedules.length > 0 && (
                              <div className="p-3 space-y-2">
                                {daySchedules.map((schedule, scheduleIndex) => {
                                  const globalIndex = availabilitySchedules.findIndex(
                                    s => s === schedule
                                  )
                                  const hasError = scheduleErrors.has(globalIndex)
                                  const errorMessage = scheduleErrors.get(globalIndex)
                                  
                                  return (
                                    <div key={scheduleIndex}>
                                      <div 
                                        data-schedule-index={globalIndex}
                                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                                          hasError 
                                            ? 'bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-600 shadow-md' 
                                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                                        }`}
                                      >
                                        <Clock className={`w-4 h-4 ${
                                          hasError ? 'text-red-500' : 'text-gray-400'
                                        }`} />
                                        <Input
                                          type="time"
                                          value={schedule.start_time}
                                          onChange={(e) => {
                                            const updated = [...availabilitySchedules]
                                            updated[globalIndex].start_time = e.target.value
                                            setAvailabilitySchedules(updated)
                                            
                                            // Reward Early: Se tinha erro, validar imediatamente ao corrigir
                                            if (hasError || hasSubmitAttempted) {
                                              setTimeout(() => {
                                                const newErrors = new Map<number, string>()
                                                updated.forEach((s, i) => {
                                                  updated.forEach((other, j) => {
                                                    if (i < j && s.day_of_week === other.day_of_week) {
                                                      const start1 = timeToMinutes(s.start_time)
                                                      const end1 = timeToMinutes(s.end_time)
                                                      const start2 = timeToMinutes(other.start_time)
                                                      const end2 = timeToMinutes(other.end_time)
                                                      
                                                      if (checkTimeOverlap(start1, end1, start2, end2)) {
                                                        const msg = `Conflito: ${s.start_time}-${s.end_time} ⚔️ ${other.start_time}-${other.end_time}`
                                                        newErrors.set(i, msg)
                                                        newErrors.set(j, msg)
                                                      }
                                                    }
                                                  })
                                                })
                                                setScheduleErrors(newErrors)
                                              }, 300)
                                            }
                                          }}
                                          onBlur={() => {
                                            // Punish Late: Validar ao sair do campo mesmo sem erro anterior
                                            setTimeout(() => {
                                              const newErrors = new Map<number, string>()
                                              availabilitySchedules.forEach((s, i) => {
                                                availabilitySchedules.forEach((other, j) => {
                                                  if (i < j && s.day_of_week === other.day_of_week) {
                                                    const start1 = timeToMinutes(s.start_time)
                                                    const end1 = timeToMinutes(s.end_time)
                                                    const start2 = timeToMinutes(other.start_time)
                                                    const end2 = timeToMinutes(other.end_time)
                                                    
                                                    if (checkTimeOverlap(start1, end1, start2, end2)) {
                                                      const msg = `Conflito: ${s.start_time}-${s.end_time} ⚔️ ${other.start_time}-${other.end_time}`
                                                      newErrors.set(i, msg)
                                                      newErrors.set(j, msg)
                                                    }
                                                  }
                                                })
                                              })
                                              setScheduleErrors(newErrors)
                                            }, 150)
                                          }}
                                          className={`flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                                            hasError 
                                              ? 'border-red-500 dark:border-red-600 focus:ring-red-500' 
                                              : 'border-gray-300 dark:border-gray-600'
                                          }`}
                                        />
                                        <span className="text-gray-500 font-medium">até</span>
                                        <Input
                                          type="time"
                                          value={schedule.end_time}
                                          onChange={(e) => {
                                            const updated = [...availabilitySchedules]
                                            updated[globalIndex].end_time = e.target.value
                                            setAvailabilitySchedules(updated)
                                            
                                            // Reward Early: Se tinha erro, validar imediatamente ao corrigir
                                            if (hasError || hasSubmitAttempted) {
                                              setTimeout(() => {
                                                const newErrors = new Map<number, string>()
                                                updated.forEach((s, i) => {
                                                  updated.forEach((other, j) => {
                                                    if (i < j && s.day_of_week === other.day_of_week) {
                                                      const start1 = timeToMinutes(s.start_time)
                                                      const end1 = timeToMinutes(s.end_time)
                                                      const start2 = timeToMinutes(other.start_time)
                                                      const end2 = timeToMinutes(other.end_time)
                                                      
                                                      if (checkTimeOverlap(start1, end1, start2, end2)) {
                                                        const msg = `Conflito: ${s.start_time}-${s.end_time} ⚔️ ${other.start_time}-${other.end_time}`
                                                        newErrors.set(i, msg)
                                                        newErrors.set(j, msg)
                                                      }
                                                    }
                                                  })
                                                })
                                                setScheduleErrors(newErrors)
                                              }, 300)
                                            }
                                          }}
                                          onBlur={() => {
                                            // Punish Late: Validar ao sair do campo mesmo sem erro anterior
                                            setTimeout(() => {
                                              const newErrors = new Map<number, string>()
                                              availabilitySchedules.forEach((s, i) => {
                                                availabilitySchedules.forEach((other, j) => {
                                                  if (i < j && s.day_of_week === other.day_of_week) {
                                                    const start1 = timeToMinutes(s.start_time)
                                                    const end1 = timeToMinutes(s.end_time)
                                                    const start2 = timeToMinutes(other.start_time)
                                                    const end2 = timeToMinutes(other.end_time)
                                                    
                                                    if (checkTimeOverlap(start1, end1, start2, end2)) {
                                                      const msg = `Conflito: ${s.start_time}-${s.end_time} ⚔️ ${other.start_time}-${other.end_time}`
                                                      newErrors.set(i, msg)
                                                      newErrors.set(j, msg)
                                                    }
                                                  }
                                                })
                                              })
                                              setScheduleErrors(newErrors)
                                            }, 150)
                                          }}
                                          className={`flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                                            hasError 
                                              ? 'border-red-500 dark:border-red-600 focus:ring-red-500' 
                                              : 'border-gray-300 dark:border-gray-600'
                                          }`}
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const updated = availabilitySchedules.filter((_, i) => i !== globalIndex)
                                            setAvailabilitySchedules(updated)
                                            // Limpar erro ao remover
                                            const newErrors = new Map(scheduleErrors)
                                            newErrors.delete(globalIndex)
                                            setScheduleErrors(newErrors)
                                          }}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                          title="Remover horário"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      
                                      {/* Mensagem de erro inline */}
                                      {hasError && errorMessage && (
                                        <div className="mt-2 ml-8 p-2 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded text-xs text-red-700 dark:text-red-300 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                          </svg>
                                          <span>{errorMessage}</span>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {availabilitySchedules.length > 0 && (
                      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
                        <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>💡 Dica:</strong> Você pode adicionar múltiplos horários por dia. Por exemplo: 09:00-12:00 e 14:00-18:00 para ter intervalo de almoço.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {formData.availability_mode === 'disabled' && (
                  <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      ⚠️ Com esta opção, o agente não poderá ser acessado via API GET /agent/id
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

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
                      onCheckedChange={(checked) =>
                        setFormData((prev) => {
                          if (!checked) {
                            return { ...prev, calendar_integration: checked }
                          }

                          const provider = prev.calendar_provider || "calcom"
                          const version =
                            provider === "calcom" ? prev.calendar_api_version || "v1" : prev.calendar_api_version
                          const existingUrl =
                            provider === "calcom"
                              ? prev.calendar_api_url && prev.calendar_api_url.trim().length > 0
                                ? prev.calendar_api_url
                                : getCalcomDefaultUrl(version)
                              : prev.calendar_api_url || null

                          return {
                            ...prev,
                            calendar_integration: checked,
                            calendar_provider: provider,
                            calendar_api_version: provider === "calcom" ? version : prev.calendar_api_version,
                            calendar_api_url: existingUrl,
                          }
                        })
                      }
                      className={switchStyles}
                    />
                  </div>
                  {formData.calendar_integration && (
                    <div className="space-y-3 pl-4 border-l-2 border-green-200 bg-green-50 p-4 rounded dark:bg-gray-700 dark:border-green-700">
                      <div>
                        <Label htmlFor="calendar_provider" className="text-gray-900 dark:text-gray-100">
                          Provedor de Calendário
                        </Label>
                        <Select
                          value={formData.calendar_provider || "calcom"}
                          onValueChange={handleCalendarProviderChange}
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Selecione o provedor" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <SelectItem value="calcom">Cal.com</SelectItem>
                            <SelectItem value="coming_soon">Em breve</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                          Escolha qual provedor de calendário será utilizado para os agendamentos.
                        </p>
                      </div>

                      {formData.calendar_provider === "coming_soon" && (
                        <div className="rounded-md border border-dashed border-yellow-400 bg-yellow-50 p-3 text-xs text-yellow-700 dark:bg-gray-800 dark:border-yellow-700 dark:text-yellow-300">
                          Novas integrações de calendário estarão disponíveis em breve.
                        </div>
                      )}

                      {formData.calendar_provider === "calcom" && (
                        <>
                          <div>
                            <Label htmlFor="calendar_api_version" className="text-gray-900 dark:text-gray-100">
                              Versão da API
                            </Label>
                            <Select
                              value={formData.calendar_api_version || "v1"}
                              onValueChange={handleCalendarVersionChange}
                            >
                              <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                                <SelectValue placeholder="Selecione a versão" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                                <SelectItem value="v1">v1 (https://api.cal.com/v1)</SelectItem>
                                <SelectItem value="v2">v2 (https://api.cal.com/v2)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="calendar_api_url" className="text-gray-900 dark:text-gray-100">
                              URL da API do Calendário
                            </Label>
                            <Input
                              id="calendar_api_url"
                              name="calendar_api_url"
                              value={formData.calendar_api_url || ""}
                              onChange={handleInputChange}
                              placeholder={getCalcomDefaultUrl(formData.calendar_api_version)}
                              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-gray-500 dark:text-gray-400">
                              Personalize a URL caso utilize um proxy ou ambiente dedicado do provedor.
                            </p>
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
                              Informe o identificador da reunião ou calendário onde os agendamentos serão criados.
                            </p>
                          </div>

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
                        </>
                      )}
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

          {/* Modal de Duplicação de Horários */}
          {showDuplicateModal && sourceDayForDuplicate !== null && (
            <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Duplicar Horários</DialogTitle>
                  <DialogDescription>
                    Selecione os dias para os quais deseja copiar os horários de{' '}
                    <strong>
                      {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][sourceDayForDuplicate]}
                    </strong>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                  {[0, 1, 2, 3, 4, 5, 6]
                    .filter(day => day !== sourceDayForDuplicate)
                    .map(day => {
                      const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
                      const dayEmojis = ['☀️', '🌙', '🔥', '💼', '⚡', '🎉', '🌴']
                      const hasSchedules = availabilitySchedules.some(s => s.day_of_week === day)
                      const isSelected = selectedDaysForDuplicate.includes(day)

                      return (
                        <div
                          key={day}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                          }`}
                          onClick={() => {
                            setSelectedDaysForDuplicate(prev =>
                              isSelected
                                ? prev.filter(d => d !== day)
                                : [...prev, day]
                            )
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{dayEmojis[day]}</span>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{dayNames[day]}</p>
                              {hasSchedules && (
                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                  ⚠️ Já possui horários (serão mantidos)
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDuplicateModal(false)
                      setSelectedDaysForDuplicate([])
                      setSourceDayForDuplicate(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedDaysForDuplicate.length === 0) {
                        toast({
                          title: "Nenhum dia selecionado",
                          description: "Selecione pelo menos um dia para duplicar os horários.",
                          variant: "destructive",
                        })
                        return
                      }

                      const sourceSchedules = availabilitySchedules.filter(
                        s => s.day_of_week === sourceDayForDuplicate
                      )

                      const newSchedules = [...availabilitySchedules]
                      selectedDaysForDuplicate.forEach(targetDay => {
                        sourceSchedules.forEach(schedule => {
                          newSchedules.push({
                            ...schedule,
                            day_of_week: targetDay,
                          })
                        })
                      })

                      setAvailabilitySchedules(newSchedules)
                      setShowDuplicateModal(false)
                      setSelectedDaysForDuplicate([])
                      setSourceDayForDuplicate(null)

                      toast({
                        title: "Horários duplicados",
                        description: `Horários copiados para ${selectedDaysForDuplicate.length} dia${selectedDaysForDuplicate.length > 1 ? 's' : ''}.`,
                      })
                    }}
                    disabled={selectedDaysForDuplicate.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Duplicar para {selectedDaysForDuplicate.length} dia{selectedDaysForDuplicate.length !== 1 ? 's' : ''}
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
