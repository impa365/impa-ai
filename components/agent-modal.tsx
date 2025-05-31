"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Bot, MessageSquare, Mic, ImageIcon, Calendar, Volume2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

interface AgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: any
  whatsappConnections: any[]
  userSettings: any
  onSuccess: () => void
}

export default function AgentModal({
  open,
  onOpenChange,
  agent,
  whatsappConnections,
  userSettings,
  onSuccess,
}: AgentModalProps) {
  const [loading, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showApiKeys, setShowApiKeys] = useState({
    voice: false,
    calendar: false,
  })

  const [formData, setFormData] = useState({
    name: "",
    identity_description: "",
    training_prompt: "",
    voice_tone: "humanizado",
    main_function: "atendimento",
    temperature: [0.7],
    whatsapp_connection_id: "",
    transcribe_audio: false,
    understand_images: false,
    voice_response_enabled: false,
    voice_provider: "",
    voice_api_key: "",
    calendar_integration: false,
    calendar_api_key: "",
    is_default: false,
  })

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || "",
        identity_description: agent.identity_description || "",
        training_prompt: agent.training_prompt || "",
        voice_tone: agent.voice_tone || "humanizado",
        main_function: agent.main_function || "atendimento",
        temperature: [agent.temperature || 0.7],
        whatsapp_connection_id: agent.whatsapp_connection_id || "",
        transcribe_audio: agent.transcribe_audio || false,
        understand_images: agent.understand_images || false,
        voice_response_enabled: agent.voice_response_enabled || false,
        voice_provider: agent.voice_provider || "",
        voice_api_key: agent.voice_api_key || "",
        calendar_integration: agent.calendar_integration || false,
        calendar_api_key: agent.calendar_api_key || "",
        is_default: agent.is_default || false,
      })
    } else {
      // Reset form for new agent
      setFormData({
        name: "",
        identity_description: "",
        training_prompt: "",
        voice_tone: "humanizado",
        main_function: "atendimento",
        temperature: [0.7],
        whatsapp_connection_id: whatsappConnections[0]?.id || "",
        transcribe_audio: false,
        understand_images: false,
        voice_response_enabled: false,
        voice_provider: "",
        voice_api_key: "",
        calendar_integration: false,
        calendar_api_key: "",
        is_default: false,
      })
    }
    setError("")
  }, [agent, whatsappConnections, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      // Validações
      if (!formData.name.trim()) {
        throw new Error("Nome do agente é obrigatório")
      }

      if (!formData.training_prompt.trim()) {
        throw new Error("Prompt de treinamento é obrigatório")
      }

      if (!formData.whatsapp_connection_id) {
        throw new Error("Conexão WhatsApp é obrigatória")
      }

      if (formData.voice_response_enabled && !formData.voice_provider) {
        throw new Error("Selecione um provedor de voz")
      }

      if (formData.voice_response_enabled && !formData.voice_api_key.trim()) {
        throw new Error("API Key de voz é obrigatória quando resposta por voz está habilitada")
      }

      if (formData.calendar_integration && !formData.calendar_api_key.trim()) {
        throw new Error("API Key do calendário é obrigatória quando integração está habilitada")
      }

      const currentUser = getCurrentUser()

      // Criar bot na Evolution API primeiro
      const evolutionBotId = await createEvolutionBot(formData)

      const agentData = {
        user_id: currentUser?.id,
        name: formData.name.trim(),
        identity_description: formData.identity_description.trim(),
        training_prompt: formData.training_prompt.trim(),
        voice_tone: formData.voice_tone,
        main_function: formData.main_function,
        temperature: formData.temperature[0],
        whatsapp_connection_id: formData.whatsapp_connection_id,
        evolution_bot_id: evolutionBotId,
        transcribe_audio: formData.transcribe_audio && userSettings?.transcribe_audio_enabled,
        understand_images: formData.understand_images && userSettings?.understand_images_enabled,
        voice_response_enabled: formData.voice_response_enabled && userSettings?.voice_response_enabled,
        voice_provider: formData.voice_response_enabled ? formData.voice_provider : null,
        voice_api_key: formData.voice_response_enabled ? formData.voice_api_key : null,
        calendar_integration: formData.calendar_integration && userSettings?.calendar_integration_enabled,
        calendar_api_key: formData.calendar_integration ? formData.calendar_api_key : null,
        is_default: formData.is_default,
        status: "active",
        type: "whatsapp", // Adicionar este campo obrigatório
      }

      if (agent) {
        // Atualizar agente existente
        const { error } = await supabase.from("ai_agents").update(agentData).eq("id", agent.id)

        if (error) throw error
      } else {
        // Criar novo agente
        const { error } = await supabase.from("ai_agents").insert([agentData])

        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao salvar agente:", error)
      setError(error.message || "Erro ao salvar agente")
    } finally {
      setSaving(false)
    }
  }

  const createEvolutionBot = async (data: any): Promise<string> => {
    try {
      // Buscar configurações de integração do banco em vez de variáveis de ambiente
      const { data: integrationData, error } = await supabase
        .from("integrations")
        .select("config")
        .eq("type", "evolution_api")
        .eq("is_active", true)
        .single()

      if (error || !integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
        throw new Error("Evolution API não configurada pelo administrador")
      }

      // Gerar um ID único para o bot
      const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Buscar configurações do n8n do banco também
      const { data: n8nData } = await supabase
        .from("integrations")
        .select("config")
        .eq("type", "n8n")
        .eq("is_active", true)
        .single()

      const webhookUrl = n8nData?.config?.flowUrl
        ? `${n8nData.config.flowUrl}?id_evobot=${botId}`
        : `https://webhook.site/unique-id?id_evobot=${botId}` // fallback para teste

      // TODO: Implementar integração real com Evolution API
      // const response = await fetch(`${integrationData.config.apiUrl}/instance/create`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'apikey': integrationData.config.apiKey
      //   },
      //   body: JSON.stringify({
      //     instanceName: botId,
      //     token: generateInstanceToken(),
      //     qrcode: true,
      //     webhook: webhookUrl,
      //     webhook_by_events: true,
      //     events: [
      //       'APPLICATION_STARTUP',
      //       'QRCODE_UPDATED',
      //       'CONNECTION_UPDATE',
      //       'MESSAGES_UPSERT',
      //       'MESSAGES_UPDATE',
      //       'SEND_MESSAGE'
      //     ]
      //   })
      // })

      // if (!response.ok) {
      //   throw new Error(`Erro na Evolution API: ${response.statusText}`)
      // }

      // const result = await response.json()

      console.log(`Bot criado com ID: ${botId}, Webhook: ${webhookUrl}`)

      return botId
    } catch (error: any) {
      console.error("Erro ao criar bot na Evolution API:", error)
      throw error
    }
  }

  function generateInstanceToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const voiceTones = [
    { value: "humanizado", label: "Humanizado - Natural e empático" },
    { value: "formal", label: "Formal - Profissional e respeitoso" },
    { value: "tecnico", label: "Técnico - Preciso e detalhado" },
    { value: "casual", label: "Casual - Descontraído e amigável" },
    { value: "comercial", label: "Comercial - Persuasivo e vendedor" },
  ]

  const mainFunctions = [
    { value: "atendimento", label: "Atendimento ao Cliente" },
    { value: "vendas", label: "Vendas" },
    { value: "agendamento", label: "Agendamento" },
    { value: "suporte", label: "Suporte Técnico" },
    { value: "qualificacao", label: "Qualificação de Leads" },
  ]

  const voiceProviders = [
    { value: "fish_audio", label: "Fish Audio" },
    { value: "eleven_labs", label: "Eleven Labs" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Bot className="w-5 h-5" />
            {agent ? "Editar Agente" : "Criar Novo Agente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                🧠 Nome e Identidade do Agente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-foreground">
                  Nome do Agente *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Luna - Assistente de Vendas"
                  required
                  className="text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="identity_description" className="text-foreground">
                  Descrição da Identidade
                </Label>
                <Textarea
                  id="identity_description"
                  value={formData.identity_description}
                  onChange={(e) => setFormData({ ...formData, identity_description: e.target.value })}
                  placeholder="Descreva a personalidade e características do seu agente..."
                  rows={3}
                  className="text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="training_prompt" className="text-foreground">
                  Prompt de Treinamento *
                </Label>
                <Textarea
                  id="training_prompt"
                  value={formData.training_prompt}
                  onChange={(e) => setFormData({ ...formData, training_prompt: e.target.value })}
                  placeholder="Instruções detalhadas sobre como o agente deve se comportar, responder e interagir..."
                  rows={5}
                  required
                  className="text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Comportamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">💬 Tom de Voz e Função</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="voice_tone" className="text-foreground">
                  Tom de Voz
                </Label>
                <Select
                  value={formData.voice_tone}
                  onValueChange={(value) => setFormData({ ...formData, voice_tone: value })}
                >
                  <SelectTrigger className="text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceTones.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value} className="text-foreground">
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="main_function" className="text-foreground">
                  Função Principal
                </Label>
                <Select
                  value={formData.main_function}
                  onValueChange={(value) => setFormData({ ...formData, main_function: value })}
                >
                  <SelectTrigger className="text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mainFunctions.map((func) => (
                      <SelectItem key={func.value} value={func.value} className="text-foreground">
                        {func.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="temperature" className="text-foreground">
                  Temperatura (Criatividade): {formData.temperature[0]}
                </Label>
                <Slider
                  value={formData.temperature}
                  onValueChange={(value) => setFormData({ ...formData, temperature: value })}
                  max={2}
                  min={0}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Conservador (0)</span>
                  <span>Criativo (2)</span>
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp_connection" className="text-foreground">
                  Conexão WhatsApp *
                </Label>
                <Select
                  value={formData.whatsapp_connection_id}
                  onValueChange={(value) => setFormData({ ...formData, whatsapp_connection_id: value })}
                >
                  <SelectTrigger className="text-foreground">
                    <SelectValue placeholder="Selecione uma conexão" />
                  </SelectTrigger>
                  <SelectContent>
                    {whatsappConnections.map((connection) => (
                      <SelectItem key={connection.id} value={connection.id} className="text-foreground">
                        {connection.connection_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Funcionalidades Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                🚀 Funcionalidades Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transcrição de Áudio */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-blue-600" />
                  <div>
                    <Label className="text-foreground">Transcrever Áudio</Label>
                    <p className="text-sm text-muted-foreground">Converter mensagens de voz em texto</p>
                  </div>
                </div>
                <Switch
                  checked={formData.transcribe_audio}
                  onCheckedChange={(checked) => setFormData({ ...formData, transcribe_audio: checked })}
                  disabled={!userSettings?.transcribe_audio_enabled}
                />
              </div>

              {/* Entender Imagens */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <Label className="text-foreground">Entender Imagens</Label>
                    <p className="text-sm text-muted-foreground">Analisar e descrever imagens enviadas</p>
                  </div>
                </div>
                <Switch
                  checked={formData.understand_images}
                  onCheckedChange={(checked) => setFormData({ ...formData, understand_images: checked })}
                  disabled={!userSettings?.understand_images_enabled}
                />
              </div>

              {/* Resposta com Voz */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <Label className="text-foreground">Resposta com Voz</Label>
                      <p className="text-sm text-muted-foreground">Enviar respostas em áudio</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.voice_response_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, voice_response_enabled: checked })}
                    disabled={!userSettings?.voice_response_enabled}
                  />
                </div>

                {formData.voice_response_enabled && (
                  <div className="ml-8 space-y-3">
                    <div>
                      <Label htmlFor="voice_provider" className="text-foreground">
                        Provedor de Voz
                      </Label>
                      <Select
                        value={formData.voice_provider}
                        onValueChange={(value) => setFormData({ ...formData, voice_provider: value })}
                      >
                        <SelectTrigger className="text-foreground">
                          <SelectValue placeholder="Selecione um provedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {voiceProviders.map((provider) => (
                            <SelectItem key={provider.value} value={provider.value} className="text-foreground">
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="voice_api_key" className="text-foreground">
                        API Key de Voz
                      </Label>
                      <div className="relative">
                        <Input
                          id="voice_api_key"
                          type={showApiKeys.voice ? "text" : "password"}
                          value={formData.voice_api_key}
                          onChange={(e) => setFormData({ ...formData, voice_api_key: e.target.value })}
                          placeholder="Sua API Key do provedor de voz"
                          className="text-foreground"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKeys({ ...showApiKeys, voice: !showApiKeys.voice })}
                        >
                          {showApiKeys.voice ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Integração com Calendário */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <Label className="text-foreground">Integração com Calendário</Label>
                      <p className="text-sm text-muted-foreground">Agendar compromissos via Cal.com</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.calendar_integration}
                    onCheckedChange={(checked) => setFormData({ ...formData, calendar_integration: checked })}
                    disabled={!userSettings?.calendar_integration_enabled}
                  />
                </div>

                {formData.calendar_integration && (
                  <div className="ml-8">
                    <Label htmlFor="calendar_api_key" className="text-foreground">
                      API Key do Cal.com
                    </Label>
                    <div className="relative">
                      <Input
                        id="calendar_api_key"
                        type={showApiKeys.calendar ? "text" : "password"}
                        value={formData.calendar_api_key}
                        onChange={(e) => setFormData({ ...formData, calendar_api_key: e.target.value })}
                        placeholder="Sua API Key do Cal.com"
                        className="text-foreground"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKeys({ ...showApiKeys, calendar: !showApiKeys.calendar })}
                      >
                        {showApiKeys.calendar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Agente Padrão */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <div>
                    <Label className="text-foreground">Agente Padrão</Label>
                    <p className="text-sm text-muted-foreground">Usar como agente principal desta conexão</p>
                  </div>
                </div>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-foreground">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Salvando..." : agent ? "Atualizar Agente" : "Criar Agente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
