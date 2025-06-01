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
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  agent?: any
  onSave: (agent: any, isNew: boolean) => void
}

export default function AgentModal({ isOpen, onOpenChange, agent, onSave }: AgentModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState("")
  const [error, setError] = useState("")
  const [whatsappConnections, setWhatsappConnections] = useState<any[]>([])
  const [showApiKeys, setShowApiKeys] = useState({
    voice: false,
    calendar: false,
  })

  const [formData, setFormData] = useState({
    name: "",
    description: "",
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
    type: "vendas",
    status: "active",
  })

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    if (agent && isOpen) {
      setFormData({
        name: agent.name || "",
        description: agent.description || "",
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
        type: agent.type || "vendas",
        status: agent.status || "active",
      })
    } else if (!agent && isOpen) {
      // Reset form for new agent
      setFormData({
        name: "",
        description: "",
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
        type: "vendas",
        status: "active",
      })
    }
    setError("")
  }, [agent, isOpen])

  const loadData = async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) return

    try {
      // Buscar conexões WhatsApp
      const { data: connections, error: connectionsError } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", currentUser.id)

      if (connectionsError) {
        console.warn("Erro ao buscar conexões WhatsApp:", connectionsError)
      } else {
        setWhatsappConnections(connections || [])
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validações
      if (!formData.name.trim()) {
        throw new Error("Nome do agente é obrigatório")
      }

      if (!formData.training_prompt.trim()) {
        throw new Error("Prompt de treinamento é obrigatório")
      }

      const currentUser = getCurrentUser()
      if (!currentUser) {
        throw new Error("Usuário não autenticado")
      }

      setLoadingStep("Salvando agente no banco de dados...")

      // Preparar model_config como JSON
      const modelConfig = {
        voice_tone: formData.voice_tone,
        main_function: formData.main_function,
        prompt: formData.training_prompt,
        transcribe_audio: formData.transcribe_audio,
        understand_images: formData.understand_images,
        voice_response_enabled: formData.voice_response_enabled,
        voice_provider: formData.voice_provider,
        voice_api_key: formData.voice_api_key,
        calendar_integration: formData.calendar_integration,
        calendar_api_key: formData.calendar_api_key,
      }

      const agentData = {
        user_id: currentUser.id,
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        status: formData.status,
        model_config: modelConfig,
        prompt_template: formData.training_prompt.trim(),
        whatsapp_connection_id: formData.whatsapp_connection_id || null,
        temperature: formData.temperature[0],
        transcribe_audio: formData.transcribe_audio,
        understand_images: formData.understand_images,
        voice_response_enabled: formData.voice_response_enabled,
        voice_provider: formData.voice_response_enabled ? formData.voice_provider : null,
        voice_api_key: formData.voice_response_enabled ? formData.voice_api_key : null,
        calendar_integration: formData.calendar_integration,
        calendar_api_key: formData.calendar_integration ? formData.calendar_api_key : null,
        is_default: formData.is_default,
        updated_at: new Date().toISOString(),
      }

      let result

      if (agent) {
        // Atualizar agente existente
        const { data, error } = await supabase.from("ai_agents").update(agentData).eq("id", agent.id).select().single()

        if (error) throw error
        result = data
      } else {
        // Criar novo agente
        const { data, error } = await supabase
          .from("ai_agents")
          .insert([{ ...agentData, created_at: new Date().toISOString() }])
          .select()
          .single()

        if (error) throw error
        result = data
      }

      setLoadingStep("Finalizando...")
      onSave(result, !agent)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao salvar agente:", error)
      setError(error.message || "Erro ao salvar agente")
    } finally {
      setLoading(false)
      setLoadingStep("")
    }
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

  const agentTypes = [
    { value: "vendas", label: "Vendas" },
    { value: "suporte", label: "Suporte" },
    { value: "marketing", label: "Marketing" },
    { value: "geral", label: "Geral" },
  ]

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {agent ? "Atualizando Agente" : "Criando Agente"}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
              {loadingStep || "Processando..."}
            </p>
            <div className="mt-4 w-full max-w-xs">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
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
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                🧠 Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">
                  Nome do Agente *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Luna - Assistente de Vendas"
                  required
                  className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">
                  Descrição
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição do agente"
                  className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-gray-900 dark:text-gray-100">
                  Tipo do Agente
                </Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {agentTypes.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="training_prompt" className="text-gray-900 dark:text-gray-100">
                  Prompt de Treinamento *
                </Label>
                <Textarea
                  id="training_prompt"
                  value={formData.training_prompt}
                  onChange={(e) => setFormData({ ...formData, training_prompt: e.target.value })}
                  placeholder="Instruções detalhadas sobre como o agente deve se comportar, responder e interagir..."
                  rows={5}
                  required
                  className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Comportamento */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                💬 Configurações de Comportamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="voice_tone" className="text-gray-900 dark:text-gray-100">
                    Tom de Voz
                  </Label>
                  <Select
                    value={formData.voice_tone}
                    onValueChange={(value) => setFormData({ ...formData, voice_tone: value })}
                  >
                    <SelectTrigger className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      {voiceTones.map((tone) => (
                        <SelectItem
                          key={tone.value}
                          value={tone.value}
                          className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                        >
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="main_function" className="text-gray-900 dark:text-gray-100">
                    Função Principal
                  </Label>
                  <Select
                    value={formData.main_function}
                    onValueChange={(value) => setFormData({ ...formData, main_function: value })}
                  >
                    <SelectTrigger className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      {mainFunctions.map((func) => (
                        <SelectItem
                          key={func.value}
                          value={func.value}
                          className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                        >
                          {func.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="temperature" className="text-gray-900 dark:text-gray-100">
                  Temperatura (Criatividade): {formData.temperature[0]}
                </Label>
                <Slider
                  value={formData.temperature}
                  onValueChange={(value) => setFormData({ ...formData, temperature: value })}
                  max={2}
                  min={0}
                  step={0.1}
                  className="mt-2 [&_[role=slider]]:bg-blue-600 [&_[role=slider]]:border-blue-600 [&_.bg-primary]:bg-blue-600 [&_[data-orientation=horizontal]]:bg-gray-200 dark:[&_[data-orientation=horizontal]]:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Conservador (0)</span>
                  <span>Criativo (2)</span>
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp_connection" className="text-gray-900 dark:text-gray-100">
                  Conexão WhatsApp
                </Label>
                <Select
                  value={formData.whatsapp_connection_id}
                  onValueChange={(value) => setFormData({ ...formData, whatsapp_connection_id: value })}
                >
                  <SelectTrigger className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Selecione uma conexão" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {whatsappConnections.map((connection) => (
                      <SelectItem
                        key={connection.id}
                        value={connection.id}
                        className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                      >
                        {connection.connection_name}
                        {connection.status !== "connected" && " (Desconectado)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Funcionalidades Avançadas */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                🚀 Funcionalidades Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transcrição de Áudio */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-blue-600" />
                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Transcrever Áudio</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Converter mensagens de voz em texto</p>
                  </div>
                </div>
                <Switch
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  checked={formData.transcribe_audio}
                  onCheckedChange={(checked) => setFormData({ ...formData, transcribe_audio: checked })}
                />
              </div>

              {/* Entender Imagens */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Entender Imagens</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Analisar e descrever imagens enviadas</p>
                  </div>
                </div>
                <Switch
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  checked={formData.understand_images}
                  onCheckedChange={(checked) => setFormData({ ...formData, understand_images: checked })}
                />
              </div>

              {/* Resposta com Voz */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100">Resposta com Voz</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enviar respostas em áudio</p>
                    </div>
                  </div>
                  <Switch
                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                    checked={formData.voice_response_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, voice_response_enabled: checked })}
                  />
                </div>

                {formData.voice_response_enabled && (
                  <div className="ml-8 space-y-3">
                    <div>
                      <Label htmlFor="voice_provider" className="text-gray-900 dark:text-gray-100">
                        Provedor de Voz
                      </Label>
                      <Select
                        value={formData.voice_provider}
                        onValueChange={(value) => setFormData({ ...formData, voice_provider: value })}
                      >
                        <SelectTrigger className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Selecione um provedor" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          {voiceProviders.map((provider) => (
                            <SelectItem
                              key={provider.value}
                              value={provider.value}
                              className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                            >
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="voice_api_key" className="text-gray-900 dark:text-gray-100">
                        API Key de Voz
                      </Label>
                      <div className="relative">
                        <Input
                          id="voice_api_key"
                          type={showApiKeys.voice ? "text" : "password"}
                          value={formData.voice_api_key}
                          onChange={(e) => setFormData({ ...formData, voice_api_key: e.target.value })}
                          placeholder="Sua API Key do provedor de voz"
                          className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
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
                      <Label className="text-gray-900 dark:text-gray-100">Integração com Calendário</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Agendar compromissos via Cal.com</p>
                    </div>
                  </div>
                  <Switch
                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                    checked={formData.calendar_integration}
                    onCheckedChange={(checked) => setFormData({ ...formData, calendar_integration: checked })}
                  />
                </div>

                {formData.calendar_integration && (
                  <div className="ml-8">
                    <Label htmlFor="calendar_api_key" className="text-gray-900 dark:text-gray-100">
                      API Key do Cal.com
                    </Label>
                    <div className="relative">
                      <Input
                        id="calendar_api_key"
                        type={showApiKeys.calendar ? "text" : "password"}
                        value={formData.calendar_api_key}
                        onChange={(e) => setFormData({ ...formData, calendar_api_key: e.target.value })}
                        placeholder="Sua API Key do Cal.com"
                        className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
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
                    <Label className="text-gray-900 dark:text-gray-100">Agente Padrão</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Usar como agente principal desta conexão</p>
                  </div>
                </div>
                <Switch
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="bg-gray-50 dark:bg-gray-800 -mx-6 -mb-6 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
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

// Exportação nomeada para compatibilidade
export { AgentModal }
