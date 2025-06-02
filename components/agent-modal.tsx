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
import { Bot, Sparkles, Info } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { modelosOpenAI } from "@/lib/openai-models"
import { fetchWhatsAppConnections } from "@/lib/whatsapp-connections"
import { createEvolutionBot, updateEvolutionBot } from "@/lib/evolution-api"

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
  user_id: string
  name: string
  description?: string | null
  prompt_template: string
  model_name: string
  temperature: number
  top_p: number
  max_tokens: number
  model_config: any // JSONB field
  is_active: boolean
  is_default: boolean
  whatsapp_connection_id?: string | null
  evolution_bot_id?: string | null
  n8n_webhook_url?: string | null
  created_at?: string
  updated_at?: string
}

const initialFormData: Agent = {
  id: "",
  user_id: "",
  name: "",
  description: "",
  prompt_template: "",
  model_name: "gpt-3.5-turbo",
  temperature: 0.7,
  top_p: 1,
  max_tokens: 1000,
  model_config: {
    activation_keyword: "",
    greeting_message_enabled: false,
    greeting_message: "",
  },
  is_active: true,
  is_default: false,
  whatsapp_connection_id: null,
  evolution_bot_id: null,
  n8n_webhook_url: null,
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

  const handleConfigChange = (key: keyof Agent, value: any) => {
    setFormData((prev) => {
      return { ...prev, model_config: { ...prev.model_config, [key]: value } }
    })
  }

  const selectedModelInfo = useMemo(() => {
    return modelosOpenAI.find((m) => m.id === formData.model_name)
  }, [formData.model_name])

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
    if (!formData.prompt_template.trim()) {
      setError("O prompt de treinamento é obrigatório.")
      setLoading(false)
      return
    }
    if (!formData.whatsapp_connection_id) {
      setError("A conexão WhatsApp é obrigatória.")
      setLoading(false)
      return
    }
    if (!formData.model_config.activation_keyword?.trim()) {
      setError("A palavra-chave de ativação é obrigatória.")
      setLoading(false)
      return
    }

    try {
      let evolutionBotId = formData.evolution_bot_id
      let n8nWebhookUrl = formData.n8n_webhook_url

      if (n8nIntegrationConfig?.flowUrl) {
        const agentSpecificToken = `AGENT_${formData.id || Date.now()}_TOKEN` // Generate a unique token
        n8nWebhookUrl = `${n8nIntegrationConfig.flowUrl}${n8nIntegrationConfig.flowUrl.includes("?") ? "&" : "?"}bot_token=${agentSpecificToken}`

        const evolutionBotData = {
          name: formData.name,
          description: formData.description || "",
          prompt: formData.prompt_template,
          model: formData.model_name,
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
          webhook_url: n8nWebhookUrl, // Use the constructed n8n URL
          api_key: n8nIntegrationConfig.apiKey || null, // Use n8n API key if configured
          active: formData.is_active,
          keyword: formData.model_config.activation_keyword || "",
          // Add other relevant fields for Evolution API
        }

        if (formData.evolution_bot_id) {
          // Update existing bot
          const updateResult = await updateEvolutionBot(formData.evolution_bot_id, evolutionBotData)
          if (!updateResult.success) throw new Error(updateResult.error || "Failed to update Evolution Bot")
        } else {
          // Create new bot
          const createResult = await createEvolutionBot(evolutionBotData)
          if (!createResult.success || !createResult.bot?.id)
            throw new Error(createResult.error || "Failed to create Evolution Bot")
          evolutionBotId = createResult.bot.id
        }
      } else {
        console.warn("n8n integration not configured. Skipping Evolution Bot creation/update.")
      }

      const dataToSave = {
        ...formData,
        user_id: currentUser.id,
        model_config: JSON.stringify(formData.model_config), // Serialize model_config
        evolution_bot_id: evolutionBotId,
        n8n_webhook_url: n8nWebhookUrl,
      }

      // Remove non-column fields before saving to Supabase
      const { id, created_at, updated_at, ...dbData } = dataToSave
      // @ts-ignore
      delete dbData.model_config // Will be saved as JSON string

      const finalDbData = {
        user_id: dbData.user_id,
        name: dbData.name,
        description: dbData.description,
        prompt_template: dbData.prompt_template,
        model_name: dbData.model_name,
        temperature: dbData.temperature,
        top_p: dbData.top_p,
        max_tokens: dbData.max_tokens,
        model_config: formData.model_config, // Keep as object for Supabase JSONB
        is_active: dbData.is_active,
        is_default: dbData.is_default,
        whatsapp_connection_id: dbData.whatsapp_connection_id,
        evolution_bot_id: dbData.evolution_bot_id,
        n8n_webhook_url: dbData.n8n_webhook_url,
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
        if (newAgentData && !evolutionBotId && n8nIntegrationConfig?.flowUrl) {
          // If bot creation was skipped due to missing ID, try again with newAgentData.id
          const agentSpecificToken = `AGENT_${newAgentData.id}_TOKEN`
          const newN8nWebhookUrl = `${n8nIntegrationConfig.flowUrl}${n8nIntegrationConfig.flowUrl.includes("?") ? "&" : "?"}bot_token=${agentSpecificToken}`
          const evolutionBotData = {
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
          const createResult = await createEvolutionBot(evolutionBotData)
          if (createResult.success && createResult.bot?.id) {
            await supabase
              .from("ai_agents")
              .update({ evolution_bot_id: createResult.bot.id, n8n_webhook_url: newN8nWebhookUrl })
              .eq("id", newAgentData.id)
          } else {
            console.warn("Failed to create Evolution Bot after agent creation:", createResult.error)
          }
        }
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
                {/* Fields: name, description, model_name, temperature, top_p, max_tokens, prompt_template */}
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
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    placeholder="Descreva a função principal do agente"
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
                          {modelo.name} ({modelo.context_window} tokens)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedModelInfo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Janela de contexto: {selectedModelInfo.context_window.toLocaleString()} tokens.{" "}
                      {selectedModelInfo.description}
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
                    <p className="text-xs text-muted-foreground mt-1">Controla a diversidade via amostragem nucleus.</p>
                  </div>
                  <div>
                    <Label htmlFor="max_tokens">Max Tokens: {formData.max_tokens}</Label>
                    <Input
                      type="number"
                      id="max_tokens"
                      name="max_tokens"
                      value={formData.max_tokens}
                      onChange={handleInputChange}
                      placeholder="1000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Máximo de tokens na resposta.</p>
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
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Defina a persona, o papel e as instruções principais do seu agente.
                  </p>
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
                    value={formData.model_config.activation_keyword || ""}
                    onChange={(e) => handleConfigChange("activation_keyword", e.target.value)}
                    placeholder="Ex: /bot, !assistente"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Palavra que o usuário deve enviar para iniciar a conversa com o bot.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="greeting_message_enabled">Mensagem de Saudação Automática</Label>
                  <Switch
                    id="greeting_message_enabled"
                    checked={formData.model_config.greeting_message_enabled}
                    onCheckedChange={(checked) => handleConfigChange("greeting_message_enabled", checked)}
                  />
                </div>
                {formData.model_config.greeting_message_enabled && (
                  <div>
                    <Label htmlFor="greeting_message">Mensagem de Saudação</Label>
                    <Textarea
                      id="greeting_message"
                      value={formData.model_config.greeting_message || ""}
                      onChange={(e) => handleConfigChange("greeting_message", e.target.value)}
                      placeholder="Olá! Como posso te ajudar hoje?"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Agente Ativo</Label>
                  <Switch
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_default">Agente Padrão para esta Conexão</Label>
                  <Switch
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_default: checked }))}
                  />
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
