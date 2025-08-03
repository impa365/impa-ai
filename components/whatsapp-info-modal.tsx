"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  Info, 
  RefreshCw, 
  Loader2, 
  Smartphone, 
  User, 
  Calendar, 
  Signal, 
  MessageSquare, 
  Users, 
  Phone,
  Settings,
  Hash,
  Wifi,
  Clock
} from "lucide-react"

interface WhatsAppInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: any
}

interface InstanceInfo {
  id?: string
  name?: string
  connectionStatus?: string
  ownerJid?: string
  profileName?: string
  profilePicUrl?: string
  integration?: string
  number?: string
  businessId?: string
  token?: string
  clientName?: string
  disconnectionReasonCode?: number
  disconnectionAt?: string
  createdAt?: string
  updatedAt?: string
  settings?: any
  stats?: {
    Message?: number
    Contact?: number
    Chat?: number
  }
}

export default function WhatsAppInfoModal({ open, onOpenChange, connection }: WhatsAppInfoModalProps) {
  const [info, setInfo] = useState<InstanceInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && connection?.instance_name) {
      fetchInstanceInfo()
    }
  }, [open, connection?.instance_name])

  const fetchInstanceInfo = async () => {
    if (!connection?.instance_name) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/whatsapp/info/${connection.instance_name}`)
      const result = await response.json()

      if (result.success) {
        setInfo(result.info)
      } else {
        setError(result.error || "Erro ao buscar informações da instância")
      }
    } catch (error) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchInstanceInfo()
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-100 text-green-700">Conectado</Badge>
      case "connecting":
        return <Badge className="bg-yellow-100 text-yellow-700">Conectando</Badge>
      case "close":
        return <Badge className="bg-gray-100 text-gray-700">Desconectado</Badge>
      default:
        return <Badge variant="secondary">{status || "Desconhecido"}</Badge>
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Informações da Instância - {connection?.connection_name}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da instância WhatsApp da Evolution API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Status da Instância</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
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
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando informações...</span>
            </div>
          ) : info ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status e Conexão */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Signal className="w-5 h-5" />
                    Status e Conexão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Foto de Perfil e Nome */}
                  {(info.profilePicUrl || info.profileName) && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={info.profilePicUrl} 
                          alt={info.profileName || "Perfil"}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {info.profileName || "Nome não disponível"}
                </div>
                        <div className="text-sm text-gray-500">
                          Perfil do WhatsApp
              </div>
                  </div>
                </div>
              )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(info.connectionStatus)}
                  </div>
                  {info.ownerJid && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">WhatsApp ID:</span>
                      <span className="text-sm font-mono">{info.ownerJid}</span>
                </div>
              )}
                  {info.number && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Número:</span>
                      <span className="text-sm">{info.number}</span>
                </div>
                  )}
                  {info.integration && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Integração:</span>
                      <span className="text-sm">{info.integration}</span>
              </div>
                  )}
                </CardContent>
              </Card>

              {/* Estatísticas */}
              {info.stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="w-5 h-5" />
                      Estatísticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <div className="text-2xl font-bold text-blue-600">
                          {info.stats.Message?.toLocaleString() || 0}
                        </div>
                      <div className="text-xs text-blue-600">Mensagens</div>
                    </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold text-green-600">
                          {info.stats.Contact?.toLocaleString() || 0}
                        </div>
                      <div className="text-xs text-green-600">Contatos</div>
                    </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <MessageSquare className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-2xl font-bold text-purple-600">
                          {info.stats.Chat?.toLocaleString() || 0}
                        </div>
                      <div className="text-xs text-purple-600">Chats</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Informações Técnicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5" />
                    Informações Técnicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ID da Instância:</span>
                    <span className="text-sm font-mono">{info.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Nome:</span>
                    <span className="text-sm">{info.name}</span>
                  </div>
                  {info.clientName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cliente:</span>
                      <span className="text-sm">{info.clientName}</span>
                </div>
              )}
                  {info.token && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Token:</span>
                      <span className="text-sm font-mono">{info.token}</span>
                    </div>
                  )}
                  {info.businessId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Business ID:</span>
                      <span className="text-sm">{info.businessId}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Datas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5" />
                    Datas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Criado em:</span>
                    <span className="text-sm">{formatDate(info.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Atualizado em:</span>
                    <span className="text-sm">{formatDate(info.updatedAt)}</span>
                  </div>
                  {info.disconnectionAt && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-600">Desconectado em:</span>
                      <span className="text-sm text-red-600">{formatDate(info.disconnectionAt)}</span>
                    </div>
                  )}
                  {info.disconnectionReasonCode && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-600">Código de Desconexão:</span>
                      <span className="text-sm text-red-600">{info.disconnectionReasonCode}</span>
              </div>
                  )}
                </CardContent>
              </Card>

              {/* Configurações */}
              {info.settings && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="w-5 h-5" />
                      Configurações da Instância
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                        <div className="text-sm font-medium">Rejeitar Chamadas</div>
                        <div className="text-xs text-gray-600">
                          {info.settings.rejectCall ? "Sim" : "Não"}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Users className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                        <div className="text-sm font-medium">Ignorar Grupos</div>
                        <div className="text-xs text-gray-600">
                          {info.settings.groupsIgnore ? "Sim" : "Não"}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Wifi className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                        <div className="text-sm font-medium">Sempre Online</div>
                        <div className="text-xs text-gray-600">
                          {info.settings.alwaysOnline ? "Sim" : "Não"}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <MessageSquare className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                        <div className="text-sm font-medium">Ler Mensagens</div>
                        <div className="text-xs text-gray-600">
                          {info.settings.readMessages ? "Sim" : "Não"}
                        </div>
                </div>
              </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Info className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Não foi possível carregar as informações da instância.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}