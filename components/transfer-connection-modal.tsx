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

    if (selectedUserId === connection.user_id) {
      setError("Selecione um usuário diferente do atual")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { data: userSettings } = await supabase
        .from("user_settings")
        .select("whatsapp_connections_limit")
        .eq("user_id", selectedUserId)
        .single()

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

      const { error: updateError } = await supabase
        .from("whatsapp_connections")
        .update({ user_id: selectedUserId })
        .eq("id", connection.id)

      if (updateError) throw updateError

      setSuccess("Conexão transferida com sucesso!")

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
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="w-5 h-5" />
            Transferir Conexão WhatsApp
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Transferir a conexão "{connection?.connection_name}" para outro usuário
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentUser" className="text-foreground">
              Usuário Atual
            </Label>
            <div className="p-2 border rounded-md bg-muted text-foreground">
              {connection?.user_profiles?.full_name || connection?.user_profiles?.email || "Desconhecido"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newUser" className="text-foreground">
              Novo Usuário
            </Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading || loadingUsers}>
              <SelectTrigger id="newUser" className="w-full text-foreground">
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
          <Button
            type="button"
            variant="outline"
            onClick={() => handleModalClose(false)}
            disabled={loading}
            className="text-foreground"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={loading || !selectedUserId || selectedUserId === connection?.user_id}
            className="bg-blue-600 text-white hover:bg-blue-700"
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
