"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Phone, MessageSquare, Users, Calendar, Info, CheckCircle2, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatPhoneNumber } from "@/lib/utils"

interface WhatsAppInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: any
}

interface InstanceInfo {
  id: string
  name: string
  connectionStatus: string
  ownerJid: string
  profileName: string
  profilePicUrl: string
  integration: string
  number: string | null
  businessId: string | null
  token: string
  clientName: string
  disconnectionReasonCode: number | null
  disconnectionObject: string | null
  disconnectionAt: string | null
  createdAt: string
  updatedAt: string
  _count: {
    Message: number
    Contact: number
    Chat: number
  }
  Setting: {
    id: string
    rejectCall: boolean
    msgCall: string
    groupsIgnore: boolean
    alwaysOnline: boolean
    readMessages: boolean
    readStatus: boolean
    syncFullHistory: boolean
    wavoipToken: string
    createdAt: string
    updatedAt: string
    instanceId: string
  }
}

export default function WhatsAppInfoModal({ open, onOpenChange, connection }: WhatsAppInfoModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [instanceInfo, setInstanceInfo] = useState<InstanceInfo | null>(null)

  useEffect(() => {
    if (open && connection) {
      fetchInstanceInfo()
    }
  }, [open, connection])

  const fetchInstanceInfo = async () => {
    if (!connection?.instance_name) return

    setLoading(true)
    setError("")

    try {
      // Buscar configurações da Evolution API
      const { data: integrationData } = await supabase
        .from("integrations")
        .select("config")
        .eq("type", "evolution_api")
        .eq("is_active", true)
        .single()

      if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
        throw new Error("Evolution API não configurada")
      }

      // Fazer requisição para a Evolution API
      const response = await fetch(`${integrationData.config.apiUrl}/instance/fetchInstances`, {
        method: "GET",
        headers: {
          apikey: integrationData.config.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar informações: ${response.status}`)
      }

      const data = await response.json()

      // Encontrar a instância específica pelo nome
      const instanceData = Array.isArray(data)
        ? data.find((instance: any) => instance.name === connection.instance_name)
        : null

      if (!instanceData) {
        throw new Error("Instância não encontrada")
      }

      setInstanceInfo(instanceData)
    } catch (error) {
      console.error("Erro ao buscar informações da instância:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  // Extrair número de telefone do ownerJid
  const extractPhoneNumber = (ownerJid: string | undefined) => {
    if (!ownerJid) return "Desconhecido"
    const match = ownerJid.match(/(\d+)@/)
    return match ? formatPhoneNumber(match[1]) : "Desconhecido"
  }

  // Formatar data
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleString()
    } catch (e) {
      return "Data inválida"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Info className="w-5 h-5" />
            Informações da Conexão WhatsApp
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Carregando informações...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-medium mb-1">Erro ao carregar informações</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : instanceInfo ? (
          <div className="space-y-6">
            {/* Cabeçalho com foto e informações principais */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20">
                  {instanceInfo.profilePicUrl ? (
                    <img
                      src={instanceInfo.profilePicUrl || "/placeholder.svg"}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=80&width=80&query=user"
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <Badge
                  className={`absolute -bottom-1 -right-1 ${
                    instanceInfo.connectionStatus === "open"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {instanceInfo.connectionStatus === "open" ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  {instanceInfo.connectionStatus === "open" ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold">{instanceInfo.profileName || "Nome não disponível"}</h3>
                <div className="flex items-center text-sm text-muted-foreground gap-1 mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{extractPhoneNumber(instanceInfo.ownerJid)}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Conectado desde {formatDate(instanceInfo.createdAt)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Estatísticas */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Estatísticas</h4>
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-500 mb-1" />
                    <span className="text-xl font-semibold">
                      {instanceInfo._count?.Message?.toLocaleString() || "0"}
                    </span>
                    <span className="text-xs text-muted-foreground">Mensagens</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <Users className="w-5 h-5 text-green-500 mb-1" />
                    <span className="text-xl font-semibold">
                      {instanceInfo._count?.Contact?.toLocaleString() || "0"}
                    </span>
                    <span className="text-xs text-muted-foreground">Contatos</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-purple-500 mb-1" />
                    <span className="text-xl font-semibold">{instanceInfo._count?.Chat?.toLocaleString() || "0"}</span>
                    <span className="text-xs text-muted-foreground">Conversas</span>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Detalhes da instância */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Detalhes da Instância</h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Nome da instância:</div>
                  <div className="font-medium">{instanceInfo.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Integração:</div>
                  <div className="font-medium">{instanceInfo.integration}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Cliente:</div>
                  <div className="font-medium">{instanceInfo.clientName}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Última atualização:</div>
                  <div className="font-medium">{formatDate(instanceInfo.updatedAt)}</div>
                </div>
                {instanceInfo.disconnectionAt && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">Última desconexão:</div>
                    <div className="font-medium">{formatDate(instanceInfo.disconnectionAt)}</div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Configurações */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Configurações</h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={instanceInfo.Setting?.alwaysOnline ? "default" : "outline"}>
                    {instanceInfo.Setting?.alwaysOnline ? "Ativado" : "Desativado"}
                  </Badge>
                  <span>Sempre online</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={instanceInfo.Setting?.readMessages ? "default" : "outline"}>
                    {instanceInfo.Setting?.readMessages ? "Ativado" : "Desativado"}
                  </Badge>
                  <span>Marcar mensagens como lidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={instanceInfo.Setting?.readStatus ? "default" : "outline"}>
                    {instanceInfo.Setting?.readStatus ? "Ativado" : "Desativado"}
                  </Badge>
                  <span>Ler status</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={instanceInfo.Setting?.rejectCall ? "default" : "outline"}>
                    {instanceInfo.Setting?.rejectCall ? "Ativado" : "Desativado"}
                  </Badge>
                  <span>Rejeitar chamadas</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
            <p>Nenhuma informação disponível para esta conexão.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
