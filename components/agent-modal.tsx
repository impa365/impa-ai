"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Bot, Loader2, AlertCircle, Mic, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

interface AgentModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  agent?: any
  onSave?: (agent: any, isNew: boolean) => void
}

export function AgentModal({ isOpen, onOpenChange, agent, onSave }: AgentModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
  const [whatsappConnections, setWhatsappConnections] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    type: "chat",
    description: "",
    prompt: "",
    model: "gpt-4",
    temperature: 0.7,
    max_tokens: 1000,
    whatsapp_connection_id: "",
    voice_provider: "",
    voice_api_key: "",
    voice_voice_id: "",
    calendar_provider: "",
    calendar_api_key: "",
    calendar_calendar_id: "",
  })

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadModalData()
    } else {
      // Reset form quando fechar
      if (!agent) {
        resetForm()
      }
      setError("")
    }
  }, [isOpen]) // Apenas isOpen como dependência

  // Carregar dados do agente quando agent mudar
  useEffect(() => {
    if (agent && isOpen) {
      setFormData({
        name: agent.name || "",
        type: agent.type || "chat",
        description: agent.description || "",
        prompt: agent.prompt || "",
        model: agent.model || "gpt-4",
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 1000,
        whatsapp_connection_id: agent.whatsapp_connection_id || "",
        voice_provider: agent.voice_provider || "",
        voice_api_key: agent.voice_api_key || "",
        voice_voice_id: agent.voice_voice_id || "",
        calendar_provider: agent.calendar_provider || "",
        calendar_api_key: agent.calendar_api_key || "",
        calendar_calendar_id: agent.calendar_calendar_id || "",
      })
    }
  }, [agent, isOpen])

  const resetForm = () => {
    setFormData({
      name: "",
      type: "chat",
      description: "",
      prompt: "",
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 1000,
      whatsapp_connection_id: "",
      voice_provider: "",
      voice_api_key: "",
      voice_voice_id: "",
      calendar_provider: "",
      calendar_api_key: "",
      calendar_calendar_id: "",
    })
  }

  const loadModalData = async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) return

    setLoadingData(true)
    try {
      // Buscar conexões WhatsApp
      const { data: connections, error: connectionsError } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", currentUser.id)

      if (connectionsError) {
        console.warn("Erro ao buscar conexões WhatsApp:", connectionsError)
        setWhatsappConnections([])
      } else {
        setWhatsappConnections(connections || [])
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do modal:", err)
      setError("Erro ao carregar dados")
    } finally {
      setLoadingData(false)
    }
  }

  const handleSave = async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      setError("Usuário não autenticado")
      return
    }

    if (!formData.name.trim()) {
      setError("Nome do agente é obrigatório")
      return
    }

    setLoading(true)
    setError("")

    try {
      const agentData = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        prompt: formData.prompt.trim(),
        model: formData.model,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        whatsapp_connection_id: formData.whatsapp_connection_id || null,
        voice_provider: formData.voice_provider || null,
        voice_api_key: formData.voice_api_key || null,
        voice_voice_id: formData.voice_voice_id || null,
        calendar_provider: formData.calendar_provider || null,
        calendar_api_key: formData.calendar_api_key || null,
        calendar_calendar_id: formData.calendar_calendar_id || null,
        user_id: currentUser.id,
        updated_at: new Date().toISOString(),
      }

      let result

      if (agent) {
        // Atualizar agente existente
        const { data, error: updateError } = await supabase
          .from("ai_agents")
          .update(agentData)
          .eq("id", agent.id)
          .select()
          .single()

        if (updateError) throw updateError
        result = data
      } else {
        // Criar novo agente
        const { data, error: insertError } = await supabase
          .from("ai_agents")
          .insert([{ ...agentData, created_at: new Date().toISOString() }])
          .select()
          .single()

        if (insertError) throw insertError
        result = data
      }

      if (onSave) {
        onSave(result, !agent)
      }
      onOpenChange(false)
    } catch (err: any) {
      console.error("Erro ao salvar agente:", err)
      setError(err.message || "Erro ao salvar agente")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {agent ? "Editar Agente" : "Novo Agente"}
          </DialogTitle>
          <DialogDescription>
            {agent ? `Editando: ${agent.name}` : "Configure seu assistente virtual para WhatsApp"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Carregando dados...</span>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="basic">Configurações Básicas</TabsTrigger>
                <TabsTrigger value="advanced">Configurações Avançadas</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Agente *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Assistente de Vendas"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo do Agente</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chat">Chat</SelectItem>
                        <SelectItem value="voice">Voz</SelectItem>
                        <SelectItem value="calendar">Calendário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="model">Modelo de IA</Label>
                    <Select
                      value={formData.model}
                      onValueChange={(value) => setFormData({ ...formData, model: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3">Claude 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descrição do agente"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="prompt">Instruções para o Agente</Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    placeholder="Descreva como o agente deve se comportar..."
                    disabled={loading}
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp_connection">Conexão WhatsApp</Label>
                  <Select
                    value={formData.whatsapp_connection_id}
                    onValueChange={(value) => setFormData({ ...formData, whatsapp_connection_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conexão" />
                    </SelectTrigger>
                    <SelectContent>
                      {whatsappConnections.length === 0 ? (
                        <SelectItem value="" disabled>
                          Nenhuma conexão disponível
                        </SelectItem>
                      ) : (
                        whatsappConnections.map((connection) => (
                          <SelectItem key={connection.id} value={connection.id}>
                            {connection.connection_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="temperature">Temperatura (Criatividade)</Label>
                    <span className="text-sm text-muted-foreground">{formData.temperature.toFixed(1)}</span>
                  </div>
                  <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[formData.temperature]}
                    onValueChange={(value) => setFormData({ ...formData, temperature: value[0] })}
                    disabled={loading}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Preciso</span>
                    <span>Criativo</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="max_tokens">Máximo de Tokens</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData({ ...formData, max_tokens: Number.parseInt(e.target.value) || 1000 })}
                    min="100"
                    max="4000"
                    disabled={loading}
                  />
                </div>

                <Separator />

                {formData.type === "voice" && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Configurações de Voz
                    </h3>

                    <div>
                      <Label htmlFor="voice_provider">Provedor de Voz</Label>
                      <Select
                        value={formData.voice_provider}
                        onValueChange={(value) => setFormData({ ...formData, voice_provider: value })}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um provedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eleven_labs">Eleven Labs</SelectItem>
                          <SelectItem value="openai">OpenAI TTS</SelectItem>
                          <SelectItem value="azure">Azure Speech</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="voice_api_key">API Key de Voz</Label>
                      <Input
                        id="voice_api_key"
                        type="password"
                        value={formData.voice_api_key}
                        onChange={(e) => setFormData({ ...formData, voice_api_key: e.target.value })}
                        placeholder="Sua API Key do provedor de voz"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="voice_voice_id">ID da Voz</Label>
                      <Input
                        id="voice_voice_id"
                        value={formData.voice_voice_id}
                        onChange={(e) => setFormData({ ...formData, voice_voice_id: e.target.value })}
                        placeholder="ID da voz no provedor"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {formData.type === "calendar" && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Configurações de Calendário
                    </h3>

                    <div>
                      <Label htmlFor="calendar_provider">Provedor de Calendário</Label>
                      <Select
                        value={formData.calendar_provider}
                        onValueChange={(value) => setFormData({ ...formData, calendar_provider: value })}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um provedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cal_com">Cal.com</SelectItem>
                          <SelectItem value="calendly">Calendly</SelectItem>
                          <SelectItem value="google">Google Calendar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="calendar_api_key">API Key do Calendário</Label>
                      <Input
                        id="calendar_api_key"
                        type="password"
                        value={formData.calendar_api_key}
                        onChange={(e) => setFormData({ ...formData, calendar_api_key: e.target.value })}
                        placeholder="Sua API Key do provedor de calendário"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="calendar_calendar_id">ID do Calendário</Label>
                      <Input
                        id="calendar_calendar_id"
                        value={formData.calendar_calendar_id}
                        onChange={(e) => setFormData({ ...formData, calendar_calendar_id: e.target.value })}
                        placeholder="ID do calendário"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading || loadingData}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || loadingData}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : agent ? (
              "Salvar Alterações"
            ) : (
              "Criar Agente"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Exportação padrão para compatibilidade
export default AgentModal

// Exportação nomeada para compatibilidade
