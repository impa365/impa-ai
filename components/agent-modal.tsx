"use client"

import type React from "react" // Mantido

import { useState, useEffect, useMemo } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bot,
  Settings,
  Volume2,
  CalendarDays,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  FileText,
  Brain,
  Palette,
  Clock,
  UserCheck,
  Loader2,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { modelosOpenAI } from "@/lib/openai-models"
import { vozOutputProviders } from "@/lib/tts-providers"
import { fetchWhatsAppConnections, type WhatsAppConnection } from "@/lib/whatsapp-connections" // Importar WhatsAppConnection type
import { createEvolutionBot, updateEvolutionBot, fetchEvolutionBotSettings } from "@/lib/evolution-api"

// Interfaces Agent, ModelConfig, VoiceConfig, ToolsConfig (sem alterações)
export interface Agent {
  id: string
  user_id: string
  name: string
  description?: string | null
  prompt_template: string
  model_name: string
  temperature: number
  top_p: number
  max_tokens: number
  model_config: ModelConfig // Mantido como objeto
  is_active: boolean
  created_at?: string
  updated_at?: string
  is_default: boolean
  whatsapp_connection_id?: string | null
  // @ts-ignore - whatsapp_connections pode não existir diretamente no agente, mas ser juntado
  whatsapp_connections?: { instance_name: string } | null
  evolution_bot_id?: string | null
  n8n_webhook_url?: string | null
}

export interface ModelConfig {
  greeting_message_enabled: boolean
  greeting_message?: string | null
  max_messages_per_user: number
  rate_limit_message?: string | null
  inactivity_timeout: number // em segundos
  inactivity_message?: string | null
  voice_output_enabled: boolean
  voice_provider?: string | null
  voice_config?: VoiceConfig | null
  tools_config?: ToolsConfig | null
  conversation_memory: "short_term" | "long_term" | "none"
  knowledge_base_enabled: boolean
  knowledge_base_ids?: string[] | null
  tone_and_style: {
    personality: string
    language_style: string
    response_length: "concise" | "medium" | "detailed"
  }
  activation_keyword?: string | null
  allowed_numbers?: string[] | null // Lista de números permitidos (com DDD)
  blocked_numbers?: string[] | null // Lista de números bloqueados (com DDD)
  collect_user_feedback: boolean
  human_takeover_enabled: boolean
  human_takeover_keyword?: string | null
  human_takeover_email?: string | null // Email para notificar sobre takeover
}

export interface VoiceConfig {
  voice_id?: string | null
  speaking_rate?: number | null // e.g., 0.5 to 2.0
  pitch?: number | null // e.g., -20 to 20
  emotion?: string | null // if supported by provider
}

export interface ToolsConfig {
  cal_com: {
    enabled: boolean
    api_key?: string | null
    event_type_id?: string | null
  }
  knowledge_retrieval: {
    enabled: boolean
    retrieval_sources?: string[] | null // IDs de bases de conhecimento
  }
}

const initialFormData: Agent = {
  id: "", // Será gerado pelo Supabase ou definido se editando
  user_id: "", // Será definido pelo usuário logado
  name: "",
  description: "",
  prompt_template: "Você é um assistente prestativo.",
  model_name: "gpt-4o",
  temperature: 0.7,
  top_p: 1.0,
  max_tokens: 1500,
  model_config: {
    greeting_message_enabled: true,
    greeting_message: "Olá! Como posso te ajudar hoje?",
    max_messages_per_user: 0, // 0 para ilimitado
    rate_limit_message: "Você atingiu o limite de mensagens. Por favor, tente novamente mais tarde.",
    inactivity_timeout: 600, // 10 minutos
    inactivity_message: "Sua sessão foi encerrada por inatividade. Envie uma mensagem para recomeçar.",
    voice_output_enabled: false,
    voice_provider: "elevenlabs",
    voice_config: {
      voice_id: "",
      speaking_rate: 1.0,
      pitch: 0,
      emotion: "neutral",
    },
    tools_config: {
      cal_com: {
        enabled: false,
        api_key: "",
        event_type_id: "",
      },
      knowledge_retrieval: {
        enabled: false,
        retrieval_sources: [],
      },
    },
    conversation_memory: "long_term",
    knowledge_base_enabled: false,
    knowledge_base_ids: [],
    tone_and_style: {
      personality: "Amigável e profissional",
      language_style: "Clara e objetiva",
      response_length: "medium",
    },
    activation_keyword: "/ia",
    allowed_numbers: [],
    blocked_numbers: [],
    collect_user_feedback: true,
    human_takeover_enabled: false,
    human_takeover_keyword: "/humano",
    human_takeover_email: "",
  },
  is_active: true,
  is_default: false,
  whatsapp_connection_id: null,
  evolution_bot_id: null,
  n8n_webhook_url: null,
}

interface AgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: Agent | null
  onSave: () => void // Simplificado: apenas notifica que salvou, a página recarrega
  maxAgentsReached?: boolean
  isEditing?: boolean
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
  const [showCalApiKey, setShowCalApiKey] = useState(false)
  const [whatsappConnections, setWhatsappConnections] = useState<WhatsAppConnection[]>([])
  const [n8nIntegrationConfig, setN8nIntegrationConfig] = useState<any>(null)
  const [evolutionInstanceName, setEvolutionInstanceName] = useState<string | null>(null)

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    toneStyle: true,
    behaviorLimits: false,
    advancedFeatures: false,
    integrations: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    if (user) {
      setFormData((prev) => ({ ...prev, user_id: user.id || "" }))
      loadWhatsAppConnections(user.id)
      loadN8nConfig()
    }
  }, [])

  const loadN8nConfig = async () => {
    try {
      const { data, error: n8nError } = await supabase.from("integrations").select("config").eq("type", "n8n").single()
      if (n8nError && n8nError.code !== "PGRST116") throw n8nError // PGRST116 means no rows found, which is fine
      if (data?.config) {
        setN8nIntegrationConfig(data.config)
      } else {
        console.warn("Configuração da integração n8n não encontrada ou vazia.")
        setN8nIntegrationConfig(null) // Garantir que seja null se não encontrado
      }
    } catch (err) {
      console.error("Erro ao carregar configuração n8n:", err)
    }
  }

  const loadWhatsAppConnections = async (userId: string) => {
    const connections = await fetchWhatsAppConnections(userId)
    setWhatsappConnections(connections)
    if (agent?.whatsapp_connection_id) {
      const selectedConn = connections.find((c) => c.id === agent.whatsapp_connection_id)
      if (selectedConn) {
        setEvolutionInstanceName(selectedConn.instance_name)
      }
    }
  }

  useEffect(() => {
    if (agent) {
      const agentModelConfig =
        typeof agent.model_config === "string" ? JSON.parse(agent.model_config) : agent.model_config

      const mergedModelConfig: ModelConfig = {
        ...initialFormData.model_config,
        ...(agentModelConfig || {}), // Garante que agentModelConfig seja um objeto
        greeting_message: (agentModelConfig?.greeting_message || initialFormData.model_config.greeting_message) ?? "",
        rate_limit_message:
          (agentModelConfig?.rate_limit_message || initialFormData.model_config.rate_limit_message) ?? "",
        inactivity_message:
          (agentModelConfig?.inactivity_message || initialFormData.model_config.inactivity_message) ?? "",
        voice_config: {
          ...initialFormData.model_config.voice_config,
          ...(agentModelConfig?.voice_config || {}),
        },
        tools_config: {
          ...initialFormData.model_config.tools_config,
          cal_com: {
            ...(initialFormData.model_config.tools_config?.cal_com || {}),
            ...(agentModelConfig?.tools_config?.cal_com || {}),
          },
          knowledge_retrieval: {
            ...(initialFormData.model_config.tools_config?.knowledge_retrieval || {}),
            ...(agentModelConfig?.tools_config?.knowledge_retrieval || {}),
          },
        },
        tone_and_style: {
          ...initialFormData.model_config.tone_and_style,
          ...(agentModelConfig?.tone_and_style || {}),
        },
      }

      setFormData({
        ...initialFormData,
        ...agent,
        description: agent.description ?? "", // Garante que description seja string
        prompt_template: agent.prompt_template ?? "", // Garante que prompt_template seja string
        model_config: mergedModelConfig,
      })

      if (agent.whatsapp_connection_id) {
        const selectedConn = whatsappConnections.find((c) => c.id === agent.whatsapp_connection_id)
        if (selectedConn) {
          setEvolutionInstanceName(selectedConn.instance_name)
        }
      }
    } else {
      setFormData({ ...initialFormData, user_id: currentUser?.id || "" })
      setEvolutionInstanceName(null)
    }
  }, [agent, currentUser, whatsappConnections])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: keyof Agent | keyof ModelConfig, checked: boolean, isModelConfigField = false) => {
    if (isModelConfigField) {
      setFormData((prev) => ({
        ...prev,
        model_config: { ...prev.model_config, [name]: checked },
      }))
    } else {
      // @ts-ignore
      setFormData((prev) => ({ ...prev, [name]: checked }))
    }
  }

  const handleSelectChange = (
    name: keyof Agent | keyof ModelConfig,
    value: string | number,
    isModelConfigField = false,
    subKey?: keyof ModelConfig["tone_and_style"],
  ) => {
    if (isModelConfigField) {
      if (name === "tone_and_style" && subKey) {
        setFormData((prev) => ({
          ...prev,
          model_config: {
            ...prev.model_config,
            tone_and_style: {
              ...prev.model_config.tone_and_style,
              [subKey]: value,
            },
          },
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          model_config: { ...prev.model_config, [name]: value },
        }))
      }
    } else {
      // @ts-ignore
      setFormData((prev) => ({ ...prev, [name]: value }))
      if (name === "whatsapp_connection_id") {
        const selectedConn = whatsappConnections.find((c) => c.id === value)
        setEvolutionInstanceName(selectedConn ? selectedConn.instance_name : null)
      }
    }
  }

  const handleSliderChange = (name: keyof Agent, value: number[]) => {
    // @ts-ignore
    setFormData((prev) => ({ ...prev, [name]: value[0] }))
  }

  const handleConfigChange = (
    key: keyof ModelConfig,
    value: any,
    subKey?:
      | keyof VoiceConfig
      | keyof ToolsConfig["cal_com"]
      | keyof ModelConfig["tone_and_style"]
      | keyof ToolsConfig["knowledge_retrieval"],
    subSubKey?: keyof ToolsConfig["cal_com"] | keyof ToolsConfig["knowledge_retrieval"], // Can be extended
  ) => {
    setFormData((prev) => {
      const newModelConfig = { ...prev.model_config }
      if (subKey && subSubKey && key === "tools_config" /*|| key === "other_nested_config"*/) {
        // @ts-ignore
        newModelConfig[key] = {
          ...newModelConfig[key],
          [subKey]: {
            // @ts-ignore
            ...newModelConfig[key]?.[subKey],
            [subSubKey]: value,
          },
        }
      } else if (subKey && (key === "voice_config" || key === "tools_config" || key === "tone_and_style")) {
        // @ts-ignore
        newModelConfig[key] = { ...newModelConfig[key], [subKey]: value }
      } else {
        // @ts-ignore
        newModelConfig[key] = value
      }
      return { ...prev, model_config: newModelConfig }
    })
  }

  const selectedModelInfo = useMemo(() => {
    return modelosOpenAI.find((m) => m.id === formData.model_name)
  }, [formData.model_name])

  const selectedVoiceProviderInfo = useMemo(() => {
    return vozOutputProviders.find((p) => p.id === formData.model_config.voice_provider)
  }, [formData.model_config.voice_provider])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (maxAgentsReached && !isEditing) {
      setError("Você atingiu o limite máximo de agentes.")
      toast({ title: "Limite Atingido", description: "Você não pode criar mais agentes.", variant: "destructive" })
      return
    }
    setLoading(true)
    setError(null)

    const requiredFields: (keyof Agent | string)[] = ["name", "prompt_template", "whatsapp_connection_id"]
    const requiredModelConfigFields: (keyof ModelConfig)[] = ["activation_keyword"]

    for (const field of requiredFields) {
      // @ts-ignore
      if (!formData[field] || (typeof formData[field] === "string" && !(formData[field] as string).trim())) {
        setError(`O campo "${field}" é obrigatório.`)
        setLoading(false)
        return
      }
    }
    for (const field of requiredModelConfigFields) {
      // @ts-ignore
      if (
        !formData.model_config[field] ||
        (typeof formData.model_config[field] === "string" && !(formData.model_config[field] as string).trim())
      ) {
        setError(`O campo de configuração "${field}" é obrigatório.`)
        setLoading(false)
        return
      }
    }

    if (!evolutionInstanceName && formData.whatsapp_connection_id) {
      const selectedConn = whatsappConnections.find((c) => c.id === formData.whatsapp_connection_id)
      if (!selectedConn || !selectedConn.instance_name) {
        setError("Não foi possível encontrar o nome da instância da Evolution API para a conexão selecionada.")
        setLoading(false)
        return
      }
      // Se encontrou, o evolutionInstanceName já deve ter sido setado no handleSelectChange
    }

    try {
      let evolutionBotId = formData.evolution_bot_id
      let finalN8nWebhookUrl = formData.n8n_webhook_url

      // Gerar URL do n8n e criar/atualizar bot na Evolution API
      if (n8nIntegrationConfig?.flowUrl && evolutionInstanceName) {
        const agentSpecificToken = `AGENT_${formData.id || Date.now()}_TOKEN`
        finalN8nWebhookUrl = `${n8nIntegrationConfig.flowUrl}${n8nIntegrationConfig.flowUrl.includes("?") ? "&" : "?"}bot_token=${agentSpecificToken}`

        const evolutionBotPayload = {
          name: formData.name,
          description: formData.description || "",
          prompt: formData.prompt_template,
          model: formData.model_name,
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
          webhook_url: finalN8nWebhookUrl,
          api_key: n8nIntegrationConfig.apiKey || null,
          active: formData.is_active,
          keyword: formData.model_config.activation_keyword || "",
          // Adicionar outros campos relevantes da Evolution API aqui, se necessário
          // Ex: group_id, department_id, etc.
        }

        // Fetch current bot settings from Evolution API if updating
        let currentEvolutionSettings = null
        if (formData.evolution_bot_id && evolutionInstanceName) {
          const settingsResult = await fetchEvolutionBotSettings(evolutionInstanceName, formData.evolution_bot_id)
          if (settingsResult.success && settingsResult.settings) {
            currentEvolutionSettings = settingsResult.settings
          } else {
            console.warn("Não foi possível buscar configurações atuais do bot na Evolution API:", settingsResult.error)
          }
        }

        // Merge new settings with existing ones, prioritizing new settings
        const finalEvolutionPayload = {
          ...(currentEvolutionSettings || {}), // existing settings or empty object
          ...evolutionBotPayload, // new settings override existing ones
        }

        if (formData.evolution_bot_id) {
          const updateResult = await updateEvolutionBot(
            evolutionInstanceName,
            formData.evolution_bot_id,
            finalEvolutionPayload,
          )
          if (!updateResult.success) throw new Error(updateResult.error || "Falha ao atualizar bot na Evolution API")
        } else {
          const createResult = await createEvolutionBot(evolutionInstanceName, finalEvolutionPayload)
          if (!createResult.success || !createResult.bot?.id)
            throw new Error(createResult.error || "Falha ao criar bot na Evolution API")
          evolutionBotId = createResult.bot.id
        }
      } else {
        if (!evolutionInstanceName && formData.whatsapp_connection_id) {
          console.warn(
            "Nome da instância da Evolution API não definido. Pulando criação/atualização do bot na Evolution.",
          )
        } else if (!n8nIntegrationConfig?.flowUrl) {
          console.warn("URL do fluxo n8n não configurada. Pulando criação/atualização do bot na Evolution.")
        }
      }

      const dbData = {
        ...formData, // formData já tem model_config como objeto
        user_id: currentUser.id,
        evolution_bot_id: evolutionBotId,
        n8n_webhook_url: finalN8nWebhookUrl,
      }
      // Remover campos que não existem na tabela ou são gerenciados automaticamente
      delete dbData.created_at
      delete dbData.updated_at
      // @ts-ignore
      delete dbData.whatsapp_connections // Este é um campo de junção, não deve ser salvo diretamente

      if (isEditing && agent?.id) {
        const { error: updateError } = await supabase.from("ai_agents").update(dbData).eq("id", agent.id)
        if (updateError) throw updateError
        toast({ title: "Sucesso", description: "Agente atualizado com sucesso!" })
      } else {
        // @ts-ignore - id é gerado pelo Supabase na inserção
        delete dbData.id
        const { data: newAgentData, error: insertError } = await supabase
          .from("ai_agents")
          .insert(dbData)
          .select()
          .single()
        if (insertError) throw insertError

        // Se o bot da Evolution não foi criado antes por falta de ID do agente, tentar criar agora
        if (newAgentData && !evolutionBotId && n8nIntegrationConfig?.flowUrl && evolutionInstanceName) {
          const agentSpecificToken = `AGENT_${newAgentData.id}_TOKEN`
          const newN8nWebhookUrl = `${n8nIntegrationConfig.flowUrl}${n8nIntegrationConfig.flowUrl.includes("?") ? "&" : "?"}bot_token=${agentSpecificToken}`
          const evolutionBotPayloadRetry = {
            name: newAgentData.name,
            description: newAgentData.description || "",
            prompt: newAgentData.prompt_template,
            model: newAgentData.model_name,
            temperature: newAgentData.temperature,
            max_tokens: newAgentData.max_tokens,
            webhook_url: newN8nWebhookUrl,
            api_key: n8nIntegrationConfig.apiKey || null,
            active: newAgentData.is_active,
            keyword: newAgentData.model_config.activation_keyword || "",
          }
          const createResultRetry = await createEvolutionBot(evolutionInstanceName, evolutionBotPayloadRetry)
          if (createResultRetry.success && createResultRetry.bot?.id) {
            await supabase
              .from("ai_agents")
              .update({ evolution_bot_id: createResultRetry.bot.id, n8n_webhook_url: newN8nWebhookUrl })
              .eq("id", newAgentData.id)
          } else {
            console.warn("Falha ao criar bot na Evolution API após criação do agente:", createResultRetry.error)
          }
        }
        toast({ title: "Sucesso", description: "Agente criado com sucesso!" })
      }
      onSave() // Notifica a página para recarregar
      onOpenChange(false)
    } catch (err: any) {
      console.error("Erro ao salvar agente:", err)
      const errorMessage = err.message || "Ocorreu um erro desconhecido ao salvar o agente."
      setError(errorMessage)
      toast({ title: "Erro ao Salvar", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const SectionToggle = ({
    title,
    sectionKey,
    icon: Icon,
    description,
  }: {
    title: string
    sectionKey: keyof typeof expandedSections
    icon: React.ElementType
    description?: string
  }) => (
    <div className="border-b">
      <Button
        variant="ghost"
        onClick={() => toggleSection(sectionKey)}
        className="w-full justify-between text-md font-semibold py-4 px-4 hover:bg-gray-50 rounded-none"
      >
        <div className="flex items-center">
          <Icon className="w-5 h-5 mr-3 text-primary" />
          <div>
            {title}
            {description && <p className="text-xs text-gray-500 font-normal text-left">{description}</p>}
          </div>
        </div>
        {expandedSections[sectionKey] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </Button>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-2xl font-bold flex items-center">
              <Bot className="w-7 h-7 mr-3 text-primary" />
              {isEditing ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes, comportamento e integrações do seu assistente virtual.
            </DialogDescription>
          </DialogHeader>

          <div className="px-2 py-4 md:px-6 md:py-6 space-y-0 bg-gray-50/30">
            {error && (
              <div className="px-4 pb-4">
                <Alert variant="destructive">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}
            {maxAgentsReached && !isEditing && (
              <div className="px-4 pb-4">
                <Alert variant="warning">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Você atingiu o limite máximo de agentes. Para criar mais, considere atualizar seu plano ou remover
                    agentes existentes.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <Card className="shadow-sm overflow-hidden">
              <SectionToggle
                title="Informações Básicas e Modelo"
                sectionKey="basic"
                icon={FileText}
                description="Nome, descrição, modelo de IA e parâmetros de geração."
              />
              {expandedSections.basic && (
                <CardContent className="p-4 md:p-6 space-y-4 border-t">
                  <div>
                    <Label htmlFor="name">Nome do Agente *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Assistente de Vendas Avançado"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição (Opcional)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleInputChange}
                      placeholder="Descreva a função e especialidade do agente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model_name">Modelo OpenAI *</Label>
                    <Select
                      name="model_name"
                      value={formData.model_name}
                      onValueChange={(value) => handleSelectChange("model_name", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelosOpenAI.map((modelo) => (
                          <SelectItem key={modelo.id} value={modelo.id}>
                            {" "}
                            {modelo.name} ({modelo.context_window} tokens){" "}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedModelInfo && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {" "}
                        Janela de contexto: {selectedModelInfo.context_window.toLocaleString()} tokens.{" "}
                        {selectedModelInfo.description}{" "}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="temperature">Temperatura: {formData.temperature.toFixed(1)}</Label>
                      <Slider
                        id="temperature"
                        name="temperature"
                        min={0}
                        max={1}
                        step={0.1}
                        defaultValue={[formData.temperature]}
                        onValueChange={(value) => handleSliderChange("temperature", value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Controla a aleatoriedade. Mais alto = mais criativo.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="top_p">Top P: {formData.top_p.toFixed(1)}</Label>
                      <Slider
                        id="top_p"
                        name="top_p"
                        min={0}
                        max={1}
                        step={0.1}
                        defaultValue={[formData.top_p]}
                        onValueChange={(value) => handleSliderChange("top_p", value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Controla a diversidade via amostragem nucleus.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="max_tokens">Max Tokens Resposta: {formData.max_tokens}</Label>
                      <Input
                        type="number"
                        id="max_tokens"
                        name="max_tokens"
                        value={formData.max_tokens}
                        onChange={handleInputChange}
                        placeholder="1500"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Máximo de tokens na resposta do agente.</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="prompt_template">Prompt de Treinamento (Instruções do Sistema) *</Label>
                    <Textarea
                      id="prompt_template"
                      name="prompt_template"
                      value={formData.prompt_template || ""}
                      onChange={handleInputChange}
                      placeholder="Você é um assistente virtual especializado em..."
                      rows={8}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Defina a persona, o papel, as instruções principais e o conhecimento base do seu agente.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="shadow-sm overflow-hidden mt-4">
              <SectionToggle
                title="Tom, Estilo e Função"
                sectionKey="toneStyle"
                icon={Palette}
                description="Personalidade, estilo de linguagem e comprimento das respostas."
              />
              {expandedSections.toneStyle && (
                <CardContent className="p-4 md:p-6 space-y-4 border-t">
                  <div>
                    <Label htmlFor="personality">Personalidade</Label>
                    <Input
                      id="personality"
                      value={formData.model_config.tone_and_style.personality}
                      onChange={(e) => handleConfigChange("tone_and_style", e.target.value, "personality")}
                      placeholder="Ex: Amigável e prestativo, Formal e direto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="language_style">Estilo de Linguagem</Label>
                    <Input
                      id="language_style"
                      value={formData.model_config.tone_and_style.language_style}
                      onChange={(e) => handleConfigChange("tone_and_style", e.target.value, "language_style")}
                      placeholder="Ex: Clara e concisa, Detalhada e explicativa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="response_length">Comprimento da Resposta</Label>
                    <Select
                      value={formData.model_config.tone_and_style.response_length}
                      onValueChange={(value) => handleConfigChange("tone_and_style", value, "response_length")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concise">Concisa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="detailed">Detalhada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="shadow-sm overflow-hidden mt-4">
              <SectionToggle
                title="Comportamento e Limites"
                sectionKey="behaviorLimits"
                icon={Settings}
                description="Ativação, saudação, inatividade, limites de uso e status."
              />
              {expandedSections.behaviorLimits && (
                <CardContent className="p-4 md:p-6 space-y-4 border-t">
                  <div>
                    <Label htmlFor="whatsapp_connection_id">Conexão WhatsApp *</Label>
                    <Select
                      name="whatsapp_connection_id"
                      value={formData.whatsapp_connection_id || ""}
                      onValueChange={(value) => handleSelectChange("whatsapp_connection_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conexão WhatsApp" />
                      </SelectTrigger>
                      <SelectContent>
                        {whatsappConnections.map((conn) => (
                          <SelectItem key={conn.id} value={conn.id}>
                            {" "}
                            {conn.connection_name} ({conn.phone_number || conn.instance_name || "N/A"}){" "}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="activation_keyword">Palavra-chave de Ativação *</Label>
                    <Input
                      id="activation_keyword"
                      value={formData.model_config.activation_keyword || ""}
                      onChange={(e) => handleConfigChange("activation_keyword", e.target.value)}
                      placeholder="Ex: /bot, !assistente"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Palavra que o usuário deve enviar para iniciar a conversa com o bot.
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label htmlFor="greeting_message_enabled" className="flex flex-col">
                      <span>Mensagem de Saudação Automática</span>
                      <span className="text-xs text-gray-500 font-normal">
                        Envia uma mensagem quando o bot é ativado.
                      </span>
                    </Label>
                    <Switch
                      id="greeting_message_enabled"
                      checked={formData.model_config.greeting_message_enabled}
                      onCheckedChange={(checked) => handleConfigChange("greeting_message_enabled", checked)}
                    />
                  </div>
                  {formData.model_config.greeting_message_enabled && (
                    <div className="pl-2">
                      <Label htmlFor="greeting_message">Texto da Mensagem de Saudação</Label>
                      <Textarea
                        id="greeting_message"
                        value={formData.model_config.greeting_message || ""}
                        onChange={(e) => handleConfigChange("greeting_message", e.target.value)}
                        placeholder="Olá! Sou seu assistente virtual. Como posso te ajudar hoje?"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="inactivity_timeout">Tempo de Inatividade (segundos)</Label>
                      <Input
                        type="number"
                        id="inactivity_timeout"
                        value={formData.model_config.inactivity_timeout}
                        onChange={(e) => handleConfigChange("inactivity_timeout", Number.parseInt(e.target.value) || 0)}
                        placeholder="Ex: 300 (5 minutos)"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Tempo para encerrar a sessão por inatividade.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="max_messages_per_user">Máx. Mensagens por Usuário (0 = ilimitado)</Label>
                      <Input
                        type="number"
                        id="max_messages_per_user"
                        value={formData.model_config.max_messages_per_user}
                        onChange={(e) =>
                          handleConfigChange("max_messages_per_user", Number.parseInt(e.target.value) || 0)
                        }
                        placeholder="Ex: 100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Define um limite de interações por usuário.</p>
                    </div>
                  </div>
                  {formData.model_config.inactivity_timeout > 0 && (
                    <div className="pl-2">
                      <Label htmlFor="inactivity_message">Mensagem de Encerramento por Inatividade</Label>
                      <Textarea
                        id="inactivity_message"
                        value={formData.model_config.inactivity_message || ""}
                        onChange={(e) => handleConfigChange("inactivity_message", e.target.value)}
                        placeholder="Sessão encerrada devido à inatividade. Envie uma mensagem para recomeçar."
                      />
                    </div>
                  )}
                  {formData.model_config.max_messages_per_user > 0 && (
                    <div className="pl-2">
                      <Label htmlFor="rate_limit_message">Mensagem de Limite de Mensagens Atingido</Label>
                      <Textarea
                        id="rate_limit_message"
                        value={formData.model_config.rate_limit_message || ""}
                        onChange={(e) => handleConfigChange("rate_limit_message", e.target.value)}
                        placeholder="Você atingiu o limite de mensagens. Por favor, tente novamente mais tarde."
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2">
                    <Label htmlFor="is_active" className="flex flex-col">
                      <span>Agente Ativo</span>
                      <span className="text-xs text-gray-500 font-normal">
                        Permite que o agente receba e processe mensagens.
                      </span>
                    </Label>
                    <Switch
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleSwitchChange("is_active", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label htmlFor="is_default" className="flex flex-col">
                      <span>Agente Padrão para esta Conexão</span>
                      <span className="text-xs text-gray-500 font-normal">
                        Se marcado, este agente responderá por padrão na conexão selecionada.
                      </span>
                    </Label>
                    <Switch
                      id="is_default"
                      name="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => handleSwitchChange("is_default", checked)}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="shadow-sm overflow-hidden mt-4">
              <SectionToggle
                title="Funcionalidades Avançadas"
                sectionKey="advancedFeatures"
                icon={Brain}
                description="Saída de voz, agendamento, memória de conversação e mais."
              />
              {expandedSections.advancedFeatures && (
                <CardContent className="p-4 md:p-6 space-y-6 border-t">
                  {/* Voice Output */}
                  <div className="p-4 border rounded-md bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <Label htmlFor="voice_output_enabled" className="flex items-center text-md font-medium">
                        {" "}
                        <Volume2 className="w-5 h-5 mr-2 text-blue-500" /> Saída de Voz (Text-to-Speech){" "}
                      </Label>
                      <Switch
                        id="voice_output_enabled"
                        checked={formData.model_config.voice_output_enabled}
                        onCheckedChange={(checked) => handleConfigChange("voice_output_enabled", checked)}
                      />
                    </div>
                    {formData.model_config.voice_output_enabled && (
                      <div className="space-y-3 pl-7 mt-2 border-t pt-3">
                        <div>
                          <Label htmlFor="voice_provider">Provedor de Voz</Label>
                          <Select
                            value={formData.model_config.voice_provider || ""}
                            onValueChange={(value) => handleConfigChange("voice_provider", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um provedor" />
                            </SelectTrigger>
                            <SelectContent>
                              {" "}
                              {vozOutputProviders.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {" "}
                                  {provider.name}{" "}
                                </SelectItem>
                              ))}{" "}
                            </SelectContent>
                          </Select>
                          {selectedVoiceProviderInfo && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {" "}
                              {selectedVoiceProviderInfo.description}{" "}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="voice_id">ID da Voz (Voice ID)</Label>
                          <Input
                            id="voice_id"
                            value={formData.model_config.voice_config?.voice_id || ""}
                            onChange={(e) => handleConfigChange("voice_config", e.target.value, "voice_id")}
                            placeholder="Ex: pMsXgVXv3BLzUgSXRplE (ElevenLabs)"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {" "}
                            ID específico da voz a ser usada no provedor. Consulte a documentação do provedor.{" "}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cal.com Integration */}
                  <div className="p-4 border rounded-md bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <Label htmlFor="cal_com_enabled" className="flex items-center text-md font-medium">
                        {" "}
                        <CalendarDays className="w-5 h-5 mr-2 text-green-500" /> Agendamento (Cal.com){" "}
                      </Label>
                      <Switch
                        id="cal_com_enabled"
                        checked={formData.model_config.tools_config?.cal_com?.enabled || false}
                        onCheckedChange={(checked) => handleConfigChange("tools_config", checked, "cal_com", "enabled")}
                      />
                    </div>
                    {formData.model_config.tools_config?.cal_com?.enabled && (
                      <div className="space-y-3 pl-7 mt-2 border-t pt-3">
                        <div>
                          <Label htmlFor="cal_com_api_key">Cal.com API Key</Label>
                          <div className="relative">
                            <Input
                              id="cal_com_api_key"
                              type={showCalApiKey ? "text" : "password"}
                              value={formData.model_config.tools_config?.cal_com?.api_key || ""}
                              onChange={(e) => handleConfigChange("tools_config", e.target.value, "cal_com", "api_key")}
                              placeholder="cal_live_..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowCalApiKey(!showCalApiKey)}
                            >
                              {" "}
                              {showCalApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{" "}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="cal_com_event_type_id">Cal.com Event Type ID / Link Slug</Label>
                          <Input
                            id="cal_com_event_type_id"
                            value={formData.model_config.tools_config?.cal_com?.event_type_id || ""}
                            onChange={(e) =>
                              handleConfigChange("tools_config", e.target.value, "cal_com", "event_type_id")
                            }
                            placeholder="Ex: meu-usuario/meu-evento-30min"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {" "}
                            O slug do seu tipo de evento Cal.com (ex: `username/event-slug`).{" "}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conversation Memory */}
                  <div className="p-4 border rounded-md bg-white">
                    <Label htmlFor="conversation_memory" className="text-md font-medium flex items-center mb-2">
                      <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Memória da Conversa
                    </Label>
                    <Select
                      value={formData.model_config.conversation_memory}
                      onValueChange={(value: "short_term" | "long_term" | "none") =>
                        handleConfigChange("conversation_memory", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma (Sem memória)</SelectItem>
                        <SelectItem value="short_term">Curto Prazo (Últimas interações)</SelectItem>
                        <SelectItem value="long_term">Longo Prazo (Resumo contínuo da conversa)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Define como o agente lembra de interações passadas na mesma conversa.
                    </p>
                  </div>

                  {/* Human Takeover */}
                  <div className="p-4 border rounded-md bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <Label htmlFor="human_takeover_enabled" className="flex items-center text-md font-medium">
                        <UserCheck className="w-5 h-5 mr-2 text-teal-500" /> Transferência para Humano
                      </Label>
                      <Switch
                        id="human_takeover_enabled"
                        checked={formData.model_config.human_takeover_enabled}
                        onCheckedChange={(checked) => handleConfigChange("human_takeover_enabled", checked)}
                      />
                    </div>
                    {formData.model_config.human_takeover_enabled && (
                      <div className="space-y-3 pl-7 mt-2 border-t pt-3">
                        <div>
                          <Label htmlFor="human_takeover_keyword">Palavra-chave para Transferência</Label>
                          <Input
                            id="human_takeover_keyword"
                            value={formData.model_config.human_takeover_keyword || ""}
                            onChange={(e) => handleConfigChange("human_takeover_keyword", e.target.value)}
                            placeholder="Ex: /humano, falar com atendente"
                          />
                        </div>
                        <div>
                          <Label htmlFor="human_takeover_email">Email para Notificação de Transferência</Label>
                          <Input
                            type="email"
                            id="human_takeover_email"
                            value={formData.model_config.human_takeover_email || ""}
                            onChange={(e) => handleConfigChange("human_takeover_email", e.target.value)}
                            placeholder="Ex: suporte@suaempresa.com"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          <DialogFooter className="p-6 pt-4 border-t sticky bottom-0 bg-white z-10">
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={loading}>
                {" "}
                Cancelar{" "}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || (maxAgentsReached && !isEditing)} className="min-w-[120px]">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "Salvar Alterações"
              ) : (
                "Criar Agente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgentModal
