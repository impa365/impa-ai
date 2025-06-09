"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

interface AgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: any
  onSuccess: () => void
}

interface WhatsAppConnection {
  id: string
  connection_name: string
  instance_name: string
  status: string
  user_profiles?: {
    full_name: string
    email: string
  }
}

export function AgentModal({ open, onOpenChange, agent, onSuccess }: AgentModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [whatsappConnections, setWhatsappConnections] = useState<WhatsAppConnection[]>([])
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
    try {
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .select(`
          id,
          connection_name,
          instance_name,
          status,
          user_profiles!whatsapp_connections_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar conexões WhatsApp:", error)
        return
      }

      console.log("Conexões WhatsApp carregadas:", data)
      setWhatsappConnections(data || [])
    } catch (error) {
      console.error("Erro ao buscar conexões WhatsApp:", error)
    } finally {
      setLoadingConnections(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do agente"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
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
            <Label htmlFor="whatsapp_connection">Conexão WhatsApp *</Label>
            <Select
              value={formData.whatsapp_connection_id}
              onValueChange={(value) => setFormData({ ...formData, whatsapp_connection_id: value })}
              disabled={loadingConnections}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingConnections
                      ? "Carregando conexões..."
                      : whatsappConnections.length === 0
                        ? "Nenhuma conexão disponível"
                        : "Selecione uma conexão WhatsApp"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {whatsappConnections.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{connection.connection_name || connection.instance_name}</span>
                      <span className="text-xs text-gray-500">
                        {connection.user_profiles?.full_name || connection.user_profiles?.email} • {connection.status}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {whatsappConnections.length === 0 && !loadingConnections && (
              <p className="text-xs text-gray-500 mt-1">
                Nenhuma conexão WhatsApp encontrada. Crie uma conexão primeiro.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do agente"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="training_prompt">Prompt de Treinamento *</Label>
            <Textarea
              id="training_prompt"
              value={formData.training_prompt}
              onChange={(e) => setFormData({ ...formData, training_prompt: e.target.value })}
              placeholder="Instruções de comportamento para o agente..."
              rows={4}
              required
            />
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

          <div className="flex justify-end space-x-2 pt-4">
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
