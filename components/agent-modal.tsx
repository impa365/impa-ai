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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Loader2, Bot, AlertCircle, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: any
  userId: string
  onSuccess: () => void
}

const TONE_OPTIONS = [
  { value: "humanizado", label: "Humanizado", description: "Natural e empático" },
  { value: "formal", label: "Formal", description: "Profissional e respeitoso" },
  { value: "tecnico", label: "Técnico", description: "Preciso e detalhado" },
  { value: "casual", label: "Casual", description: "Descontraído e amigável" },
  { value: "comercial", label: "Comercial", description: "Persuasivo e vendedor" },
]

const FUNCTION_OPTIONS = [
  { value: "atendimento", label: "Atendimento ao Cliente" },
  { value: "vendas", label: "Vendas" },
  { value: "agendamento", label: "Agendamento" },
  { value: "suporte", label: "Suporte Técnico" },
  { value: "qualificacao", label: "Qualificação de Leads" },
]

const TRIGGER_TYPE_OPTIONS = [
  { value: "all", label: "Todas as mensagens" },
  { value: "keyword", label: "Palavra-chave específica" },
]

const TRIGGER_OPERATOR_OPTIONS = [
  { value: "contains", label: "Contém" },
  { value: "equals", label: "Igual a" },
  { value: "startsWith", label: "Começa com" },
  { value: "endsWith", label: "Termina com" },
  { value: "regex", label: "Expressão regular" },
]

export default function AgentModal({ open, onOpenChange, agent, userId, onSuccess }: AgentModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState("")
  const [connections, setConnections] = useState<any[]>([])
  const [userSettings, setUserSettings] = useState<any>(null)
  const [globalSettings, setGlobalSettings] = useState<any>({})
  const [showVoiceApiKey, setShowVoiceApiKey] = useState(false)
  const [showCalendarApiKey, setShowCalendarApiKey] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: "",
    whatsappConnectionId: "",
    tone: "humanizado",
    mainFunction: "atendimento",
    temperature: 0.7,
    transcribeAudio: false,
    understandImages: false,
    voiceResponse: false,
    voiceProvider: "eleven_labs",
    voiceApiKey: "",
    calendarIntegration: false,
    calendarApiKey: "",
    triggerType: "keyword",
    triggerOperator: "contains",
    triggerValue: "",
    keywordFinish: "#SAIR",
    unknownMessage: "Desculpe, não entendi. Pode reformular sua pergunta?",
    delayMessage: 1000,
    listeningFromMe: false,
    stopBotFromMe: false,
    keepOpen: false,
    debounceTime: 0,
    ignoreGroups: true,
    splitMessages: true,
    timePerChar: 50,
    expireTime: 0,
    isDefault: false,
  })

  useEffect(() => {
    if (open) {
      fetchData()
    } else {
      setError("")
    }
  }, [open, agent])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      // Buscar conexões WhatsApp do usuário
      const { data: connectionsData } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "connected")
        .order("connection_name")

      setConnections(connectionsData || [])

      // Buscar configurações do usuário
      const { data: userSettingsData } = await supabase
        .from("user_agent_settings")
        .select("*")
        .eq("user_id", userId)
        .single()

      setUserSettings(userSettingsData)

      // Buscar configurações globais
      const { data: globalSettingsData } = await supabase
        .from("global_agent_settings")
        .select("setting_key, setting_value")

      const globalSettingsObj = {}
      globalSettingsData?.forEach((setting) => {
        globalSettingsObj[setting.setting_key] = JSON.parse(setting.setting_value)
      })
      setGlobalSettings(globalSettingsObj)

      // Preencher formulário se for edição
      if (agent) {
        setFormData({
          name: agent.name || "",
          description: agent.description || "",
          prompt: agent.prompt || "",
          whatsappConnectionId: agent.whatsapp_connection_id || "",
          tone: agent.tone || "humanizado",
          mainFunction: agent.main_function || "atendimento",
          temperature: agent.temperature || 0.7,
          transcribeAudio: agent.transcribe_audio || false,
          understandImages: agent.understand_images || false,
          voiceResponse: agent.voice_response || false,
          voiceProvider: agent.voice_provider || "eleven_labs",
          voiceApiKey: agent.voice_api_key || "",
          calendarIntegration: agent.calendar_integration || false,
          calendarApiKey: agent.calendar_api_key || "",
          triggerType: agent.trigger_type || "keyword",
          triggerOperator: agent.trigger_operator || "contains",
          triggerValue: agent.trigger_value || "",
          keywordFinish: agent.keyword_finish || "#SAIR",
          unknownMessage: agent.unknown_message || "Desculpe, não entendi. Pode reformular sua pergunta?",
          delayMessage: agent.delay_message || 1000,
          listeningFromMe: agent.listening_from_me || false,
          stopBotFromMe: agent.stop_bot_from_me || false,
          keepOpen: agent.keep_open || false,
          debounceTime: agent.debounce_time || 0,
          ignoreGroups: agent.ignore_groups !== false,
          splitMessages: agent.split_messages !== false,
          timePerChar: agent.time_per_char || 50,
          expireTime: agent.expire_time || 0,
          isDefault: agent.is_default || false,
        })
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      setError("Nome e prompt são obrigatórios")
      return
    }

    if (!formData.whatsappConnectionId) {
      setError("Selecione uma conexão WhatsApp")
      return
    }

    if (formData.triggerType === "keyword" && !formData.triggerValue.trim()) {
      setError("Palavra-chave é obrigatória quando o tipo de gatilho é 'palavra-chave'")
      return
    }

    setLoading(true)
    setError("")

    try {
      const payload = {
        userId,
        ...formData,
      }

      const url = agent ? `/api/agents/${agent.id}` : "/api/agents"
      const method = agent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar agente")
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao salvar agente:", error)
      setError(error.message || "Erro ao salvar agente")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    onOpenChange(false)
  }

  const isFeatureEnabled = (feature: string) => {
    const userEnabled = userSettings?.[`${feature}_enabled`]
    const globalEnabled = globalSettings[`${feature}_global_enabled`]
    return userEnabled !== false && globalEnabled !== false
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Bot className="w-5 h-5" />
            {agent ? "Editar Agente IA" : "Novo Agente IA"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {agent ? `Editando: ${formData.name || agent.name}` : "Configure seu agente de inteligência artificial"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
          </Alert>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Carregando dados...</span>
          </div>
        ) : (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="personality">Personalidade</TabsTrigger>
              <TabsTrigger value="integrations">Integrações</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-foreground">
                    Nome do Agente *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Luna - Assistente de Vendas"
                    disabled={loading}
                    className="text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsappConnection" className="text-foreground">
                    Conexão WhatsApp *
                  </Label>
                  <Select
                    value={formData.whatsappConnectionId}
                    onValueChange={(value) => setFormData({ ...formData, whatsappConnectionId: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="text-foreground">
                      <SelectValue placeholder="Selecione uma conexão" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((connection) => (
                        <SelectItem key={connection.id} value={connection.id}>
                          {connection.connection_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-foreground">
                  Descrição
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição do agente"
                  disabled={loading}
                  className="text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="prompt" className="text-foreground">
                  Prompt de Treinamento *
                </Label>
                <Textarea
                  id="prompt"
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Descreva como o agente deve se comportar, suas responsabilidades e conhecimentos..."
                  rows={6}
                  disabled={loading}
                  className="text-foreground"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                  disabled={loading}
                />
                <Label htmlFor="isDefault" className="text-foreground">
                  Definir como agente padrão desta conexão
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="personality" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tone" className="text-foreground">
                    Tom de Voz
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
                      {TONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mainFunction" className="text-foreground">
                    Função Principal
                  </Label>
                  <Select
                    value={formData.mainFunction}
                    onValueChange={(value) => setFormData({ ...formData, mainFunction: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNCTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-foreground">Temperatura (Criatividade): {formData.temperature}</Label>
                <Slider
                  value={[formData.temperature]}
                  onValueChange={(value) => setFormData({ ...formData, temperature: value[0] })}
                  max={1}
                  min={0}
                  step={0.1}
                  className="mt-2"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Mais Conservador</span>
                  <span>Mais Criativo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="triggerType" className="text-foreground">
                    Tipo de Gatilho
                  </Label>
                  <Select
                    value={formData.triggerType}
                    onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.triggerType === "keyword" && (
                  <div>
                    <Label htmlFor="triggerOperator" className="text-foreground">
                      Operador
                    </Label>
                    <Select
                      value={formData.triggerOperator}
                      onValueChange={(value) => setFormData({ ...formData, triggerOperator: value })}
                      disabled={loading}
                    >
                      <SelectTrigger className="text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_OPERATOR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {formData.triggerType === "keyword" && (
                <div>
                  <Label htmlFor="triggerValue" className="text-foreground">
                    Palavra-chave *
                  </Label>
                  <Input
                    id="triggerValue"
                    value={formData.triggerValue}
                    onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                    placeholder="Ex: oi, olá, menu"
                    disabled={loading}
                    className="text-foreground"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-foreground">Recursos de IA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="transcribeAudio" className="text-foreground">
                        Transcrever áudio
                      </Label>
                      <Switch
                        id="transcribeAudio"
                        checked={formData.transcribeAudio && isFeatureEnabled("transcribe_audio")}
                        onCheckedChange={(checked) => setFormData({ ...formData, transcribeAudio: checked })}
                        disabled={loading || !isFeatureEnabled("transcribe_audio")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="understandImages" className="text-foreground">
                        Entender imagens
                      </Label>
                      <Switch
                        id="understandImages"
                        checked={formData.understandImages && isFeatureEnabled("understand_images")}
                        onCheckedChange={(checked) => setFormData({ ...formData, understandImages: checked })}
                        disabled={loading || !isFeatureEnabled("understand_images")}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-foreground">Resposta por Voz</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="voiceResponse" className="text-foreground">
                        Habilitar voz
                      </Label>
                      <Switch
                        id="voiceResponse"
                        checked={formData.voiceResponse && isFeatureEnabled("voice_response")}
                        onCheckedChange={(checked) => setFormData({ ...formData, voiceResponse: checked })}
                        disabled={loading || !isFeatureEnabled("voice_response")}
                      />
                    </div>

                    {formData.voiceResponse && isFeatureEnabled("voice_response") && (
                      <>
                        <div>
                          <Label htmlFor="voiceProvider" className="text-foreground">
                            Provedor
                          </Label>
                          <Select
                            value={formData.voiceProvider}
                            onValueChange={(value) => setFormData({ ...formData, voiceProvider: value })}
                            disabled={loading}
                          >
                            <SelectTrigger className="text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {globalSettings.fish_audio_enabled && (
                                <SelectItem value="fish_audio">Fish Audio</SelectItem>
                              )}
                              {globalSettings.eleven_labs_enabled && (
                                <SelectItem value="eleven_labs">Eleven Labs</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="voiceApiKey" className="text-foreground">
                            API Key
                          </Label>
                          <div className="relative">
                            <Input
                              id="voiceApiKey"
                              type={showVoiceApiKey ? "text" : "password"}
                              value={formData.voiceApiKey}
                              onChange={(e) => setFormData({ ...formData, voiceApiKey: e.target.value })}
                              placeholder="Sua API key do provedor de voz"
                              disabled={loading}
                              className="text-foreground pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowVoiceApiKey(!showVoiceApiKey)}
                            >
                              {showVoiceApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-foreground">Integração de Agenda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="calendarIntegration" className="text-foreground">
                      Habilitar Cal.com
                    </Label>
                    <Switch
                      id="calendarIntegration"
                      checked={formData.calendarIntegration && isFeatureEnabled("calendar_integration")}
                      onCheckedChange={(checked) => setFormData({ ...formData, calendarIntegration: checked })}
                      disabled={loading || !isFeatureEnabled("calendar_integration")}
                    />
                  </div>

                  {formData.calendarIntegration && isFeatureEnabled("calendar_integration") && (
                    <div>
                      <Label htmlFor="calendarApiKey" className="text-foreground">
                        API Key Cal.com
                      </Label>
                      <div className="relative">
                        <Input
                          id="calendarApiKey"
                          type={showCalendarApiKey ? "text" : "password"}
                          value={formData.calendarApiKey}
                          onChange={(e) => setFormData({ ...formData, calendarApiKey: e.target.value })}
                          placeholder="Sua API key do Cal.com"
                          disabled={loading}
                          className="text-foreground pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowCalendarApiKey(!showCalendarApiKey)}
                        >
                          {showCalendarApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keywordFinish" className="text-foreground">
                    Palavra para Sair
                  </Label>
                  <Input
                    id="keywordFinish"
                    value={formData.keywordFinish}
                    onChange={(e) => setFormData({ ...formData, keywordFinish: e.target.value })}
                    placeholder="#SAIR"
                    disabled={loading}
                    className="text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="delayMessage" className="text-foreground">
                    Delay entre Mensagens (ms)
                  </Label>
                  <Input
                    id="delayMessage"
                    type="number"
                    value={formData.delayMessage}
                    onChange={(e) => setFormData({ ...formData, delayMessage: Number.parseInt(e.target.value) || 0 })}
                    min="0"
                    disabled={loading}
                    className="text-foreground"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="unknownMessage" className="text-foreground">
                  Mensagem para Comando Desconhecido
                </Label>
                <Textarea
                  id="unknownMessage"
                  value={formData.unknownMessage}
                  onChange={(e) => setFormData({ ...formData, unknownMessage: e.target.value })}
                  rows={3}
                  disabled={loading}
                  className="text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="debounceTime" className="text-foreground">
                    Debounce Time (s)
                  </Label>
                  <Input
                    id="debounceTime"
                    type="number"
                    value={formData.debounceTime}
                    onChange={(e) => setFormData({ ...formData, debounceTime: Number.parseInt(e.target.value) || 0 })}
                    min="0"
                    disabled={loading}
                    className="text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="timePerChar" className="text-foreground">
                    Tempo por Caractere (ms)
                  </Label>
                  <Input
                    id="timePerChar"
                    type="number"
                    value={formData.timePerChar}
                    onChange={(e) => setFormData({ ...formData, timePerChar: Number.parseInt(e.target.value) || 50 })}
                    min="1"
                    disabled={loading}
                    className="text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="listeningFromMe"
                    checked={formData.listeningFromMe}
                    onCheckedChange={(checked) => setFormData({ ...formData, listeningFromMe: checked })}
                    disabled={loading}
                  />
                  <Label htmlFor="listeningFromMe" className="text-foreground">
                    Escutar mensagens próprias
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="stopBotFromMe"
                    checked={formData.stopBotFromMe}
                    onCheckedChange={(checked) => setFormData({ ...formData, stopBotFromMe: checked })}
                    disabled={loading}
                  />
                  <Label htmlFor="stopBotFromMe" className="text-foreground">
                    Parar bot com mensagens próprias
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="keepOpen"
                    checked={formData.keepOpen}
                    onCheckedChange={(checked) => setFormData({ ...formData, keepOpen: checked })}
                    disabled={loading}
                  />
                  <Label htmlFor="keepOpen" className="text-foreground">
                    Manter conversa aberta
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ignoreGroups"
                    checked={formData.ignoreGroups}
                    onCheckedChange={(checked) => setFormData({ ...formData, ignoreGroups: checked })}
                    disabled={loading}
                  />
                  <Label htmlFor="ignoreGroups" className="text-foreground">
                    Ignorar grupos
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="splitMessages"
                    checked={formData.splitMessages}
                    onCheckedChange={(checked) => setFormData({ ...formData, splitMessages: checked })}
                    disabled={loading}
                  />
                  <Label htmlFor="splitMessages" className="text-foreground">
                    Dividir mensagens longas
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading || loadingData} className="text-foreground">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || loadingData}
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
