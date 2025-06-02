"use client"

import type React from "react"

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
  Loader2,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { modelosOpenAI } from "@/lib/openai-models"
import { vozOutputProviders } from "@/lib/tts-providers"
import { fetchWhatsAppConnections, type WhatsAppConnection } from "@/lib/whatsapp-connections"
import { createEvolutionBot, updateEvolutionBot, fetchEvolutionBotSettings } from "@/lib/evolution-api"

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
  model_config: ModelConfig
  is_active: boolean
  created_at?: string
  updated_at?: string
  is_default: boolean
  whatsapp_connection_id?: string | null
  // @ts-ignore
  whatsapp_connections?: { instance_name: string } | null
  evolution_bot_id?: string | null
  n8n_webhook_url?: string | null
}

export interface ModelConfig {
  activation_keyword?: string | null
  voice_output_enabled: boolean
  voice_provider?: string | null
  voice_config?: VoiceConfig | null
  tools_config?: ToolsConfig | null
  // Campos removidos: greeting_message_enabled, greeting_message, max_messages_per_user, rate_limit_message,
  // inactivity_timeout, inactivity_message, conversation_memory, knowledge_base_enabled, knowledge_base_ids,
  // tone_and_style, allowed_numbers, blocked_numbers, collect_user_feedback, human_takeover_enabled,
  // human_takeover_keyword, human_takeover_email
}

export interface VoiceConfig {
  voice_id?: string | null
  // Campos removidos: speaking_rate, pitch, emotion
}

export interface ToolsConfig {
  cal_com: {
    enabled: boolean
    api_key?: string | null
    event_type_id?: string | null
  }
  // Campo removido: knowledge_retrieval
}

const initialModelConfig: ModelConfig = {
  activation_keyword: "/ia",
  voice_output_enabled: false,
  voice_provider: "elevenlabs",
  voice_config: {
    voice_id: "",
  },
  tools_config: {
    cal_com: {
      enabled: false,
      api_key: "",
      event_type_id: "",
    },
  },
}

const initialFormData: Agent = {
  id: "",
  user_id: "",
  name: "",
  description: "",
  prompt_template: "Você é um assistente prestativo.",
  model_name: "gpt-4o",
  temperature: 0.7,
  top_p: 1.0,
  max_tokens: 1500,
  model_config: initialModelConfig,
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
  onSave: () => void
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
    behavior: true, // Renomeado e simplificado
    advanced: false, // Para Voz e Cal.com
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
      if (n8nError && n8nError.code !== "PGRST116") throw n8nError
      if (data?.config) {
        setN8nIntegrationConfig(data.config)
      } else {
        setN8nIntegrationConfig(null)
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
      const agentModelConfigData =
        typeof agent.model_config === "string" ? JSON.parse(agent.model_config) : agent.model_config

      const mergedModelConfig: ModelConfig = {
        ...initialModelConfig, // Começa com os padrões simplificados
        ...(agentModelConfigData || {}),
        voice_config: {
          ...initialModelConfig.voice_config,
          ...(agentModelConfigData?.voice_config || {}),
        },
        tools_config: {
          ...initialModelConfig.tools_config,
          cal_com: {
            ...(initialModelConfig.tools_config?.cal_com || {}),
            ...(agentModelConfigData?.tools_config?.cal_com || {}),
          },
        },
      }

      setFormData({
        ...initialFormData,
        ...agent,
        description: agent.description ?? "",
        prompt_template: agent.prompt_template ?? "",
        model_config: mergedModelConfig,
      })

      if (agent.whatsapp_connection_id) {
        const selectedConn = whatsappConnections.find((c) => c.id === agent.whatsapp_connection_id)
        if (selectedConn) {
          setEvolutionInstanceName(selectedConn.instance_name)
        }
      }
    } else {
      setFormData({ ...initialFormData, user_id: currentUser?.id || "", model_config: initialModelConfig })
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
        model_config: { ...prev.model_config, [name]: checked } as ModelConfig,
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: checked }))
    }
  }

  const handleSelectChange = (
    name: keyof Agent | keyof ModelConfig,
    value: string | number,
    isModelConfigField = false,
  ) => {
    if (isModelConfigField) {
      setFormData((prev) => ({
        ...prev,
        model_config: { ...prev.model_config, [name]: value } as ModelConfig,
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
      if (name === "whatsapp_connection_id") {
        const selectedConn = whatsappConnections.find((c) => c.id === value)
        setEvolutionInstanceName(selectedConn ? selectedConn.instance_name : null)
      }
    }
  }

  const handleSliderChange = (name: keyof Agent, value: number[]) => {
    setFormData((prev) => ({ ...prev, [name]: value[0] }))
  }

  const handleConfigChange = (
    key: keyof ModelConfig,
    value: any,
    subKey?: keyof VoiceConfig | keyof ToolsConfig["cal_com"],
    subSubKey?: keyof ToolsConfig["cal_com"], // Apenas para cal_com agora
  ) => {
    setFormData((prev) => {
      const newModelConfig = { ...prev.model_config }

      if (key === "tools_config" && subKey === "cal_com" && subSubKey) {
        newModelConfig.tools_config = {
          ...newModelConfig.tools_config,
          cal_com: {
            ...(newModelConfig.tools_config?.cal_com || { enabled: false }), // Garante que cal_com exista
            [subSubKey]: value,
          },
        }
      } else if (key === "tools_config" && subKey === "cal_com") {
        // @ts-ignore
        newModelConfig.tools_config.cal_com[subKey] = value // Ex: enabled
      } else if (key === "voice_config" && subKey) {
        newModelConfig.voice_config = {
          ...(newModelConfig.voice_config || {}), // Garante que voice_config exista
          [subKey]: value,
        }
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

    const requiredFields: (keyof Agent)[] = ["name", "prompt_template", "whatsapp_connection_id"]
    const requiredModelConfigFields: (keyof ModelConfig)[] = ["activation_keyword"]

    for (const field of requiredFields) {
      if (!formData[field] || (typeof formData[field] === "string" && !(formData[field] as string).trim())) {
        setError(`O campo "${field}" é obrigatório.`)
        setLoading(false)
        return
      }
    }
    for (const field of requiredModelConfigFields) {
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
      // Tentativa de buscar novamente se não estiver definido
      const selectedConn = whatsappConnections.find((c) => c.id === formData.whatsapp_connection_id)
      if (!selectedConn || !selectedConn.instance_name) {
        setError("Não foi possível encontrar o nome da instância da Evolution API para a conexão selecionada.")
        setLoading(false)
        return
      }
      setEvolutionInstanceName(selectedConn.instance_name) // Atualiza o estado para uso subsequente
    }

    // Garante que evolutionInstanceName seja usado a partir daqui, após a verificação
    const currentEvolutionInstanceName =
      evolutionInstanceName ||
      (formData.whatsapp_connection_id
        ? whatsappConnections.find((c) => c.id === formData.whatsapp_connection_id)?.instance_name
        : null)

    if (!currentEvolutionInstanceName && formData.whatsapp_connection_id) {
      setError("Nome da instância da Evolution API ainda não definido após verificação.")
      setLoading(false)
      return
    }

    try {
      let evolutionBotId = formData.evolution_bot_id
      let finalN8nWebhookUrl = formData.n8n_webhook_url

      if (n8nIntegrationConfig?.flowUrl && currentEvolutionInstanceName) {
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
        }

        let currentEvolutionSettings = null
        if (formData.evolution_bot_id && currentEvolutionInstanceName) {
          const settingsResult = await fetchEvolutionBotSettings(
            currentEvolutionInstanceName,
            formData.evolution_bot_id,
          )
          if (settingsResult.success && settingsResult.settings) {
            currentEvolutionSettings = settingsResult.settings
          }
        }

        const finalEvolutionPayload = {
          ...(currentEvolutionSettings || {}),
          ...evolutionBotPayload,
        }

        if (formData.evolution_bot_id) {
          const updateResult = await updateEvolutionBot(
            currentEvolutionInstanceName,
            formData.evolution_bot_id,
            finalEvolutionPayload,
          )
          if (!updateResult.success) throw new Error(updateResult.error || "Falha ao atualizar bot na Evolution API")
        } else {
          const createResult = await createEvolutionBot(currentEvolutionInstanceName, finalEvolutionPayload)
          if (!createResult.success || !createResult.bot?.id)
            throw new Error(createResult.error || "Falha ao criar bot na Evolution API")
          evolutionBotId = createResult.bot.id
        }
      }

      const dbData = {
        user_id: currentUser.id,
        name: formData.name,
        description: formData.description,
        prompt_template: formData.prompt_template,
        model_name: formData.model_name,
        temperature: formData.temperature,
        top_p: formData.top_p,
        max_tokens: formData.max_tokens,
        model_config: formData.model_config, // Salvar o objeto model_config simplificado
        is_active: formData.is_active,
        is_default: formData.is_default,
        whatsapp_connection_id: formData.whatsapp_connection_id,
        evolution_bot_id: evolutionBotId,
        n8n_webhook_url: finalN8nWebhookUrl,
      }

      if (isEditing && agent?.id) {
        const { error: updateError } = await supabase.from("ai_agents").update(dbData).eq("id", agent.id)
        if (updateError) throw updateError
        toast({ title: "Sucesso", description: "Agente atualizado com sucesso!" })
      } else {
        const { data: newAgentData, error: insertError } = await supabase
          .from("ai_agents")
          // @ts-ignore
          .insert(dbData)
          .select()
          .single()
        if (insertError) throw insertError

        if (newAgentData && !evolutionBotId && n8nIntegrationConfig?.flowUrl && currentEvolutionInstanceName) {
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
          const createResultRetry = await createEvolutionBot(currentEvolutionInstanceName, evolutionBotPayloadRetry)
          if (createResultRetry.success && createResultRetry.bot?.id) {
            await supabase
              .from("ai_agents")
              .update({ evolution_bot_id: createResultRetry.bot.id, n8n_webhook_url: newN8nWebhookUrl })
              .eq("id", newAgentData.id)
          }
        }
        toast({ title: "Sucesso", description: "Agente criado com sucesso!" })
      }
      onSave()
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-2xl font-bold flex items-center">
              <Bot className="w-7 h-7 mr-3 text-primary" />
              {isEditing ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
            </DialogTitle>
            <DialogDescription>Configure os detalhes essenciais e funcionalidades do seu agente.</DialogDescription>
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
                  <AlertDescription>Você atingiu o limite máximo de agentes.</AlertDescription>
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
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição (Opcional)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleInputChange}
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelosOpenAI.map((modelo) => (
                          <SelectItem key={modelo.id} value={modelo.id}>
                            {modelo.name} ({modelo.context_window} tokens)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedModelInfo && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Janela de contexto: {selectedModelInfo.context_window.toLocaleString()} tokens.
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
                    </div>
                    <div>
                      <Label htmlFor="max_tokens">Max Tokens: {formData.max_tokens}</Label>
                      <Input
                        type="number"
                        id="max_tokens"
                        name="max_tokens"
                        value={formData.max_tokens}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="prompt_template">Prompt de Treinamento *</Label>
                    <Textarea
                      id="prompt_template"
                      name="prompt_template"
                      value={formData.prompt_template || ""}
                      onChange={handleInputChange}
                      rows={6}
                      required
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="shadow-sm overflow-hidden mt-4">
              <SectionToggle
                title="Comportamento e Conexão"
                sectionKey="behavior"
                icon={Settings}
                description="Conexão WhatsApp, palavra de ativação e status."
              />
              {expandedSections.behavior && (
                <CardContent className="p-4 md:p-6 space-y-4 border-t">
                  <div>
                    <Label htmlFor="whatsapp_connection_id">Conexão WhatsApp *</Label>
                    <Select
                      name="whatsapp_connection_id"
                      value={formData.whatsapp_connection_id || ""}
                      onValueChange={(value) => handleSelectChange("whatsapp_connection_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conexão" />
                      </SelectTrigger>
                      <SelectContent>
                        {whatsappConnections.map((conn) => (
                          <SelectItem key={conn.id} value={conn.id}>
                            {conn.connection_name} ({conn.phone_number || conn.instance_name || "N/A"})
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
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label htmlFor="is_active" className="flex flex-col">
                      <span>Agente Ativo</span>
                      <span className="text-xs text-gray-500 font-normal">
                        Permite que o agente processe mensagens.
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
                        Define se este agente responde por padrão.
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
                title="Funcionalidades Adicionais"
                sectionKey="advanced"
                icon={Brain}
                description="Configurações de saída de voz e agendamento Cal.com."
              />
              {expandedSections.advanced && (
                <CardContent className="p-4 md:p-6 space-y-6 border-t">
                  <div className="p-4 border rounded-md bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <Label htmlFor="voice_output_enabled" className="flex items-center text-md font-medium">
                        <Volume2 className="w-5 h-5 mr-2 text-blue-500" /> Saída de Voz (TTS)
                      </Label>
                      <Switch
                        id="voice_output_enabled"
                        checked={!!formData.model_config.voice_output_enabled}
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
                              {vozOutputProviders.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedVoiceProviderInfo && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedVoiceProviderInfo.description}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="voice_id">ID da Voz (Voice ID)</Label>
                          <Input
                            id="voice_id"
                            value={formData.model_config.voice_config?.voice_id || ""}
                            onChange={(e) => handleConfigChange("voice_config", e.target.value, "voice_id")}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-md bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <Label htmlFor="cal_com_enabled" className="flex items-center text-md font-medium">
                        <CalendarDays className="w-5 h-5 mr-2 text-green-500" /> Agendamento (Cal.com)
                      </Label>
                      <Switch
                        id="cal_com_enabled"
                        checked={!!formData.model_config.tools_config?.cal_com?.enabled}
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
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowCalApiKey(!showCalApiKey)}
                            >
                              {showCalApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                Cancelar
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
