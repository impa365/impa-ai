"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, AlertCircle } from "lucide-react"
import { createEvolutionInstance } from "@/lib/whatsapp-api"
import WhatsAppQRModal from "./whatsapp-qr-modal"
import InstanceCreationModal from "./instance-creation-modal"

interface WhatsAppConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: () => void
}

export default function WhatsAppConnectionModal({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: WhatsAppConnectionModalProps) {
  const [connectionName, setConnectionName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Estados para os modais
  const [creationModalOpen, setCreationModalOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [createdConnection, setCreatedConnection] = useState<any>(null)

  const validateConnectionName = (name: string): boolean => {
    // Permitir apenas letras, números e underscores
    const regex = /^[a-zA-Z0-9_]+$/
    return regex.test(name) && name.length >= 3 && name.length <= 20
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!connectionName.trim()) {
      setError("Nome da conexão é obrigatório")
      return
    }

    if (!validateConnectionName(connectionName.trim())) {
      setError("Nome deve ter 3-20 caracteres e conter apenas letras, números e underscores")
      return
    }

    setError("")

    // Fechar o modal de criação e abrir a animação
    onOpenChange(false)
    setCreationModalOpen(true)
  }

  const handleCreationComplete = async () => {
    setLoading(true)

    try {
      const result = await createEvolutionInstance(connectionName.trim(), userId)

      if (result.success) {
        // Atualizar a lista de conexões
        onSuccess()

        // Armazenar a conexão criada para usar depois
        setCreatedConnection(result.data.connection)
      } else {
        setError(result.error || "Erro ao criar conexão")
        // Fechar modal de criação e reabrir o de configuração em caso de erro
        setCreationModalOpen(false)
        onOpenChange(true)
      }
    } catch (error) {
      setError("Erro interno do servidor")
      // Fechar modal de criação e reabrir o de configuração em caso de erro
      setCreationModalOpen(false)
      onOpenChange(true)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectWhatsApp = () => {
    // Abrir o modal do QR Code com a conexão criada
    setQrModalOpen(true)
  }

  const handleQRModalClose = () => {
    setQrModalOpen(false)
    setCreatedConnection(null)
    setConnectionName("") // Limpar o formulário
  }

  const handleStatusChange = (status: string) => {
    if (createdConnection) {
      setCreatedConnection({ ...createdConnection, status })
    }
    // Atualizar a lista quando o status mudar
    onSuccess()
  }

  return (
    <>
      {/* Modal de criação da conexão */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nova Conexão WhatsApp
            </DialogTitle>
            <DialogDescription>Crie uma nova conexão WhatsApp para seus agentes de IA</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="connectionName">Nome da Conexão</Label>
              <Input
                id="connectionName"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder="Ex: minha_conexao_principal"
                disabled={loading}
                maxLength={20}
              />
              <p className="text-xs text-gray-500">Use apenas letras, números e underscores. Mínimo 3 caracteres.</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !connectionName.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Conexão
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de animação de criação */}
      <InstanceCreationModal
        open={creationModalOpen}
        onOpenChange={setCreationModalOpen}
        connectionName={connectionName}
        onComplete={handleCreationComplete}
        onConnectWhatsApp={handleConnectWhatsApp}
      />

      {/* Modal do QR Code */}
      <WhatsAppQRModal
        open={qrModalOpen}
        onOpenChange={handleQRModalClose}
        connection={createdConnection}
        onStatusChange={handleStatusChange}
      />
    </>
  )
}
