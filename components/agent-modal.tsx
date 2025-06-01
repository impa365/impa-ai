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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot } from "lucide-react"
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
  const [loading, setLoading] = useState(false)
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
    voice_id: "",
    calendar_meeting_id: "",
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
        voice_id: agent.voice_id || "",
        calendar_meeting_id: agent.calendar_meeting_id || "",
      })
    } else {
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
        voice_id: "",
        calendar_meeting_id: "",
      })
    }
    setError("")
  }, [agent, whatsappConnections, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validações básicas
      if (!formData.name.trim()) {
        throw new Error("Nome do agente é obrigatório")
      }

      if (!formData.training_prompt.trim()) {
        throw new Error("Prompt de treinamento é obrigatório")
      }

      if (!formData.whatsapp_connection_id) {
        throw new Error("Conexão WhatsApp é obrigatória")
      }

      const currentUser = getCurrentUser()

      setLoadingStep("Salvando agente...")

      const agentData = {
        user_id: currentUser?.id,
        name: formData.name.trim(),
        identity_description: formData.identity_description.trim(),
        training_prompt: formData.training_prompt.trim(),
        voice_tone: formData.voice_tone,
        main_function: formData.main_function,
        temperature: formData.temperature[0],
        whatsapp_connection_id: formData.whatsapp_connection_id,
        transcribe_audio: formData.transcribe_audio,
        understand_images: formData.understand_images,
        voice_response_enabled: formData.voice_response_enabled,
        voice_provider: formData.voice_response_enabled ? formData.voice_provider : null,
        voice_api_key: formData.voice_response_enabled ? formData.voice_api_key : null,
        calendar_integration: formData.calendar_integration,
        calendar_api_key: formData.calendar_integration ? formData.calendar_api_key : null,
        is_default: formData.is_default,
        status: "active",
        type: "whatsapp",
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
        voice_id: formData.voice_response_enabled ? formData.voice_id : null,
        calendar_meeting_id: formData.calendar_integration ? formData.calendar_meeting_id : null,
      }

      if (agent) {
        const { error } = await supabase.from("ai_agents").update(agentData).eq("id", agent.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("ai_agents").insert([agentData])
        if (error) throw error
      }

      onSuccess()
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
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              {agent ? "Atualizando Agente" : "Criando Agente"}
            </h3>
            <p className="mt-2 text-sm text-gray-600 text-center">{loadingStep || "Processando..."}</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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
              <CardTitle className="text-lg flex items-center gap-2">🧠 Nome e Identidade do Agente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Agente *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Luna - Assistente de Vendas"
                  required
                />
              </div>

              <div>
                <Label htmlFor="identity_description">Descrição da Identidade</Label>
                <Textarea
                  id="identity_description"
                  value={formData.identity_description}
                  onChange={(e) => setFormData({ ...formData, identity_description: e.target.value })}
                  placeholder="Descreva a personalidade e características do seu agente..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="training_prompt">Prompt de Treinamento *</Label>
                <Textarea
                  id="training_prompt"
                  value={formData.training_prompt}
                  onChange={(e) => setFormData({ ...formData, training_prompt: e.target.value })}
                  placeholder="Instruções detalhadas sobre como o agente deve se comportar, responder e interagir..."
                  rows={5}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Comportamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">💬 Tom de Voz e Função</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="voice_tone">Tom de Voz</Label>
                  <Select
                    value={formData.voice_tone}
                    onValueChange={(value) => setFormData({ ...formData, voice_tone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceTones.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="main_function">Função Principal</Label>
                  <Select
                    value={formData.main_function}
                    onValueChange={(value) => setFormData({ ...formData, main_function: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mainFunctions.map((func) => (
                        <SelectItem key={func.value} value={func.value}>
                          {func.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="temperature">Temperatura (Criatividade): {formData.temperature[0]}</Label>
                <Slider
                  value={formData.temperature}
                  onValueChange={(value) => setFormData({ ...formData, temperature: value })}
                  max={2}
                  min={0}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Conservador (0)</span>
                  <span>Criativo (2)</span>
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp_connection">Conexão WhatsApp *</Label>
                <Select
                  value={formData.whatsapp_connection_id}
                  onValueChange={(value) => setFormData({ ...formData, whatsapp_connection_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conexão" />
                  </SelectTrigger>
                  <SelectContent>
                    {whatsappConnections.map((connection) => (
                      <SelectItem key={connection.id} value={connection.id}>
                        {connection.connection_name}
                        {connection.status !== "connected" && " (Desconectado)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
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
