"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, RefreshCw, Loader2, Smartphone, User, Calendar, Signal, MessageSquare, Users, Phone } from "lucide-react"

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
  isOnline?: boolean
  createdAt?: string
  updatedAt?: string
  disconnectedAt?: string
  disconnectionReason?: number
  settings?: any
  stats?: {
    messages: number
    contacts: number
    chats: number
  }
}

export default function WhatsAppInfoModal({ open, onOpenChange, connection, onStatusChange }: WhatsAppInfoModalProps) {
  const [info, setInfo] = useState<ConnectionInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [disconnecting, setDisconnecting] = useState(false)

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

  const handleDisconnect = async () => {
    if (!connection?.instance_name || disconnecting) return

    setDisconnecting(true)
    try {
      const response = await fetch(`/api/whatsapp/disconnect/${connection.instance_name}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        // Atualizar informações após desconectar
        await fetchConnectionInfo()
        if (onStatusChange) {
          onStatusChange("disconnected")
        }
      } else {
        setError(result.error || "Erro ao desconectar")
      }
    } catch (error) {
      setError("Erro ao desconectar")
    } finally {
      setDisconnecting(false)
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não disponível"

    try {
      const date = new Date(dateString)
      return date.toLocaleString("pt-BR")
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-popover-foreground">
            <Info className="w-5 h-5" />
            Informações da Conexão - {connection?.connection_name}
          </DialogTitle>
          <DialogDescription className="text-popover-foreground/80">
            Detalhes completos da conexão WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Status da Conexão</h4>
            <div className="flex gap-2">
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
              {info?.status === "connected" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-white"
                >
                  <Phone className={`w-4 h-4 mr-2 ${disconnecting ? "animate-spin" : ""}`} />
                  {disconnecting ? "Desconectando..." : "Desconectar"}
                </Button>
              )}
            </div>
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
                    <span className="text-sm font-medium text-foreground">Cliente:</span>
                  </div>
                  <span className="text-sm text-foreground">{info.profileName}</span>
                </div>
              )}

              {/* Online Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${info.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="text-sm font-medium text-foreground">Online:</span>
                </div>
                <span className="text-sm text-foreground">{info.isOnline ? "Sim" : "Não"}</span>
              </div>

              {/* Statistics */}
              {info.stats && (
                <div className="space-y-2">
                  <h5 className="font-medium text-foreground">Estatísticas</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                      <MessageSquare className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                      <div className="text-lg font-bold text-blue-600">{info.stats.messages.toLocaleString()}</div>
                      <div className="text-xs text-blue-600">Mensagens</div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                      <Users className="w-5 h-5 mx-auto mb-1 text-green-600" />
                      <div className="text-lg font-bold text-green-600">{info.stats.contacts.toLocaleString()}</div>
                      <div className="text-xs text-green-600">Contatos</div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                      <MessageSquare className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                      <div className="text-lg font-bold text-purple-600">{info.stats.chats.toLocaleString()}</div>
                      <div className="text-xs text-purple-600">Chats</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">Datas</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Criado em:</span>
                    </div>
                    <span className="text-sm text-foreground">{formatDate(info.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Atualizado em:</span>
                    </div>
                    <span className="text-sm text-foreground">{formatDate(info.updatedAt)}</span>
                  </div>
                  {info.disconnectedAt && (
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Desconectado em:</span>
                      </div>
                      <span className="text-sm text-red-600">{formatDate(info.disconnectedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

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
                  {info.disconnectionReason && (
                    <p>
                      <strong>Código de Desconexão:</strong> {info.disconnectionReason}
                    </p>
                  )}
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
