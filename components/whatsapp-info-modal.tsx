"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, RefreshCw, Loader2, Smartphone, User, Calendar, Signal } from "lucide-react"

interface WhatsAppInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: any
  onStatusChange?: (status: string) => void
}

interface ConnectionInfo {
  status: string
  phoneNumber?: string
  profileName?: string
  lastSeen?: string
  batteryLevel?: number
  isOnline?: boolean
  platform?: string
}

export default function WhatsAppInfoModal({ open, onOpenChange, connection, onStatusChange }: WhatsAppInfoModalProps) {
  const [info, setInfo] = useState<ConnectionInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && connection?.instance_name) {
      fetchConnectionInfo()
    }
  }, [open, connection?.instance_name])

  const fetchConnectionInfo = async () => {
    if (!connection?.instance_name) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/whatsapp/info/${connection.instance_name}`)
      const result = await response.json()

      if (result.success) {
        setInfo(result.info)
        if (result.info.status && onStatusChange) {
          onStatusChange(result.info.status)
        }
      } else {
        setError(result.error || "Erro ao buscar informações da conexão")
      }
    } catch (error) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchConnectionInfo()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-700">Conectado</Badge>
      case "connecting":
        return <Badge className="bg-yellow-100 text-yellow-700">Conectando</Badge>
      case "disconnected":
        return <Badge className="bg-gray-100 text-gray-700">Desconectado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Não disponível"

    try {
      const date = new Date(lastSeen)
      return date.toLocaleString("pt-BR")
    } catch {
      return lastSeen
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-popover-foreground">
            <Info className="w-5 h-5" />
            Informações da Conexão - {connection?.connection_name}
          </DialogTitle>
          <DialogDescription className="text-popover-foreground/80">
            Detalhes da conexão WhatsApp ativa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Status da Conexão</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Carregando informações...</span>
            </div>
          ) : info ? (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Signal className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Status:</span>
                </div>
                {getStatusBadge(info.status)}
              </div>

              {/* Phone Number */}
              {info.phoneNumber && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Número:</span>
                  </div>
                  <span className="text-sm text-foreground">{info.phoneNumber}</span>
                </div>
              )}

              {/* Profile Name */}
              {info.profileName && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Nome do Perfil:</span>
                  </div>
                  <span className="text-sm text-foreground">{info.profileName}</span>
                </div>
              )}

              {/* Online Status */}
              {info.isOnline !== undefined && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${info.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                    <span className="text-sm font-medium text-foreground">Online:</span>
                  </div>
                  <span className="text-sm text-foreground">{info.isOnline ? "Sim" : "Não"}</span>
                </div>
              )}

              {/* Last Seen */}
              {info.lastSeen && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Última Atividade:</span>
                  </div>
                  <span className="text-sm text-foreground">{formatLastSeen(info.lastSeen)}</span>
                </div>
              )}

              {/* Battery Level */}
              {info.batteryLevel !== undefined && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 text-muted-foreground">🔋</div>
                    <span className="text-sm font-medium text-foreground">Bateria:</span>
                  </div>
                  <span className="text-sm text-foreground">{info.batteryLevel}%</span>
                </div>
              )}

              {/* Platform */}
              {info.platform && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Plataforma:</span>
                  </div>
                  <span className="text-sm text-foreground">{info.platform}</span>
                </div>
              )}

              {/* Instance Info */}
              <div className="pt-4 border-t">
                <h5 className="font-medium text-foreground mb-2">Informações da Instância</h5>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Nome da Conexão:</strong> {connection.connection_name}
                  </p>
                  <p>
                    <strong>Instância:</strong> {connection.instance_name}
                  </p>
                  <p>
                    <strong>Criado em:</strong> {new Date(connection.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Info className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Não foi possível carregar as informações da conexão.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
