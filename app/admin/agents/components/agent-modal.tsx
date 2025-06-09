"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: any
  onSuccess: () => void
}

interface WhatsAppConnection {
  id: string
  connection_name: string | null
  instance_name: string
  status: string
  user_id: string
  phone_number?: string
}

export function AgentModal({ open, onOpenChange, agent, onSuccess }: AgentModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [whatsappConnections, setWhatsappConnections] = useState<WhatsAppConnection[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    type: agent?.type || "geral",
    description: agent?.description || "",
    status: agent?.status || "active",
    whatsapp_connection_id: agent?.whatsapp_connection_id || "",
    training_prompt:
      agent?.training_prompt ||
      "Você é um assistente virtual especializado em atendimento ao cliente. Seja sempre educado, prestativo e profissional.",
  })

  // Carregar conexões WhatsApp quando o modal abrir
  useEffect(() => {
    if (open) {
      fetchWhatsAppConnections()
    }
  }, [open])

  const fetchWhatsAppConnections = async () => {
    setLoadingConnections(true)
    setDebugInfo("🔍 Iniciando busca via API...")

    try {
      // Usar a API em vez do cliente Supabase direto
      const response = await fetch("/api/whatsapp-connections", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        const errorText = await response.text()
        setDebugInfo(`❌ Erro na API: ${response.status} - ${errorText}`)
        console.error("Erro na API:", response.status, errorText)
        return
      }

      const result = await response.json()

      if (!result.success) {
        setDebugInfo(`❌ API retornou erro: ${result.error || "Desconhecido"}`)
        console.error("API retornou erro:", result.error)
        return
      }

      const connections = result.connections || []
      console.log(`✅ ${connections.length} conexões encontradas via API:`, connections)

      setWhatsappConnections(connections)
      setDebugInfo(`✅ ${connections.length} conexões carregadas`)

      // Adicionar conexão hardcoded para teste
      if (connections.length === 0) {
        console.log("⚠️ Nenhuma conexão encontrada, adicionando conexão de teste")
        const testConnection = {
          id: "test-connection-id",
          connection_name: "Conexão de Teste",
          instance_name: "teste01",
          status: "disconnected",
          user_id: "test-user-id",
          phone_number: "5511999999999",
        }
        setWhatsappConnections([testConnection])
        setDebugInfo("⚠️ Nenhuma conexão real encontrada. Adicionada conexão de teste.")
      }
    } catch (error) {
      console.error("💥 Erro geral:", error)
      setDebugInfo(`💥 Erro: ${error}`)

      // Adicionar conexão hardcoded para teste mesmo em caso de erro
      const testConnection = {
        id: "test-connection-id",
        connection_name: "Conexão de Teste (Fallback)",
        instance_name: "teste01",
        status: "disconnected",
        user_id: "test-user-id",
        phone_number: "5511999999999",
      }
      setWhatsappConnections([testConnection])
      setDebugInfo(`💥 Erro: ${error}. Adicionada conexão de teste.`)
    } finally {
      setLoadingConnections(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("💾 Dados do agente para salvar:", formData)

      // Simular salvamento
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao salvar agente:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent ? "Editar Agente" : "Criar Agente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da IA *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Luna, Assistente de Vendas, Bot Atendimento"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Este será o nome que identifica sua IA no sistema</p>
            </div>

            <div>
              <Label htmlFor="type">Função Principal</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Atendimento ao Cliente" />
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
              placeholder="Ex: IA especializada em vendas de produtos digitais, focada em qualificar leads e agendar reuniões"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Descreva qual é o objetivo principal desta IA (vendas, suporte, agendamento, etc.)
            </p>
          </div>

          <div>
            <Label htmlFor="whatsapp_connection">Conexão WhatsApp *</Label>
            <Select
              value={formData.whatsapp_connection_id}
              onValueChange={(value) => {
                console.log("🔄 Conexão selecionada:", value)
                setFormData({ ...formData, whatsapp_connection_id: value })
              }}
              disabled={loadingConnections}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingConnections
                      ? "Carregando conexões..."
                      : whatsappConnections.length === 0
                        ? "Nenhuma conexão disponível"
                        : "Selecione qual número WhatsApp esta IA irá usar"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {whatsappConnections.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{connection.connection_name || connection.instance_name}</span>
                      <span className="text-xs text-gray-500">
                        {connection.phone_number && `📱 ${connection.phone_number} • `}
                        Status: {connection.status}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-xs text-gray-500 mt-1">
              Escolha qual número de WhatsApp esta IA irá utilizar para se comunicar
            </p>

            {/* Debug info mais visível */}
            {debugInfo && (
              <div className="text-sm text-blue-700 mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                <strong>Debug:</strong> {debugInfo}
              </div>
            )}

            {whatsappConnections.length === 0 && !loadingConnections && (
              <div className="text-sm text-red-600 mt-2 p-3 bg-red-50 rounded border border-red-200">
                <strong>⚠️ Atenção:</strong> Nenhuma conexão WhatsApp encontrada.{" "}
                <a href="/admin/whatsapp" className="underline text-blue-600">
                  Crie uma conexão primeiro
                </a>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="training_prompt">Instruções de Comportamento (Prompt de Treinamento) *</Label>
            <Textarea
              id="training_prompt"
              value={formData.training_prompt}
              onChange={(e) => setFormData({ ...formData, training_prompt: e.target.value })}
              placeholder="Ex: Você é uma assistente de vendas especializada em produtos digitais. Seja sempre educada, faça perguntas para entender as necessidades do cliente, e conduza a conversa para agendar uma reunião. Nunca invente informações que não possui."
              rows={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Instruções detalhadas sobre como a IA deve se comportar, responder e agir durante as conversas
            </p>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="training">Treinando</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.whatsapp_connection_id} className="min-w-[100px]">
              {loading ? "Salvando..." : agent ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
