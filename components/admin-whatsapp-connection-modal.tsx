"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, AlertCircle } from "lucide-react"
import { createEvolutionInstance } from "@/lib/whatsapp-api"
import InstanceCreationModal from "./instance-creation-modal"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AdminWhatsAppConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adminId: string
  onSuccess: () => void
}

export default function AdminWhatsAppConnectionModal({
  open,
  onOpenChange,
  adminId,
  onSuccess,
}: AdminWhatsAppConnectionModalProps) {
  const [connectionName, setConnectionName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [creationModalOpen, setCreationModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, email, full_name")
        .order("full_name", { ascending: true })

      if (data) {
        setUsers(data)
        setSelectedUserId(adminId)
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const validateConnectionName = (name: string): boolean => {
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

    if (!selectedUserId) {
      setError("Selecione um usuário para atribuir esta conexão")
      return
    }

    setError("")
    onOpenChange(false)
    setCreationModalOpen(true)
  }

  const handleCreationComplete = async () => {
    if (isCreating) return

    setIsCreating(true)
    setLoading(true)

    try {
      const result = await createEvolutionInstance(connectionName.trim(), selectedUserId)

      if (result.success) {
        onSuccess()
        setCreationModalOpen(false)
        setConnectionName("")
        setSelectedUserId(adminId)
      } else {
        setError(result.error || "Erro ao criar conexão")
        setCreationModalOpen(false)
        onOpenChange(true)
      }
    } catch (error) {
      setError("Erro interno do servidor")
      setCreationModalOpen(false)
      onOpenChange(true)
    } finally {
      setLoading(false)
      setIsCreating(false)
    }
  }

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setConnectionName("")
      setError("")
      setLoading(false)
      setIsCreating(false)
      setSelectedUserId(adminId)
    }
    onOpenChange(open)
  }

  const handleCreationModalClose = (open: boolean) => {
    if (!open) {
      setIsCreating(false)
      setLoading(false)
    }
    setCreationModalOpen(open)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Plus className="w-5 h-5" />
              Nova Conexão WhatsApp
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Crie uma nova conexão WhatsApp e atribua a um usuário
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="connectionName" className="text-gray-900 dark:text-gray-100">
                Nome da Conexão
              </Label>
              <Input
                id="connectionName"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder="Ex: minha_conexao_principal"
                disabled={loading}
                maxLength={20}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use apenas letras, números e underscores. Mínimo 3 caracteres.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId" className="text-gray-900 dark:text-gray-100">
                Atribuir a Usuário
              </Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading || loadingUsers}>
                <SelectTrigger id="userId" className="w-full text-foreground">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Carregando usuários...</span>
                    </div>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email} {user.id === adminId ? "(Você)" : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleModalClose(false)}
                disabled={loading}
                className="text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !connectionName.trim() || !selectedUserId || isCreating}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {loading || isCreating ? (
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

      <InstanceCreationModal
        open={creationModalOpen}
        onOpenChange={handleCreationModalClose}
        connectionName={connectionName}
        onComplete={handleCreationComplete}
        onConnectWhatsApp={() => {}}
      />
    </>
  )
}
