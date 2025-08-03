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
      // Buscar usuários via API segura
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error("Erro ao buscar usuários")
      }
      
      const result = await response.json()
      if (result.users) {
        setUsers(result.users)
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      setError("Erro ao carregar lista de usuários")
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
      // Verificar limites do usuário de destino via API
      const userResponse = await fetch(`/api/admin/users/${selectedUserId}`)
      if (!userResponse.ok) {
        throw new Error("Erro ao verificar dados do usuário")
      }
      
      const userData = await userResponse.json()
      const userLimits = userData.user.whatsapp_connections_limit || 2

      // Verificar conexões atuais do usuário de destino
      const connectionsResponse = await fetch(`/api/whatsapp-connections?userId=${selectedUserId}&isAdmin=true`)
      if (!connectionsResponse.ok) {
        throw new Error("Erro ao verificar conexões do usuário")
      }
      
      const connectionsData = await connectionsResponse.json()
      const currentConnections = connectionsData.connections?.length || 0

      // Verificar se não excede o limite
      if (currentConnections >= userLimits) {
        setError(`O usuário já atingiu o limite de ${userLimits} conexões WhatsApp`)
        return
      }

      // Realizar transferência via API
      const transferResponse = await fetch(`/api/whatsapp-connections`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: connection.id,
          user_id: selectedUserId,
          updated_at: new Date().toISOString(),
        }),
      })

      if (!transferResponse.ok) {
        const errorData = await transferResponse.json()
        throw new Error(errorData.error || "Erro ao transferir conexão")
      }

      setSuccess("Conexão transferida com sucesso!")
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
      }, 1500)

    } catch (error: any) {
      console.error("Erro ao transferir conexão:", error)
      setError(error.message || "Erro ao transferir conexão")
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
