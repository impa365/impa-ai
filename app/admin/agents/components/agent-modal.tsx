"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertTriangle, CheckCircle, Info, ExternalLink } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface WhatsAppConnection {
  id: string
  connection_name: string | null
  instance_name: string
  status: string
  user_id: string
  phone_number?: string | null
  user_profiles?: {
    id: string
    full_name: string
    email: string
  }
}

export interface ConnectionFetchLog {
  timestamp: Date
  message: string
  type: "info" | "error" | "success"
}

interface AgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: any
  onSuccess: () => void
  whatsappConnections: WhatsAppConnection[]
  isLoadingConnections: boolean
  fetchLogs: ConnectionFetchLog[]
  selectedUserId?: string
  isAdmin?: boolean
}

export function AgentModal({
  open,
  onOpenChange,
  agent,
  onSuccess,
  whatsappConnections,
  isLoadingConnections,
  fetchLogs,
  selectedUserId,
  isAdmin = false,
}: AgentModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    type: agent?.type || "geral",
    description: agent?.description || "",
    status: agent?.status || "active",
    whatsapp_connection_id: agent?.whatsapp_connection_id || "",
    user_id: selectedUserId || agent?.user_id || "",
    training_prompt: agent?.training_prompt || "Você é um assistente virtual. Seja sempre educado e prestativo.",
    model_config: agent?.model_config || "",
    model: agent?.model || "",
  })
  
  // Estados para configurações LLM
  const [llmConfig, setLlmConfig] = useState<any>(null)
  const [loadingLlmConfig, setLoadingLlmConfig] = useState(false)

  useEffect(() => {
    setFormData({
      name: agent?.name || "",
      type: agent?.type || "geral",
      description: agent?.description || "",
      status: agent?.status || "active",
      whatsapp_connection_id: agent?.whatsapp_connection_id || "",
      user_id: selectedUserId || agent?.user_id || "",
      training_prompt: agent?.training_prompt || "Você é um assistente virtual. Seja sempre educado e prestativo.",
      model_config: agent?.model_config || "",
      model: agent?.model || "",
    })
  }, [agent, open, selectedUserId])

  // Função SEGURA para carregar configurações LLM
  const loadLlmConfig = async () => {
    try {
      console.log("🔄 [AdminAgentModal] Carregando configurações LLM...")
      setLoadingLlmConfig(true)

      const response = await fetch("/api/system/llm-config", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`)
      
      const data = await response.json()
      
      if (data.success && data.config) {
        console.log("✅ [AdminAgentModal] Configurações LLM carregadas")
        setLlmConfig(data.config)
             } else {
         // Fallback seguro
         setLlmConfig({
           available_providers: ["openai"],
           default_model: {"openai": "gpt-4o-mini"}
         })
       }
     } catch (error) {
       console.error("❌ [AdminAgentModal] Erro:", error)
       setLlmConfig({
         available_providers: ["openai"],
         default_model: {"openai": "gpt-4o-mini"}
       })
     } finally {
      setLoadingLlmConfig(false)
    }
  }

  useEffect(() => {
    if (open) loadLlmConfig()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações SEGURAS
    if (!formData.whatsapp_connection_id) {
      alert("Por favor, selecione uma conexão WhatsApp antes de criar o agente.")
      return
    }

    if (isAdmin && !formData.user_id) {
      alert("Como administrador, você deve especificar para qual usuário está criando o agente.")
      return
    }

    if (!formData.model_config) {
      alert("Por favor, selecione um provedor de IA.")
      return
    }

    if (!formData.model) {
      alert("Por favor, selecione ou digite um modelo específico.")
      return
    }

    setIsSaving(true)
    try {
      console.log("💾 Salvando agente:", formData)
      // Aqui você implementaria a chamada real para salvar o agente
      await new Promise((resolve) => setTimeout(resolve, 1500))
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao salvar agente:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const getPlaceholderText = () => {
    if (isLoadingConnections) return "Carregando conexões..."
    if (whatsappConnections.length === 0) return "Nenhuma conexão disponível"
    return "Selecione uma conexão"
  }

  const getConnectionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "connected":
      case "authenticated":
        return "bg-green-500 text-white"
      case "connecting":
        return "bg-yellow-500 text-white"
      case "disconnected":
        return "bg-gray-500 text-white"
      case "error":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-400 text-white"
    }
  }

  const LogIcon = ({ type }: { type: ConnectionFetchLog["type"] }) => {
    if (type === "error") return <AlertTriangle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
    if (type === "success") return <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
    return <Info className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
  }

  // Determinar se o formulário pode ser submetido
  const canSubmit =
    !isSaving &&
    !isLoadingConnections &&
    !loadingLlmConfig &&
    formData.whatsapp_connection_id &&
    formData.name.trim() &&
    formData.training_prompt.trim() &&
    formData.model_config &&
    formData.model &&
    whatsappConnections.length > 0 &&
    (!isAdmin || formData.user_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {agent ? "Editar Agente IA" : "Criar Novo Agente IA"}
            {isAdmin && selectedUserId && (
              <span className="text-sm font-normal text-muted-foreground ml-2">(para usuário selecionado)</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow pr-6 -mr-6">
          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            {/* Alert quando não há conexões */}
            {!isLoadingConnections && whatsappConnections.length === 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Impossível criar agente:</strong> Nenhuma conexão WhatsApp disponível
                  {isAdmin ? " para o usuário selecionado" : ""}.
                  <br />
                  <a
                    href="/admin/whatsapp"
                    className="inline-flex items-center mt-2 text-sm underline hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Configurar Conexões WhatsApp
                  </a>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <Label htmlFor="name">Nome da IA *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={whatsappConnections.length === 0}
                  placeholder="Ex: Assistente de Vendas, Bot Suporte..."
                />
              </div>
              <div>
                <Label htmlFor="type">Função Principal</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={whatsappConnections.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="geral">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição do Propósito da IA</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={whatsappConnections.length === 0}
                placeholder="Descreva qual é o objetivo principal desta IA..."
              />
            </div>

            <div>
              <Label htmlFor="whatsapp_connection">Conexão WhatsApp *</Label>
              <Select
                value={formData.whatsapp_connection_id}
                onValueChange={(value) => setFormData({ ...formData, whatsapp_connection_id: value })}
                disabled={isLoadingConnections || whatsappConnections.length === 0}
              >
                <SelectTrigger>
                  {isLoadingConnections && whatsappConnections.length === 0 && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <SelectValue placeholder={getPlaceholderText()} />
                </SelectTrigger>
                <SelectContent>
                  {whatsappConnections.length > 0
                    ? whatsappConnections.map((connection) => (
                        <SelectItem key={connection.id} value={connection.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col text-left">
                              <span className="font-medium">
                                {connection.connection_name || connection.instance_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ID: {connection.id.slice(0, 8)}...
                                {connection.phone_number && ` • ${connection.phone_number}`}
                              </span>
                            </div>
                            <Badge className={getConnectionStatusColor(connection.status)}>{connection.status}</Badge>
                          </div>
                        </SelectItem>
                      ))
                    : !isLoadingConnections && (
                        <SelectItem value="no-connections-placeholder" disabled>
                          Nenhuma conexão encontrada.
                        </SelectItem>
                      )}
                  {isLoadingConnections && whatsappConnections.length === 0 && (
                    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  )}
                </SelectContent>
              </Select>
              {whatsappConnections.length === 0 && !isLoadingConnections && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ É necessário ter pelo menos uma conexão WhatsApp configurada para criar agentes.
                </p>
              )}
              {whatsappConnections.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✅ {whatsappConnections.length} conexão(ões) disponível(eis) - incluindo todas com status válido
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="training_prompt">Instruções de Comportamento (Prompt de Treinamento) *</Label>
              <Textarea
                id="training_prompt"
                value={formData.training_prompt}
                onChange={(e) => setFormData({ ...formData, training_prompt: e.target.value })}
                rows={5}
                required
                disabled={whatsappConnections.length === 0}
                placeholder="Ex: Você é uma assistente de vendas especializada em produtos digitais. Seja sempre educada, faça perguntas para entender as necessidades do cliente..."
              />
            </div>

            {/* Seção SEGURA de Configuração de LLM */}
            <div>
              <Label htmlFor="model_config">Provedor de IA 🔒</Label>
              <Select
                value={formData.model_config}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  model_config: value,
                  model: "" // Limpar modelo ao trocar provedor
                })}
                disabled={loadingLlmConfig || !llmConfig || whatsappConnections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingLlmConfig ? "Carregando provedores..." : "Selecione o provedor de IA"} />
                </SelectTrigger>
                <SelectContent>
                  {llmConfig?.available_providers?.map((provider: string) => (
                    <SelectItem key={provider} value={provider}>
                      {provider === "openai" && "OpenAI (GPT)"}
                      {provider === "anthropic" && "Anthropic (Claude)"}
                      {provider === "google" && "Google (Gemini)"}
                      {provider === "ollama" && "Ollama (Local)"}
                      {provider === "groq" && "Groq (Fast)"}
                      {!["openai", "anthropic", "google", "ollama", "groq"].includes(provider) && provider}
                    </SelectItem>
                  )) || (
                    <SelectItem value="openai" disabled>
                      {loadingLlmConfig ? "Carregando..." : "Nenhum provedor disponível"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Escolha qual provedor de IA será usado (configurações do servidor)
              </p>
            </div>

            {formData.model_config && (
              <div>
                <Label htmlFor="model">Modelo Específico 🎯</Label>
                <Select
                  value={formData.model ? "custom" : "default"}
                                     onValueChange={(value) => {
                     if (value === "default") {
                       const defaultModel = formData.model_config && llmConfig?.default_model?.[formData.model_config] || "gpt-4o-mini"
                       setFormData({ ...formData, model: defaultModel })
                     } else {
                       setFormData({ ...formData, model: "" })
                     }
                   }}
                  disabled={whatsappConnections.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Usar modelo padrão ou personalizado" />
                  </SelectTrigger>
                  <SelectContent>
                                         <SelectItem value="default">
                       Modelo Padrão ({formData.model_config && llmConfig?.default_model?.[formData.model_config] || "gpt-4o-mini"})
                     </SelectItem>
                    <SelectItem value="custom">Modelo Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.model_config && formData.model === "" && (
              <div>
                <Label htmlFor="custom_model">Nome do Modelo Personalizado * 🔧</Label>
                <Input
                  id="custom_model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder={
                    formData.model_config === "openai" ? "Ex: gpt-4o, gpt-4o-mini, gpt-3.5-turbo" :
                    formData.model_config === "anthropic" ? "Ex: claude-3-haiku-20240307, claude-3-sonnet-20240229" :
                    formData.model_config === "google" ? "Ex: gemini-1.5-flash, gemini-1.5-pro" :
                    formData.model_config === "ollama" ? "Ex: llama3.2:3b, llama3.2:1b" :
                    formData.model_config === "groq" ? "Ex: llama3-8b-8192, mixtral-8x7b-32768" :
                    "Digite o nome exato do modelo"
                  }
                  disabled={whatsappConnections.length === 0}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite o nome exato do modelo para o provedor {formData.model_config}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="status">Status do Agente</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={whatsappConnections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="training">Treinando</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <details className="mt-4">
              <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900">
                Painel de Logs da Busca de Conexões ({fetchLogs.length})
              </summary>
              <ScrollArea className="h-32 mt-2 border rounded-md p-2 bg-gray-50 text-xs">
                {fetchLogs.length === 0 && <p className="text-gray-500">Nenhum log disponível.</p>}
                {fetchLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-start py-1 ${
                      log.type === "error"
                        ? "text-red-700"
                        : log.type === "success"
                          ? "text-green-700"
                          : "text-gray-700"
                    }`}
                  >
                    <LogIcon type={log.type} />
                    <div className="flex-grow">
                      <span className="font-mono text-gray-400 mr-2">
                        {log.timestamp.toLocaleTimeString()}.
                        {log.timestamp.getMilliseconds().toString().padStart(3, "0")}
                      </span>
                      <span>{log.message}</span>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </details>
          </form>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit} onClick={handleSubmit}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {agent ? "Atualizar Agente" : "Criar Agente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
