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
import { Eye, EyeOff, Bot, MessageSquare, Mic, ImageIcon, Calendar, Volume2, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { createEvolutionBot, updateEvolutionBot } from "@/lib/evolution-api"

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
  const [loadingStep, setLoadingStep] = useState("")
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
    // Configurações do bot Evolution
    trigger_type: "keyword",
    trigger_operator: "contains",
    trigger_value: "",
    keyword_finish: "#SAIR",
    delay_message: 1000,
    unknown_message: "Desculpe, não entendi sua mensagem. Digite #SAIR para encerrar.",
    listening_from_me: true,
    stop_bot_from_me: true,
    keep_open: true,
    debounce_time: 5,
    split_messages: true,
    time_per_char: 50,
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
        // Configurações do bot Evolution
        trigger_type: agent.trigger_type || "keyword",
        trigger_operator: agent.trigger_operator || "contains",
        trigger_value: agent.trigger_value || "",
        keyword_finish: agent.keyword_finish || "#SAIR",
        delay_message: agent.delay_message || 1000,
        unknown_message: agent.unknown_message || "Desculpe, não entendi sua mensagem. Digite #SAIR para encerrar.",
        listening_from_me: agent.listening_from_me !== false,
        stop_bot_from_me: agent.stop_bot_from_me !== false,
        keep_open: agent.keep_open !== false,
        debounce_time: agent.debounce_time || 5,
        split_messages: agent.split_messages !== false,
        time_per_char: agent.time_per_char || 50,
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
        // Configurações do bot Evolution
        trigger_type: "keyword",
        trigger_operator: "contains",
        trigger_value: "",
        keyword_finish: "#SAIR",
        delay_message: 1000,
        unknown_message: "Desculpe, não entendi sua mensagem. Digite #SAIR para encerrar.",
        listening_from_me: true,
        stop_bot_from_me: true,
        keep_open: true,
        debounce_time: 5,
        split_messages: true,
        time_per_char: 50,
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

      if (!formData.trigger_value.trim()) {
        throw new Error("Palavra-chave de ativação é obrigatória")
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

      // Verificar se a conexão WhatsApp existe
      setLoadingStep("Verificando conexão WhatsApp...")
      const { data: connectionData, error: connectionError } = await supabase
        .from("whatsapp_connections")
        .select("instance_name")
        .eq("id", formData.whatsapp_connection_id)
        .single()

      if (connectionError) {
        throw new Error("Conexão WhatsApp não encontrada")
      }

      let evolutionBotId = agent?.evolution_bot_id

      if (!agent) {
        // Criar novo bot na Evolution API
        setLoadingStep("Criando bot na Evolution API...")

        // Buscar configurações do n8n
        const { data: n8nData } = await supabase
          .from("integrations")
          .select("config")
          .eq("type", "n8n")
          .eq("is_active", true)
          .single()

        const apiUrl = n8nData?.config?.flowUrl || "https://webhook.site/unique-id"
        const apiKey = n8nData?.config?.apiKey || ""

        const botData = {
          enabled: true,
          description: formData.name,
          apiUrl: `${apiUrl}?id_bot=`, // O ID será adicionado após a criação
          apiKey: apiKey,
          triggerType: formData.trigger_type,
          triggerOperator: formData.trigger_operator,
          triggerValue: formData.trigger_value,
          expire: 0,
          keywordFinish: formData.keyword_finish,
          delayMessage: formData.delay_message,
          unknownMessage: formData.unknown_message,
          listeningFromMe: formData.listening_from_me,
          stopBotFromMe: formData.stop_bot_from_me,
          keepOpen: formData.keep_open,
          debounceTime: formData.debounce_time,
          ignoreJids: ["@g.us"],
          splitMessages: formData.split_messages,
          timePerChar: formData.time_per_char,
        }

        const evolutionResult = await createEvolutionBot(connectionData.instance_name, botData)

        if (!evolutionResult.success) {
          throw new Error(evolutionResult.error || "Erro ao criar bot na Evolution API")
        }

        evolutionBotId = evolutionResult.botId

        // Atualizar URL do webhook com o ID do bot
        setLoadingStep("Configurando webhook...")
        await updateEvolutionBot(connectionData.instance_name, evolutionBotId, {
          ...botData,
          apiUrl: `${apiUrl}?id_bot=${evolutionBotId}`,
        })
      }

      setLoadingStep("Salvando agente no banco de dados...")

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
        type: "whatsapp",
        // Configurações do bot Evolution
        trigger_type: formData.trigger_type,
        trigger_operator: formData.trigger_operator,
        trigger_value: formData.trigger_value,
        keyword_finish: formData.keyword_finish,
        delay_message: formData.delay_message,
        unknown_message: formData.unknown_message,
        listening_from_me: formData.listening_from_me,
        stop_bot_from_me: formData.stop_bot_from_me,
        keep_open: formData.keep_open,
        debounce_time: formData.debounce_time,
        split_messages: formData.split_messages,
        time_per_char: formData.time_per_char,
      }

      if (agent) {
        // Atualizar agente existente
        const { error } = await supabase.from("ai_agents").update(agentData).eq("id", agent.id)

        if (error) throw error

        // Atualizar bot na Evolution API se necessário
        if (evolutionBotId) {
          setLoadingStep("Atualizando bot na Evolution API...")
          const { data: n8nData } = await supabase
            .from("integrations")
            .select("config")
            .eq("type", "n8n")
            .eq("is_active", true)
            .single()

          const apiUrl = n8nData?.config?.flowUrl || "https://webhook.site/unique-id"
          const apiKey = n8nData?.config?.apiKey || ""

          const botData = {
            enabled: true,
            description: formData.name,
            apiUrl: `${apiUrl}?id_bot=${evolutionBotId}`,
            apiKey: apiKey,
            triggerType: formData.trigger_type,
            triggerOperator: formData.trigger_operator,
            triggerValue: formData.trigger_value,
            expire: 0,
            keywordFinish: formData.keyword_finish,
            delayMessage: formData.delay_message,
            unknownMessage: formData.unknown_message,
            listeningFromMe: formData.listening_from_me,
            stopBotFromMe: formData.stop_bot_from_me,
            keepOpen: formData.keep_open,
            debounceTime: formData.debounce_time,
            ignoreJids: ["@g.us"],
            splitMessages: formData.split_messages,
            timePerChar: formData.time_per_char,
          }

          await updateEvolutionBot(connectionData.instance_name, evolutionBotId, botData)
        }
      } else {
        // Criar novo agente
        const { error } = await supabase.from("ai_agents").insert([agentData])

        if (error) throw error
      }

      setLoadingStep("Finalizando...")
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao salvar agente:", error)
      setError(error.message || "Erro ao salvar agente")
    } finally {
      setSaving(false)
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

  const triggerTypes = [
    { value: "keyword", label: "Palavra-chave" },
    { value: "all", label: "Todas as mensagens" },
  ]

  const triggerOperators = [
    { value: "contains", label: "Contém" },
    { value: "equals", label: "Igual a" },
    { value: "startsWith", label: "Começa com" },
    { value: "endsWith", label: "Termina com" },
    { value: "regex", label: "Expressão regular" },
    { value: "none", label: "Nenhum" },
  ]

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                🧠 Nome e Identidade do Agente
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
                <Label htmlFor="identity_description" className="text-gray-900 dark:text-gray-100">
                  Descrição da Identidade
                </Label>
                <Textarea
                  id="identity_description"
                  value={formData.identity_description}
                  onChange={(e) => setFormData({ ...formData, identity_description: e.target.value })}
                  placeholder="Descreva a personalidade e características do seu agente..."
                  rows={3}
                  className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
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
                💬 Tom de Voz e Função
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
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Conservador (0)</span>
                  <span>Criativo (2)</span>
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp_connection" className="text-gray-900 dark:text-gray-100">
                  Conexão WhatsApp *
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
                {whatsappConnections.find((c) => c.id === formData.whatsapp_connection_id)?.status !== "connected" && (
                  <p className="text-xs text-amber-600 mt-1">
                    Esta conexão está desconectada. O agente só funcionará quando a conexão estiver ativa.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Bot */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Settings className="w-5 h-5" />
                Configurações do Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trigger_type" className="text-gray-900 dark:text-gray-100">
                    Tipo de Ativação
                  </Label>
                  <Select
                    value={formData.trigger_type}
                    onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                  >
                    <SelectTrigger className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      {triggerTypes.map((type) => (
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
                  <Label htmlFor="trigger_operator" className="text-gray-900 dark:text-gray-100">
                    Operador
                  </Label>
                  <Select
                    value={formData.trigger_operator}
                    onValueChange={(value) => setFormData({ ...formData, trigger_operator: value })}
                  >
                    <SelectTrigger className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      {triggerOperators.map((operator) => (
                        <SelectItem
                          key={operator.value}
                          value={operator.value}
                          className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                        >
                          {operator.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="trigger_value" className="text-gray-900 dark:text-gray-100">
                  Palavra-chave de Ativação *
                </Label>
                <Input
                  id="trigger_value"
                  value={formData.trigger_value}
                  onChange={(e) => setFormData({ ...formData, trigger_value: e.target.value })}
                  placeholder="Ex: oi, olá, menu"
                  required
                  className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keyword_finish" className="text-gray-900 dark:text-gray-100">
                    Palavra para Sair
                  </Label>
                  <Input
                    id="keyword_finish"
                    value={formData.keyword_finish}
                    onChange={(e) => setFormData({ ...formData, keyword_finish: e.target.value })}
                    placeholder="#SAIR"
                    className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="debounce_time" className="text-gray-900 dark:text-gray-100">
                    Tempo de Espera (segundos)
                  </Label>
                  <Input
                    id="debounce_time"
                    type="number"
                    value={formData.debounce_time}
                    onChange={(e) => setFormData({ ...formData, debounce_time: Number.parseInt(e.target.value) || 5 })}
                    min="1"
                    max="30"
                    className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="unknown_message" className="text-gray-900 dark:text-gray-100">
                  Mensagem para Comando Não Reconhecido
                </Label>
                <Textarea
                  id="unknown_message"
                  value={formData.unknown_message}
                  onChange={(e) => setFormData({ ...formData, unknown_message: e.target.value })}
                  placeholder="Mensagem exibida quando o bot não entende o comando"
                  rows={2}
                  className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="listening_from_me"
                    checked={formData.listening_from_me}
                    onCheckedChange={(checked) => setFormData({ ...formData, listening_from_me: checked })}
                  />
                  <Label htmlFor="listening_from_me" className="text-sm text-gray-900 dark:text-gray-100">
                    Escutar minhas mensagens
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="keep_open"
                    checked={formData.keep_open}
                    onCheckedChange={(checked) => setFormData({ ...formData, keep_open: checked })}
                  />
                  <Label htmlFor="keep_open" className="text-sm text-gray-900 dark:text-gray-100">
                    Manter conversa aberta
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="split_messages"
                    checked={formData.split_messages}
                    onCheckedChange={(checked) => setFormData({ ...formData, split_messages: checked })}
                  />
                  <Label htmlFor="split_messages" className="text-sm text-gray-900 dark:text-gray-100">
                    Dividir mensagens longas
                  </Label>
                </div>
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
                    <Label className="text-gray-900 dark:text-gray-100">Entender Imagens</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Analisar e descrever imagens enviadas</p>
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
                      <Label className="text-gray-900 dark:text-gray-100">Resposta com Voz</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enviar respostas em áudio</p>
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
                    checked={formData.calendar_integration}
                    onCheckedChange={(checked) => setFormData({ ...formData, calendar_integration: checked })}
                    disabled={!userSettings?.calendar_integration_enabled}
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
