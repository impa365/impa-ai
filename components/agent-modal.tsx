"use client"

import type React from "react"

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
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Sparkles, Info, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { fetchWhatsAppConnections } from "@/lib/whatsapp-connections"
import { createEvolutionBot, updateEvolutionBot, fetchEvolutionBot } from "@/lib/evolution-api"

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
  is_default?: boolean | null
  created_at?: string
  updated_at?: string
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
  const [n8nIntegrationConfig, setN8nIntegrationConfig] = useState<any>(null)
  const [showVoiceApiKey, setShowVoiceApiKey] = useState(false)
  const [showCalendarApiKey, setShowCalendarApiKey] = useState(false)
  const [evolutionSyncStatus, setEvolutionSyncStatus] = useState<string>("")

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    if (user) {
      setFormData((prev) => ({ ...prev, user_id: user.id }))
      loadWhatsAppConnections(user.id)
      loadN8nConfig()
    }
  }, [])

  const loadN8nConfig = async () => {
    const { data, error } = await supabase.from("integrations").select("config").eq("type", "n8n").single()

    if (data && data.config) {
      setN8nIntegrationConfig(data.config)
    } else {
      console.warn("Configuração da integração n8n não encontrada.")
    }
  }

  const loadWhatsAppConnections = async (userId: string) => {
    const connections = await fetchWhatsAppConnections(userId)
    setWhatsappConnections(connections)
  }

  // Sincronizar com Evolution API quando abrir o modal para edição
  useEffect(() => {
    if (agent && agent.evolution_bot_id && agent.whatsapp_connection_id && open) {
      syncWithEvolutionAPI()
    }
  }, [agent, open])

  const syncWithEvolutionAPI = async () => {
    if (!agent?.evolution_bot_id || !agent?.whatsapp_connection_id) return

    try {
      setEvolutionSyncStatus("Sincronizando com Evolution API...")

      // Buscar conexão WhatsApp para obter instance_name
      const { data: connection } = await supabase
        .from("whatsapp_connections")
        .select("instance_name")
        .eq("id", agent.whatsapp_connection_id)
        .single()

      if (connection?.instance_name) {
        const evolutionBot = await fetchEvolutionBot(connection.instance_name, agent.evolution_bot_id)

        if (evolutionBot) {
          setEvolutionSyncStatus("Sincronizado com sucesso!")
          // Atualizar dados locais com dados da Evolution API se necessário
          setTimeout(() => setEvolutionSyncStatus(""), 3000)
        } else {
          setEvolutionSyncStatus("Erro na sincronização")
          setTimeout(() => setEvolutionSyncStatus(""), 3000)
        }
      }
    } catch (error) {
      console.error("Erro ao sincronizar com Evolution API:", error)
      setEvolutionSyncStatus("Erro na sincronização")
      setTimeout(() => setEvolutionSyncStatus(""), 3000)
    }
  }

  useEffect(() => {
    if (agent) {
      setFormData({ ...initialFormData, ...agent })
    } else {
      setFormData({ ...initialFormData, user_id: currentUser?.id || "" })
    }
  }, [agent, currentUser])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({ ...prev, [name]: value[0] }))
  }

  const handleConfigChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      model_config: { ...prev.model_config, [key]: value },
    }))
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
      setError("O nome do agente é obrigatório.")
      setLoading(false)
      return
    }
    if (!formData.whatsapp_connection_id) {
      setError("A conexão WhatsApp é obrigatória.")
      setLoading(false)
      return
    }
    if (!formData.model_config?.activation_keyword?.trim()) {
      setError("A palavra-chave de ativação é obrigatória.")
      setLoading(false)
      return
    }
    if (!formData.training_prompt?.trim()) {
      setError("O prompt de treinamento é obrigatório.")
      setLoading(false)
      return
    }

    try {
      let evolutionBotId = formData.evolution_bot_id

      // Buscar instance_name da conexão WhatsApp
      const { data: connection } = await supabase
        .from("whatsapp_connections")
        .select("instance_name")
        .eq("id", formData.whatsapp_connection_id)
        .single()

      if (!connection?.instance_name) {
        throw new Error("Instância WhatsApp não encontrada")
      }

      // Sincronizar com Evolution API
      if (n8nIntegrationConfig?.flowUrl) {
        const agentSpecificToken = `AGENT_${formData.id || Date.now()}_TOKEN`

        const evolutionBotData = {
          enabled: formData.status === "active",
          description: formData.description || formData.name,
          apiUrl: `${n8nIntegrationConfig.flowUrl}${n8nIntegrationConfig.flowUrl.includes("?") ? "&" : "?"}bot_token=${agentSpecificToken}`,
          apiKey: n8nIntegrationConfig.apiKey || "",
          triggerType: "keyword",
          triggerOperator: "equals",
          triggerValue: formData.model_config?.activation_keyword || "",
          expire: 0,
          keywordFinish: "#sair",
          delayMessage: 1000,
          unknownMessage: "Desculpe, não entendi. Digite a palavra-chave para começar.",
          listeningFromMe: false,
          stopBotFromMe: true,
          keepOpen: false,
          debounceTime: 10,
          ignoreJids: [],
          splitMessages: true,
          timePerChar: 100,
        }

        if (formData.evolution_bot_id) {
          const updateResult = await updateEvolutionBot(
            connection.instance_name,
            formData.evolution_bot_id,
            evolutionBotData,
          )
          if (!updateResult) throw new Error("Falha ao atualizar bot na Evolution API")
        } else {
          const createResult = await createEvolutionBot(connection.instance_name, evolutionBotData)
          if (!createResult.success || !createResult.botId)
            throw new Error(createResult.error || "Falha ao criar bot na Evolution API")
          evolutionBotId = createResult.botId
        }
      }

      const finalDbData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        status: formData.status,
        model_config: formData.model_config,
        prompt_template: formData.prompt_template,
        user_id: currentUser.id,
        whatsapp_connection_id: formData.whatsapp_connection_id,
        evolution_bot_id: evolutionBotId,
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
        is_default: formData.is_default,
      }

      if (isEditing && agent?.id) {
        const { error: updateError } = await supabase.from("ai_agents").update(finalDbData).eq("id", agent.id)
        if (updateError) throw updateError
        toast({ title: "Sucesso", description: "Agente atualizado com sucesso!" })
      } else {
        const { data: newAgentData, error: insertError } = await supabase
          .from("ai_agents")
          .insert(finalDbData)
          .select()
          .single()
        if (insertError) throw insertError
        toast({ title: "Sucesso", description: "Agente criado com sucesso!" })
      }
      onSave()
      onOpenChange(false)
    } catch (err: any) {
      console.error("Error saving agent:", err)
      setError(err.message || "Ocorreu um erro ao salvar o agente.")
      toast({ title: "Erro", description: err.message || "Falha ao salvar o agente.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-2xl font-bold flex items-center">
              <Bot className="w-7 h-7 mr-2 text-primary" />
              {isEditing ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
            </DialogTitle>
            <DialogDescription>Configure os detalhes e o comportamento do seu agente de IA.</DialogDescription>
            {evolutionSyncStatus && <div className="text-sm text-muted-foreground mt-2">{evolutionSyncStatus}</div>}
          </DialogHeader>

          <div className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <Sparkles className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {maxAgentsReached && !isEditing && (
              <Alert variant="warning">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Você atingiu o limite máximo de agentes. Para criar mais, considere atualizar seu plano ou remover
                  agentes existentes.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardContent className="pt-4 space-y-4">
                {/* Informações Básicas */}
                <div>
                  <Label htmlFor="name">Nome do Agente *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Assistente de Vendas"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    placeholder="Descreva a função principal do agente"
                  />
                </div>

                <div>
                  <Label htmlFor="identity_description">Descrição da Identidade</Label>
                  <Textarea
                    id="identity_description"
                    name="identity_description"
                    value={formData.identity_description || ""}
                    onChange={handleInputChange}
                    placeholder="Como o agente se apresenta"
                  />
                </div>

                <div>
                  <Label htmlFor="training_prompt">Prompt de Treinamento *</Label>
                  <Textarea
                    id="training_prompt"
                    name="training_prompt"
                    value={formData.training_prompt || ""}
                    onChange={handleInputChange}
                    placeholder="Instruções detalhadas para o agente"
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="voice_tone">Tom de Voz</Label>
                    <Select
                      name="voice_tone"
                      value={formData.voice_tone || ""}
                      onValueChange={(value) => handleSelectChange("voice_tone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tom" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="humanizado">Humanizado</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="main_function">Função Principal</Label>
                    <Select
                      name="main_function"
                      value={formData.main_function || ""}
                      onValueChange={(value) => handleSelectChange("main_function", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="atendimento">Atendimento</SelectItem>
                        <SelectItem value="vendas">Vendas</SelectItem>
                        <SelectItem value="agendamento">Agendamento</SelectItem>
                        <SelectItem value="suporte">Suporte</SelectItem>
                        <SelectItem value="qualificacao">Qualificação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="temperature">Temperatura: {(formData.temperature || 0.7).toFixed(1)}</Label>
                  <Slider
                    id="temperature"
                    name="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[formData.temperature || 0.7]}
                    onValueChange={(value) => handleSliderChange("temperature", value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Controla a criatividade das respostas</p>
                </div>

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
                          {conn.connection_name} ({conn.phone_number || "Número não disponível"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="activation_keyword">Palavra-chave de Ativação *</Label>
                  <Input
                    id="activation_keyword"
                    value={formData.model_config?.activation_keyword || ""}
                    onChange={(e) => handleConfigChange("activation_keyword", e.target.value)}
                    placeholder="Ex: /bot, !assistente"
                  />
                </div>

                {/* Funcionalidades */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="transcribe_audio">Transcrever Áudio</Label>
                    <Switch
                      id="transcribe_audio"
                      checked={formData.transcribe_audio || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, transcribe_audio: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="understand_images">Entender Imagens</Label>
                    <Switch
                      id="understand_images"
                      checked={formData.understand_images || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, understand_images: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="voice_response_enabled">Resposta por Voz</Label>
                    <Switch
                      id="voice_response_enabled"
                      checked={formData.voice_response_enabled || false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, voice_response_enabled: checked }))
                      }
                    />
                  </div>

                  {formData.voice_response_enabled && (
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                      <div>
                        <Label htmlFor="voice_provider">Provedor de Voz</Label>
                        <Select
                          name="voice_provider"
                          value={formData.voice_provider || ""}
                          onValueChange={(value) => handleSelectChange("voice_provider", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o provedor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eleven_labs">ElevenLabs</SelectItem>
                            <SelectItem value="fish_audio">Fish Audio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="voice_api_key">API Key do Sistema de Voz</Label>
                        <div className="relative">
                          <Input
                            id="voice_api_key"
                            name="voice_api_key"
                            type={showVoiceApiKey ? "text" : "password"}
                            value={formData.voice_api_key || ""}
                            onChange={handleInputChange}
                            placeholder="Chave da API do sistema"
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
                        <Label htmlFor="voice_id">ID da Voz</Label>
                        <Input
                          id="voice_id"
                          value={formData.model_config?.voice_id || ""}
                          onChange={(e) => handleConfigChange("voice_id", e.target.value)}
                          placeholder="ID específico da voz no provedor"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="calendar_integration">Integração com Calendário</Label>
                    <Switch
                      id="calendar_integration"
                      checked={formData.calendar_integration || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, calendar_integration: checked }))}
                    />
                  </div>

                  {formData.calendar_integration && (
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                      <div>
                        <Label htmlFor="calendar_api_key">API Key do Calendário</Label>
                        <div className="relative">
                          <Input
                            id="calendar_api_key"
                            name="calendar_api_key"
                            type={showCalendarApiKey ? "text" : "password"}
                            value={formData.calendar_api_key || ""}
                            onChange={handleInputChange}
                            placeholder="Chave da API do calendário"
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
                        <Label htmlFor="calendar_event_id">ID da Agenda</Label>
                        <Input
                          id="calendar_event_id"
                          value={formData.model_config?.calendar_event_id || ""}
                          onChange={(e) => handleConfigChange("calendar_event_id", e.target.value)}
                          placeholder="ID do evento/agenda no calendário"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_default">Agente Padrão</Label>
                    <Switch
                      id="is_default"
                      checked={formData.is_default || false}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_default: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={loading || (maxAgentsReached && !isEditing)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Agente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgentModal
