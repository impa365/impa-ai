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
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, UserPlus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TransferConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: any
  onSuccess: () => void
}

export default function TransferConnectionModal({
  open,
  onOpenChange,
  connection,
  onSuccess,
}: TransferConnectionModalProps) {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Carregar usuários quando o modal abrir
  useEffect(() => {
    if (open && connection) {
      fetchUsers()
      setSelectedUserId(connection.user_id || "")
    }
  }, [open, connection])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, email, full_name")
        .order("full_name", { ascending: true })

      if (data) {
        setUsers(data)
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleTransfer = async () => {
    if (!connection || !selectedUserId) return

    // Se o usuário selecionado é o mesmo, não faz nada
    if (selectedUserId === connection.user_id) {
      setError("Selecione um usuário diferente do atual")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Verificar limite de conexões do usuário
      const { data: userSettings } = await supabase
        .from("user_settings")
        .select("whatsapp_connections_limit")
        .eq("user_id", selectedUserId)
        .single()

      // Contar conexões atuais do usuário
      const { data: userConnections, count } = await supabase
        .from("whatsapp_connections")
        .select("id", { count: "exact" })
        .eq("user_id", selectedUserId)

      const connectionCount = count || 0
      const connectionLimit = userSettings?.whatsapp_connections_limit || 2

      if (connectionCount >= connectionLimit) {
        setError(`O usuário selecionado já atingiu o limite de ${connectionLimit} conexões`)
        return
      }

      // Transferir a conexão
      const { error: updateError } = await supabase
        .from("whatsapp_connections")
        .update({ user_id: selectedUserId })
        .eq("id", connection.id)

      if (updateError) throw updateError

      setSuccess("Conexão transferida com sucesso!")

      // Fechar o modal após 2 segundos
      setTimeout(() => {
        onOpenChange(false)
        onSuccess()
      }, 2000)
    } catch (error) {
      console.error("Erro ao transferir conexão:", error)
      setError("Erro ao transferir conexão")
    } finally {
      setLoading(false)
    }
  }

  // Reset states when modal closes
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setError("")
      setSuccess("")
      setSelectedUserId("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Transferir Conexão WhatsApp
          </DialogTitle>
          <DialogDescription>Transferir a conexão "{connection?.connection_name}" para outro usuário</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentUser">Usuário Atual</Label>
            <div className="p-2 border rounded-md bg-gray-50">
              {connection?.user_profiles?.full_name || connection?.user_profiles?.email || "Desconhecido"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newUser">Novo Usuário</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading || loadingUsers}>
              <SelectTrigger id="newUser" className="w-full">
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
                      {user.full_name || user.email}
                      {user.id === connection?.user_id ? " (Atual)" : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleModalClose(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={loading || !selectedUserId || selectedUserId === connection?.user_id}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Transferindo...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Transferir Conexão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
