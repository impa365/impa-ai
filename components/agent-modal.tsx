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
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Bot, Loader2, AlertCircle, Mic, Calendar, ImageIcon, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { checkUserCanCreateAgent } from "@/lib/agent-limits"

interface AgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: any
  onSuccess?: (agent: any) => void
}

export function AgentModal({ open, onOpenChange, agent, onSuccess }: AgentModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
  const [whatsappConnections, setWhatsappConnections] = useState<any[]>([])
  const [canCreateAgent, setCanCreateAgent] = useState(true)
  const [limitInfo, setLimitInfo] = useState({ currentCount: 0, limit: 0 })

  const [formData, setFormData] = useState({
    name: "",
    type: "general",
    tone: "professional",
    model: "gpt-4o",
    prompt: "",
    whatsapp_connection_id: "",
    temperature: 0.7,
    transcribe_audio: true,
    understand_images: true,
    voice_response_enabled: false,
    calendar_integration: false,
    trigger_value: "",
  })

  const user = getCurrentUser()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setLoadingData(true)
      try {
        // Verificar limite de agentes
        const { canCreate, currentCount, limit } = await checkUserCanCreateAgent(user.id)
        setCanCreateAgent(canCreate)
        setLimitInfo({ currentCount, limit })

        // Buscar conexões WhatsApp
        const { data: connections, error: connectionsError } = await supabase
          .from("whatsapp_connections")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "connected")

        if (connectionsError) throw connectionsError
        setWhatsappConnections(connections || [])

        // Carregar dados do agente se estiver editando
        if (agent) {
          setFormData({
            name: agent.name || "",
            type: agent.model_config?.function || "general",
            tone: agent.model_config?.tone || "professional",
            model: agent.model_config?.model || "gpt-4o",
            prompt: agent.model_config?.prompt || "",
            whatsapp_connection_id: agent.whatsapp_connection_id || "",
            temperature: agent.temperature || 0.7,
            transcribe_audio: agent.transcribe_audio !== false,
            understand_images: agent.understand_images !== false,
            voice_response_enabled: agent.voice_response_enabled || false,
            calendar_integration: agent.calendar_integration || false,
            trigger_value: agent.trigger_value || "",
          })
        }
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err)
        setError(err.message || "Erro ao carregar dados")
      } finally {
        setLoadingData(false)
      }
    }

    if (open) {
      fetchData()
    } else {
      setError("")
      if (!agent) {
        setFormData({
          name: "",
          type: "general",
          tone: "professional",
          model: "gpt-4o",
          prompt: "",
          whatsapp_connection_id: "",
          temperature: 0.7,
          transcribe_audio: true,
          understand_images: true,
          voice_response_enabled: false,
          calendar_integration: false,
          trigger_value: "",
        })
      }
    }
  }, [user, open, agent])

  const handleSave = async () => {
    if (!user) {
      setError("Usuário não autenticado")
      return
    }

    if (!formData.name.trim()) {
      setError("Nome do agente é obrigatório")
      return
    }

    if (!formData.whatsapp_connection_id) {
      setError("Selecione uma conexão WhatsApp")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Verificar limite de agentes se estiver criando um novo
      if (!agent) {
        const { canCreate } = await checkUserCanCreateAgent(user.id)
        if (!canCreate) {
          setError("Você atingiu o limite de agentes. Entre em contato com o administrador.")
          setLoading(false)
          return
        }
      }

      const modelConfig = {
        function: formData.type,
        tone: formData.tone,
        model: formData.model,
        prompt: formData.prompt,
      }

      let result

      if (agent) {
        // Atualizar agente existente
        const { data, error: updateError } = await supabase
          .from("ai_agents")
          .update({
            name: formData.name.trim(),
            model_config: modelConfig,
            whatsapp_connection_id: formData.whatsapp_connection_id,
            temperature: formData.temperature,
            transcribe_audio: formData.transcribe_audio,
            understand_images: formData.understand_images,
            voice_response_enabled: formData.voice_response_enabled,
            calendar_integration: formData.calendar_integration,
            trigger_value: formData.trigger_value.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", agent.id)
          .select()
          .single()

        if (updateError) throw updateError
        result = data
      } else {
        // Criar novo agente
        const { data, error: insertError } = await supabase
          .from("ai_agents")
          .insert([
            {
              name: formData.name.trim(),
              user_id: user.id,
              model_config: modelConfig,
              whatsapp_connection_id: formData.whatsapp_connection_id,
              temperature: formData.temperature,
              transcribe_audio: formData.transcribe_audio,
              understand_images: formData.understand_images,
              voice_response_enabled: formData.voice_response_enabled,
              calendar_integration: formData.calendar_integration,
              trigger_value: formData.trigger_value.trim(),
            },
          ])
          .select()
          .single()

        if (insertError) throw insertError
        result = data
      }

      if (onSuccess) onSuccess(result)
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Bot className="w-5 h-5" />
            {agent ? "Editar Agente" : "Novo Agente"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {agent ? `Editando: ${agent.name}` : "Configure seu assistente virtual para WhatsApp"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!canCreateAgent && !agent && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Você atingiu o limite de {limitInfo.limit} agentes. Entre em contato com o administrador para aumentar seu
              limite.
            </AlertDescription>
          </Alert>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Carregando dados...</span>
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
                  <Label htmlFor="name" className="text-foreground">
                    Nome do Agente *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Assistente de Vendas"
                    disabled={loading}
                    className="text-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-foreground">
                      Função do Agente
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      disabled={loading}
                    >
                      <SelectTrigger className="text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Geral</SelectItem>
                        <SelectItem value="sales">Vendas</SelectItem>
                        <SelectItem value="support">Suporte</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="customer_service">Atendimento ao Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tone" className="text-foreground">
                      Tom de Comunicação
                    </Label>
                    <Select
                      value={formData.tone}
                      onValueChange={(value) => setFormData({ ...formData, tone: value })}
                      disabled={loading}
                    >
                      <SelectTrigger className="text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="friendly">Amigável</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="technical">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="whatsapp_connection" className="text-foreground">
                    Conexão WhatsApp *
                  </Label>
                  <Select
                    value={formData.whatsapp_connection_id}
                    onValueChange={(value) => setFormData({ ...formData, whatsapp_connection_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="text-foreground">
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
                            {connection.connection_name} ({connection.phone_number || connection.instance_name})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {whatsappConnections.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Você precisa ter pelo menos uma conexão WhatsApp ativa para criar um agente.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="model" className="text-foreground">
                    Modelo de IA
                  </Label>
                  <Select
                    value={formData.model}
                    onValueChange={(value) => setFormData({ ...formData, model: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prompt" className="text-foreground">
                    Instruções para o Agente
                  </Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    placeholder="Descreva como o agente deve se comportar, quais informações ele deve fornecer, etc."
                    disabled={loading}
                    className="text-foreground min-h-[120px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="temperature" className="text-foreground">
                      Temperatura (Criatividade)
                    </Label>
                    <span className="text-sm text-muted-foreground">{formData.temperature.toFixed(1)}</span>
                  </div>
                  <Slider
                    id="temperature"
                    min={0}
                    max={1}
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

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Recursos Avançados</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground flex items-center gap-2">
                        <Mic className="w-4 h-4 text-blue-500" />
                        Transcrever Áudios
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Converter mensagens de voz em texto automaticamente
                      </p>
                    </div>
                    <Switch
                      checked={formData.transcribe_audio}
                      onCheckedChange={(checked) => setFormData({ ...formData, transcribe_audio: checked })}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                        Entender Imagens
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Permitir que o agente analise e responda sobre imagens
                      </p>
                    </div>
                    <Switch
                      checked={formData.understand_images}
                      onCheckedChange={(checked) => setFormData({ ...formData, understand_images: checked })}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground flex items-center gap-2">
                        <Mic className="w-4 h-4 text-blue-500" />
                        Resposta por Voz
                      </Label>
                      <p className="text-xs text-muted-foreground">Enviar respostas em formato de áudio</p>
                    </div>
                    <Switch
                      checked={formData.voice_response_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, voice_response_enabled: checked })}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        Integração com Calendário
                      </Label>
                      <p className="text-xs text-muted-foreground">Permitir que o agente agende compromissos</p>
                    </div>
                    <Switch
                      checked={formData.calendar_integration}
                      onCheckedChange={(checked) => setFormData({ ...formData, calendar_integration: checked })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="trigger" className="text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    Palavra de Ativação (Opcional)
                  </Label>
                  <Input
                    id="trigger"
                    value={formData.trigger_value}
                    onChange={(e) => setFormData({ ...formData, trigger_value: e.target.value })}
                    placeholder="Ex: #atendimento"
                    disabled={loading}
                    className="text-foreground mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Defina uma palavra-chave que ativará o agente em grupos ou conversas
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading || loadingData} className="text-foreground">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || loadingData || (!agent && !canCreateAgent)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
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

// Adicionar exportação padrão para compatibilidade
export default AgentModal
